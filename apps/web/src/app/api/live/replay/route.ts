import { NextRequest, NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

interface DriverInfo {
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
    // Helper to fetch with retry on rate limit
    async function fetchWithRetry(url: string, retries = 3): Promise<any> {
      for (let i = 0; i < retries; i++) {
        const res = await fetch(url);
        const data = await res.json();

        if (data.error === "Too Many Requests" || data.detail?.includes("Request limit")) {
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }

        return Array.isArray(data) ? data : [];
      }
      return [];
    }

    // Fetch data in batches to avoid rate limiting (3 req/sec max)
    const batch1 = await Promise.all([
      fetchWithRetry(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`),
      fetchWithRetry(`${OPENF1_BASE}/sessions?session_key=${sessionKey}`),
      fetchWithRetry(`${OPENF1_BASE}/laps?session_key=${sessionKey}`),
    ]);
    const [drivers, sessions, laps] = batch1;

    await new Promise(resolve => setTimeout(resolve, 400));

    const batch2 = await Promise.all([
      fetchWithRetry(`${OPENF1_BASE}/stints?session_key=${sessionKey}`),
      fetchWithRetry(`${OPENF1_BASE}/intervals?session_key=${sessionKey}`),
      fetchWithRetry(`${OPENF1_BASE}/position?session_key=${sessionKey}`),
    ]);
    const [stints, intervals, positions] = batch2;

    await new Promise(resolve => setTimeout(resolve, 400));

    const batch3 = await Promise.all([
      fetchWithRetry(`${OPENF1_BASE}/race_control?session_key=${sessionKey}`),
      fetchWithRetry(`${OPENF1_BASE}/weather?session_key=${sessionKey}`),
    ]);
    const [raceControl, weather] = batch3;

    // Get session info
    const sessionInfo = sessions.length > 0 ? sessions[0] : null;

    // Fetch meeting info to get meeting name (with rate limit handling)
    let meetingName = sessionInfo?.location || "Grand Prix";
    if (sessionInfo?.meeting_key) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const meetings = await fetchWithRetry(`${OPENF1_BASE}/meetings?meeting_key=${sessionInfo.meeting_key}`);
      if (meetings.length > 0) {
        meetingName = meetings[0].meeting_name;
      }
    }

    // Build driver info map
    const driverMap = new Map<number, DriverInfo>(
      drivers.map((d: any) => [
        d.driver_number,
        {
          code: d.name_acronym,
          teamName: d.team_name,
          teamColor: `#${d.team_colour || "808080"}`,
        },
      ])
    );

    // Build intervals map by lap and driver for quick lookup
    const intervalsMap = new Map<string, any>();
    for (const interval of intervals) {
      const key = `${interval.driver_number}-${interval.lap_number || 'latest'}`;
      intervalsMap.set(key, interval);
    }

    // Organize laps by lap number and calculate positions
    const lapsByNumber = new Map<number, any[]>();
    let maxLap = 0;

    // Group all lap data by lap number first
    const rawLapsByNumber = new Map<number, any[]>();
    for (const lap of laps) {
      const lapNum = lap.lap_number;
      if (!lapNum) continue;
      if (lapNum > maxLap) maxLap = lapNum;

      if (!rawLapsByNumber.has(lapNum)) {
        rawLapsByNumber.set(lapNum, []);
      }
      rawLapsByNumber.get(lapNum)!.push(lap);
    }

    // Track cumulative times to calculate positions
    const cumulativeTimes = new Map<number, number>(); // driver_number -> cumulative time
    const bestLapTimes = new Map<number, number>(); // driver_number -> best lap time
    let overallBestLap: number | null = null;
    let overallBestDriver: number | null = null;

    // Process each lap
    for (let lapNum = 1; lapNum <= maxLap; lapNum++) {
      const rawLaps = rawLapsByNumber.get(lapNum) || [];
      const lapData: any[] = [];

      for (const lap of rawLaps) {
        const driverNum = lap.driver_number;
        const driverInfo = driverMap.get(driverNum);
        if (!driverInfo) continue;

        // Update cumulative time
        if (lap.lap_duration) {
          const prevTime = cumulativeTimes.get(driverNum) || 0;
          cumulativeTimes.set(driverNum, prevTime + lap.lap_duration);

          // Track best lap
          const currentBest = bestLapTimes.get(driverNum);
          if (!currentBest || lap.lap_duration < currentBest) {
            bestLapTimes.set(driverNum, lap.lap_duration);
          }
          if (!overallBestLap || lap.lap_duration < overallBestLap) {
            overallBestLap = lap.lap_duration;
            overallBestDriver = driverNum;
          }
        }

        // Find stint info for this driver at this lap
        const stint = stints.find(
          (s: any) =>
            s.driver_number === driverNum &&
            s.lap_start <= lapNum &&
            (s.lap_end === null || s.lap_end >= lapNum)
        );

        // Find interval info - try lap-specific first, then latest
        let interval = intervalsMap.get(`${driverNum}-${lapNum}`);
        if (!interval) {
          // Find closest interval before this lap
          const driverIntervals = intervals.filter((i: any) => i.driver_number === driverNum);
          interval = driverIntervals.find((i: any) => i.lap_number === lapNum) ||
                     driverIntervals[driverIntervals.length - 1];
        }

        lapData.push({
          driverCode: driverInfo.code,
          driverNumber: driverNum,
          teamName: driverInfo.teamName,
          teamColor: driverInfo.teamColor,
          gap: interval?.gap_to_leader ?? null,
          interval: interval?.interval ?? null,
          lastLap: lap.lap_duration ?? null,
          bestLap: bestLapTimes.get(driverNum) ?? null,
          sector1: lap.duration_sector_1 ?? null,
          sector2: lap.duration_sector_2 ?? null,
          sector3: lap.duration_sector_3 ?? null,
          tyre: {
            compound: stint?.compound?.toUpperCase() || "MEDIUM",
            age: stint ? lapNum - stint.lap_start + (stint.tyre_age_at_start || 0) : lapNum,
            isNew: stint?.tyre_age_at_start === 0,
          },
          pitStops: stint?.stint_number ? stint.stint_number - 1 : 0,
          status: lap.is_pit_out_lap ? "PIT" : "RACING",
          isPersonalBest: lap.is_personal_best || false,
          isOverallBest: overallBestDriver === driverNum && lap.lap_duration === overallBestLap,
          lapNumber: lapNum,
          cumulativeTime: cumulativeTimes.get(driverNum) || 0,
          position: lap.position || null,
        });
      }

      // Sort by position if available, otherwise by cumulative time
      lapData.sort((a, b) => {
        // If both have explicit positions, use those
        if (a.position && b.position) {
          return a.position - b.position;
        }
        // Otherwise sort by cumulative time
        return (a.cumulativeTime || Infinity) - (b.cumulativeTime || Infinity);
      });

      // Assign positions and calculate gaps
      const leaderTime = lapData[0]?.cumulativeTime || 0;
      let prevTime = leaderTime;

      lapData.forEach((driver, index) => {
        driver.position = index + 1;

        // Calculate gap to leader
        if (index === 0) {
          driver.gap = null;
          driver.interval = null;
        } else {
          // Use interval data if available, otherwise calculate from cumulative time
          if (!driver.gap && driver.cumulativeTime) {
            driver.gap = driver.cumulativeTime - leaderTime;
          }
          if (!driver.interval && driver.cumulativeTime) {
            driver.interval = driver.cumulativeTime - prevTime;
          }
          prevTime = driver.cumulativeTime;
        }

        // Clean up internal field
        delete driver.cumulativeTime;
      });

      lapsByNumber.set(lapNum, lapData);
    }

    // Organize positions by lap for track map
    const positionsByLap = new Map<number, any[]>();
    const positionsByDriver = new Map<number, any[]>();

    for (const pos of positions) {
      const driverNum = pos.driver_number;
      if (!positionsByDriver.has(driverNum)) {
        positionsByDriver.set(driverNum, []);
      }
      positionsByDriver.get(driverNum)!.push(pos);
    }

    for (let lap = 1; lap <= maxLap; lap++) {
      const lapPositions: any[] = [];

      for (const [driverNum, driverPositions] of positionsByDriver) {
        const driverInfo = driverMap.get(driverNum);
        if (!driverInfo || driverPositions.length === 0) continue;

        const sampleIndex = Math.min(
          Math.floor((lap / maxLap) * driverPositions.length),
          driverPositions.length - 1
        );
        const pos = driverPositions[sampleIndex];

        lapPositions.push({
          driverCode: driverInfo.code,
          driverNumber: driverNum,
          teamColor: driverInfo.teamColor,
          x: pos.x || 0,
          y: pos.y || 0,
          z: pos.z || 0,
          timestamp: pos.date,
        });
      }

      positionsByLap.set(lap, lapPositions);
    }

    // Format race control messages with lap numbers
    const formattedRaceControl = raceControl.map((msg: any) => ({
      timestamp: msg.date,
      category: msg.flag ? "FLAG" : msg.category || "OTHER",
      flag: msg.flag?.toUpperCase().replace(" ", "_"),
      message: msg.message,
      driverNumber: msg.driver_number,
      lapNumber: msg.lap_number || 1,
    }));

    // Get latest weather
    const latestWeather = weather.length > 0 ? weather[weather.length - 1] : null;

    return NextResponse.json({
      lapsData: Object.fromEntries(lapsByNumber),
      positionsData: Object.fromEntries(positionsByLap),
      raceControlData: formattedRaceControl,
      weather: latestWeather
        ? {
            airTemp: latestWeather.air_temperature,
            trackTemp: latestWeather.track_temperature,
            humidity: latestWeather.humidity,
            pressure: latestWeather.pressure,
            windSpeed: latestWeather.wind_speed,
            windDirection: latestWeather.wind_direction,
            rainfall: latestWeather.rainfall > 0,
          }
        : null,
      totalLaps: maxLap,
      sessionInfo: sessionInfo ? {
        sessionKey: parseInt(sessionKey),
        sessionName: sessionInfo.session_name,
        meetingName: meetingName,
        circuitShortName: sessionInfo.circuit_short_name,
        countryName: sessionInfo.country_name,
        year: sessionInfo.year,
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Replay API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch replay data" },
      { status: 500 }
    );
  }
}
