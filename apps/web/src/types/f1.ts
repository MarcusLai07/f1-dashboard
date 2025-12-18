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

export type DriverStatus = "RACING" | "PIT" | "OUT" | "FINISHED";

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
  tyre: TyreInfo;
  pitStops: number;
  status: DriverStatus;
  isPersonalBest: boolean;
  isOverallBest: boolean;
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
}

export interface PositionData {
  timestamp: string;
  sessionKey: number;
  positions: CarPosition[];
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
  currentSession: Session | null;
  timing: DriverTiming[];
  positions: CarPosition[];
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
