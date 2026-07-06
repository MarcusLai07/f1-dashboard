// Teams TypeScript interfaces
// Unified team data schema for F1 Dashboard

export interface TeamFull {
  id: string;
  name: string;
  shortName: string;
  fullName: string;
  color: string;
  country: string;
  base: string;
  principal: string;
  engine: string;
  drivers: string[]; // Driver codes
  isNew: boolean;
}

export interface TeamsData {
  year: number;
  teams: TeamFull[];
}
