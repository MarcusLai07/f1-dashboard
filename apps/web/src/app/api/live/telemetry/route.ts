import { NextRequest, NextResponse } from "next/server";
import { openf1Fetch } from "@/lib/openf1";
import { getDriversFull, getTeamsFull } from "@/data";

interface DriverInfo {
  code: string;
  teamColor: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionKey = searchParams.get("session_key");
  const driversParam = searchParams.get("drivers"); // Comma-separated driver numbers

  if (!sessionKey) {
    return NextResponse.json(
      { error: "session_key is required" },
      { status: 400 }
    );
  }

  try {
    // Get driver info for codes and colors (OpenF1 + local fallback)
    const [driversRes, localDrivers, localTeams] = await Promise.all([
      openf1Fetch(`/drivers?session_key=${sessionKey}`),
      getDriversFull().catch(() => []),
      getTeamsFull().catch(() => []),
    ]);
    const driversData = await driversRes.json();
    const localDriverMap = new Map(localDrivers.map(d => [d.number, d]));
    const localTeamMap = new Map(localTeams.map(t => [t.id, t]));

    const driverMap = new Map<number, DriverInfo>();
    const drivers = Array.isArray(driversData) ? driversData : [];
    for (const d of drivers) {
      if (d?.driver_number) {
        const local = localDriverMap.get(d.driver_number);
        const localTeam = local?.teamId ? localTeamMap.get(local.teamId) : undefined;
        driverMap.set(d.driver_number, {
          code: d.name_acronym || local?.code || `D${d.driver_number}`,
          teamColor: d.team_colour ? `#${d.team_colour}` : (localTeam?.color || "#808080"),
        });
      }
    }
    // Add any local drivers not in OpenF1 response
    for (const local of localDrivers) {
      if (!driverMap.has(local.number)) {
        const localTeam = local.teamId ? localTeamMap.get(local.teamId) : undefined;
        driverMap.set(local.number, {
          code: local.code,
          teamColor: localTeam?.color || "#808080",
        });
      }
    }

    // Get car data for specified drivers or all
    if (driversParam) {
      // Fetch latest car data for each driver
      const driverNums = driversParam.split(",");
      const telemetryPromises = driverNums.map(async (driverNum) => {
        // Get the most recent car data entry
        const res = await openf1Fetch(
          `/car_data?session_key=${sessionKey}&driver_number=${driverNum.trim()}`
        );
        const data = await res.json();
        // Return only the latest entry
        return data.length > 0 ? data[data.length - 1] : null;
      });

      const telemetryResults = await Promise.all(telemetryPromises);
      const telemetry: Record<string, any> = {};

      for (const carData of telemetryResults) {
        if (!carData) continue;

        const driverNum = carData.driver_number;
        const driverInfo = driverMap.get(driverNum);

        if (driverInfo) {
          telemetry[driverInfo.code] = {
            driverCode: driverInfo.code,
            driverNumber: driverNum,
            teamColor: driverInfo.teamColor,
            speed: carData.speed || 0,
            throttle: carData.throttle || 0,
            brake: carData.brake || 0,
            gear: carData.n_gear || 0,
            rpm: carData.rpm || 0,
            drs: carData.drs || 0,
            timestamp: carData.date,
          };
        }
      }

      return NextResponse.json({
        telemetry,
        timestamp: new Date().toISOString(),
      });
    }

    // If no specific drivers, return empty
    return NextResponse.json({
      telemetry: {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Telemetry API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch telemetry" },
      { status: 500 }
    );
  }
}
