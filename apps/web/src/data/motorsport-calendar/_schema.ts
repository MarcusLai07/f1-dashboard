// Motorsport Calendar TypeScript interfaces
// Unified schema for all motorsport series calendars

export interface SeriesInfo {
  id: string;           // e.g., "f1", "wec", "wrc"
  name: string;         // e.g., "FIA Formula 1 World Championship"
  shortName: string;    // e.g., "F1"
  category: MotorsportCategory;
  color: string;        // Hex color for badges/dots
  website?: string;     // Official website URL
}

export type MotorsportCategory =
  | "formula"
  | "endurance"
  | "rally"
  | "touring"
  | "motorcycle"
  | "stock"
  | "special";

export interface MotorsportEvent {
  id: string;           // e.g., "f1-2026-01"
  seriesId: string;     // e.g., "f1"
  name: string;         // e.g., "Australian Grand Prix"
  officialName?: string; // e.g., "FORMULA 1 QATAR AIRWAYS AUSTRALIAN GRAND PRIX 2026"
  country: string;      // e.g., "Australia"
  circuit: string;      // e.g., "Albert Park Circuit"
  circuitId?: string;   // e.g., "albert-park" (for circuit data lookup)
  location?: string;    // City/region
  round?: number;       // Race round number (F1-specific)
  dates: {
    start: string;      // ISO date: "2026-03-06"
    end: string;        // ISO date: "2026-03-08"
  };
  sessions: MotorsportSession[];
  status?: "confirmed" | "provisional" | "cancelled";
  isFeatured?: boolean; // Major events like 24h Le Mans, Monaco GP
  isSprint?: boolean;   // Sprint weekend (F1-specific)
  eventType?: EventType; // Type of event (race, testing, launch)
  timezone?: string;    // e.g., "Australia/Melbourne"
}

export type EventType = "race" | "testing" | "launch" | "festival";

export interface MotorsportSession {
  name: string;         // e.g., "Race", "Qualifying", "FP1", "Stage 1"
  shortName?: string;   // e.g., "R", "Q", "FP1", "SS1"
  dateTime: string;     // ISO UTC: "2026-03-08T04:00:00Z"
  duration?: string;    // e.g., "2h", "1h30m"
  type?: SessionType;
}

export type SessionType =
  | "practice"
  | "qualifying"
  | "sprint_qualifying"
  | "sprint"
  | "race"
  | "stage"
  | "warmup"
  | "shakedown";

export interface SeriesCalendar {
  seriesId: string;
  year: number;
  events: MotorsportEvent[];
}

export interface SeriesMetadata {
  series: SeriesInfo[];
}

// Aggregated data for display
export interface CalendarDay {
  date: string;         // ISO date
  events: MotorsportEvent[];
}
