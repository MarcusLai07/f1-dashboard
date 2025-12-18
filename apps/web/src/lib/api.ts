import type {
  Session,
  DriverTiming,
  CarPosition,
  DriverTelemetry,
  RaceControlMessage,
  Weather,
  Driver,
} from "@/types/f1";

const API_BASE = "/api/live";

// Generic fetch wrapper with error handling
async function fetchAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(endpoint, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// Session APIs
export async function getSessions(): Promise<{
  current: Session | null;
  recent: Session[];
  timestamp: string;
}> {
  return fetchAPI(`${API_BASE}/sessions`);
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
