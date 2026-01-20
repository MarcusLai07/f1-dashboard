// Comprehensive F1 Circuit Data Schema
// Designed for future database migration
// Data sourced from FastF1 telemetry and official F1 timing

export interface Turn {
  number: number;
  name?: string;
  type?: "hairpin" | "chicane" | "fast" | "medium" | "slow";
  gear?: number;
  speed?: number; // km/h typical apex speed
  position: number; // Position along track as percentage (0-100)
  labelOffset?: number; // Distance from track in SVG units
  labelAngle?: number; // Override angle in degrees
}

export interface DRSZone {
  detection: number; // Position along track as percentage (0-100)
  activation: number; // Position along track as percentage (0-100)
  length?: number; // meters
}

export interface Sector {
  number: 1 | 2 | 3;
  startPercent: number;
  endPercent: number;
  color: string;
}

export interface LapRecord {
  time: string; // "1:12.909" format
  driver: string;
  year: number;
}

export interface StartFinish {
  x: number;
  y: number;
  angle: number; // degrees
}

export interface CircuitSvg {
  viewBox: string;
  path: string; // Full telemetry-based SVG path
  startFinish?: StartFinish;
}

export interface CircuitData {
  // === Identifiers ===
  id: string; // e.g., "bahrain"
  circuitKey?: string; // OpenF1 circuit key for API matching

  // === Basic Info ===
  name: string; // "Bahrain International Circuit"
  shortName: string; // "Bahrain"
  location: string; // "Sakhir"
  country: string; // "Bahrain"
  timezone?: string; // "Asia/Bahrain"

  // === Track Characteristics ===
  length: number; // km (e.g., 5.412)
  turns: number; // total corner count
  laps: number; // race lap count
  raceDistance?: number; // km (length * laps)
  firstGP?: number; // year

  // === SVG Rendering ===
  svg: CircuitSvg;

  // === Detailed Track Data ===
  corners: Turn[]; // detailed turn data with gear/speed/position
  drsZones: DRSZone[];
  sectors: [Sector, Sector, Sector]; // exactly 3

  // === Pit Lane ===
  pitLaneLength?: number; // meters
  pitLaneTimeLoss?: number; // seconds

  // === Additional Markers ===
  speedTrap?: number; // Position along track as percentage (0-100)
  pathStartOffset?: number; // Where on SVG path the start/finish is (0-100%)

  // === Records ===
  records: {
    lapRecord?: LapRecord;
    fastestPitStop?: {
      time: number; // seconds
      team: string;
      year: number;
    };
  };

  // === Race History ===
  history?: {
    winners: Array<{
      year: number;
      driver: string;
      driverCode: string;
      team: string;
    }>;
    poles: Array<{
      year: number;
      driver: string;
      driverCode: string;
      team: string;
      time?: string;
    }>;
  };

  // === Metadata ===
  lastUpdated?: string; // ISO date
  dataSource?: string; // e.g., "FastF1 2024 Qualifying"
}

// Manifest for listing all available circuits
export interface CircuitManifest {
  version: string;
  lastUpdated: string;
  ids: string[];
}
