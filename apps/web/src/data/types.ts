// Shared Data Types
// Types for reference data, calendar, and API responses

// ============ TEAMS ============
export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  country: string;
  principal?: string;
  engine?: string;
}

// ============ DRIVERS ============
export interface DriverReference {
  code: string;           // "VER", "HAM", etc.
  number: number;
  firstName: string;
  lastName: string;
  teamId: string;
  country: string;
  dateOfBirth?: string;
}

// ============ CALENDAR ============
export interface SessionSchedule {
  fp1?: string;
  fp2?: string;
  fp3?: string;
  sprintQualifying?: string;
  sprint?: string;
  qualifying: string;
  race: string;
}

export interface CalendarEvent {
  round: number;
  name: string;
  officialName: string;
  country: string;
  circuit: string;
  circuitId: string;
  dates: {
    start: string;
    end: string;
  };
  sessions: SessionSchedule;
  isSprint: boolean;
  timezone: string;
}

// ============ OVERRIDES ============
export interface CalendarOverride {
  round?: number;
  sessions?: Partial<SessionSchedule>;
  cancelled?: boolean;
  note?: string;
}

export interface CalendarOverrides {
  [year: string]: {
    [dateKey: string]: CalendarOverride;
  };
}

// ============ API RESPONSES ============
export interface DataSourceInfo {
  source: "api" | "fallback" | "cache";
  timestamp: string;
  hasOverrides: boolean;
}
