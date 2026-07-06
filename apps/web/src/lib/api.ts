import type {
  Session,
  DriverTiming,
  CarPosition,
  CarLocation,
  DriverTelemetry,
  RaceControlMessage,
  Weather,
  Driver,
} from "@/types/f1";

const API_BASE = "/api/live";

// Rate limit tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 350; // ms between requests

// Generic fetch wrapper with error handling and rate limiting
async function fetchAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  // Enforce minimum interval between requests to avoid rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  const url = new URL(endpoint, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    // Silently handle rate limiting - don't throw, return empty data
    if (response.status === 429 || error.error?.includes("rate") || error.error?.includes("limit")) {
      console.debug("Rate limited, skipping request");
      throw new Error("RATE_LIMITED");
    }
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// Session APIs
export async function getSessions(year?: number): Promise<{
  current: Session | null;
  recent: Session[];
  year: number;
  timestamp: string;
}> {
  const params: Record<string, string> = {};
  if (year) params.year = year.toString();
  return fetchAPI(`${API_BASE}/sessions`, params);
}

// Driver APIs
export async function getDrivers(sessionKey: number): Promise<{
  drivers: Driver[];
  timestamp: string;
}> {
  return fetchAPI(`${API_BASE}/drivers`, {
    session_key: sessionKey.toString(),
  });
}

// Timing APIs
export async function getTiming(sessionKey: number): Promise<{
  timing: DriverTiming[];
  timestamp: string;
}> {
  return fetchAPI(`${API_BASE}/timing`, {
    session_key: sessionKey.toString(),
  });
}

// Telemetry APIs
export async function getTelemetry(
  sessionKey: number,
  driverNumbers: number[]
): Promise<{
  telemetry: Record<string, DriverTelemetry>;
  timestamp: string;
}> {
  return fetchAPI(`${API_BASE}/telemetry`, {
    session_key: sessionKey.toString(),
    drivers: driverNumbers.join(","),
  });
}

// Position APIs
export async function getPositions(sessionKey: number): Promise<{
  positions: CarPosition[];
  timestamp: string;
}> {
  return fetchAPI(`${API_BASE}/position`, {
    session_key: sessionKey.toString(),
  });
}

// Race Control APIs
export async function getRaceControl(
  sessionKey: number,
  since?: string
): Promise<{
  messages: RaceControlMessage[];
  timestamp: string;
}> {
  const params: Record<string, string> = {
    session_key: sessionKey.toString(),
  };
  if (since) params.since = since;

  return fetchAPI(`${API_BASE}/race-control`, params);
}

// Weather APIs
export async function getWeather(sessionKey: number): Promise<{
  weather: Weather | null;
  timestamp: string;
}> {
  return fetchAPI(`${API_BASE}/weather`, {
    session_key: sessionKey.toString(),
  });
}

// Location APIs (actual track coordinates)
export async function getLocation(sessionKey: number): Promise<{
  locations: CarLocation[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null;
  timestamp: string;
}> {
  return fetchAPI(`${API_BASE}/location`, {
    session_key: sessionKey.toString(),
  });
}

// Combined data fetch for initial load
export async function getAllLiveData(sessionKey: number): Promise<{
  timing: DriverTiming[];
  positions: CarPosition[];
  raceControl: RaceControlMessage[];
  weather: Weather | null;
  timestamp: string;
}> {
  const [timingRes, positionsRes, raceControlRes, weatherRes] = await Promise.all([
    getTiming(sessionKey),
    getPositions(sessionKey),
    getRaceControl(sessionKey),
    getWeather(sessionKey),
  ]);

  return {
    timing: timingRes.timing,
    positions: positionsRes.positions,
    raceControl: raceControlRes.messages,
    weather: weatherRes.weather,
    timestamp: new Date().toISOString(),
  };
}
