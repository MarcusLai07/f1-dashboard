// F1 Team Colors (2026 Season)
export const TEAM_COLORS: Record<string, string> = {
  "Red Bull Racing": "#3671C6",
  Ferrari: "#E8002D",
  Mercedes: "#27F4D2",
  McLaren: "#FF8000",
  "Aston Martin": "#229971",
  Alpine: "#00A1E8",
  Williams: "#1868DB",
  "Racing Bulls": "#6692FF",
  Audi: "#F50537",
  Cadillac: "#1C1C1C",
  "Haas F1 Team": "#B6BABD",
} as const;

// Driver to Team mapping (2026 Season)
export const DRIVER_TEAMS: Record<string, string> = {
  // Red Bull Racing
  VER: "Red Bull Racing",
  HAD: "Red Bull Racing", // Isack Hadjar
  // Ferrari
  LEC: "Ferrari",
  HAM: "Ferrari",
  // McLaren (Norris is 2025 Champion)
  NOR: "McLaren",
  PIA: "McLaren",
  // Mercedes
  RUS: "Mercedes",
  ANT: "Mercedes", // Kimi Antonelli
  // Aston Martin
  ALO: "Aston Martin",
  STR: "Aston Martin",
  // Alpine
  GAS: "Alpine",
  COL: "Alpine", // Franco Colapinto
  // Williams
  ALB: "Williams",
  SAI: "Williams",
  // Racing Bulls (formerly RB/AlphaTauri)
  LAW: "Racing Bulls", // Liam Lawson
  LIN: "Racing Bulls", // Arvid Lindblad (rookie)
  // Audi (formerly Kick Sauber)
  HUL: "Audi",
  BOR: "Audi", // Gabriel Bortoleto
  // Cadillac (new team for 2026)
  PER: "Cadillac",
  BOT: "Cadillac",
  // Haas F1 Team
  OCO: "Haas F1 Team",
  BEA: "Haas F1 Team", // Oliver Bearman
} as const;

// Driver Numbers (2026 Season)
export const DRIVER_NUMBERS: Record<string, number> = {
  // Red Bull Racing
  VER: 3, // Verstappen switched from 33 to 3
  HAD: 6, // Isack Hadjar
  // Ferrari
  LEC: 16,
  HAM: 44,
  // McLaren
  NOR: 1, // 2025 World Champion
  PIA: 81,
  // Mercedes
  RUS: 63,
  ANT: 12, // Kimi Antonelli (tribute to Senna)
  // Aston Martin
  ALO: 14,
  STR: 18,
  // Alpine
  GAS: 10,
  COL: 43, // Franco Colapinto
  // Williams
  ALB: 23,
  SAI: 55,
  // Racing Bulls
  LAW: 30, // Liam Lawson
  LIN: 41, // Arvid Lindblad (rookie, initials AL → 41)
  // Audi
  HUL: 27,
  BOR: 5, // Gabriel Bortoleto
  // Cadillac
  PER: 11,
  BOT: 77,
  // Haas F1 Team
  OCO: 31,
  BEA: 87, // Oliver Bearman
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
