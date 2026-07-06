import { NextRequest, NextResponse } from "next/server";
import { openf1Fetch } from "@/lib/openf1";

interface DriverInfo {
  code: string;
  firstName: string;
  lastName: string;
  teamName: string;
  teamColor: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionKey = searchParams.get("session_key");
  const driverNumber = searchParams.get("driver_number");

  if (!sessionKey) {
    return NextResponse.json(
      { error: "session_key is required" },
      { status: 400 }
    );
  }

  try {
    // Build URL with optional driver filter
    let url = `/laps?session_key=${sessionKey}`;
    if (driverNumber) {
      url += `&driver_number=${driverNumber}`;
    }

    const [lapsRes, driversRes] = await Promise.all([
      openf1Fetch(url),
      openf1Fetch(`/drivers?session_key=${sessionKey}`),
    ]);

    const [lapsData, driversData] = await Promise.all([
      lapsRes.json(),
      driversRes.json(),
    ]);

    const laps = Array.isArray(lapsData) ? lapsData : [];
    const drivers = Array.isArray(driversData) ? driversData : [];

    // Build driver map
    const driverMap = new Map<number, DriverInfo>(
      drivers.map((d: any) => [
        d.driver_number,
        {
          code: d.name_acronym,
          firstName: d.first_name,
          lastName: d.last_name,
          teamName: d.team_name,
          teamColor: d.team_colour ? `#${d.team_colour}` : "#808080",
        },
      ])
    );

    // Process and format lap data
    const processedLaps = laps.map((lap: any) => ({
      driverNumber: lap.driver_number,
      driverCode: driverMap.get(lap.driver_number)?.code || "???",
      teamColor: driverMap.get(lap.driver_number)?.teamColor || "#808080",
      lapNumber: lap.lap_number,
      lapTime: lap.lap_duration,
      sector1: lap.duration_sector_1,
      sector2: lap.duration_sector_2,
      sector3: lap.duration_sector_3,
      isPitOutLap: lap.is_pit_out_lap,
      position: lap.position,
    }));

    // Sort by lap number, then position
    processedLaps.sort((a: any, b: any) => {
      if (a.lapNumber !== b.lapNumber) return a.lapNumber - b.lapNumber;
      return (a.position || 0) - (b.position || 0);
    });

    return NextResponse.json({
      laps: processedLaps,
      drivers: Array.from(driverMap.entries()).map(([num, info]) => ({
        driverNumber: num,
        ...info,
      })),
    });
  } catch (error) {
    console.error("Laps API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lap data" },
      { status: 500 }
    );
  }
}
