// Circuit Data Schema
// TypeScript types for circuit JSON files

export interface Position {
  x: number;
  y: number;
}

export interface StartFinishPosition extends Position {
  angle: number;
}

export interface Sector {
  id: 1 | 2 | 3;
  start: number;  // 0-1 position along track
  end: number;    // 0-1 position along track
  color: string;  // hex color
}

export interface Corner {
  number: number;
  name: string;
  position: number;  // 0-1 position along track
  type?: "hairpin" | "chicane" | "fast" | "medium" | "slow";
}

export interface DRSZone {
  detection: number;  // 0-1 position for detection point
  start: number;      // 0-1 position for activation
  end: number;        // 0-1 position for deactivation
}

export interface MarshallingSector {
  id: number;
  start: number;
  end: number;
}

export interface LapRecord {
  time: string;       // "1:12.909" format
  driver: string;
  year: number;
}

export interface CircuitSvg {
  viewBox: string;
  path: string;
  startFinish: StartFinishPosition;
}

export interface CircuitData {
  id: string;
  name: string;
  shortName: string;
  location: string;
  country: string;
  length: number;       // km
  turns: number;
  firstGP?: number;

  svg: CircuitSvg;

  sectors: [Sector, Sector, Sector];  // Always exactly 3
  corners?: Corner[];
  drsZones?: DRSZone[];
  marshallingSectors?: MarshallingSector[];

  records?: {
    lapRecord?: LapRecord;
  };
}

// Manifest for listing all available circuits
export interface CircuitManifest {
  ids: string[];
  lastUpdated: string;
}
