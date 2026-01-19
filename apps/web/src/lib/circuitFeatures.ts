// Comprehensive F1 Circuit Features Data
// Includes turns, DRS zones, sectors, and key statistics

export interface Turn {
  number: number;
  name?: string;
  type?: "hairpin" | "chicane" | "fast" | "medium" | "slow";
  gear?: number;
  speed?: number; // km/h
  position?: number; // Position along track as percentage (0-100) for rendering
  // Label positioning overrides (optional - for when auto-placement is wrong)
  labelOffset?: number; // Distance from track in SVG units (default: 18). Negative = flip to opposite side
  labelAngle?: number; // Override angle in degrees (0 = right, 90 = down, 180 = left, 270 = up)
}

export interface DRSZone {
  detection: number; // Position along track as percentage (0-100)
  activation: number; // Position along track as percentage (0-100)
  length?: number; // meters
}

export interface Sector {
  number: 1 | 2 | 3;
  startPercent: number; // Position along track as percentage (0-100)
  endPercent: number;
  color: string;
}

export interface CircuitFeatures {
  circuitId: string;
  name: string;
  location: string;
  country: string;
  length: number; // km
  turns: Turn[];
  laps: number;
  raceDistance: number; // km
  firstGP: number;
  lapRecord?: {
    time: string;
    driver: string;
    year: number;
  };
  drsZones: DRSZone[];
  sectors: Sector[];
  speedTrap?: number; // Position along track as percentage
  pitLaneLength?: number; // meters
  pitLaneTimeLoss?: number; // seconds
  pathStartOffset?: number; // Where on the SVG path (0-100%) the start/finish line is located
}

// Circuit features data for 2026 calendar circuits
export const circuitFeatures: Record<string, CircuitFeatures> = {
  // Australian Grand Prix - Albert Park
  "albert park": {
    circuitId: "albert_park",
    name: "Albert Park Grand Prix Circuit",
    location: "Melbourne",
    country: "Australia",
    length: 5.278,
    laps: 58,
    raceDistance: 306.124,
    firstGP: 1996,
    lapRecord: {
      time: "1:19.813",
      driver: "Charles Leclerc",
      year: 2024,
    },
    turns: [
      { number: 1, type: "medium", gear: 3, speed: 115, position: 7.1 },
      { number: 2, type: "fast", gear: 5, speed: 175, position: 8.8 },
      { number: 3, type: "medium", gear: 4, speed: 145, position: 21.0 },
      { number: 4, type: "slow", gear: 2, speed: 85, position: 23.9 },
      { number: 5, type: "medium", gear: 3, speed: 120, position: 27.8 },
      { number: 6, type: "fast", gear: 6, speed: 210, position: 35.9 },
      { number: 7, type: "fast", gear: 5, speed: 185, position: 38.1 },
      { number: 8, type: "medium", gear: 4, speed: 155, position: 42.1 },
      { number: 9, type: "chicane", gear: 3, speed: 110, position: 63.0 },
      { number: 10, type: "chicane", gear: 3, speed: 105, position: 65.3 },
      { number: 11, type: "hairpin", gear: 2, speed: 75, position: 78.4 },
      { number: 12, type: "fast", gear: 5, speed: 170, position: 83.7 },
      { number: 13, type: "slow", gear: 2, speed: 80, position: 88.3 },
      { number: 14, type: "medium", gear: 4, speed: 140, position: 91.2 },
    ],
    drsZones: [
      { detection: 88, activation: 92, length: 340 },
      { detection: 55, activation: 60, length: 280 },
    ],
    sectors: [
      { number: 1, startPercent: 0, endPercent: 33, color: "#ef4444" },
      { number: 2, startPercent: 33, endPercent: 60, color: "#3b82f6" },
      { number: 3, startPercent: 60, endPercent: 100, color: "#eab308" },
    ],
    speedTrap: 45,
    pitLaneLength: 280,
    pitLaneTimeLoss: 18.5,
    // SVG path has been rotated to start at start/finish line - no offset needed
  },

  // Bahrain Grand Prix - Sakhir
  // Turn positions from FastF1 telemetry data
  "bahrain": {
    circuitId: "bahrain",
    name: "Bahrain International Circuit",
    location: "Sakhir",
    country: "Bahrain",
    length: 5.412,
    laps: 57,
    raceDistance: 308.238,
    firstGP: 2004,
    lapRecord: {
      time: "1:31.447",
      driver: "Pedro de la Rosa",
      year: 2005,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "hairpin", gear: 2, speed: 65, position: 13.2 },
      { number: 2, type: "hairpin", gear: 2, speed: 65, position: 15.0 },
      { number: 3, type: "fast", gear: 5, speed: 174, position: 17.1 },
      { number: 4, type: "medium", gear: 3, speed: 127, position: 27.9 },
      { number: 5, type: "fast", gear: 6, speed: 220, position: 32.9 },
      { number: 6, type: "fast", gear: 6, speed: 219, position: 34.7 },
      { number: 7, type: "fast", gear: 6, speed: 219, position: 36.5 },
      { number: 8, type: "slow", gear: 2, speed: 79, position: 41.3 },
      { number: 9, type: "slow", gear: 2, speed: 77, position: 48.2 },
      { number: 10, type: "slow", gear: 2, speed: 77, position: 49.9 },
      { number: 11, type: "fast", gear: 5, speed: 170, position: 64.3 },
      { number: 12, type: "fast", gear: 7, speed: 260, position: 70.8 },
      { number: 13, type: "medium", gear: 4, speed: 146, position: 75.6 },
      { number: 14, type: "medium", gear: 4, speed: 134, position: 90.6 },
      { number: 15, type: "medium", gear: 4, speed: 134, position: 92.3 },
    ],
    drsZones: [
      { detection: 85, activation: 90, length: 650 },
      { detection: 24, activation: 30, length: 450 },
      { detection: 55, activation: 60, length: 380 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 33.0, color: "#ef4444" },
      { number: 2, startPercent: 33.0, endPercent: 72.9, color: "#3b82f6" },
      { number: 3, startPercent: 72.9, endPercent: 100, color: "#eab308" },
    ],
    speedTrap: 48,
    pitLaneLength: 390,
    pitLaneTimeLoss: 21.5,
  },

  // Monaco Grand Prix
  // Turn positions from FastF1 telemetry data
  "monaco": {
    circuitId: "monaco",
    name: "Circuit de Monaco",
    location: "Monte Carlo",
    country: "Monaco",
    length: 3.337,
    laps: 78,
    raceDistance: 260.286,
    firstGP: 1950,
    lapRecord: {
      time: "1:12.909",
      driver: "Lewis Hamilton",
      year: 2021,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, name: "Sainte Devote", type: "medium", gear: 3, speed: 117, position: 5.6 },
      { number: 2, name: "Beau Rivage", type: "fast", gear: 6, speed: 245, position: 17.6 },
      { number: 3, name: "Massenet", type: "fast", gear: 5, speed: 171, position: 22.6 },
      { number: 4, name: "Casino Square", type: "medium", gear: 4, speed: 148, position: 26.5 },
      { number: 5, name: "Mirabeau Haute", type: "slow", gear: 2, speed: 76, position: 33.4 },
      { number: 6, name: "Grand Hotel Hairpin", type: "hairpin", gear: 1, speed: 46, position: 37.4 },
      { number: 7, name: "Mirabeau Bas", type: "hairpin", gear: 1, speed: 46, position: 39.8 },
      { number: 8, name: "Portier", type: "slow", gear: 2, speed: 83, position: 42.5 },
      { number: 9, name: "Tunnel", type: "fast", gear: 6, speed: 252, position: 52.9 },
      { number: 10, name: "Nouvelle Chicane", type: "slow", gear: 2, speed: 70, position: 62.4 },
      { number: 11, name: "Nouvelle Chicane", type: "slow", gear: 2, speed: 70, position: 64.2 },
      { number: 12, name: "Tabac", type: "fast", gear: 5, speed: 179, position: 70.9 },
      { number: 13, name: "Louis Chiron", type: "fast", gear: 5, speed: 197, position: 75.8 },
      { number: 14, name: "Swimming Pool 1", type: "fast", gear: 6, speed: 211, position: 76.4 },
      { number: 15, name: "Swimming Pool 2", type: "medium", gear: 4, speed: 131, position: 80.3 },
      { number: 16, name: "La Rascasse", type: "medium", gear: 4, speed: 131, position: 81.2 },
      { number: 17, name: "Noghes", type: "medium", gear: 3, speed: 111, position: 83.4 },
      { number: 18, name: "Portier", type: "hairpin", gear: 2, speed: 61, position: 87.1 },
      { number: 19, name: "Anthony Noghes", type: "hairpin", gear: 2, speed: 61, position: 89.9 },
    ],
    drsZones: [
      { detection: 88, activation: 94, length: 260 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 31.9, color: "#ef4444" },
      { number: 2, startPercent: 31.9, endPercent: 74.3, color: "#3b82f6" },
      { number: 3, startPercent: 74.3, endPercent: 100, color: "#eab308" },
    ],
    speedTrap: 35,
    pitLaneLength: 350,
    pitLaneTimeLoss: 23.5,
  },

  // British Grand Prix - Silverstone
  // Turn positions from FastF1 telemetry data
  "silverstone": {
    circuitId: "silverstone",
    name: "Silverstone Circuit",
    location: "Silverstone",
    country: "UK",
    length: 5.891,
    laps: 52,
    raceDistance: 306.198,
    firstGP: 1950,
    lapRecord: {
      time: "1:27.097",
      driver: "Max Verstappen",
      year: 2020,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, name: "Abbey", type: "fast", gear: 7, speed: 297, position: 7.4 },
      { number: 2, name: "Village", type: "fast", gear: 7, speed: 297, position: 10.4 },
      { number: 3, name: "The Loop", type: "medium", gear: 3, speed: 115, position: 14.8 },
      { number: 4, name: "Aintree", type: "slow", gear: 2, speed: 90, position: 17.7 },
      { number: 5, name: "Wellington Straight", type: "fast", gear: 5, speed: 177, position: 21.0 },
      { number: 6, name: "Brooklands", type: "fast", gear: 5, speed: 172, position: 33.7 },
      { number: 7, name: "Luffield", type: "medium", gear: 3, speed: 116, position: 37.4 },
      { number: 8, name: "Woodcote", type: "fast", gear: 6, speed: 257, position: 43.2 },
      { number: 9, name: "Copse", type: "fast", gear: 7, speed: 294, position: 52.3 },
      { number: 10, name: "Maggotts", type: "fast", gear: 7, speed: 299, position: 61.8 },
      { number: 11, name: "Becketts", type: "fast", gear: 7, speed: 291, position: 63.1 },
      { number: 12, name: "Chapel", type: "fast", gear: 6, speed: 252, position: 65.6 },
      { number: 13, name: "Hangar Straight", type: "fast", gear: 6, speed: 223, position: 68.2 },
      { number: 14, name: "Stowe", type: "fast", gear: 6, speed: 228, position: 70.7 },
      { number: 15, name: "Vale", type: "fast", gear: 6, speed: 240, position: 85.5 },
      { number: 16, name: "Club", type: "medium", gear: 3, speed: 107, position: 93.1 },
      { number: 17, name: "Farm Curve", type: "medium", gear: 3, speed: 107, position: 94.7 },
      { number: 18, name: "Abbey Approach", type: "fast", gear: 4, speed: 159, position: 97.3 },
    ],
    drsZones: [
      { detection: 88, activation: 94, length: 580 },
      { detection: 42, activation: 48, length: 450 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 31.2, color: "#ef4444" },
      { number: 2, startPercent: 31.2, endPercent: 72.7, color: "#3b82f6" },
      { number: 3, startPercent: 72.7, endPercent: 100, color: "#eab308" },
    ],
    speedTrap: 60,
    pitLaneLength: 380,
    pitLaneTimeLoss: 19.8,
  },

  // Belgian Grand Prix - Spa
  // Turn positions from FastF1 telemetry data
  "spa": {
    circuitId: "spa",
    name: "Circuit de Spa-Francorchamps",
    location: "Stavelot",
    country: "Belgium",
    length: 7.004,
    laps: 44,
    raceDistance: 308.052,
    firstGP: 1950,
    lapRecord: {
      time: "1:46.286",
      driver: "Valtteri Bottas",
      year: 2018,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, name: "La Source", type: "hairpin", gear: 2, speed: 69, position: 5.2 },
      { number: 2, name: "Eau Rouge Entry", type: "fast", gear: 8, speed: 304, position: 14.9 },
      { number: 3, name: "Eau Rouge", type: "fast", gear: 8, speed: 300, position: 16.6 },
      { number: 4, name: "Raidillon", type: "fast", gear: 8, speed: 300, position: 18.1 },
      { number: 5, name: "Les Combes", type: "medium", gear: 4, speed: 134, position: 34.2 },
      { number: 6, name: "Les Combes", type: "medium", gear: 4, speed: 132, position: 35.4 },
      { number: 7, name: "Les Combes", type: "fast", gear: 4, speed: 154, position: 37.9 },
      { number: 8, name: "Malmedy", type: "slow", gear: 2, speed: 94, position: 43.4 },
      { number: 9, name: "Rivage", type: "fast", gear: 4, speed: 152, position: 46.9 },
      { number: 10, name: "Pouhon", type: "fast", gear: 7, speed: 261, position: 54.6 },
      { number: 11, name: "Fagnes", type: "fast", gear: 7, speed: 274, position: 58.1 },
      { number: 12, name: "Campus", type: "medium", gear: 4, speed: 142, position: 64.0 },
      { number: 13, name: "Stavelot", type: "medium", gear: 4, speed: 142, position: 66.3 },
      { number: 14, name: "Paul Frere Curve", type: "medium", gear: 4, speed: 131, position: 70.5 },
      { number: 15, name: "Blanchimont", type: "fast", gear: 6, speed: 218, position: 74.2 },
      { number: 16, name: "Bus Stop Chicane", type: "fast", gear: 8, speed: 308, position: 84.4 },
      { number: 17, name: "Bus Stop Exit", type: "fast", gear: 8, speed: 307, position: 88.5 },
      { number: 18, name: "La Source Approach", type: "hairpin", gear: 2, speed: 63, position: 96.1 },
      { number: 19, name: "La Source Entry", type: "hairpin", gear: 2, speed: 63, position: 97.1 },
    ],
    drsZones: [
      { detection: 90, activation: 96, length: 455 },
      { detection: 10, activation: 15, length: 750 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 32.2, color: "#ef4444" },
      { number: 2, startPercent: 32.2, endPercent: 72.4, color: "#3b82f6" },
      { number: 3, startPercent: 72.4, endPercent: 100, color: "#eab308" },
    ],
    speedTrap: 20,
    pitLaneLength: 450,
    pitLaneTimeLoss: 22.5,
  },

  // Japanese Grand Prix - Suzuka
  "suzuka": {
    circuitId: "suzuka",
    name: "Suzuka International Racing Course",
    location: "Suzuka",
    country: "Japan",
    length: 5.807,
    laps: 53,
    raceDistance: 307.471,
    firstGP: 1987,
    lapRecord: {
      time: "1:30.983",
      driver: "Lewis Hamilton",
      year: 2019,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "fast", gear: 6, speed: 210, position: 11.0 },
      { number: 2, type: "fast", gear: 5, speed: 172, position: 14.0 },
      { number: 3, name: "S Curves", type: "fast", gear: 6, speed: 232, position: 18.0 },
      { number: 4, name: "S Curves", type: "fast", gear: 6, speed: 229, position: 20.5 },
      { number: 5, name: "S Curves", type: "fast", gear: 6, speed: 223, position: 23.0 },
      { number: 6, name: "S Curves", type: "fast", gear: 5, speed: 189, position: 26.5 },
      { number: 7, name: "Dunlop Curve", type: "fast", gear: 6, speed: 241, position: 29.3 },
      { number: 8, name: "Degner 1", type: "fast", gear: 7, speed: 264, position: 38.8 },
      { number: 9, name: "Degner 2", type: "medium", gear: 4, speed: 139, position: 41.5 },
      { number: 10, name: "Hairpin", type: "medium", gear: 3, speed: 104, position: 47.0, labelOffset: -22 },
      { number: 11, name: "Spoon Curve Entry", type: "slow", gear: 2, speed: 74, position: 49.5 },
      { number: 12, name: "Spoon Curve", type: "fast", gear: 5, speed: 198, position: 57.0 },
      { number: 13, name: "Back Straight", type: "fast", gear: 5, speed: 202, position: 64.5 },
      { number: 14, name: "130R", type: "fast", gear: 4, speed: 168, position: 68.0 },
      { number: 15, name: "Casio Triangle 1", type: "fast", gear: 7, speed: 297, position: 85.0 },
      { number: 16, name: "Casio Triangle 2", type: "slow", gear: 2, speed: 89, position: 92.0 },
      { number: 17, name: "Casio Triangle Exit", type: "slow", gear: 2, speed: 89, position: 93.0 },
      { number: 18, name: "Final Curve", type: "fast", gear: 4, speed: 156, position: 95.5 },
    ],
    drsZones: [
      { detection: 85, activation: 90, length: 620 },
      { detection: 56, activation: 62, length: 380 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 37.6, color: "#ef4444" },
      { number: 2, startPercent: 37.6, endPercent: 81.2, color: "#3b82f6" },
      { number: 3, startPercent: 81.2, endPercent: 100, color: "#eab308" },
    ],
    speedTrap: 65,
    pitLaneLength: 400,
    pitLaneTimeLoss: 20.0,
  },

  // Abu Dhabi Grand Prix - Yas Marina
  "yas marina": {
    circuitId: "yas_marina",
    name: "Yas Marina Circuit",
    location: "Abu Dhabi",
    country: "UAE",
    length: 5.281,
    laps: 58,
    raceDistance: 306.183,
    firstGP: 2009,
    lapRecord: {
      time: "1:26.103",
      driver: "Max Verstappen",
      year: 2021,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "fast", gear: 5, speed: 172, position: 7.2 },
      { number: 2, type: "fast", gear: 6, speed: 232, position: 12.0 },
      { number: 3, type: "fast", gear: 7, speed: 267, position: 16.0 },
      { number: 4, type: "fast", gear: 7, speed: 275, position: 19.3 },
      { number: 5, type: "medium", gear: 3, speed: 108, position: 27.1 },
      { number: 6, type: "hairpin", gear: 2, speed: 68, position: 50.1 },
      { number: 7, type: "hairpin", gear: 2, speed: 68, position: 51.3 },
      { number: 8, type: "fast", gear: 5, speed: 197, position: 55.1 },
      { number: 9, type: "fast", gear: 5, speed: 181, position: 70.5 },
      { number: 10, type: "fast", gear: 6, speed: 255, position: 77.1 },
      { number: 11, type: "medium", gear: 4, speed: 135, position: 80.2 },
      { number: 12, type: "medium", gear: 3, speed: 106, position: 82.5 },
      { number: 13, type: "medium", gear: 3, speed: 106, position: 84.5 },
      { number: 14, type: "medium", gear: 4, speed: 147, position: 86.9 },
      { number: 15, type: "fast", gear: 6, speed: 246, position: 92.0 },
      { number: 16, type: "medium", gear: 4, speed: 138, position: 96.6 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 620 },
      { detection: 40, activation: 46, length: 550 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 23.0, color: "#ef4444" },
      { number: 2, startPercent: 23.0, endPercent: 67.7, color: "#3b82f6" },
      { number: 3, startPercent: 67.7, endPercent: 100, color: "#eab308" },
    ],
    speedTrap: 52,
    pitLaneLength: 350,
    pitLaneTimeLoss: 19.5,
  },

  // Dutch Grand Prix - Zandvoort
  "zandvoort": {
    circuitId: "zandvoort",
    name: "Circuit Zandvoort",
    location: "Zandvoort",
    country: "Netherlands",
    length: 4.259,
    laps: 72,
    raceDistance: 306.587,
    firstGP: 1952,
    lapRecord: {
      time: "1:11.097",
      driver: "Lewis Hamilton",
      year: 2021,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, name: "Tarzan", type: "medium", gear: 3, speed: 120, position: 8.0 },
      { number: 2, name: "Gerlachbocht", type: "fast", gear: 5, speed: 198, position: 15.4 },
      { number: 3, name: "Hugenholtz", type: "medium", gear: 4, speed: 138, position: 19.4 },
      { number: 4, type: "fast", gear: 5, speed: 205, position: 24.5 },
      { number: 5, type: "fast", gear: 7, speed: 272, position: 29.3 },
      { number: 6, type: "fast", gear: 7, speed: 284, position: 32.8 },
      { number: 7, name: "Scheivlak", type: "fast", gear: 7, speed: 261, position: 40.1 },
      { number: 8, name: "Master", type: "fast", gear: 6, speed: 237, position: 47.5 },
      { number: 9, type: "medium", gear: 3, speed: 114, position: 52.6 },
      { number: 10, name: "Hans Ernst", type: "medium", gear: 3, speed: 118, position: 58.8 },
      { number: 11, type: "slow", gear: 2, speed: 91, position: 72.3 },
      { number: 12, type: "slow", gear: 2, speed: 91, position: 74.4 },
      { number: 13, name: "Arie Luyendyk", type: "fast", gear: 5, speed: 201, position: 81.8 },
      { number: 14, name: "Kumho", type: "fast", gear: 6, speed: 255, position: 88.4 },
    ],
    drsZones: [
      { detection: 90, activation: 95, length: 470 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 35.1, color: "#ef4444" },
      { number: 2, startPercent: 35.1, endPercent: 69.0, color: "#3b82f6" },
      { number: 3, startPercent: 69.0, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 18.5,
  },

  // Miami Grand Prix
  "miami": {
    circuitId: "miami",
    name: "Miami International Autodrome",
    location: "Miami",
    country: "USA",
    length: 5.412,
    laps: 57,
    raceDistance: 308.326,
    firstGP: 2022,
    lapRecord: {
      time: "1:29.708",
      driver: "Max Verstappen",
      year: 2023,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "slow", gear: 2, speed: 94, position: 6.8 },
      { number: 2, type: "slow", gear: 2, speed: 94, position: 8.6 },
      { number: 3, type: "fast", gear: 4, speed: 160, position: 10.2 },
      { number: 4, type: "fast", gear: 7, speed: 263, position: 20.9 },
      { number: 5, type: "fast", gear: 6, speed: 229, position: 23.4 },
      { number: 6, type: "fast", gear: 6, speed: 231, position: 25.9 },
      { number: 7, type: "medium", gear: 4, speed: 131, position: 28.8 },
      { number: 8, type: "medium", gear: 4, speed: 131, position: 30.4 },
      { number: 9, type: "fast", gear: 7, speed: 290, position: 40.6 },
      { number: 10, type: "fast", gear: 8, speed: 307, position: 45.7 },
      { number: 11, type: "slow", gear: 2, speed: 90, position: 57.4 },
      { number: 12, type: "slow", gear: 2, speed: 90, position: 59.5 },
      { number: 13, type: "slow", gear: 2, speed: 90, position: 62.2 },
      { number: 14, type: "slow", gear: 2, speed: 90, position: 63.5 },
      { number: 15, type: "slow", gear: 2, speed: 74, position: 63.9 },
      { number: 16, type: "slow", gear: 2, speed: 74, position: 65.6 },
      { number: 17, type: "hairpin", gear: 2, speed: 68, position: 90.3 },
      { number: 18, type: "slow", gear: 2, speed: 96, position: 92.9 },
      { number: 19, type: "fast", gear: 6, speed: 244, position: 96.8 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 670 },
      { detection: 53, activation: 58, length: 440 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 33.6, color: "#ef4444" },
      { number: 2, startPercent: 33.6, endPercent: 68.3, color: "#3b82f6" },
      { number: 3, startPercent: 68.3, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 19.5,
  },

  // Emilia Romagna Grand Prix - Imola
  // Turn positions from FastF1 telemetry data
  "imola": {
    circuitId: "imola",
    name: "Autodromo Enzo e Dino Ferrari",
    location: "Imola",
    country: "Italy",
    length: 4.909,
    laps: 63,
    raceDistance: 309.049,
    firstGP: 1980,
    lapRecord: {
      time: "1:15.484",
      driver: "Lewis Hamilton",
      year: 2020,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, name: "Tamburello", type: "fast", gear: 6, speed: 252, position: 7.9 },
      { number: 2, name: "Tamburello 2", type: "fast", gear: 6, speed: 236, position: 11.9 },
      { number: 3, name: "Villeneuve", type: "fast", gear: 6, speed: 242, position: 15.3 },
      { number: 4, name: "Tosa", type: "slow", gear: 2, speed: 98, position: 25.0 },
      { number: 5, name: "Piratella", type: "slow", gear: 2, speed: 98, position: 27.9 },
      { number: 6, name: "Acque Minerali", type: "fast", gear: 5, speed: 186, position: 40.7 },
      { number: 7, type: "medium", gear: 4, speed: 138, position: 43.1 },
      { number: 8, name: "Variante Alta", type: "slow", gear: 2, speed: 82, position: 55.5 },
      { number: 9, type: "slow", gear: 2, speed: 82, position: 57.7 },
      { number: 10, name: "Rivazza 1", type: "fast", gear: 5, speed: 196, position: 79.9 },
      { number: 11, name: "Rivazza 2", type: "medium", gear: 3, speed: 119, position: 83.6 },
      { number: 12, type: "medium", gear: 3, speed: 123, position: 87.2 },
      { number: 13, type: "fast", gear: 6, speed: 237, position: 92.8 },
      { number: 14, type: "fast", gear: 6, speed: 237, position: 95.6 },
      { number: 15, type: "fast", gear: 5, speed: 194, position: 97.7 },
    ],
    drsZones: [
      { detection: 90, activation: 95, length: 620 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 31.4, color: "#ef4444" },
      { number: 2, startPercent: 31.4, endPercent: 73.9, color: "#3b82f6" },
      { number: 3, startPercent: 73.9, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 22.0,
  },

  // Azerbaijan Grand Prix - Baku
  // Turn positions from FastF1 telemetry data
  "baku": {
    circuitId: "baku",
    name: "Baku City Circuit",
    location: "Baku",
    country: "Azerbaijan",
    length: 6.003,
    laps: 51,
    raceDistance: 306.049,
    firstGP: 2016,
    lapRecord: {
      time: "1:43.009",
      driver: "Charles Leclerc",
      year: 2019,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "slow", gear: 2, speed: 77, position: 5.2 },
      { number: 2, type: "slow", gear: 2, speed: 93, position: 7.3 },
      { number: 3, type: "medium", gear: 4, speed: 147, position: 10.9 },
      { number: 4, type: "medium", gear: 4, speed: 145, position: 12.6 },
      { number: 5, type: "fast", gear: 6, speed: 233, position: 17.2 },
      { number: 6, type: "fast", gear: 6, speed: 227, position: 18.8 },
      { number: 7, type: "fast", gear: 6, speed: 227, position: 20.1 },
      { number: 8, name: "Castle Section", type: "hairpin", gear: 1, speed: 58, position: 26.1 },
      { number: 9, type: "slow", gear: 2, speed: 79, position: 28.9 },
      { number: 10, type: "slow", gear: 2, speed: 79, position: 30.3 },
      { number: 11, type: "medium", gear: 3, speed: 112, position: 32.8 },
      { number: 12, type: "medium", gear: 3, speed: 112, position: 34.5 },
      { number: 13, type: "fast", gear: 5, speed: 194, position: 37.8 },
      { number: 14, type: "fast", gear: 5, speed: 194, position: 39.4 },
      { number: 15, type: "fast", gear: 8, speed: 339, position: 54.5 },
      { number: 16, type: "hairpin", gear: 2, speed: 68, position: 76.7 },
      { number: 17, type: "medium", gear: 4, speed: 134, position: 78.9 },
      { number: 18, type: "slow", gear: 2, speed: 79, position: 82.2 },
      { number: 19, type: "medium", gear: 4, speed: 140, position: 85.3 },
      { number: 20, type: "fast", gear: 5, speed: 193, position: 90.5 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 610 },
      { detection: 48, activation: 53, length: 580 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 35.7, color: "#ef4444" },
      { number: 2, startPercent: 35.7, endPercent: 73.4, color: "#3b82f6" },
      { number: 3, startPercent: 73.4, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 21.0,
  },

  // Singapore Grand Prix - Marina Bay
  // Turn positions from FastF1 telemetry data
  "singapore": {
    circuitId: "marina_bay",
    name: "Marina Bay Street Circuit",
    location: "Singapore",
    country: "Singapore",
    length: 4.940,
    laps: 62,
    raceDistance: 306.143,
    firstGP: 2008,
    lapRecord: {
      time: "1:35.867",
      driver: "Lewis Hamilton",
      year: 2023,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "slow", gear: 2, speed: 97, position: 5.7 },
      { number: 2, type: "slow", gear: 2, speed: 97, position: 7.9 },
      { number: 3, type: "medium", gear: 4, speed: 163, position: 13.9 },
      { number: 4, type: "fast", gear: 5, speed: 170, position: 18.9 },
      { number: 5, name: "Esplanade", type: "slow", gear: 2, speed: 93, position: 21.6 },
      { number: 6, type: "slow", gear: 2, speed: 93, position: 23.9 },
      { number: 7, name: "Memorial", type: "hairpin", gear: 1, speed: 59, position: 29.9 },
      { number: 8, type: "slow", gear: 2, speed: 81, position: 35.3 },
      { number: 9, type: "slow", gear: 2, speed: 81, position: 36.9 },
      { number: 10, type: "medium", gear: 3, speed: 104, position: 40.4 },
      { number: 11, type: "fast", gear: 5, speed: 197, position: 50.6 },
      { number: 12, type: "fast", gear: 5, speed: 197, position: 52.9 },
      { number: 13, type: "medium", gear: 3, speed: 110, position: 60.6 },
      { number: 14, type: "hairpin", gear: 2, speed: 63, position: 67.0 },
      { number: 15, type: "fast", gear: 5, speed: 177, position: 70.9 },
      { number: 16, type: "medium", gear: 4, speed: 146, position: 76.9 },
      { number: 17, type: "slow", gear: 2, speed: 89, position: 80.1 },
      { number: 18, type: "slow", gear: 2, speed: 89, position: 82.6 },
      { number: 19, type: "medium", gear: 4, speed: 148, position: 88.6 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 450 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 31.9, color: "#ef4444" },
      { number: 2, startPercent: 31.9, endPercent: 67.9, color: "#3b82f6" },
      { number: 3, startPercent: 67.9, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 25.0,
  },

  // United States Grand Prix - COTA
  // Turn positions from FastF1 telemetry data
  "cota": {
    circuitId: "americas",
    name: "Circuit of the Americas",
    location: "Austin",
    country: "USA",
    length: 5.513,
    laps: 56,
    raceDistance: 308.405,
    firstGP: 2012,
    lapRecord: {
      time: "1:36.169",
      driver: "Charles Leclerc",
      year: 2019,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "slow", gear: 2, speed: 99, position: 5.9 },
      { number: 2, type: "fast", gear: 5, speed: 181, position: 10.1 },
      { number: 3, type: "fast", gear: 6, speed: 230, position: 13.6 },
      { number: 4, type: "fast", gear: 6, speed: 225, position: 16.7 },
      { number: 5, type: "fast", gear: 6, speed: 218, position: 18.5 },
      { number: 6, type: "fast", gear: 6, speed: 218, position: 20.9 },
      { number: 7, type: "fast", gear: 5, speed: 198, position: 23.9 },
      { number: 8, type: "fast", gear: 5, speed: 198, position: 26.2 },
      { number: 9, type: "fast", gear: 6, speed: 255, position: 29.6 },
      { number: 10, type: "fast", gear: 6, speed: 255, position: 31.7 },
      { number: 11, type: "hairpin", gear: 2, speed: 66, position: 39.3 },
      { number: 12, type: "fast", gear: 5, speed: 184, position: 51.9 },
      { number: 13, type: "fast", gear: 5, speed: 180, position: 56.3 },
      { number: 14, type: "fast", gear: 5, speed: 180, position: 58.9 },
      { number: 15, type: "medium", gear: 4, speed: 138, position: 62.7 },
      { number: 16, type: "medium", gear: 4, speed: 161, position: 68.8 },
      { number: 17, type: "medium", gear: 4, speed: 161, position: 71.3 },
      { number: 18, type: "medium", gear: 4, speed: 161, position: 73.6 },
      { number: 19, type: "medium", gear: 4, speed: 168, position: 88.9 },
      { number: 20, type: "fast", gear: 5, speed: 196, position: 95.7 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 580 },
      { detection: 35, activation: 40, length: 470 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 30.7, color: "#ef4444" },
      { number: 2, startPercent: 30.7, endPercent: 73.7, color: "#3b82f6" },
      { number: 3, startPercent: 73.7, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 21.5,
  },

  // Mexico City Grand Prix
  // Turn positions from FastF1 telemetry data
  "mexico": {
    circuitId: "rodriguez",
    name: "Autodromo Hermanos Rodriguez",
    location: "Mexico City",
    country: "Mexico",
    length: 4.304,
    laps: 71,
    raceDistance: 305.354,
    firstGP: 1963,
    lapRecord: {
      time: "1:17.774",
      driver: "Valtteri Bottas",
      year: 2021,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "medium", gear: 4, speed: 137, position: 8.7 },
      { number: 2, type: "slow", gear: 2, speed: 92, position: 12.5 },
      { number: 3, type: "slow", gear: 2, speed: 92, position: 14.7 },
      { number: 4, type: "hairpin", gear: 1, speed: 55, position: 21.6 },
      { number: 5, type: "medium", gear: 3, speed: 108, position: 26.5 },
      { number: 6, type: "medium", gear: 3, speed: 105, position: 30.9 },
      { number: 7, type: "fast", gear: 5, speed: 192, position: 37.8 },
      { number: 8, type: "fast", gear: 5, speed: 192, position: 40.5 },
      { number: 9, type: "fast", gear: 6, speed: 230, position: 47.2 },
      { number: 10, type: "fast", gear: 7, speed: 260, position: 52.9 },
      { number: 11, type: "fast", gear: 7, speed: 260, position: 56.9 },
      { number: 12, type: "medium", gear: 4, speed: 134, position: 65.9 },
      { number: 13, type: "medium", gear: 4, speed: 161, position: 77.9 },
      { number: 14, type: "fast", gear: 5, speed: 188, position: 81.9 },
      { number: 15, type: "fast", gear: 5, speed: 172, position: 87.9 },
      { number: 16, type: "fast", gear: 5, speed: 172, position: 92.9 },
      { number: 17, type: "fast", gear: 5, speed: 172, position: 96.4 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 610 },
      { detection: 23, activation: 28, length: 380 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 29.9, color: "#ef4444" },
      { number: 2, startPercent: 29.9, endPercent: 72.6, color: "#3b82f6" },
      { number: 3, startPercent: 72.6, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 20.5,
  },

  // Brazilian Grand Prix - Interlagos
  // Turn positions from FastF1 telemetry data
  "interlagos": {
    circuitId: "interlagos",
    name: "Autodromo Jose Carlos Pace",
    location: "Sao Paulo",
    country: "Brazil",
    length: 4.309,
    laps: 71,
    raceDistance: 305.879,
    firstGP: 1973,
    lapRecord: {
      time: "1:10.540",
      driver: "Valtteri Bottas",
      year: 2018,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, name: "Senna S", type: "medium", gear: 3, speed: 112, position: 6.4 },
      { number: 2, type: "medium", gear: 3, speed: 112, position: 8.5 },
      { number: 3, name: "Curva do Sol", type: "medium", gear: 4, speed: 144, position: 12.9 },
      { number: 4, name: "Descida do Lago", type: "fast", gear: 6, speed: 227, position: 24.4 },
      { number: 5, type: "fast", gear: 6, speed: 214, position: 28.1 },
      { number: 6, type: "fast", gear: 6, speed: 214, position: 30.9 },
      { number: 7, name: "Laranjinha", type: "medium", gear: 4, speed: 166, position: 36.8 },
      { number: 8, name: "Pinheirinho", type: "fast", gear: 5, speed: 200, position: 44.3 },
      { number: 9, name: "Bico de Pato", type: "fast", gear: 5, speed: 188, position: 54.4 },
      { number: 10, name: "Mergulho", type: "fast", gear: 6, speed: 221, position: 61.1 },
      { number: 11, name: "Junção", type: "fast", gear: 5, speed: 184, position: 67.2 },
      { number: 12, name: "Subida dos Boxes", type: "medium", gear: 3, speed: 123, position: 80.9 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 580 },
      { detection: 50, activation: 55, length: 420 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 29.9, color: "#ef4444" },
      { number: 2, startPercent: 29.9, endPercent: 64.0, color: "#3b82f6" },
      { number: 3, startPercent: 64.0, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 20.0,
  },

  // Las Vegas Grand Prix
  // Turn positions from FastF1 telemetry data
  "las vegas": {
    circuitId: "vegas",
    name: "Las Vegas Strip Circuit",
    location: "Las Vegas",
    country: "USA",
    length: 6.201,
    laps: 50,
    raceDistance: 310.05,
    firstGP: 2023,
    lapRecord: {
      time: "1:35.490",
      driver: "Oscar Piastri",
      year: 2023,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "medium", gear: 4, speed: 152, position: 5.8 },
      { number: 2, type: "medium", gear: 4, speed: 152, position: 7.1 },
      { number: 3, type: "fast", gear: 6, speed: 224, position: 14.9 },
      { number: 4, type: "fast", gear: 6, speed: 224, position: 16.5 },
      { number: 5, type: "hairpin", gear: 2, speed: 66, position: 26.3 },
      { number: 6, type: "hairpin", gear: 2, speed: 66, position: 28.0 },
      { number: 7, type: "fast", gear: 5, speed: 189, position: 31.9 },
      { number: 8, type: "fast", gear: 5, speed: 189, position: 33.9 },
      { number: 9, type: "fast", gear: 5, speed: 189, position: 36.1 },
      { number: 10, type: "fast", gear: 6, speed: 218, position: 39.4 },
      { number: 11, type: "fast", gear: 6, speed: 218, position: 41.4 },
      { number: 12, type: "slow", gear: 2, speed: 73, position: 51.9 },
      { number: 13, type: "slow", gear: 2, speed: 73, position: 53.4 },
      { number: 14, type: "hairpin", gear: 2, speed: 66, position: 68.7 },
      { number: 15, type: "fast", gear: 5, speed: 194, position: 70.2 },
      { number: 16, type: "fast", gear: 5, speed: 194, position: 72.0 },
      { number: 17, type: "fast", gear: 5, speed: 175, position: 95.7 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 740 },
      { detection: 52, activation: 57, length: 620 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 32.5, color: "#ef4444" },
      { number: 2, startPercent: 32.5, endPercent: 66.5, color: "#3b82f6" },
      { number: 3, startPercent: 66.5, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 22.0,
  },

  // Qatar Grand Prix - Lusail
  // Turn positions from FastF1 telemetry data
  "qatar": {
    circuitId: "losail",
    name: "Lusail International Circuit",
    location: "Lusail",
    country: "Qatar",
    length: 5.419,
    laps: 57,
    raceDistance: 308.611,
    firstGP: 2021,
    lapRecord: {
      time: "1:24.319",
      driver: "Max Verstappen",
      year: 2023,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "fast", gear: 6, speed: 213, position: 10.1 },
      { number: 2, type: "fast", gear: 5, speed: 198, position: 14.6 },
      { number: 3, type: "fast", gear: 5, speed: 180, position: 18.1 },
      { number: 4, type: "fast", gear: 5, speed: 180, position: 21.2 },
      { number: 5, type: "fast", gear: 6, speed: 252, position: 27.7 },
      { number: 6, type: "fast", gear: 6, speed: 252, position: 31.1 },
      { number: 7, type: "fast", gear: 5, speed: 196, position: 36.3 },
      { number: 8, type: "fast", gear: 5, speed: 196, position: 39.7 },
      { number: 9, type: "fast", gear: 5, speed: 196, position: 42.9 },
      { number: 10, type: "fast", gear: 6, speed: 248, position: 49.7 },
      { number: 11, type: "fast", gear: 6, speed: 237, position: 56.2 },
      { number: 12, type: "fast", gear: 5, speed: 186, position: 64.2 },
      { number: 13, type: "fast", gear: 5, speed: 186, position: 67.2 },
      { number: 14, type: "fast", gear: 6, speed: 237, position: 75.6 },
      { number: 15, type: "fast", gear: 6, speed: 237, position: 79.9 },
      { number: 16, type: "fast", gear: 5, speed: 182, position: 90.3 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 640 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 32.9, color: "#ef4444" },
      { number: 2, startPercent: 32.9, endPercent: 69.9, color: "#3b82f6" },
      { number: 3, startPercent: 69.9, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 19.5,
  },

  // Saudi Arabian Grand Prix - Jeddah
  // Turn positions from FastF1 telemetry data
  "jeddah": {
    circuitId: "jeddah",
    name: "Jeddah Corniche Circuit",
    location: "Jeddah",
    country: "Saudi Arabia",
    length: 6.174,
    laps: 50,
    raceDistance: 308.45,
    firstGP: 2021,
    lapRecord: {
      time: "1:30.734",
      driver: "Lewis Hamilton",
      year: 2021,
    },
    turns: [
      // Turn positions from FastF1 telemetry with label offsets for clarity
      { number: 1, type: "fast", gear: 6, speed: 251, position: 3.9, labelAngle: 315, labelOffset: 20 },
      { number: 2, type: "fast", gear: 6, speed: 251, position: 5.4, labelOffset: -20 },
      { number: 3, type: "fast", gear: 6, speed: 251, position: 6.9, labelOffset: -18 },
      { number: 4, type: "fast", gear: 6, speed: 248, position: 10.7, labelOffset: -18 },
      { number: 5, type: "fast", gear: 6, speed: 248, position: 12.5, labelOffset: -20 },
      { number: 6, type: "fast", gear: 6, speed: 248, position: 14.4, labelOffset: -18 },
      { number: 7, type: "fast", gear: 6, speed: 248, position: 16.1, labelOffset: -18 },
      { number: 8, type: "fast", gear: 7, speed: 280, position: 19.7, labelAngle: 135, labelOffset: 24 },
      { number: 9, type: "fast", gear: 7, speed: 280, position: 22.5, labelAngle: 315, labelOffset: 20 },
      { number: 10, type: "fast", gear: 7, speed: 280, position: 24.9, labelAngle: 135, labelOffset: 24 },
      { number: 11, type: "fast", gear: 6, speed: 234, position: 29.3, labelOffset: -20 },
      { number: 12, type: "fast", gear: 6, speed: 234, position: 31.5, labelOffset: -20 },
      { number: 13, type: "medium", gear: 3, speed: 120, position: 37.9, labelAngle: 180, labelOffset: 22 },
      { number: 14, type: "fast", gear: 6, speed: 252, position: 41.9, labelAngle: 315, labelOffset: 22 },
      { number: 15, type: "fast", gear: 6, speed: 252, position: 44.1, labelAngle: 315, labelOffset: 22 },
      { number: 16, type: "fast", gear: 6, speed: 252, position: 46.2, labelAngle: 90, labelOffset: 22 },
      { number: 17, type: "fast", gear: 6, speed: 252, position: 48.7, labelAngle: 90, labelOffset: 22 },
      { number: 18, type: "fast", gear: 6, speed: 252, position: 50.9, labelAngle: 90, labelOffset: 22 },
      { number: 19, type: "fast", gear: 6, speed: 252, position: 52.9, labelAngle: 90, labelOffset: 22 },
      { number: 20, type: "fast", gear: 7, speed: 270, position: 58.1, labelAngle: 90, labelOffset: 22 },
      { number: 21, type: "fast", gear: 7, speed: 270, position: 60.4, labelAngle: 90, labelOffset: 22 },
      { number: 22, type: "slow", gear: 2, speed: 78, position: 67.7, labelAngle: 90, labelOffset: 22 },
      { number: 23, type: "fast", gear: 5, speed: 181, position: 71.9, labelAngle: 90, labelOffset: 22 },
      { number: 24, type: "fast", gear: 5, speed: 181, position: 74.5, labelAngle: 135, labelOffset: 22 },
      { number: 25, type: "fast", gear: 6, speed: 245, position: 80.0 },
      { number: 26, type: "fast", gear: 6, speed: 245, position: 83.9 },
      { number: 27, type: "hairpin", gear: 2, speed: 64, position: 93.1 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 680 },
      { detection: 35, activation: 40, length: 590 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 34.0, color: "#ef4444" },
      { number: 2, startPercent: 34.0, endPercent: 67.3, color: "#3b82f6" },
      { number: 3, startPercent: 67.3, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 20.0,
  },

  // Chinese Grand Prix - Shanghai
  // Turn positions calibrated to official F1 circuit diagram
  "shanghai": {
    circuitId: "shanghai",
    name: "Shanghai International Circuit",
    location: "Shanghai",
    country: "China",
    length: 5.451,
    laps: 56,
    raceDistance: 305.066,
    firstGP: 2004,
    lapRecord: {
      time: "1:32.238",
      driver: "Michael Schumacher",
      year: 2004,
    },
    turns: [
      { number: 1, type: "medium", gear: 4, speed: 150, position: 10.5 },
      { number: 2, type: "medium", gear: 4, speed: 145, position: 13.0 },
      { number: 3, type: "medium", gear: 4, speed: 140, position: 15.5, labelAngle: 290, labelOffset: 13 },
      { number: 4, type: "slow", gear: 3, speed: 120, position: 19.0, labelOffset: -20 },
      { number: 5, type: "slow", gear: 3, speed: 115, position: 23.5 },
      { number: 6, type: "hairpin", gear: 2, speed: 65, position: 28.5 },
      { number: 7, type: "fast", gear: 6, speed: 223, position: 37.0 },
      { number: 8, type: "fast", gear: 6, speed: 219, position: 42.0 },
      { number: 9, type: "medium", gear: 4, speed: 150, position: 46.0 },
      { number: 10, type: "medium", gear: 4, speed: 145, position: 48.0 },
      { number: 11, type: "slow", gear: 2, speed: 92, position: 56.5 },
      { number: 12, type: "slow", gear: 2, speed: 92, position: 59.0 },
      { number: 13, type: "hairpin", gear: 2, speed: 65, position: 62.0 },
      { number: 14, type: "fast", gear: 5, speed: 190, position: 87.5 },
      { number: 15, type: "fast", gear: 5, speed: 190, position: 89.0, labelOffset: -22 },
      { number: 16, type: "fast", gear: 5, speed: 190, position: 94.5, labelAngle: 220, labelOffset: 22 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 620 },
      { detection: 48, activation: 53, length: 530 },
    ],
    sectors: [
      // Sector boundaries calibrated to official F1 diagram
      // S1: Start through snail (T1-T6), ends at top-right corner
      { number: 1, startPercent: 0, endPercent: 25, color: "#ef4444" },
      // S2: T7 through hairpin (T11-T12), ends after hairpin
      { number: 2, startPercent: 25, endPercent: 55, color: "#3b82f6" },
      // S3: T13-T16 back to finish
      { number: 3, startPercent: 55, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 21.5,
  },

  // Spanish Grand Prix - Barcelona
  // Turn positions from FastF1 telemetry data
  "barcelona": {
    circuitId: "catalunya",
    name: "Circuit de Barcelona-Catalunya",
    location: "Barcelona",
    country: "Spain",
    length: 4.657,
    laps: 66,
    raceDistance: 307.236,
    firstGP: 1991,
    lapRecord: {
      time: "1:16.330",
      driver: "Max Verstappen",
      year: 2024,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, name: "Elf", type: "medium", gear: 3, speed: 129, position: 7.8 },
      { number: 2, type: "medium", gear: 4, speed: 135, position: 11.6 },
      { number: 3, name: "Renault", type: "medium", gear: 4, speed: 135, position: 14.3 },
      { number: 4, type: "slow", gear: 2, speed: 89, position: 20.9 },
      { number: 5, name: "Seat", type: "slow", gear: 2, speed: 89, position: 24.0 },
      { number: 6, type: "fast", gear: 6, speed: 210, position: 32.9 },
      { number: 7, name: "Wurth", type: "fast", gear: 6, speed: 210, position: 37.0 },
      { number: 8, type: "fast", gear: 6, speed: 210, position: 41.2 },
      { number: 9, name: "Campsa", type: "fast", gear: 7, speed: 280, position: 51.7 },
      { number: 10, name: "La Caixa", type: "slow", gear: 2, speed: 72, position: 59.5 },
      { number: 11, type: "fast", gear: 5, speed: 180, position: 68.2 },
      { number: 12, type: "fast", gear: 5, speed: 180, position: 72.0 },
      { number: 13, name: "Chicane", type: "medium", gear: 4, speed: 155, position: 80.5 },
      { number: 14, type: "medium", gear: 4, speed: 155, position: 83.2 },
      { number: 15, type: "medium", gear: 4, speed: 163, position: 89.2 },
      { number: 16, name: "New Holland", type: "fast", gear: 5, speed: 193, position: 94.4 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 590 },
      { detection: 30, activation: 35, length: 420 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 32.9, color: "#ef4444" },
      { number: 2, startPercent: 32.9, endPercent: 68.8, color: "#3b82f6" },
      { number: 3, startPercent: 68.8, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 20.5,
  },

  // Canadian Grand Prix - Montreal
  // Turn positions from FastF1 telemetry data
  "montreal": {
    circuitId: "villeneuve",
    name: "Circuit Gilles Villeneuve",
    location: "Montreal",
    country: "Canada",
    length: 4.361,
    laps: 70,
    raceDistance: 305.27,
    firstGP: 1978,
    lapRecord: {
      time: "1:13.078",
      driver: "Valtteri Bottas",
      year: 2019,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "medium", gear: 3, speed: 124, position: 6.9 },
      { number: 2, type: "medium", gear: 3, speed: 124, position: 9.6 },
      { number: 3, name: "Virage Senna", type: "medium", gear: 4, speed: 152, position: 17.2 },
      { number: 4, type: "medium", gear: 4, speed: 152, position: 19.9 },
      { number: 5, type: "fast", gear: 6, speed: 211, position: 26.3 },
      { number: 6, type: "fast", gear: 5, speed: 183, position: 33.9 },
      { number: 7, type: "fast", gear: 5, speed: 183, position: 37.1 },
      { number: 8, name: "L'Epingle", type: "hairpin", gear: 1, speed: 57, position: 51.7 },
      { number: 9, type: "fast", gear: 6, speed: 212, position: 57.9 },
      { number: 10, type: "medium", gear: 3, speed: 109, position: 74.3 },
      { number: 11, type: "medium", gear: 3, speed: 109, position: 77.1 },
      { number: 12, type: "fast", gear: 5, speed: 196, position: 83.3 },
      { number: 13, name: "Wall of Champions", type: "medium", gear: 3, speed: 114, position: 91.5 },
      { number: 14, type: "medium", gear: 3, speed: 114, position: 94.7 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 580 },
      { detection: 42, activation: 47, length: 450 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 34.9, color: "#ef4444" },
      { number: 2, startPercent: 34.9, endPercent: 72.0, color: "#3b82f6" },
      { number: 3, startPercent: 72.0, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 19.0,
  },

  // Austrian Grand Prix - Red Bull Ring
  // Turn positions from FastF1 telemetry data
  "austria": {
    circuitId: "red_bull_ring",
    name: "Red Bull Ring",
    location: "Spielberg",
    country: "Austria",
    length: 4.318,
    laps: 71,
    raceDistance: 306.452,
    firstGP: 1970,
    lapRecord: {
      time: "1:05.619",
      driver: "Carlos Sainz",
      year: 2020,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "slow", gear: 2, speed: 82, position: 13.1 },
      { number: 2, type: "slow", gear: 2, speed: 82, position: 17.1 },
      { number: 3, type: "hairpin", gear: 2, speed: 63, position: 36.9 },
      { number: 4, type: "fast", gear: 6, speed: 225, position: 49.5 },
      { number: 5, type: "fast", gear: 6, speed: 225, position: 53.1 },
      { number: 6, type: "fast", gear: 6, speed: 225, position: 56.9 },
      { number: 7, type: "fast", gear: 6, speed: 225, position: 60.9 },
      { number: 8, type: "fast", gear: 7, speed: 285, position: 76.3 },
      { number: 9, type: "slow", gear: 2, speed: 99, position: 89.3 },
      { number: 10, type: "slow", gear: 2, speed: 99, position: 93.2 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 720 },
      { detection: 55, activation: 60, length: 540 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 30.5, color: "#ef4444" },
      { number: 2, startPercent: 30.5, endPercent: 73.1, color: "#3b82f6" },
      { number: 3, startPercent: 73.1, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 17.5,
  },

  // Hungarian Grand Prix - Hungaroring
  // Turn positions from FastF1 telemetry data
  "hungary": {
    circuitId: "hungaroring",
    name: "Hungaroring",
    location: "Budapest",
    country: "Hungary",
    length: 4.381,
    laps: 70,
    raceDistance: 306.63,
    firstGP: 1986,
    lapRecord: {
      time: "1:16.627",
      driver: "Lewis Hamilton",
      year: 2020,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, type: "medium", gear: 3, speed: 107, position: 9.9 },
      { number: 2, type: "medium", gear: 4, speed: 145, position: 18.5 },
      { number: 3, type: "fast", gear: 5, speed: 178, position: 24.3 },
      { number: 4, type: "hairpin", gear: 2, speed: 68, position: 32.8 },
      { number: 5, type: "fast", gear: 5, speed: 175, position: 40.3 },
      { number: 6, type: "medium", gear: 4, speed: 153, position: 49.3 },
      { number: 7, type: "medium", gear: 4, speed: 153, position: 52.8 },
      { number: 8, type: "medium", gear: 3, speed: 115, position: 56.3 },
      { number: 9, type: "medium", gear: 4, speed: 162, position: 62.1 },
      { number: 10, type: "fast", gear: 5, speed: 193, position: 67.3 },
      { number: 11, type: "medium", gear: 4, speed: 155, position: 72.9 },
      { number: 12, type: "medium", gear: 4, speed: 155, position: 76.2 },
      { number: 13, type: "medium", gear: 4, speed: 138, position: 84.1 },
      { number: 14, type: "slow", gear: 2, speed: 82, position: 92.1 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 490 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 31.2, color: "#ef4444" },
      { number: 2, startPercent: 31.2, endPercent: 69.3, color: "#3b82f6" },
      { number: 3, startPercent: 69.3, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 20.5,
  },

  // Italian Grand Prix - Monza
  // Turn positions from FastF1 telemetry data
  "monza": {
    circuitId: "monza",
    name: "Autodromo Nazionale Monza",
    location: "Monza",
    country: "Italy",
    length: 5.793,
    laps: 53,
    raceDistance: 306.72,
    firstGP: 1950,
    lapRecord: {
      time: "1:21.046",
      driver: "Rubens Barrichello",
      year: 2004,
    },
    turns: [
      // Turn positions from FastF1 telemetry
      { number: 1, name: "Variante del Rettifilo", type: "slow", gear: 2, speed: 75, position: 10.6 },
      { number: 2, type: "slow", gear: 2, speed: 75, position: 12.7 },
      { number: 3, name: "Curva Grande", type: "fast", gear: 8, speed: 307, position: 22.8 },
      { number: 4, name: "Variante della Roggia", type: "slow", gear: 2, speed: 79, position: 35.3 },
      { number: 5, type: "slow", gear: 2, speed: 79, position: 37.7 },
      { number: 6, name: "Lesmo 1", type: "fast", gear: 6, speed: 218, position: 45.9 },
      { number: 7, name: "Lesmo 2", type: "fast", gear: 5, speed: 195, position: 51.5 },
      { number: 8, name: "Variante Ascari", type: "fast", gear: 5, speed: 189, position: 65.2 },
      { number: 9, type: "fast", gear: 5, speed: 189, position: 67.6 },
      { number: 10, type: "fast", gear: 5, speed: 189, position: 70.1 },
      { number: 11, name: "Parabolica", type: "fast", gear: 6, speed: 246, position: 87.2 },
    ],
    drsZones: [
      { detection: 88, activation: 93, length: 750 },
      { detection: 30, activation: 35, length: 620 },
    ],
    sectors: [
      // Sector boundaries from FastF1 timing data
      { number: 1, startPercent: 0, endPercent: 30.9, color: "#ef4444" },
      { number: 2, startPercent: 30.9, endPercent: 71.5, color: "#3b82f6" },
      { number: 3, startPercent: 71.5, endPercent: 100, color: "#eab308" },
    ],
    pitLaneTimeLoss: 23.5,
  },
};

// Get circuit features by name (case insensitive, partial match)
export function getCircuitFeatures(name: string): CircuitFeatures | null {
  const searchName = name.toLowerCase().trim();

  // Try exact match first
  if (circuitFeatures[searchName]) {
    return circuitFeatures[searchName];
  }

  // Try partial match
  for (const [key, features] of Object.entries(circuitFeatures)) {
    if (
      key.includes(searchName) ||
      searchName.includes(key) ||
      features.name.toLowerCase().includes(searchName) ||
      features.location.toLowerCase().includes(searchName)
    ) {
      return features;
    }
  }

  return null;
}

// Get turn type color for visualization
export function getTurnTypeColor(type: Turn["type"]): string {
  switch (type) {
    case "hairpin":
      return "#ef4444"; // red
    case "slow":
      return "#f97316"; // orange
    case "medium":
      return "#eab308"; // yellow
    case "fast":
      return "#22c55e"; // green
    case "chicane":
      return "#a855f7"; // purple
    default:
      return "#6b7280"; // gray
  }
}
