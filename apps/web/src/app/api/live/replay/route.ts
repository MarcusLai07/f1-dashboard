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
    // Fetch all data for the session at once
    const [driversRes, lapsRes, stintsRes, intervalsRes, positionsRes, raceControlRes, weatherRes] =
      await Promise.all([
        fetch(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`),
        fetch(`${OPENF1_BASE}/laps?session_key=${sessionKey}`),
        fetch(`${OPENF1_BASE}/stints?session_key=${sessionKey}`),
        fetch(`${OPENF1_BASE}/intervals?session_key=${sessionKey}`),
        fetch(`${OPENF1_BASE}/position?session_key=${sessionKey}`),
        fetch(`${OPENF1_BASE}/race_control?session_key=${sessionKey}`),
        fetch(`${OPENF1_BASE}/weather?session_key=${sessionKey}`),
      ]);

    const [drivers, laps, stints, intervals, positions, raceControl, weather] = await Promise.all([
      driversRes.json(),
      lapsRes.json(),
      stintsRes.json(),
      intervalsRes.json(),
      positionsRes.json(),
      raceControlRes.json(),
      weatherRes.json(),
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

    // Organize laps by lap number
    const lapsByNumber = new Map<number, any[]>();
    let maxLap = 0;

    for (const lap of laps) {
      const lapNum = lap.lap_number;
      if (lapNum > maxLap) maxLap = lapNum;

      if (!lapsByNumber.has(lapNum)) {
        lapsByNumber.set(lapNum, []);
      }

      const driverInfo = driverMap.get(lap.driver_number);
      if (!driverInfo) continue;

      // Find stint info for this driver at this lap
      const stint = stints.find(
        (s: any) =>
          s.driver_number === lap.driver_number &&
          s.lap_start <= lapNum &&
          (s.lap_end === null || s.lap_end >= lapNum)
      );

      // Find interval info
      const interval = intervals.find(
        (i: any) => i.driver_number === lap.driver_number && i.lap_number === lapNum
      );

      lapsByNumber.get(lapNum)!.push({
        position: lap.position || 99,
        driverCode: driverInfo.code,
        driverNumber: lap.driver_number,
        teamName: driverInfo.teamName,
        teamColor: driverInfo.teamColor,
        gap: interval?.gap_to_leader ?? null,
        interval: interval?.interval ?? null,
        lastLap: lap.lap_duration ?? null,
        bestLap: null, // Will calculate on client
        sector1: lap.duration_sector_1 ?? null,
        sector2: lap.duration_sector_2 ?? null,
        sector3: lap.duration_sector_3 ?? null,
        tyre: {
          compound: stint?.compound?.toUpperCase() || "UNKNOWN",
          age: stint ? lapNum - stint.lap_start + (stint.tyre_age_at_start || 0) : 0,
          isNew: stint?.tyre_age_at_start === 0,
        },
        pitStops: stint?.stint_number ? stint.stint_number - 1 : 0,
        status: lap.is_pit_out_lap ? "PIT" : "RACING",
        isPersonalBest: lap.is_personal_best || false,
        isOverallBest: false,
        lapNumber: lapNum,
      });
    }

    // Sort each lap's data by position
    for (const [lapNum, lapData] of lapsByNumber) {
      lapData.sort((a, b) => a.position - b.position);
    }

    // Organize positions by lap (approximate by grouping by time ranges)
    // For simplicity, we'll sample positions at regular intervals
    const positionsByLap = new Map<number, any[]>();

    // Group positions by driver and get their track positions per lap
    const positionsByDriver = new Map<number, any[]>();
    for (const pos of positions) {
      const driverNum = pos.driver_number;
      if (!positionsByDriver.has(driverNum)) {
        positionsByDriver.set(driverNum, []);
      }
      positionsByDriver.get(driverNum)!.push(pos);
    }

    // For each lap, get representative positions
    for (let lap = 1; lap <= maxLap; lap++) {
      const lapPositions: any[] = [];

      for (const [driverNum, driverPositions] of positionsByDriver) {
        const driverInfo = driverMap.get(driverNum);
        if (!driverInfo || driverPositions.length === 0) continue;

        // Get a position sample for this lap (roughly)
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

    // Format race control messages
    const formattedRaceControl = raceControl.map((msg: any) => ({
      timestamp: msg.date,
      category: msg.flag ? "FLAG" : msg.category || "OTHER",
      flag: msg.flag?.toUpperCase().replace(" ", "_"),
      message: msg.message,
      driverNumber: msg.driver_number,
      lapNumber: msg.lap_number,
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
      sessionInfo: {
        sessionKey: parseInt(sessionKey),
      },
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
