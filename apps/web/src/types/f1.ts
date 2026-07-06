// F1 Dashboard TypeScript Types

// =============================================================================
// Session Types
// =============================================================================

export type SessionType = "FP1" | "FP2" | "FP3" | "Q" | "SQ" | "S" | "R";

export type SessionStatus = "upcoming" | "live" | "finished";

export interface Session {
  sessionKey: number;
  sessionName: string;
  sessionType: SessionType;
  meetingKey: number;
  meetingName: string;
  circuitKey: number;
  circuitShortName: string;
  countryName: string;
  startTime: string;
  endTime: string | null;
  status: SessionStatus;
  year: number;
}

// =============================================================================
// Driver & Team Types
// =============================================================================

export interface Driver {
  driverNumber: number;
  driverCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  teamName: string;
  teamColor: string;
  countryCode: string;
  headshotUrl?: string;
}

export type DriverStatus = "RACING" | "PIT" | "OUT" | "FINISHED" | "RETIRED" | "STOPPED" | "KNOCKED_OUT";

// =============================================================================
// Timing Types
// =============================================================================

export interface DriverTiming {
  position: number;
  driverCode: string;
  driverNumber: number;
  teamName: string;
  teamColor: string;
  gap: number | null; // Gap to leader in seconds
  interval: number | null; // Gap to car ahead in seconds
  lastLap: number | null; // Last lap time in seconds
  bestLap: number | null; // Best lap time in seconds
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  sector1Best?: boolean; // Session best for sector 1
  sector2Best?: boolean; // Session best for sector 2
  sector3Best?: boolean; // Session best for sector 3
  sector1PersonalBest?: boolean; // Personal best for sector 1
  sector2PersonalBest?: boolean; // Personal best for sector 2
  sector3PersonalBest?: boolean; // Personal best for sector 3
  tyre: TyreInfo;
  stintHistory?: Stint[]; // All stints for this driver in the session
  pitStops: number;
  status: DriverStatus;
  isPersonalBest: boolean;
  isOverallBest: boolean;
  // Investigation and penalty tracking
  isUnderInvestigation?: boolean;
  hasPenalty?: boolean;
  penaltySeconds?: number; // Time penalty in seconds (5, 10, etc.)
  // Qualifying specific
  q1Time?: number | null;
  q2Time?: number | null;
  q3Time?: number | null;
  isKnockedOut?: boolean; // Eliminated from qualifying
  // Race specific
  positionGained?: number; // +/- positions from grid/previous
  hasFastestLap?: boolean;
  inDrsRange?: boolean; // Within 1 second of car ahead
  // Lap tracking
  currentLap?: number;
  totalLaps?: number;
  // Live car data (from /car_data endpoint)
  speed?: number | null;
  gear?: number | null;
  // Mini-sectors (Practice & Qualifying only)
  miniSectors?: {
    sector1: (number | null)[];
    sector2: (number | null)[];
    sector3: (number | null)[];
  };
}

// =============================================================================
// Mini-Sector Types (Practice & Qualifying Only)
// =============================================================================

/**
 * Mini-sector segment status values from OpenF1
 * These represent the performance in each mini-sector segment
 */
export type MiniSectorStatus = 2048 | 2049 | 2051 | 2064;

export const MINI_SECTOR_VALUES = {
  YELLOW: 2048, // Slower than personal best
  GREEN: 2049, // Personal best
  PURPLE: 2051, // Overall session best
  PITLANE: 2064, // In pitlane
} as const;

/**
 * Mini-sector data for a single lap
 * Note: Mini-sectors are NOT available during Race or Sprint Race sessions
 */
export interface MiniSectorData {
  segmentsSector1: MiniSectorStatus[]; // Mini-sector values for Sector 1
  segmentsSector2: MiniSectorStatus[]; // Mini-sector values for Sector 2
  segmentsSector3: MiniSectorStatus[]; // Mini-sector values for Sector 3
}

/**
 * Extended lap data including mini-sectors (for Practice/Qualifying)
 */
export interface LapDataWithMiniSectors extends LapData {
  miniSectors?: MiniSectorData; // Only present in FP1/FP2/FP3/Q/SQ sessions
}

/**
 * Driver timing with mini-sector progress (for live timing tower)
 */
export interface DriverTimingWithMiniSectors extends DriverTiming {
  currentMiniSectors?: MiniSectorData; // Current lap mini-sector progress
}

export interface TimingData {
  timestamp: string;
  sessionKey: number;
  drivers: DriverTiming[];
}

// =============================================================================
// Tyre Types
// =============================================================================

export type TyreCompound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET";

export interface TyreInfo {
  compound: TyreCompound;
  age: number; // Laps on current tyre
  isNew: boolean;
}

export interface Stint {
  stintNumber: number;
  compound: TyreCompound;
  startLap: number;
  endLap: number | null;
  tyreAge: number;
}

// =============================================================================
// Pit Stop Types
// =============================================================================

export interface PitStop {
  driverNumber: number;
  lapNumber: number;
  pitDuration: number; // Total pit time in seconds
  timestamp: string;
  sessionKey: number;
  meetingKey: number;
}

// =============================================================================
// Telemetry Types
// =============================================================================

export interface DriverTelemetry {
  driverCode: string;
  driverNumber: number;
  teamColor: string;
  speed: number; // km/h
  throttle: number; // 0-100
  brake: number; // 0-100
  gear: number; // 0-8
  rpm: number;
  drs: DRSStatus;
  timestamp: string;
}

export type DRSStatus = 0 | 1 | 8 | 10 | 12 | 14;

export interface TelemetryDataPoint {
  distance: number;
  time: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
  drs: DRSStatus;
}

// =============================================================================
// Position Types (Track Map)
// =============================================================================

export interface CarPosition {
  driverCode: string;
  driverNumber: number;
  teamColor: string;
  x: number;
  y: number;
  z: number;
  timestamp: string;
  // Extended fields for position estimation
  position?: number; // Race position (1-20)
  status?: "RACING" | "PIT" | "OUT" | "STOPPED" | "RUNNING";
  currentLap?: number;
  sector?: 1 | 2 | 3; // Current sector (estimated from timing)
  sectorProgress?: number; // 0-1 progress within sector (estimated)
}

export interface PositionData {
  timestamp: string;
  sessionKey: number;
  positions: CarPosition[];
}

/**
 * Car location from OpenF1 /location endpoint
 * These are actual track coordinates (Cartesian, arbitrary origin)
 * Sample rate: ~3.7Hz
 */
export interface CarLocation {
  driverCode: string;
  driverNumber: number;
  teamColor: string;
  x: number;
  y: number;
  z: number;
  timestamp: string;
}

export interface LocationBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// =============================================================================
// Race Control Types
// =============================================================================

export type RaceControlCategory =
  | "FLAG"
  | "SAFETY_CAR"
  | "VSC"
  | "DRS"
  | "INCIDENT"
  | "PIT"
  | "TIME_PENALTY"
  | "OTHER";

export type FlagType =
  | "GREEN"
  | "YELLOW"
  | "DOUBLE_YELLOW"
  | "RED"
  | "BLUE"
  | "BLACK_WHITE"
  | "BLACK"
  | "CHEQUERED";

export interface RaceControlMessage {
  timestamp: string;
  category: RaceControlCategory;
  flag?: FlagType;
  message: string;
  driverNumber?: number;
  sector?: number;
  scope?: "Track" | "Sector" | "Driver";
}

export interface TrackStatus {
  status: "AllClear" | "Yellow" | "SCDeployed" | "VSCDeployed" | "Red";
  message?: string;
}

// =============================================================================
// Weather Types
// =============================================================================

export interface Weather {
  airTemp: number; // Celsius
  trackTemp: number; // Celsius
  humidity: number; // Percentage
  pressure: number; // mbar
  windSpeed: number; // m/s
  windDirection: number; // Degrees
  rainfall: boolean;
  timestamp: string;
}

// =============================================================================
// Lap Types (for Analysis)
// =============================================================================

export interface LapData {
  lapNumber: number;
  driverCode: string;
  driverNumber: number;
  lapTime: number | null;
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  speedTrap: number | null;
  speedI1: number | null;
  speedI2: number | null;
  speedFL: number | null;
  compound: TyreCompound;
  tyreAge: number;
  isPersonalBest: boolean;
  isOverallBest: boolean;
  isPitInLap: boolean;
  isPitOutLap: boolean;
  isAccurate: boolean;
  timestamp: string;
}

// =============================================================================
// Comparison Types (for Analysis)
// =============================================================================

export interface DriverComparison {
  driver1: {
    code: string;
    teamColor: string;
    lap: LapData;
    telemetry: TelemetryDataPoint[];
  };
  driver2: {
    code: string;
    teamColor: string;
    lap: LapData;
    telemetry: TelemetryDataPoint[];
  };
  delta: TelemetryDelta[];
}

export interface TelemetryDelta {
  distance: number;
  timeDelta: number; // Positive = driver1 faster
  speedDelta: number;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface APIResponse<T> {
  data: T;
  timestamp: string;
  cached: boolean;
}

export interface APIError {
  error: string;
  message: string;
  statusCode: number;
}

// =============================================================================
// Store Types
// =============================================================================

export interface LiveState {
  isConnected: boolean;
  isStreaming: boolean;
  currentSession: Session | null;
  timing: DriverTiming[];
  positions: CarPosition[];
  locations: CarLocation[];
  locationBounds: LocationBounds | null;
  telemetry: Record<string, DriverTelemetry>;
  raceControl: RaceControlMessage[];
  weather: Weather | null;
  trackStatus: TrackStatus;
  selectedDrivers: string[];
  lastUpdate: string | null;
}

export interface AnalysisState {
  selectedYear: number;
  selectedGrandPrix: string | null;
  selectedSession: SessionType | null;
  sessionData: Session | null;
  laps: LapData[];
  comparisonDrivers: [string, string] | null;
  comparisonData: DriverComparison | null;
  replayLap: number;
  isPlaying: boolean;
  playbackSpeed: number;
  isLoading: boolean;
  error: string | null;
}
