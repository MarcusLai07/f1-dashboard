import { NextRequest, NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

// Simple in-memory cache for replay data
const replayCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Helper to fetch with retry and delay
async function fetchWithRetry(
  url: string,
  retries = 3,
  delay = 500
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, { cache: "force-cache" });

    if (response.ok) {
      return response;
    }

    if (response.status === 429 && i < retries - 1) {
      // Rate limited - wait and retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      continue;
    }

    if (!response.ok && i === retries - 1) {
      return response; // Return last failed response
    }
  }

  // Should never reach here, but TypeScript needs this
  throw new Error("Fetch failed");
}

interface LapData {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  st_speed: number | null;
  is_pit_out_lap: boolean;
  segments_sector_1: number[] | null;
  segments_sector_2: number[] | null;
  segments_sector_3: number[] | null;
  date_start: string;
}

interface DriverData {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  session_key: number;
}

interface PositionData {
  driver_number: number;
  position: number;
  date: string;
}

interface StintData {
  driver_number: number;
  lap_start: number;
  lap_end: number | null;
  compound: string;
  tyre_age_at_start: number;
}

interface RaceControlData {
  date: string;
  lap_number: number | null;
  category: string;
  message: string;
  flag: string | null;
  scope: string | null;
  driver_number: number | null;
}

interface WeatherData {
  date: string;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  rainfall: number;
}

interface SessionData {
  session_key: number;
  session_name: string;
  session_type: string;
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  country_name: string;
  date_start: string;
  date_end: string | null;
  year: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionKey = searchParams.get("session_key");

  if (!sessionKey) {
    return NextResponse.json({ error: "session_key is required" }, { status: 400 });
  }

  // Check cache first
  const cacheKey = `replay_${sessionKey}`;
  const cached = replayCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Fetch session info first
    const sessionRes = await fetchWithRetry(
      `${OPENF1_BASE}/sessions?session_key=${sessionKey}`
    );

    let sessionInfo: SessionData | null = null;
    let meetingName: string | null = null;

    if (sessionRes.ok) {
      const sessionData = await sessionRes.json();
      if (Array.isArray(sessionData) && sessionData.length > 0) {
        sessionInfo = sessionData[0];

        // Fetch meeting info for meeting name
        if (sessionInfo && sessionInfo.meeting_key) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          const meetingRes = await fetchWithRetry(
            `${OPENF1_BASE}/meetings?meeting_key=${sessionInfo.meeting_key}`
          );
          if (meetingRes.ok) {
            const meetingData = await meetingRes.json();
            if (Array.isArray(meetingData) && meetingData.length > 0) {
              meetingName = meetingData[0].meeting_name;
            }
          }
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Fetch data sequentially to avoid rate limiting
    // Start with drivers (smallest, fastest)
    const driversRes = await fetchWithRetry(
      `${OPENF1_BASE}/drivers?session_key=${sessionKey}`
    );

    if (!driversRes.ok) {
      if (driversRes.status === 429) {
        return NextResponse.json(
          { error: "Rate limited by OpenF1 API. Please wait a moment and try again." },
          { status: 429 }
        );
      }
      throw new Error(`OpenF1 API error: drivers ${driversRes.status}`);
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 200));

    const lapsRes = await fetchWithRetry(
      `${OPENF1_BASE}/laps?session_key=${sessionKey}`
    );

    if (!lapsRes.ok) {
      if (lapsRes.status === 429) {
        return NextResponse.json(
          { error: "Rate limited by OpenF1 API. Please wait a moment and try again." },
          { status: 429 }
        );
      }
      throw new Error(`OpenF1 API error: laps ${lapsRes.status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    const positionsRes = await fetchWithRetry(
      `${OPENF1_BASE}/position?session_key=${sessionKey}`
    );

    await new Promise((resolve) => setTimeout(resolve, 200));

    const stintsRes = await fetchWithRetry(
      `${OPENF1_BASE}/stints?session_key=${sessionKey}`
    );

    await new Promise((resolve) => setTimeout(resolve, 200));

    const raceControlRes = await fetchWithRetry(
      `${OPENF1_BASE}/race_control?session_key=${sessionKey}`
    );

    await new Promise((resolve) => setTimeout(resolve, 200));

    const weatherRes = await fetchWithRetry(
      `${OPENF1_BASE}/weather?session_key=${sessionKey}`
    );

    const [lapsData, driversData, positionsData, stintsData, raceControlData, weatherData]: [
      LapData[],
      DriverData[],
      PositionData[],
      StintData[],
      RaceControlData[],
      WeatherData[]
    ] = await Promise.all([
      lapsRes.json(),
      driversRes.json(),
      positionsRes.ok ? positionsRes.json() : [],
      stintsRes.ok ? stintsRes.json() : [],
      raceControlRes.ok ? raceControlRes.json() : [],
      weatherRes.ok ? weatherRes.json() : [],
    ]);

    // Group laps by lap number
    const lapsByNumber = new Map<number, LapData[]>();
    lapsData.forEach((lap) => {
      const existing = lapsByNumber.get(lap.lap_number) || [];
      existing.push(lap);
      lapsByNumber.set(lap.lap_number, existing);
    });

    // Get max lap number
    const maxLap = Math.max(...lapsData.map((l) => l.lap_number), 0);

    // Build positions by lap (find closest position update before each lap)
    const positionsByDriver = new Map<number, PositionData[]>();
    positionsData.forEach((p) => {
      const existing = positionsByDriver.get(p.driver_number) || [];
      existing.push(p);
      positionsByDriver.set(p.driver_number, existing);
    });

    // Sort positions by date for each driver
    positionsByDriver.forEach((positions) => {
      positions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    // Group race control by lap
    const raceControlByLap = new Map<number, RaceControlData[]>();
    raceControlData.forEach((rc) => {
      const lap = rc.lap_number || 0;
      const existing = raceControlByLap.get(lap) || [];
      existing.push(rc);
      raceControlByLap.set(lap, existing);
    });

    // Sort weather data by timestamp for finding closest weather to each lap
    const sortedWeather = [...weatherData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Helper to find closest weather reading for a given timestamp
    function getWeatherForTimestamp(timestamp: string): WeatherData | null {
      if (sortedWeather.length === 0) return null;
      const targetTime = new Date(timestamp).getTime();

      // Find the weather reading closest to this timestamp
      let closest = sortedWeather[0];
      let closestDiff = Math.abs(new Date(closest.date).getTime() - targetTime);

      for (const weather of sortedWeather) {
        const diff = Math.abs(new Date(weather.date).getTime() - targetTime);
        if (diff < closestDiff) {
          closest = weather;
          closestDiff = diff;
        }
        // If we've passed the target time and diff is increasing, we found the closest
        if (new Date(weather.date).getTime() > targetTime && diff > closestDiff) {
          break;
        }
      }
      return closest;
    }

    // Helper to get tyre info for a driver at a given lap
    function getTyreInfo(driverNumber: number, lapNumber: number) {
      const driverStints = stintsData.filter((s) => s.driver_number === driverNumber);
      const currentStint = driverStints.find(
        (s) => s.lap_start <= lapNumber && (s.lap_end === null || s.lap_end >= lapNumber)
      );
      if (currentStint) {
        return {
          compound: currentStint.compound,
          age: lapNumber - currentStint.lap_start + currentStint.tyre_age_at_start,
        };
      }
      return { compound: "UNKNOWN", age: 0 };
    }

    // Helper to get all stint history for a driver up to a given lap
    function getStintHistory(driverNumber: number, lapNumber: number) {
      const driverStints = stintsData
        .filter((s) => s.driver_number === driverNumber && s.lap_start <= lapNumber)
        .sort((a, b) => a.lap_start - b.lap_start);

      return driverStints.map((stint, idx) => ({
        stintNumber: idx + 1,
        compound: stint.compound.toUpperCase() as "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET",
        startLap: stint.lap_start,
        endLap: stint.lap_end,
        tyreAge: stint.tyre_age_at_start,
      }));
    }

    // Track best lap times for position calculation (used in practice/qualifying)
    const bestLapTimes = new Map<number, number>();

    // Helper to calculate positions based on BEST LAP TIME (for practice/qualifying)
    // This is the correct behavior - fastest best lap = P1
    function calculatePositionsByBestLap(): Map<number, number> {
      const positions = new Map<number, number>();

      // Get all drivers with their best times
      const driversWithBestTimes: { driverNumber: number; bestTime: number }[] = [];
      const driversWithoutTimes: number[] = [];

      driversData.forEach((driver) => {
        const bestTime = bestLapTimes.get(driver.driver_number);
        if (bestTime !== undefined) {
          driversWithBestTimes.push({ driverNumber: driver.driver_number, bestTime });
        } else {
          driversWithoutTimes.push(driver.driver_number);
        }
      });

      // Sort by best lap time (fastest = first place)
      driversWithBestTimes.sort((a, b) => a.bestTime - b.bestTime);

      // Assign positions 1 through N for drivers with times
      driversWithBestTimes.forEach((driver, idx) => {
        positions.set(driver.driverNumber, idx + 1);
      });

      // Drivers without times go to the bottom
      driversWithoutTimes.forEach((driverNumber, idx) => {
        positions.set(driverNumber, driversWithBestTimes.length + idx + 1);
      });

      return positions;
    }

    // Track personal bests and overall bests for sector highlighting
    const personalBests = new Map<number, { s1: number; s2: number; s3: number; lap: number }>();
    const overallBests = { s1: Infinity, s2: Infinity, s3: Infinity, lap: Infinity };

    // Track last known state for each driver
    const lastKnownState = new Map<number, {
      lastLap: number | null;
      bestLap: number | null;
      lastSeenLap: number;
      tyre: { compound: string; age: number };
    }>();

    // Initialize last known state for all drivers
    driversData.forEach((driver) => {
      lastKnownState.set(driver.driver_number, {
        lastLap: null,
        bestLap: null,
        lastSeenLap: 0,
        tyre: { compound: "UNKNOWN", age: 0 },
      });
    });

    // Helper to detect investigation/penalty from race control messages up to a certain timestamp
    function getDriverIncidentStatus(driverNumber: number, upToTimestamp: string): { isUnderInvestigation: boolean; hasPenalty: boolean; penaltySeconds: number | null } {
      const upToTime = new Date(upToTimestamp).getTime();
      const relevantMessages = raceControlData
        .filter((rc) => {
          const rcTime = new Date(rc.date).getTime();
          return rcTime <= upToTime && rc.driver_number === driverNumber;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // newest first

      let isUnderInvestigation = false;
      let hasPenalty = false;
      let penaltySeconds: number | null = null;

      for (const rc of relevantMessages) {
        const msg = rc.message?.toUpperCase() || "";

        // Check for penalties (more specific first)
        if (msg.includes("TIME PENALTY") || msg.includes("SECOND TIME PENALTY") || msg.includes("SEC PENALTY")) {
          hasPenalty = true;
          // Try to extract penalty seconds
          const match = msg.match(/(\d+)\s*SECOND/);
          if (match) {
            penaltySeconds = parseInt(match[1], 10);
          }
          isUnderInvestigation = false; // Investigation resolved
          break;
        } else if (msg.includes("PENALTY") && !msg.includes("NO FURTHER")) {
          hasPenalty = true;
          isUnderInvestigation = false;
          break;
        } else if (msg.includes("NO FURTHER ACTION") || msg.includes("NO INVESTIGATION")) {
          // Investigation cleared
          isUnderInvestigation = false;
          break;
        } else if (msg.includes("UNDER INVESTIGATION") || msg.includes("NOTED") || msg.includes("WILL BE INVESTIGATED")) {
          isUnderInvestigation = true;
          // Don't break - there might be a resolution later (but we sorted newest first, so this is the latest status)
          break;
        }
      }

      return { isUnderInvestigation, hasPenalty, penaltySeconds };
    }

    // Build snapshots for each lap
    const snapshots = [];
    for (let lap = 1; lap <= maxLap; lap++) {
      const lapDrivers = lapsByNumber.get(lap) || [];
      const raceControlMessages = raceControlByLap.get(lap) || [];

      // Create a set of drivers who have data this lap (on track)
      const driversWithDataThisLap = new Set(lapDrivers.map((l) => l.driver_number));

      // First, process all lap data to update personal bests and best lap times
      lapDrivers.forEach((lapData) => {
        const pb = personalBests.get(lapData.driver_number) || { s1: Infinity, s2: Infinity, s3: Infinity, lap: Infinity };

        // Update personal bests
        if (lapData.duration_sector_1 && lapData.duration_sector_1 < pb.s1) pb.s1 = lapData.duration_sector_1;
        if (lapData.duration_sector_2 && lapData.duration_sector_2 < pb.s2) pb.s2 = lapData.duration_sector_2;
        if (lapData.duration_sector_3 && lapData.duration_sector_3 < pb.s3) pb.s3 = lapData.duration_sector_3;
        if (lapData.lap_duration && lapData.lap_duration < pb.lap) pb.lap = lapData.lap_duration;
        personalBests.set(lapData.driver_number, pb);

        // Update best lap time for position calculation
        if (lapData.lap_duration !== null) {
          const currentBest = bestLapTimes.get(lapData.driver_number);
          if (currentBest === undefined || lapData.lap_duration < currentBest) {
            bestLapTimes.set(lapData.driver_number, lapData.lap_duration);
          }
        }

        // Update overall bests
        if (lapData.duration_sector_1 && lapData.duration_sector_1 < overallBests.s1) overallBests.s1 = lapData.duration_sector_1;
        if (lapData.duration_sector_2 && lapData.duration_sector_2 < overallBests.s2) overallBests.s2 = lapData.duration_sector_2;
        if (lapData.duration_sector_3 && lapData.duration_sector_3 < overallBests.s3) overallBests.s3 = lapData.duration_sector_3;
        if (lapData.lap_duration && lapData.lap_duration < overallBests.lap) overallBests.lap = lapData.lap_duration;

        // Update last known state
        const tyreInfo = getTyreInfo(lapData.driver_number, lap);
        lastKnownState.set(lapData.driver_number, {
          lastLap: lapData.lap_duration,
          bestLap: pb.lap === Infinity ? null : pb.lap,
          lastSeenLap: lap,
          tyre: tyreInfo,
        });
      });

      // Calculate positions based on BEST LAP TIME (correct for practice/qualifying)
      const positionsForLap = calculatePositionsByBestLap();

      // Build timing data for ALL drivers
      const timing = driversData.map((driverInfo) => {
        const driverNumber = driverInfo.driver_number;
        const lapData = lapDrivers.find((l) => l.driver_number === driverNumber);
        const isOnTrack = driversWithDataThisLap.has(driverNumber);
        const state = lastKnownState.get(driverNumber);
        const pb = personalBests.get(driverNumber) || { s1: Infinity, s2: Infinity, s3: Infinity, lap: Infinity };
        const tyreInfo = getTyreInfo(driverNumber, lap);
        const position = positionsForLap.get(driverNumber) || 20;

        // Get investigation/penalty status for this driver at this point in time
        const lapTimestamp = lapDrivers[0]?.date_start || new Date().toISOString();
        const incidentStatus = getDriverIncidentStatus(driverNumber, lapTimestamp);

        // If driver has lap data this lap, use it
        if (lapData && isOnTrack) {
          const s1Best = lapData.duration_sector_1 === overallBests.s1 ? "purple" : lapData.duration_sector_1 === pb.s1 ? "green" : "yellow";
          const s2Best = lapData.duration_sector_2 === overallBests.s2 ? "purple" : lapData.duration_sector_2 === pb.s2 ? "green" : "yellow";
          const s3Best = lapData.duration_sector_3 === overallBests.s3 ? "purple" : lapData.duration_sector_3 === pb.s3 ? "green" : "yellow";

          return {
            position,
            driverCode: driverInfo.name_acronym || `D${driverNumber}`,
            driverNumber,
            teamName: driverInfo.team_name || "Unknown",
            teamColor: driverInfo.team_colour ? `#${driverInfo.team_colour}` : "#ffffff",
            gap: null as number | null,
            interval: null as number | null,
            lastLap: lapData.lap_duration,
            bestLap: pb.lap === Infinity ? null : pb.lap,
            sector1: lapData.duration_sector_1,
            sector2: lapData.duration_sector_2,
            sector3: lapData.duration_sector_3,
            sector1Best: s1Best === "purple",
            sector2Best: s2Best === "purple",
            sector3Best: s3Best === "purple",
            sector1PersonalBest: s1Best === "green",
            sector2PersonalBest: s2Best === "green",
            sector3PersonalBest: s3Best === "green",
            tyre: {
              compound: tyreInfo.compound.toUpperCase() as "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET",
              age: tyreInfo.age,
              isNew: tyreInfo.age === 0,
            },
            stintHistory: getStintHistory(driverNumber, lap),
            pitStops: Math.max(0, getStintHistory(driverNumber, lap).length - 1),
            status: lapData.is_pit_out_lap ? "PIT" as const : "RACING" as const,
            isPersonalBest: lapData.lap_duration !== null && lapData.lap_duration === pb.lap,
            isOverallBest: lapData.lap_duration !== null && lapData.lap_duration === overallBests.lap,
            currentLap: lap,
            miniSectors: {
              sector1: lapData.segments_sector_1 || [],
              sector2: lapData.segments_sector_2 || [],
              sector3: lapData.segments_sector_3 || [],
            },
            // Investigation and penalty status
            isUnderInvestigation: incidentStatus.isUnderInvestigation,
            hasPenalty: incidentStatus.hasPenalty,
            penaltySeconds: incidentStatus.penaltySeconds,
          };
        }

        // Driver is in pit (not on a flying lap) - show their best lap data
        return {
          position,
          driverCode: driverInfo.name_acronym || `D${driverNumber}`,
          driverNumber,
          teamName: driverInfo.team_name || "Unknown",
          teamColor: driverInfo.team_colour ? `#${driverInfo.team_colour}` : "#ffffff",
          gap: null as number | null,
          interval: null as number | null,
          lastLap: state?.lastLap || null,
          bestLap: pb.lap === Infinity ? null : pb.lap,
          sector1: null,
          sector2: null,
          sector3: null,
          sector1Best: false,
          sector2Best: false,
          sector3Best: false,
          sector1PersonalBest: false,
          sector2PersonalBest: false,
          sector3PersonalBest: false,
          tyre: {
            compound: tyreInfo.compound.toUpperCase() as "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET",
            age: tyreInfo.age,
            isNew: tyreInfo.age === 0,
          },
          stintHistory: getStintHistory(driverNumber, lap),
          pitStops: Math.max(0, getStintHistory(driverNumber, lap).length - 1),
          // In practice, drivers in pit are just "PIT" not "OUT"
          status: "PIT" as const,
          isPersonalBest: false,
          isOverallBest: false,
          currentLap: state?.lastSeenLap || 0,
          miniSectors: {
            sector1: [],
            sector2: [],
            sector3: [],
          },
          // Investigation and penalty status
          isUnderInvestigation: incidentStatus.isUnderInvestigation,
          hasPenalty: incidentStatus.hasPenalty,
          penaltySeconds: incidentStatus.penaltySeconds,
        };
      });

      // Sort by position (already based on best lap time)
      timing.sort((a, b) => a.position - b.position);

      // Calculate gaps based on BEST LAP TIME difference from leader
      if (timing.length > 0) {
        const leaderBestLap = timing[0].bestLap;
        timing.forEach((driver, idx) => {
          if (idx === 0) {
            driver.gap = null;
            driver.interval = null;
          } else {
            // Gap is the difference between this driver's best lap and the leader's best lap
            if (driver.bestLap && leaderBestLap) {
              driver.gap = driver.bestLap - leaderBestLap;
            }
            // Interval is the difference to the driver ahead
            const prev = timing[idx - 1];
            if (driver.bestLap && prev.bestLap) {
              driver.interval = driver.bestLap - prev.bestLap;
            }
          }
        });
      }

      const raceControl = raceControlMessages.map((rc) => ({
        timestamp: rc.date,
        category: rc.category,
        message: rc.message,
        flag: rc.flag,
        scope: rc.scope,
        driverNumber: rc.driver_number,
        lapNumber: rc.lap_number,
      }));

      // Get weather for this lap's timestamp
      const lapTimestamp = lapDrivers[0]?.date_start || new Date().toISOString();
      const weatherForLap = getWeatherForTimestamp(lapTimestamp);
      const weather = weatherForLap ? {
        airTemp: weatherForLap.air_temperature,
        trackTemp: weatherForLap.track_temperature,
        humidity: weatherForLap.humidity,
        pressure: weatherForLap.pressure,
        windSpeed: weatherForLap.wind_speed,
        windDirection: weatherForLap.wind_direction,
        rainfall: weatherForLap.rainfall > 0,
        timestamp: weatherForLap.date,
      } : null;

      // Derive track status from race control messages
      // Look for the most recent track status affecting message
      let trackStatus: { status: "AllClear" | "Yellow" | "SCDeployed" | "VSCDeployed" | "Red"; message?: string } = { status: "AllClear" };
      const allRaceControlUpToLap = raceControlData
        .filter((rc) => (rc.lap_number || 0) <= lap)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      for (const rc of allRaceControlUpToLap) {
        if (rc.flag === "RED") {
          trackStatus = { status: "Red", message: rc.message };
          break;
        } else if (rc.category === "SafetyCar" || rc.message?.toLowerCase().includes("safety car")) {
          trackStatus = { status: "SCDeployed", message: rc.message };
          break;
        } else if (rc.category === "Vsc" || rc.message?.toLowerCase().includes("virtual safety car") || rc.message?.toLowerCase().includes("vsc")) {
          trackStatus = { status: "VSCDeployed", message: rc.message };
          break;
        } else if (rc.flag === "YELLOW" || rc.flag === "DOUBLE YELLOW") {
          trackStatus = { status: "Yellow", message: rc.message };
          break;
        } else if (rc.flag === "GREEN" || rc.message?.toLowerCase().includes("green light") || rc.message?.toLowerCase().includes("track clear")) {
          trackStatus = { status: "AllClear", message: rc.message };
          break;
        }
      }

      // Detect qualifying round from race control messages
      // Look for messages indicating Q1, Q2, Q3, SQ1, SQ2, SQ3 session starts
      let qualifyingRound: "Q1" | "Q2" | "Q3" | "SQ1" | "SQ2" | "SQ3" | null = null;
      const allRaceControlByTime = raceControlData
        .filter((rc) => new Date(rc.date).getTime() <= new Date(lapTimestamp).getTime())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      for (const rc of allRaceControlByTime) {
        const msg = rc.message?.toUpperCase() || "";
        // Check for explicit round mentions in messages
        if (msg.includes("Q3") || msg.includes("SQ3")) {
          qualifyingRound = msg.includes("SQ3") || msg.includes("SPRINT") ? "SQ3" : "Q3";
          break;
        } else if (msg.includes("Q2") || msg.includes("SQ2")) {
          qualifyingRound = msg.includes("SQ2") || msg.includes("SPRINT") ? "SQ2" : "Q2";
          break;
        } else if (msg.includes("Q1") || msg.includes("SQ1")) {
          qualifyingRound = msg.includes("SQ1") || msg.includes("SPRINT") ? "SQ1" : "Q1";
          break;
        }
      }

      // If no round detected from messages but this is a qualifying session, default to Q1/SQ1
      const isSprintQualifying = sessionInfo?.session_type?.toLowerCase().includes("sprint") ||
        sessionInfo?.session_name?.toLowerCase().includes("sprint") ||
        sessionInfo?.session_name?.toLowerCase().includes("shootout");

      if (!qualifyingRound && sessionInfo?.session_type?.toLowerCase().includes("qualifying")) {
        qualifyingRound = isSprintQualifying ? "SQ1" : "Q1";
      }

      snapshots.push({
        lap,
        timestamp: lapTimestamp,
        timing,
        raceControl,
        weather,
        trackStatus,
        qualifyingRound,
      });
    }

    const responseData = {
      sessionKey: parseInt(sessionKey),
      totalLaps: maxLap,
      snapshots,
      timestamp: new Date().toISOString(),
      // Session info for qualifying detection
      session: sessionInfo ? {
        sessionKey: sessionInfo.session_key,
        sessionName: sessionInfo.session_name,
        sessionType: sessionInfo.session_type,
        meetingKey: sessionInfo.meeting_key,
        meetingName: meetingName || sessionInfo.country_name || "Unknown GP",
        circuitKey: sessionInfo.circuit_key,
        circuitShortName: sessionInfo.circuit_short_name,
        countryName: sessionInfo.country_name,
        startTime: sessionInfo.date_start,
        endTime: sessionInfo.date_end,
        year: sessionInfo.year,
        status: "finished" as const,
      } : null,
    };

    // Cache the result
    replayCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Replay API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session replay data. Please try again in a few seconds." },
      { status: 500 }
    );
  }
}
