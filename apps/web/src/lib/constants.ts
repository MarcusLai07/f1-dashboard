// F1 Team Colors (2024-2025 Season)
export const TEAM_COLORS: Record<string, string> = {
  "Red Bull Racing": "#3671C6",
  Ferrari: "#E8002D",
  Mercedes: "#27F4D2",
  McLaren: "#FF8000",
  "Aston Martin": "#229971",
  Alpine: "#FF87BC",
  Williams: "#64C4FF",
  RB: "#6692FF",
  "Kick Sauber": "#52E252",
  "Haas F1 Team": "#B6BABD",
} as const;

// Driver to Team mapping (2025)
export const DRIVER_TEAMS: Record<string, string> = {
  VER: "Red Bull Racing",
  PER: "Red Bull Racing",
  HAM: "Ferrari",
  LEC: "Ferrari",
  RUS: "Mercedes",
  ANT: "Mercedes", // Antonelli
  NOR: "McLaren",
  PIA: "McLaren",
  ALO: "Aston Martin",
  STR: "Aston Martin",
  GAS: "Alpine",
  DOO: "Alpine", // Doohan
  ALB: "Williams",
  SAI: "Williams",
  TSU: "RB",
  HAD: "RB", // Hadjar
  BOT: "Kick Sauber",
  BOR: "Kick Sauber", // Bortoleto
  OCO: "Haas F1 Team",
  BEA: "Haas F1 Team", // Bearman
} as const;

// Driver Numbers
export const DRIVER_NUMBERS: Record<string, number> = {
  VER: 1,
  PER: 11,
  HAM: 44,
  LEC: 16,
  RUS: 63,
  ANT: 12,
  NOR: 4,
  PIA: 81,
  ALO: 14,
  STR: 18,
  GAS: 10,
  DOO: 7,
  ALB: 23,
  SAI: 55,
  TSU: 22,
  HAD: 20,
  BOT: 77,
  BOR: 5,
  OCO: 31,
  BEA: 87,
} as const;

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
  timing: 1000, // 1 second
  telemetry: 500, // 0.5 seconds
  position: 1000, // 1 second
  raceControl: 2000, // 2 seconds
  weather: 30000, // 30 seconds
} as const;

// API Base URLs
export const API_URLS = {
  openF1: "https://api.openf1.org/v1",
  local: "/api",
} as const;

// Helper function to get team color by driver code
export function getTeamColor(driverCode: string): string {
  const team = DRIVER_TEAMS[driverCode];
  return team ? TEAM_COLORS[team] : "#808080";
}

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
