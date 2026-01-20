// Calendar TypeScript interfaces
// Moved from lib/calendar2026.ts for unified data access

export interface F1Event {
  round: number;
  name: string;
  officialName: string;
  country: string;
  circuit: string;
  circuitId: string;
  dates: {
    start: string; // ISO date string
    end: string;
  };
  sessions: {
    fp1?: string; // ISO datetime string (UTC)
    fp2?: string;
    fp3?: string;
    sprintQualifying?: string;
    sprint?: string;
    qualifying: string;
    race: string;
  };
  isSprint: boolean;
  timezone: string;
}

export interface PreSeasonEvent {
  name: string;
  location: string;
  circuit?: string;
  dates: {
    start: string;
    end: string;
  };
  sessions?: {
    morning: string; // ISO datetime for morning session start (UTC)
    afternoon: string; // ISO datetime for afternoon session start (UTC)
  };
  type: "testing" | "shakedown" | "launch";
  timezone?: string;
}

export interface CalendarData {
  year: number;
  races: F1Event[];
  preseason: PreSeasonEvent[];
  launches: PreSeasonEvent[];
  sprintRounds: number[];
}
