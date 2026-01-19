import { NextRequest, NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

interface DriverInfo {
  code: string;
  firstName: string;
  lastName: string;
  teamName: string;
  teamColor: string;
}

// Fetch with retry for rate limiting
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      if (i === retries - 1) return [];
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return [];
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
    let url = `${OPENF1_BASE}/laps?session_key=${sessionKey}`;
    if (driverNumber) {
      url += `&driver_number=${driverNumber}`;
    }

    const laps = await fetchWithRetry(url);

    // Also fetch driver info for reference
    const drivers = await fetchWithRetry(
      `${OPENF1_BASE}/drivers?session_key=${sessionKey}`
    );

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
