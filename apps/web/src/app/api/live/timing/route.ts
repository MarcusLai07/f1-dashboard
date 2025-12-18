import { NextRequest, NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionKey = searchParams.get("session_key");

  if (!sessionKey) {
    return NextResponse.json(
      { error: "session_key is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch multiple endpoints in parallel
    const [driversRes, lapsRes, stintsRes, intervalsRes] = await Promise.all([
      fetch(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`),
      fetch(`${OPENF1_BASE}/laps?session_key=${sessionKey}`),
      fetch(`${OPENF1_BASE}/stints?session_key=${sessionKey}`),
      fetch(`${OPENF1_BASE}/intervals?session_key=${sessionKey}`),
    ]);

    const [drivers, laps, stints, intervals] = await Promise.all([
      driversRes.json(),
      lapsRes.json(),
      stintsRes.json(),
      intervalsRes.json(),
    ]);

    // Build driver info map
    const driverMap = new Map(
      drivers.map((d: any) => [
        d.driver_number,
        {
          code: d.name_acronym,
          teamName: d.team_name,
          teamColor: `#${d.team_colour || "808080"}`,
        },
      ])
    );

    // Get latest lap for each driver
    const latestLaps = new Map<number, any>();
    const bestLaps = new Map<number, number>();
    let overallBest: { driver: number; time: number } | null = null;

    for (const lap of laps) {
      const driverNum = lap.driver_number;
      const lapTime = lap.lap_duration;

      // Track latest lap
      if (
        !latestLaps.has(driverNum) ||
        lap.lap_number > latestLaps.get(driverNum).lap_number
      ) {
        latestLaps.set(driverNum, lap);
      }

      // Track best lap per driver
      if (lapTime && (!bestLaps.has(driverNum) || lapTime < bestLaps.get(driverNum)!)) {
        bestLaps.set(driverNum, lapTime);
      }

      // Track overall best
      if (lapTime && (!overallBest || lapTime < overallBest.time)) {
        overallBest = { driver: driverNum, time: lapTime };
      }
    }

    // Get latest stint for each driver
    const latestStints = new Map<number, any>();
    for (const stint of stints) {
      const driverNum = stint.driver_number;
      if (
        !latestStints.has(driverNum) ||
        stint.stint_number > latestStints.get(driverNum).stint_number
      ) {
        latestStints.set(driverNum, stint);
      }
    }

    // Get latest interval for each driver
    const latestIntervals = new Map<number, any>();
    for (const interval of intervals) {
      const driverNum = interval.driver_number;
      if (
        !latestIntervals.has(driverNum) ||
        new Date(interval.date) > new Date(latestIntervals.get(driverNum).date)
      ) {
        latestIntervals.set(driverNum, interval);
      }
    }

    // Build timing data
    const timingData: any[] = [];

    for (const [driverNum, lap] of latestLaps) {
      const driverInfo = driverMap.get(driverNum);
      const stint = latestStints.get(driverNum);
      const interval = latestIntervals.get(driverNum);
      const driverBest = bestLaps.get(driverNum);

      if (!driverInfo) continue;

      timingData.push({
        position: lap.position || timingData.length + 1,
        driverCode: driverInfo.code,
        driverNumber: driverNum,
        teamName: driverInfo.teamName,
        teamColor: driverInfo.teamColor,
        gap: interval?.gap_to_leader ?? null,
        interval: interval?.interval ?? null,
        lastLap: lap.lap_duration ?? null,
        bestLap: driverBest ?? null,
        sector1: lap.duration_sector_1 ?? null,
        sector2: lap.duration_sector_2 ?? null,
        sector3: lap.duration_sector_3 ?? null,
        tyre: {
          compound: stint?.compound?.toUpperCase() || "UNKNOWN",
          age: stint?.tyre_age_at_start
            ? stint.tyre_age_at_start + (lap.lap_number - stint.lap_start)
            : 0,
          isNew: stint?.tyre_age_at_start === 0,
        },
        pitStops: stint?.stint_number ? stint.stint_number - 1 : 0,
        status: "RACING",
        isPersonalBest: lap.is_personal_best || false,
        isOverallBest: overallBest?.driver === driverNum && lap.lap_duration === overallBest?.time,
      });
    }

    // Sort by position
    timingData.sort((a, b) => (a.position || 99) - (b.position || 99));

    return NextResponse.json({
      timing: timingData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Timing API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timing data" },
      { status: 500 }
    );
  }
}
