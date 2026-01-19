// F1 Circuit SVG paths and data
// Paths are simplified representations scaled to fit a 1000x600 viewBox

export interface LapRecord {
  time: string;
  driver: string;
  year: number;
}

export interface PastResult {
  year: number;
  driver: string;
  team: string;
}

export interface CircuitData {
  name: string;
  shortName: string;
  country: string;
  path: string;
  viewBox: string;
  startFinish: { x: number; y: number; angle: number };
  length: number; // km
  turns: number;
  // Race-specific data
  laps?: number;
  raceDistance?: number; // km
  firstGP?: number;
  lapRecord?: LapRecord;
  pastWinners?: PastResult[];
  pastPoles?: PastResult[];
}

export const circuits: Record<string, CircuitData> = {
  // Abu Dhabi - Yas Marina Circuit
  "yas marina circuit": {
    name: "Yas Marina Circuit",
    shortName: "Yas Marina",
    country: "UAE",
    viewBox: "0 0 1000 600",
    path: `M 180,300
           L 180,180
           C 180,140 220,100 280,100
           L 500,100
           C 540,100 560,120 580,140
           L 680,240
           C 720,280 760,280 800,260
           L 880,220
           C 920,200 940,220 940,260
           L 940,380
           C 940,420 920,440 880,440
           L 760,440
           C 720,440 700,460 700,500
           L 700,520
           C 700,560 660,580 620,580
           L 380,580
           C 340,580 300,560 280,520
           L 200,380
           C 180,340 180,320 180,300 Z`,
    startFinish: { x: 180, y: 240, angle: -90 },
    length: 5.281,
    turns: 16,
    laps: 58,
    raceDistance: 306.183,
    firstGP: 2009,
    lapRecord: { time: "1:26.103", driver: "Max Verstappen", year: 2021 },
    pastWinners: [
      { year: 2024, driver: "Lando Norris", team: "McLaren" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Max Verstappen", team: "Red Bull" },
    ],
    pastPoles: [
      { year: 2024, driver: "Lando Norris", team: "McLaren" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Max Verstappen", team: "Red Bull" },
    ],
  },

  // Monaco - Circuit de Monaco
  "monaco": {
    name: "Circuit de Monaco",
    shortName: "Monaco",
    country: "Monaco",
    viewBox: "0 0 1000 600",
    path: `M 150,400
           L 150,200
           C 150,160 180,140 220,140
           L 400,140
           C 440,140 460,160 480,180
           L 520,220
           C 560,260 600,260 640,240
           L 720,200
           C 760,180 800,180 840,200
           L 900,260
           C 940,300 940,360 900,400
           L 800,480
           C 760,510 720,520 680,500
           L 600,460
           C 560,440 520,450 480,480
           L 380,560
           C 340,590 280,590 240,560
           L 180,500
           C 150,470 150,440 150,400 Z`,
    startFinish: { x: 150, y: 300, angle: -90 },
    length: 3.337,
    turns: 19,
    laps: 78,
    raceDistance: 260.286,
    firstGP: 1950,
    lapRecord: { time: "1:12.909", driver: "Lewis Hamilton", year: 2021 },
    pastWinners: [
      { year: 2024, driver: "Charles Leclerc", team: "Ferrari" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Sergio Perez", team: "Red Bull" },
    ],
    pastPoles: [
      { year: 2024, driver: "Charles Leclerc", team: "Ferrari" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Charles Leclerc", team: "Ferrari" },
    ],
  },

  // Silverstone - Silverstone Circuit
  "silverstone circuit": {
    name: "Silverstone Circuit",
    shortName: "Silverstone",
    country: "UK",
    viewBox: "0 0 1000 600",
    path: `M 100,350
           L 100,250
           C 100,200 140,160 200,160
           L 350,160
           L 450,100
           C 500,70 560,70 600,100
           L 700,180
           C 740,210 780,210 820,180
           L 900,120
           C 940,90 980,120 980,180
           L 980,350
           C 980,400 950,440 900,460
           L 750,520
           C 700,540 650,540 600,520
           L 450,450
           C 400,430 350,440 300,470
           L 180,540
           C 140,560 100,540 100,480
           L 100,350 Z`,
    startFinish: { x: 100, y: 300, angle: -90 },
    length: 5.891,
    turns: 18,
    laps: 52,
    raceDistance: 306.198,
    firstGP: 1950,
    lapRecord: { time: "1:27.097", driver: "Max Verstappen", year: 2020 },
    pastWinners: [
      { year: 2024, driver: "Lewis Hamilton", team: "Mercedes" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Carlos Sainz", team: "Ferrari" },
    ],
    pastPoles: [
      { year: 2024, driver: "George Russell", team: "Mercedes" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Carlos Sainz", team: "Ferrari" },
    ],
  },

  // Monza - Autodromo Nazionale Monza
  "monza": {
    name: "Autodromo Nazionale Monza",
    shortName: "Monza",
    country: "Italy",
    viewBox: "0 0 1000 600",
    path: `M 100,300
           L 100,180
           C 100,140 140,100 200,100
           L 700,100
           C 760,100 800,140 820,180
           L 880,300
           C 900,340 900,400 880,440
           L 780,540
           C 740,580 680,580 620,560
           L 500,500
           C 460,480 420,480 380,500
           L 280,560
           C 220,590 160,570 140,520
           L 100,400
           C 100,360 100,340 100,300 Z`,
    startFinish: { x: 100, y: 240, angle: -90 },
    length: 5.793,
    turns: 11,
  },

  // Spa - Circuit de Spa-Francorchamps
  "spa-francorchamps": {
    name: "Circuit de Spa-Francorchamps",
    shortName: "Spa",
    country: "Belgium",
    viewBox: "0 0 1000 600",
    path: `M 80,400
           L 80,280
           C 80,240 100,200 140,180
           L 280,120
           C 320,100 360,100 400,120
           L 500,180
           L 600,140
           C 660,110 720,110 780,140
           L 900,220
           C 940,250 960,300 940,360
           L 880,480
           C 860,520 820,540 780,540
           L 600,540
           C 560,540 520,520 500,480
           L 420,340
           C 400,300 360,280 320,300
           L 200,380
           C 160,400 120,420 100,460
           L 80,520
           C 60,560 80,560 80,400 Z`,
    startFinish: { x: 80, y: 340, angle: -90 },
    length: 7.004,
    turns: 19,
    laps: 44,
    raceDistance: 308.052,
    firstGP: 1950,
    lapRecord: { time: "1:46.286", driver: "Valtteri Bottas", year: 2018 },
    pastWinners: [
      { year: 2024, driver: "Lewis Hamilton", team: "Mercedes" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Max Verstappen", team: "Red Bull" },
    ],
    pastPoles: [
      { year: 2024, driver: "Charles Leclerc", team: "Ferrari" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Max Verstappen", team: "Red Bull" },
    ],
  },

  // Suzuka - Suzuka International Racing Course
  "suzuka": {
    name: "Suzuka International Racing Course",
    shortName: "Suzuka",
    country: "Japan",
    viewBox: "0 0 1000 600",
    path: `M 150,350
           C 150,280 200,220 280,200
           L 400,180
           C 460,170 500,200 520,260
           L 540,340
           C 560,400 620,420 680,400
           L 800,340
           C 860,310 900,340 900,400
           L 900,480
           C 900,540 860,580 800,580
           L 500,580
           C 440,580 400,540 400,480
           L 400,420
           C 400,360 360,320 300,320
           L 200,340
           C 160,350 150,380 150,350 Z`,
    startFinish: { x: 150, y: 350, angle: 0 },
    length: 5.807,
    turns: 18,
    laps: 53,
    raceDistance: 307.471,
    firstGP: 1987,
    lapRecord: { time: "1:30.983", driver: "Lewis Hamilton", year: 2019 },
    pastWinners: [
      { year: 2024, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Max Verstappen", team: "Red Bull" },
    ],
    pastPoles: [
      { year: 2024, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Max Verstappen", team: "Red Bull" },
    ],
  },

  // Singapore - Marina Bay Street Circuit
  "marina bay": {
    name: "Marina Bay Street Circuit",
    shortName: "Singapore",
    country: "Singapore",
    viewBox: "0 0 1000 600",
    path: `M 100,300
           L 100,150
           C 100,110 140,80 200,80
           L 700,80
           C 760,80 800,110 820,150
           L 880,280
           C 900,320 900,380 880,420
           L 800,520
           C 760,560 700,580 640,560
           L 500,500
           C 440,480 380,480 320,500
           L 200,560
           C 140,580 100,540 100,480
           L 100,300 Z`,
    startFinish: { x: 100, y: 220, angle: -90 },
    length: 4.940,
    turns: 19,
  },

  // COTA - Circuit of the Americas
  "cota": {
    name: "Circuit of the Americas",
    shortName: "COTA",
    country: "USA",
    viewBox: "0 0 1000 600",
    path: `M 80,400
           L 80,200
           C 80,160 120,120 180,120
           L 300,120
           C 340,120 380,140 400,180
           L 480,320
           C 500,360 540,380 600,380
           L 750,380
           C 810,380 860,340 880,280
           L 920,180
           C 940,140 960,160 960,200
           L 960,450
           C 960,510 920,550 860,560
           L 600,580
           C 540,580 480,560 440,520
           L 320,400
           C 280,360 220,340 160,360
           L 100,400
           C 80,410 80,420 80,400 Z`,
    startFinish: { x: 80, y: 300, angle: -90 },
    length: 5.513,
    turns: 20,
  },

  // Bahrain - Bahrain International Circuit
  "sakhir": {
    name: "Bahrain International Circuit",
    shortName: "Bahrain",
    country: "Bahrain",
    viewBox: "0 0 1000 600",
    path: `M 120,350
           L 120,200
           C 120,160 160,120 220,120
           L 500,120
           C 560,120 600,160 620,200
           L 700,380
           C 720,420 760,440 820,440
           L 900,440
           C 940,440 960,480 960,520
           L 960,540
           C 960,580 920,600 880,580
           L 700,500
           C 660,480 620,480 580,500
           L 400,580
           C 340,600 280,580 260,540
           L 140,380
           C 120,340 120,370 120,350 Z`,
    startFinish: { x: 120, y: 280, angle: -90 },
    length: 5.412,
    turns: 15,
    laps: 57,
    raceDistance: 308.238,
    firstGP: 2004,
    lapRecord: { time: "1:31.447", driver: "Pedro de la Rosa", year: 2005 },
    pastWinners: [
      { year: 2024, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Charles Leclerc", team: "Ferrari" },
    ],
    pastPoles: [
      { year: 2024, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Charles Leclerc", team: "Ferrari" },
    ],
  },

  // Jeddah - Jeddah Corniche Circuit
  "jeddah": {
    name: "Jeddah Corniche Circuit",
    shortName: "Jeddah",
    country: "Saudi Arabia",
    viewBox: "0 0 1000 600",
    path: `M 60,400
           L 60,200
           C 60,140 100,100 160,100
           L 400,100
           C 440,100 480,120 500,160
           L 560,280
           C 580,320 620,340 680,340
           L 800,340
           C 860,340 900,380 920,420
           L 960,540
           C 980,580 940,600 900,580
           L 600,480
           C 540,460 480,460 420,480
           L 200,560
           C 140,580 80,540 80,480
           L 60,400 Z`,
    startFinish: { x: 60, y: 300, angle: -90 },
    length: 6.174,
    turns: 27,
  },

  // Melbourne - Albert Park Circuit
  "albert park": {
    name: "Albert Park Circuit",
    shortName: "Melbourne",
    country: "Australia",
    viewBox: "0 0 1000 600",
    path: `M 150,300
           L 150,150
           C 150,100 200,80 260,80
           L 600,80
           C 680,80 720,120 740,180
           L 800,340
           C 820,400 860,440 920,440
           L 950,440
           C 980,440 980,480 950,500
           L 700,560
           C 640,580 580,580 520,560
           L 320,480
           C 260,460 200,460 160,500
           L 150,520
           C 130,560 150,560 150,300 Z`,
    startFinish: { x: 150, y: 220, angle: -90 },
    length: 5.278,
    turns: 14,
    laps: 58,
    raceDistance: 306.124,
    firstGP: 1996,
    lapRecord: { time: "1:19.813", driver: "Charles Leclerc", year: 2024 },
    pastWinners: [
      { year: 2024, driver: "Carlos Sainz", team: "Ferrari" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Charles Leclerc", team: "Ferrari" },
    ],
    pastPoles: [
      { year: 2024, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2023, driver: "Max Verstappen", team: "Red Bull" },
      { year: 2022, driver: "Charles Leclerc", team: "Ferrari" },
    ],
  },

  // Imola - Autodromo Enzo e Dino Ferrari
  "imola": {
    name: "Autodromo Enzo e Dino Ferrari",
    shortName: "Imola",
    country: "Italy",
    viewBox: "0 0 1000 600",
    path: `M 100,350
           L 100,200
           C 100,140 160,100 240,100
           L 600,100
           C 680,100 740,140 780,200
           L 860,360
           C 880,400 880,460 840,500
           L 700,580
           C 640,620 560,620 500,580
           L 300,460
           C 240,420 180,420 140,460
           L 100,500
           C 80,540 100,540 100,350 Z`,
    startFinish: { x: 100, y: 280, angle: -90 },
    length: 4.909,
    turns: 19,
  },

  // Miami - Miami International Autodrome
  "miami": {
    name: "Miami International Autodrome",
    shortName: "Miami",
    country: "USA",
    viewBox: "0 0 1000 600",
    path: `M 80,320
           L 80,180
           C 80,120 140,80 220,80
           L 700,80
           C 780,80 840,120 860,180
           L 900,280
           C 920,340 920,400 880,460
           L 780,540
           C 720,580 640,580 580,540
           L 400,420
           C 340,380 260,380 200,420
           L 120,480
           C 80,510 80,480 80,320 Z`,
    startFinish: { x: 80, y: 250, angle: -90 },
    length: 5.412,
    turns: 19,
  },

  // Barcelona - Circuit de Barcelona-Catalunya
  "barcelona": {
    name: "Circuit de Barcelona-Catalunya",
    shortName: "Barcelona",
    country: "Spain",
    viewBox: "0 0 1000 600",
    path: `M 100,350
           L 100,180
           C 100,120 160,80 240,80
           L 500,80
           C 560,80 600,100 640,140
           L 760,280
           C 800,320 860,340 920,320
           L 960,300
           C 980,290 980,340 960,380
           L 860,500
           C 800,560 720,580 640,560
           L 400,480
           C 320,460 240,480 180,520
           L 120,560
           C 80,580 100,540 100,350 Z`,
    startFinish: { x: 100, y: 260, angle: -90 },
    length: 4.657,
    turns: 16,
  },

  // Canada - Circuit Gilles Villeneuve
  "montreal": {
    name: "Circuit Gilles Villeneuve",
    shortName: "Montreal",
    country: "Canada",
    viewBox: "0 0 1000 600",
    path: `M 60,400
           L 60,200
           C 60,140 100,100 180,100
           L 500,100
           L 600,160
           C 660,200 720,200 780,160
           L 900,80
           C 960,60 980,100 960,160
           L 920,300
           C 900,360 860,400 800,420
           L 600,480
           C 520,500 440,500 360,480
           L 180,420
           C 120,400 80,440 60,500
           C 40,560 60,560 60,400 Z`,
    startFinish: { x: 60, y: 300, angle: -90 },
    length: 4.361,
    turns: 14,
  },

  // Austria - Red Bull Ring
  "red bull ring": {
    name: "Red Bull Ring",
    shortName: "Austria",
    country: "Austria",
    viewBox: "0 0 1000 600",
    path: `M 120,400
           L 120,200
           C 120,140 180,100 260,100
           L 600,100
           C 700,100 780,160 820,260
           L 880,440
           C 900,500 860,560 780,560
           L 400,560
           C 300,560 220,520 180,460
           L 120,360
           C 100,320 120,420 120,400 Z`,
    startFinish: { x: 120, y: 300, angle: -90 },
    length: 4.318,
    turns: 10,
  },

  // Hungary - Hungaroring
  "hungaroring": {
    name: "Hungaroring",
    shortName: "Hungary",
    country: "Hungary",
    viewBox: "0 0 1000 600",
    path: `M 120,350
           L 120,200
           C 120,140 180,100 260,100
           L 500,100
           C 580,100 640,140 680,200
           L 780,380
           C 820,460 880,480 940,460
           L 960,450
           C 980,440 980,500 940,520
           L 700,580
           C 600,600 500,580 420,540
           L 240,440
           C 180,410 140,420 120,480
           C 100,540 120,540 120,350 Z`,
    startFinish: { x: 120, y: 280, angle: -90 },
    length: 4.381,
    turns: 14,
  },

  // Netherlands - Circuit Zandvoort
  "zandvoort": {
    name: "Circuit Zandvoort",
    shortName: "Zandvoort",
    country: "Netherlands",
    viewBox: "0 0 1000 600",
    path: `M 100,350
           L 100,200
           C 100,140 160,100 240,100
           L 600,100
           C 700,100 780,160 820,260
           L 880,420
           C 900,480 860,540 780,560
           L 400,580
           C 300,580 200,540 160,480
           L 120,420
           C 100,380 100,360 100,350 Z`,
    startFinish: { x: 100, y: 280, angle: -90 },
    length: 4.259,
    turns: 14,
  },

  // Mexico - Autodromo Hermanos Rodriguez
  "mexico": {
    name: "Autodromo Hermanos Rodriguez",
    shortName: "Mexico City",
    country: "Mexico",
    viewBox: "0 0 1000 600",
    path: `M 100,350
           L 100,180
           C 100,120 160,80 260,80
           L 700,80
           C 800,80 860,140 880,240
           L 900,380
           C 920,460 880,520 800,540
           L 400,580
           C 280,600 180,560 140,480
           L 100,400
           C 80,360 100,360 100,350 Z`,
    startFinish: { x: 100, y: 260, angle: -90 },
    length: 4.304,
    turns: 17,
  },

  // Brazil - Interlagos
  "interlagos": {
    name: "Autodromo Jose Carlos Pace",
    shortName: "Interlagos",
    country: "Brazil",
    viewBox: "0 0 1000 600",
    path: `M 100,300
           L 100,180
           C 100,120 160,80 260,80
           L 600,80
           C 700,80 780,140 820,240
           L 880,400
           C 900,480 860,540 760,560
           L 400,580
           C 280,600 180,560 140,480
           L 100,380
           C 80,320 100,320 100,300 Z`,
    startFinish: { x: 100, y: 240, angle: -90 },
    length: 4.309,
    turns: 15,
  },

  // Las Vegas - Las Vegas Strip Circuit
  "las vegas": {
    name: "Las Vegas Strip Circuit",
    shortName: "Las Vegas",
    country: "USA",
    viewBox: "0 0 1000 600",
    path: `M 80,400
           L 80,160
           C 80,100 140,60 220,60
           L 800,60
           C 880,60 940,100 960,180
           L 960,400
           C 960,480 900,540 820,560
           L 300,580
           C 200,580 120,540 100,460
           L 80,400 Z`,
    startFinish: { x: 80, y: 280, angle: -90 },
    length: 6.201,
    turns: 17,
  },

  // Qatar - Lusail International Circuit
  "lusail": {
    name: "Lusail International Circuit",
    shortName: "Qatar",
    country: "Qatar",
    viewBox: "0 0 1000 600",
    path: `M 100,350
           L 100,180
           C 100,120 160,80 260,80
           L 700,80
           C 800,80 860,140 880,240
           L 920,420
           C 940,500 900,560 800,580
           L 400,580
           C 280,580 180,540 140,460
           L 100,380
           C 80,340 100,350 100,350 Z`,
    startFinish: { x: 100, y: 260, angle: -90 },
    length: 5.419,
    turns: 16,
  },
};

// Get circuit by short name (case insensitive, partial match)
export function getCircuit(name: string): CircuitData | null {
  const searchName = name.toLowerCase().trim();

  // Try exact match first
  if (circuits[searchName]) {
    return circuits[searchName];
  }

  // Try partial match
  for (const [key, circuit] of Object.entries(circuits)) {
    if (
      key.includes(searchName) ||
      circuit.shortName.toLowerCase().includes(searchName) ||
      circuit.name.toLowerCase().includes(searchName)
    ) {
      return circuit;
    }
  }

  return null;
}

// Default circuit (generic oval)
export const defaultCircuit: CircuitData = {
  name: "Circuit",
  shortName: "Circuit",
  country: "",
  viewBox: "0 0 600 400",
  path: `M 120,200
         A 180,130 0 1,1 480,200
         A 180,130 0 1,1 120,200`,
  startFinish: { x: 300, y: 70, angle: 0 },
  length: 0,
  turns: 0,
};
