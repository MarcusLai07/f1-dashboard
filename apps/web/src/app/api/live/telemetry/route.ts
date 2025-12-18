import { NextRequest, NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionKey = searchParams.get("session_key");
  const drivers = searchParams.get("drivers"); // Comma-separated driver numbers

  if (!sessionKey) {
    return NextResponse.json(
      { error: "session_key is required" },
      { status: 400 }
    );
  }

  try {
    // Get driver info for colors
    const driversRes = await fetch(
      `${OPENF1_BASE}/drivers?session_key=${sessionKey}`
    );
    const driversData = await driversRes.json();
    const driverMap = new Map(
      driversData.map((d: any) => [
        d.driver_number,
        {
          code: d.name_acronym,
          teamColor: `#${d.team_colour || "808080"}`,
        },
      ])
    );

    // Get car data for specified drivers or all
    let carDataUrl = `${OPENF1_BASE}/car_data?session_key=${sessionKey}`;
    if (drivers) {
      // Fetch latest car data for each driver
      const driverNums = drivers.split(",");
      const telemetryPromises = driverNums.map(async (driverNum) => {
        // Get the most recent car data entry
        const res = await fetch(
          `${OPENF1_BASE}/car_data?session_key=${sessionKey}&driver_number=${driverNum.trim()}`
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
