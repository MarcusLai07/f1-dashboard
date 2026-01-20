// Tyre Compound Colors
export const TYRE_COLORS: Record<string, string> = {
  SOFT: "#ff0000",
  MEDIUM: "#ffd700",
  HARD: "#ffffff",
  INTERMEDIATE: "#43b02a",
  WET: "#0067ad",
} as const;

// Tyre Compound Short Names
export const TYRE_SHORT: Record<string, string> = {
  SOFT: "S",
  MEDIUM: "M",
  HARD: "H",
  INTERMEDIATE: "I",
  WET: "W",
} as const;

// Flag Colors
export const FLAG_COLORS: Record<string, string> = {
  GREEN: "#00ff00",
  YELLOW: "#ffff00",
  RED: "#ff0000",
  BLUE: "#0000ff",
  CHEQUERED: "#ffffff",
} as const;

// Session Types
export const SESSION_TYPES = {
  FP1: "Free Practice 1",
  FP2: "Free Practice 2",
  FP3: "Free Practice 3",
  Q: "Qualifying",
  SQ: "Sprint Qualifying",
  S: "Sprint",
  R: "Race",
} as const;

// DRS Status
export const DRS_STATUS = {
  0: "Disabled",
  1: "Available",
  8: "Active",
} as const;

// Polling intervals in milliseconds
export const POLLING_INTERVALS = {
  timing: 3000, // 3 seconds (OpenF1 rate limit: 3 req/sec)
  telemetry: 2000, // 2 seconds
  position: 4000, // 4 seconds
  raceControl: 5000, // 5 seconds
  weather: 60000, // 60 seconds
} as const;

// API Base URLs
export const API_URLS = {
  openF1: "https://api.openf1.org/v1",
  local: "/api",
} as const;

// Helper function to get tyre color
export function getTyreColor(compound: string): string {
  return TYRE_COLORS[compound.toUpperCase()] || "#808080";
}

// Format lap time from seconds to MM:SS.mmm
export function formatLapTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "--:--.---";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, "0");
  return `${mins}:${secs}`;
}

// Format gap time
export function formatGap(gap: number | null): string {
  if (gap === null || gap === undefined) return "";
  if (gap === 0) return "LEADER";
  return gap > 0 ? `+${gap.toFixed(3)}` : gap.toFixed(3);
}

// Format interval to car ahead
export function formatInterval(interval: number | null): string {
  if (interval === null || interval === undefined) return "";
  return `+${interval.toFixed(3)}`;
}
