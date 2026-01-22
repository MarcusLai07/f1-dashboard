import { NextRequest, NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

interface DriverInfo {
  driverNumber: number;
  code: string;
  teamName: string;
  teamColor: string;
}

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
    const [driversRes, lapsRes, stintsRes] = await Promise.all([
      fetch(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`),
      fetch(`${OPENF1_BASE}/laps?session_key=${sessionKey}`),
      fetch(`${OPENF1_BASE}/stints?session_key=${sessionKey}`),
    ]);

    const [driversData, lapsData, stintsData] = await Promise.all([
      driversRes.json(),
      lapsRes.json(),
      stintsRes.json(),
    ]);

    // Ensure arrays (API may return empty objects or null)
    const drivers = Array.isArray(driversData) ? driversData : [];
    const laps = Array.isArray(lapsData) ? lapsData : [];
    const stints = Array.isArray(stintsData) ? stintsData : [];

    // Build driver info list (all drivers in session)
    const allDrivers: DriverInfo[] = [];
    for (const d of drivers) {
      if (d?.driver_number) {
        allDrivers.push({
          driverNumber: d.driver_number,
          code: d.name_acronym || `D${d.driver_number}`,
          teamName: d.team_name || "Unknown",
          teamColor: `#${d.team_colour || "808080"}`,
        });
      }
    }

    // Get latest lap and best lap for each driver
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

      // Track best lap per driver (for position calculation)
      if (lapTime && (!bestLaps.has(driverNum) || lapTime < bestLaps.get(driverNum)!)) {
        bestLaps.set(driverNum, lapTime);
      }

      // Track overall best
      if (lapTime && (!overallBest || lapTime < overallBest.time)) {
        overallBest = { driver: driverNum, time: lapTime };
      }
    }

    // Get latest stint for each driver (for tyre info)
    const latestStints = new Map<number, any>();
    // Get all stints per driver (for stint history)
    const allStintsPerDriver = new Map<number, any[]>();
    for (const stint of stints) {
      const driverNum = stint.driver_number;
      if (
        !latestStints.has(driverNum) ||
        stint.stint_number > latestStints.get(driverNum).stint_number
      ) {
        latestStints.set(driverNum, stint);
      }
      // Collect all stints for history
      const driverStints = allStintsPerDriver.get(driverNum) || [];
      driverStints.push(stint);
      allStintsPerDriver.set(driverNum, driverStints);
    }

    // Helper to get stint history for a driver
    function getStintHistory(driverNum: number) {
      const driverStints = allStintsPerDriver.get(driverNum) || [];
      return driverStints
        .sort((a, b) => a.stint_number - b.stint_number)
        .map((stint) => ({
          stintNumber: stint.stint_number,
          compound: (stint.compound?.toUpperCase() || "UNKNOWN") as "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET",
          startLap: stint.lap_start,
          endLap: stint.lap_end,
          tyreAge: stint.tyre_age_at_start || 0,
        }));
    }

    // Calculate positions based on BEST LAP TIME (correct for practice/qualifying)
    // Drivers with faster best laps get higher positions
    const driversWithBestTimes = allDrivers
      .map((d) => ({
        ...d,
        bestTime: bestLaps.get(d.driverNumber),
      }))
      .sort((a, b) => {
        // Drivers with times come first, sorted by fastest
        if (a.bestTime !== undefined && b.bestTime !== undefined) {
          return a.bestTime - b.bestTime;
        }
        // Drivers with times before those without
        if (a.bestTime !== undefined) return -1;
        if (b.bestTime !== undefined) return 1;
        // Both without times - maintain original order
        return 0;
      });

    // Assign positions
    const positionMap = new Map<number, number>();
    driversWithBestTimes.forEach((d, idx) => {
      positionMap.set(d.driverNumber, idx + 1);
    });

    // Build timing data for ALL drivers
    const timingData = allDrivers.map((driverInfo) => {
      const driverNum = driverInfo.driverNumber;
      const lap = latestLaps.get(driverNum);
      const stint = latestStints.get(driverNum);
      const driverBest = bestLaps.get(driverNum);
      const position = positionMap.get(driverNum) || 20;

      // Calculate gap and interval based on best lap times
      let gap: number | null = null;
      let interval: number | null = null;

      if (driverBest !== undefined && overallBest) {
        gap = driverBest - overallBest.time;
        if (gap < 0.001) gap = null; // Leader has no gap
      }

      // Find driver ahead for interval calculation
      if (position > 1) {
        const driverAhead = driversWithBestTimes[position - 2]; // -2 because position is 1-indexed
        if (driverAhead?.bestTime !== undefined && driverBest !== undefined) {
          interval = driverBest - driverAhead.bestTime;
        }
      }

      // Determine if driver is currently on track (has recent lap data)
      const hasLapData = lap !== undefined;
      const isOnTrack = hasLapData && lap.lap_duration !== null;

      // Calculate tyre age
      let tyreAge = 0;
      if (stint && lap) {
        tyreAge = stint.tyre_age_at_start
          ? stint.tyre_age_at_start + (lap.lap_number - stint.lap_start)
          : lap.lap_number - stint.lap_start;
      }

      return {
        position,
        driverCode: driverInfo.code,
        driverNumber: driverNum,
        teamName: driverInfo.teamName,
        teamColor: driverInfo.teamColor,
        gap,
        interval,
        lastLap: lap?.lap_duration ?? null,
        bestLap: driverBest ?? null,
        sector1: lap?.duration_sector_1 ?? null,
        sector2: lap?.duration_sector_2 ?? null,
        sector3: lap?.duration_sector_3 ?? null,
        sector1Best: false, // Would need sector bests tracking
        sector2Best: false,
        sector3Best: false,
        sector1PersonalBest: false,
        sector2PersonalBest: false,
        sector3PersonalBest: false,
        tyre: {
          compound: stint?.compound?.toUpperCase() || "UNKNOWN",
          age: tyreAge,
          isNew: stint?.tyre_age_at_start === 0,
        },
        stintHistory: getStintHistory(driverNum),
        pitStops: stint?.stint_number ? stint.stint_number - 1 : 0,
        // In practice, drivers without current lap data are "IN PIT", not "OUT"
        status: isOnTrack ? "RACING" : "PIT",
        isPersonalBest: lap?.is_personal_best || false,
        isOverallBest: overallBest?.driver === driverNum && lap?.lap_duration === overallBest?.time,
        currentLap: lap?.lap_number ?? 0,
        miniSectors: {
          sector1: lap?.segments_sector_1 || [],
          sector2: lap?.segments_sector_2 || [],
          sector3: lap?.segments_sector_3 || [],
        },
      };
    });

    // Sort by position
    timingData.sort((a, b) => a.position - b.position);

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
