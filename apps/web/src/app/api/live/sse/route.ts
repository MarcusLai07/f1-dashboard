import { NextRequest } from "next/server";
import { openf1Fetch } from "@/lib/openf1";
import { getCachedDrivers, type CachedDriverInfo } from "@/lib/driverCache";

// Force dynamic (no edge caching)
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function getIntervals(sessionType: string, isLive: boolean) {
  if (!isLive) {
    return { timing: 30000, position: 30000, raceControl: 30000, weather: 300000 };
  }
  switch (sessionType) {
    case "race":
    case "sprint":
      return { timing: 1000, position: 1000, raceControl: 1500, weather: 30000 };
    case "qualifying":
      return { timing: 1500, position: 2000, raceControl: 1500, weather: 30000 };
    default:
      return { timing: 2000, position: 2500, raceControl: 3000, weather: 60000 };
  }
}

// ---------------------------------------------------------------------------
// Data fetchers (reuse cached drivers, no redundant /drivers calls)
// ---------------------------------------------------------------------------

async function fetchTiming(sessionKey: string, drivers: Map<number, CachedDriverInfo>) {
  const windowAgo = new Date(Date.now() - 20000).toISOString();

  const [lapsRes, stintsRes, carDataRes] = await Promise.all([
    openf1Fetch(`/laps?session_key=${sessionKey}`),
    openf1Fetch(`/stints?session_key=${sessionKey}`),
    openf1Fetch(
      `/car_data?session_key=${sessionKey}&date%3E${encodeURIComponent(windowAgo)}`
    ).catch(() => null),
  ]);

  const [lapsData, stintsData] = await Promise.all([
    lapsRes.json(),
    stintsRes.json(),
  ]);

  const laps = Array.isArray(lapsData) ? lapsData : [];
  const stints = Array.isArray(stintsData) ? stintsData : [];

  let carData: any[] = [];
  if (carDataRes) {
    try {
      const raw = await carDataRes.json();
      carData = Array.isArray(raw) ? raw : [];
    } catch { /* ignore */ }
  }

  // Latest car_data per driver
  const latestCarData = new Map<number, { speed: number; gear: number; date: string }>();
  for (const entry of carData) {
    if (!entry?.driver_number) continue;
    const existing = latestCarData.get(entry.driver_number);
    if (!existing || new Date(entry.date) > new Date(existing.date)) {
      latestCarData.set(entry.driver_number, {
        speed: entry.speed ?? 0,
        gear: entry.n_gear ?? 0,
        date: entry.date,
      });
    }
  }

  // Latest & best laps
  const latestLaps = new Map<number, any>();
  const bestLaps = new Map<number, number>();
  let overallBest: { driver: number; time: number } | null = null;
  const lastCompletedLaps = new Map<number, any>();

  for (const lap of laps) {
    const dn = lap.driver_number;
    const lt = lap.lap_duration;
    if (!latestLaps.has(dn) || lap.lap_number > latestLaps.get(dn).lap_number)
      latestLaps.set(dn, lap);
    if (lt != null && (!lastCompletedLaps.has(dn) || lap.lap_number > lastCompletedLaps.get(dn).lap_number))
      lastCompletedLaps.set(dn, lap);
    if (lt && (!bestLaps.has(dn) || lt < bestLaps.get(dn)!))
      bestLaps.set(dn, lt);
    if (lt && (!overallBest || lt < overallBest.time))
      overallBest = { driver: dn, time: lt };
  }

  // Latest stint + history
  const latestStints = new Map<number, any>();
  const allStintsPerDriver = new Map<number, any[]>();
  for (const stint of stints) {
    const dn = stint.driver_number;
    if (!latestStints.has(dn) || stint.stint_number > latestStints.get(dn).stint_number)
      latestStints.set(dn, stint);
    const arr = allStintsPerDriver.get(dn) || [];
    arr.push(stint);
    allStintsPerDriver.set(dn, arr);
  }

  // Positions by best lap
  const allDrivers = Array.from(drivers.values());
  const sorted = allDrivers
    .map((d) => ({ ...d, bestTime: bestLaps.get(d.driverNumber) }))
    .sort((a, b) => {
      if (a.bestTime !== undefined && b.bestTime !== undefined) return a.bestTime - b.bestTime;
      if (a.bestTime !== undefined) return -1;
      if (b.bestTime !== undefined) return 1;
      return 0;
    });
  const posMap = new Map<number, number>();
  sorted.forEach((d, i) => posMap.set(d.driverNumber, i + 1));

  const timing = allDrivers.map((di) => {
    const dn = di.driverNumber;
    const lap = latestLaps.get(dn);
    const stint = latestStints.get(dn);
    const driverBest = bestLaps.get(dn);
    const position = posMap.get(dn) || 20;
    const completedLap = lastCompletedLaps.get(dn);

    let gap: number | null = null;
    let interval: number | null = null;
    if (driverBest !== undefined && overallBest) {
      gap = driverBest - overallBest.time;
      if (gap < 0.001) gap = null;
    }
    if (position > 1) {
      const ahead = sorted[position - 2];
      if (ahead?.bestTime !== undefined && driverBest !== undefined)
        interval = driverBest - ahead.bestTime;
    }

    // Determine on-track status
    // Priority: stint end (definitive pit signal from OpenF1) > active stint > speed
    const driverCarData = latestCarData.get(dn);
    const stintEnded = stint && stint.lap_end !== undefined && stint.lap_end !== null;
    const stintOngoing = stint && !stintEnded;
    const hasPartialLap = lap && lap.lap_duration === null && (lap.duration_sector_1 !== null || lap.duration_sector_2 !== null);
    let isOnTrack: boolean;

    if (stintEnded) {
      // Stint explicitly ended (lap_end set) = driver has pitted
      isOnTrack = false;
    } else if (stintOngoing || hasPartialLap) {
      // Active stint or mid-lap = on track
      isOnTrack = true;
    } else if (driverCarData) {
      // No stint data: fall back to speed
      isOnTrack = driverCarData.speed > 0;
    } else {
      isOnTrack = false;
    }

    let tyreAge = 0;
    if (stint && lap) {
      tyreAge = stint.tyre_age_at_start
        ? stint.tyre_age_at_start + (lap.lap_number - stint.lap_start)
        : lap.lap_number - stint.lap_start;
    }

    const driverStints = (allStintsPerDriver.get(dn) || [])
      .sort((a: any, b: any) => a.stint_number - b.stint_number)
      .map((s: any) => ({
        stintNumber: s.stint_number,
        compound: (s.compound?.toUpperCase() || "UNKNOWN"),
        startLap: s.lap_start,
        endLap: s.lap_end,
        tyreAge: s.tyre_age_at_start || 0,
      }));

    return {
      position,
      driverCode: di.code,
      driverNumber: dn,
      teamName: di.teamName,
      teamColor: di.teamColor,
      gap,
      interval,
      lastLap: lap?.lap_duration ?? completedLap?.lap_duration ?? null,
      bestLap: driverBest ?? null,
      sector1: lap?.duration_sector_1 ?? null,
      sector2: lap?.duration_sector_2 ?? null,
      sector3: lap?.duration_sector_3 ?? null,
      sector1Best: false,
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
      stintHistory: driverStints,
      pitStops: stint?.stint_number ? stint.stint_number - 1 : 0,
      status: isOnTrack ? "RACING" : "PIT",
      isPersonalBest: lap?.is_personal_best || completedLap?.is_personal_best || false,
      isOverallBest: overallBest?.driver === dn && (lap?.lap_duration === overallBest?.time || completedLap?.lap_duration === overallBest?.time),
      currentLap: lap?.lap_number ?? 0,
      speed: driverCarData?.speed ?? null,
      gear: driverCarData?.gear ?? null,
      miniSectors: {
        sector1: lap?.segments_sector_1 || [],
        sector2: lap?.segments_sector_2 || [],
        sector3: lap?.segments_sector_3 || [],
      },
    };
  });

  timing.sort((a: any, b: any) => a.position - b.position);
  return timing;
}

async function fetchPosition(sessionKey: string, drivers: Map<number, CachedDriverInfo>) {
  const positionsRes = await openf1Fetch(`/position?session_key=${sessionKey}`);
  const positionsData = await positionsRes.json();
  const positions = Array.isArray(positionsData) ? positionsData : [];

  const latest = new Map<number, any>();
  for (const pos of positions) {
    if (!pos?.driver_number) continue;
    const dn = pos.driver_number;
    if (!latest.has(dn) || new Date(pos.date) > new Date(latest.get(dn).date))
      latest.set(dn, pos);
  }

  const result: any[] = [];
  for (const [dn, pos] of latest) {
    const di = drivers.get(dn);
    if (!di) continue;
    result.push({
      driverCode: di.code,
      driverNumber: dn,
      teamColor: di.teamColor,
      x: pos.x || 0,
      y: pos.y || 0,
      z: pos.z || 0,
      timestamp: pos.date,
    });
  }
  return result;
}

async function fetchLocation(sessionKey: string, drivers: Map<number, CachedDriverInfo>) {
  const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
  const locationRes = await openf1Fetch(
    `/location?session_key=${sessionKey}&date%3E${encodeURIComponent(thirtySecondsAgo)}`
  );
  const locationData = await locationRes.json();
  const locations = Array.isArray(locationData) ? locationData : [];

  const latest = new Map<number, any>();
  for (const loc of locations) {
    if (!loc?.driver_number || loc.x === undefined || loc.y === undefined) continue;
    const dn = loc.driver_number;
    if (!latest.has(dn) || new Date(loc.date) > new Date(latest.get(dn).date))
      latest.set(dn, loc);
  }

  const points: any[] = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (const [dn, loc] of latest) {
    const di = drivers.get(dn);
    if (!di) continue;
    const hasReal = loc.x !== 0 || loc.y !== 0;
    if (hasReal) {
      if (loc.x < minX) minX = loc.x;
      if (loc.x > maxX) maxX = loc.x;
      if (loc.y < minY) minY = loc.y;
      if (loc.y > maxY) maxY = loc.y;
    }
    points.push({
      driverCode: di.code,
      driverNumber: dn,
      teamColor: di.teamColor,
      x: loc.x,
      y: loc.y,
      z: loc.z || 0,
      timestamp: loc.date,
    });
  }

  const hasRealBounds = minX !== Infinity;
  const bounds = hasRealBounds
    ? { minX: minX - 100, maxX: maxX + 100, minY: minY - 100, maxY: maxY + 100 }
    : null;

  return { locations: points, bounds };
}

async function fetchRaceControl(sessionKey: string, since?: string) {
  let url = `/race_control?session_key=${sessionKey}`;
  if (since) url += `&date>=${since}`;

  const response = await openf1Fetch(url);
  if (!response.ok) return [];

  const messages = await response.json();
  if (!Array.isArray(messages)) return [];

  const formatted = messages.map((msg: any) => {
    let category = "OTHER";
    let flag: string | undefined;

    if (msg.flag) {
      category = "FLAG";
      flag = msg.flag.toUpperCase().replace(" ", "_");
    } else if (msg.message?.toLowerCase().includes("safety car") || msg.category === "SafetyCar") {
      category = "SAFETY_CAR";
    } else if (msg.message?.toLowerCase().includes("virtual safety car") || msg.category === "Vsc") {
      category = "VSC";
    } else if (msg.message?.toLowerCase().includes("drs")) {
      category = "DRS";
    } else if (msg.category === "Flag") {
      category = "FLAG";
    } else if (msg.category === "Incident") {
      category = "INCIDENT";
    }

    return {
      timestamp: msg.date,
      category,
      flag,
      message: msg.message,
      driverNumber: msg.driver_number,
      sector: msg.sector,
      scope: msg.scope,
    };
  });

  formatted.sort(
    (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return formatted;
}

async function fetchOvertakes(sessionKey: string, since?: string) {
  let url = `/overtakes?session_key=${sessionKey}`;
  if (since) url += `&date>=${since}`;

  const response = await openf1Fetch(url);
  if (!response.ok) return [];

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  const formatted = data
    .filter((o: any) => o.overtaking_driver_number && o.overtaken_driver_number)
    .map((o: any) => ({
      timestamp: o.date,
      position: o.position,
      overtakingDriverNumber: o.overtaking_driver_number,
      overtakenDriverNumber: o.overtaken_driver_number,
    }));

  formatted.sort(
    (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return formatted;
}

async function fetchWeather(sessionKey: string) {
  const response = await openf1Fetch(`/weather?session_key=${sessionKey}`);
  if (!response.ok) return null;

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const latest = data[data.length - 1];
  return {
    airTemp: latest.air_temperature,
    trackTemp: latest.track_temperature,
    humidity: latest.humidity,
    pressure: latest.pressure,
    windSpeed: latest.wind_speed,
    windDirection: latest.wind_direction,
    rainfall: latest.rainfall > 0,
    timestamp: latest.date,
  };
}

// ---------------------------------------------------------------------------
// SSE Route Handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionKey = searchParams.get("session_key");
  const sessionType = searchParams.get("session_type") || "practice";
  const isLive = searchParams.get("is_live") === "true";
  const skipLocation = searchParams.get("skip_location") === "true";

  if (!sessionKey) {
    return new Response("session_key is required", { status: 400 });
  }

  const intervals = getIntervals(sessionType, isLive);
  let lastRaceControlTimestamp: string | undefined;
  let lastOvertakeTimestamp: string | undefined;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        } catch {
          // Stream closed
          closed = true;
        }
      }

      // Heartbeat every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          closed = true;
        }
      }, 15000);

      // --- Polling loops ---

      async function pollTiming() {
        if (closed) return;
        try {
          const drivers = await getCachedDrivers(sessionKey!);
          const timing = await fetchTiming(sessionKey!, drivers);
          send("timing", { timing, timestamp: new Date().toISOString() });
        } catch { /* next poll will retry */ }
      }

      async function pollPosition() {
        if (closed) return;
        try {
          const drivers = await getCachedDrivers(sessionKey!);
          const positions = await fetchPosition(sessionKey!, drivers);
          send("position", { positions, timestamp: new Date().toISOString() });
        } catch { /* next poll will retry */ }
      }

      async function pollLocation() {
        if (closed || skipLocation) return;
        try {
          const drivers = await getCachedDrivers(sessionKey!);
          const loc = await fetchLocation(sessionKey!, drivers);
          send("location", { ...loc, timestamp: new Date().toISOString() });
        } catch { /* next poll will retry */ }
      }

      async function pollRaceControl() {
        if (closed) return;
        try {
          const messages = await fetchRaceControl(sessionKey!, lastRaceControlTimestamp);
          if (messages.length > 0) {
            lastRaceControlTimestamp = messages[0].timestamp;
          }
          send("raceControl", { messages, timestamp: new Date().toISOString() });
        } catch { /* next poll will retry */ }
      }

      async function pollOvertakes() {
        if (closed) return;
        try {
          const overtakes = await fetchOvertakes(sessionKey!, lastOvertakeTimestamp);
          if (overtakes.length > 0) {
            lastOvertakeTimestamp = overtakes[0].timestamp;
            send("overtakes", { overtakes, timestamp: new Date().toISOString() });
          }
        } catch { /* next poll will retry */ }
      }

      async function pollWeather() {
        if (closed) return;
        try {
          const weather = await fetchWeather(sessionKey!);
          send("weather", { weather, timestamp: new Date().toISOString() });
        } catch { /* next poll will retry */ }
      }

      // Initial burst — fetch everything once
      pollTiming();
      pollPosition();
      pollLocation();
      pollRaceControl();
      pollOvertakes();
      pollWeather();

      // Set up independent intervals
      const timingTimer = setInterval(pollTiming, intervals.timing);
      const positionTimer = setInterval(pollPosition, intervals.position);
      const locationTimer = skipLocation ? null : setInterval(pollLocation, intervals.position);
      const raceControlTimer = setInterval(pollRaceControl, intervals.raceControl);
      const overtakesTimer = setInterval(pollOvertakes, intervals.raceControl);
      const weatherTimer = setInterval(pollWeather, intervals.weather);

      // Cleanup when stream is cancelled (client disconnect)
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(heartbeat);
        clearInterval(timingTimer);
        clearInterval(positionTimer);
        if (locationTimer) clearInterval(locationTimer);
        clearInterval(raceControlTimer);
        clearInterval(overtakesTimer);
        clearInterval(weatherTimer);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering if present
    },
  });
}
