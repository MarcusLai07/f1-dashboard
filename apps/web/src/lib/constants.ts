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

// Sector/Timing Colors
export const TIMING_COLORS = {
  PURPLE: "#a855f7", // Session best
  GREEN: "#22c55e", // Personal best
  YELLOW: "#eab308", // Slower than personal best
  WHITE: "#ffffff", // Neutral/no comparison
  RED: "#ef4444", // Significantly slower / error
} as const;

// Mini-Sector Status Colors (OpenF1 values)
export const MINI_SECTOR_COLORS: Record<number, string> = {
  2048: "#eab308", // Yellow - slower than personal best
  2049: "#22c55e", // Green - personal best
  2051: "#a855f7", // Purple - session best
  2064: "#6b7280", // Gray - pitlane
} as const;

// Status Badge Colors
export const STATUS_COLORS = {
  PIT: { bg: "#f59e0b", text: "#000000" }, // Orange/Amber
  OUT: { bg: "#ef4444", text: "#ffffff" }, // Red
  RETIRED: { bg: "#ef4444", text: "#ffffff" }, // Red
  STOPPED: { bg: "#ef4444", text: "#ffffff" }, // Red
  KNOCKED_OUT: { bg: "#6b7280", text: "#ffffff" }, // Gray
  INVESTIGATION: { bg: "#f97316", text: "#000000" }, // Orange (pulsing)
  PENALTY: { bg: "#dc2626", text: "#ffffff" }, // Dark red
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

// Format sector time (no minutes, just seconds)
export function formatSectorTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  return seconds.toFixed(3);
}

// Format position change
export function formatPositionChange(change: number): string {
  if (change === 0) return "";
  return change > 0 ? `+${change}` : `${change}`;
}
