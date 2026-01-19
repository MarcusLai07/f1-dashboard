// F1 2026 Season Calendar
// Data sourced from formula1.com - January 2026
// Times are in UTC, convert to local timezone as needed

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

// Pre-Season Testing 2026
// Barcelona: 9:00-13:00, 14:00-18:00 local (CET = UTC+1)
// Bahrain: 9:00-13:00, 14:00-18:00 local (AST = UTC+3)
export const PRE_SEASON_2026: PreSeasonEvent[] = [
  {
    name: "Barcelona Shakedown Week",
    location: "Spain",
    circuit: "Circuit de Barcelona-Catalunya",
    dates: {
      start: "2026-01-26",
      end: "2026-01-30",
    },
    sessions: {
      morning: "2026-01-26T08:00:00Z", // 09:00 local CET
      afternoon: "2026-01-26T13:00:00Z", // 14:00 local CET
    },
    type: "shakedown",
    timezone: "Europe/Madrid",
  },
  {
    name: "Pre-Season Testing 1",
    location: "Bahrain",
    circuit: "Bahrain International Circuit",
    dates: {
      start: "2026-02-11",
      end: "2026-02-13",
    },
    sessions: {
      morning: "2026-02-11T06:00:00Z", // 09:00 local AST
      afternoon: "2026-02-11T11:00:00Z", // 14:00 local AST
    },
    type: "testing",
    timezone: "Asia/Bahrain",
  },
  {
    name: "Pre-Season Testing 2",
    location: "Bahrain",
    circuit: "Bahrain International Circuit",
    dates: {
      start: "2026-02-18",
      end: "2026-02-20",
    },
    sessions: {
      morning: "2026-02-18T06:00:00Z", // 09:00 local AST
      afternoon: "2026-02-18T11:00:00Z", // 14:00 local AST
    },
    type: "testing",
    timezone: "Asia/Bahrain",
  },
];

// Team Launch Events 2026
export const TEAM_LAUNCHES_2026: PreSeasonEvent[] = [
  {
    name: "Red Bull / Racing Bulls Launch",
    location: "Detroit, Michigan",
    dates: { start: "2026-01-15", end: "2026-01-15" },
    type: "launch",
  },
  {
    name: "Haas Launch",
    location: "Online",
    dates: { start: "2026-01-19", end: "2026-01-19" },
    type: "launch",
  },
  {
    name: "Audi Launch",
    location: "Berlin",
    dates: { start: "2026-01-20", end: "2026-01-20" },
    type: "launch",
  },
  {
    name: "Honda Power Unit Reveal",
    location: "Tokyo",
    dates: { start: "2026-01-20", end: "2026-01-20" },
    type: "launch",
  },
  {
    name: "Mercedes Launch",
    location: "Online",
    dates: { start: "2026-01-22", end: "2026-01-22" },
    type: "launch",
  },
  {
    name: "Alpine Launch",
    location: "Barcelona",
    dates: { start: "2026-01-23", end: "2026-01-23" },
    type: "launch",
  },
  {
    name: "Ferrari Launch",
    location: "TBC",
    dates: { start: "2026-01-23", end: "2026-01-23" },
    type: "launch",
  },
  {
    name: "Mercedes (Second Event)",
    location: "Online",
    dates: { start: "2026-02-02", end: "2026-02-02" },
    type: "launch",
  },
  {
    name: "Williams Launch",
    location: "Online",
    dates: { start: "2026-02-03", end: "2026-02-03" },
    type: "launch",
  },
  {
    name: "Cadillac Launch",
    location: "Super Bowl TV Ad",
    dates: { start: "2026-02-08", end: "2026-02-08" },
    type: "launch",
  },
  {
    name: "Aston Martin Launch",
    location: "TBC",
    dates: { start: "2026-02-09", end: "2026-02-09" },
    type: "launch",
  },
  {
    name: "McLaren Launch",
    location: "Bahrain International Circuit",
    dates: { start: "2026-02-09", end: "2026-02-09" },
    type: "launch",
  },
];

// Full 2026 Race Calendar (24 Rounds)
// Note: Session times are approximate and based on typical schedules
// Actual times will be confirmed closer to each event
export const CALENDAR_2026: F1Event[] = [
  {
    round: 1,
    name: "Australian Grand Prix",
    officialName: "FORMULA 1 QATAR AIRWAYS AUSTRALIAN GRAND PRIX 2026",
    country: "Australia",
    circuit: "Albert Park Circuit",
    circuitId: "albert_park",
    dates: { start: "2026-03-06", end: "2026-03-08" },
    sessions: {
      fp1: "2026-03-06T01:30:00Z", // 12:30 local
      fp2: "2026-03-06T05:00:00Z", // 16:00 local
      fp3: "2026-03-07T01:30:00Z", // 12:30 local
      qualifying: "2026-03-07T05:00:00Z", // 16:00 local
      race: "2026-03-08T04:00:00Z", // 15:00 local
    },
    isSprint: false,
    timezone: "Australia/Melbourne",
  },
  {
    round: 2,
    name: "Chinese Grand Prix",
    officialName: "FORMULA 1 HEINEKEN CHINESE GRAND PRIX 2026",
    country: "China",
    circuit: "Shanghai International Circuit",
    circuitId: "shanghai",
    dates: { start: "2026-03-13", end: "2026-03-15" },
    sessions: {
      fp1: "2026-03-13T03:30:00Z", // 11:30 local
      sprintQualifying: "2026-03-13T07:30:00Z", // 15:30 local
      sprint: "2026-03-14T03:00:00Z", // 11:00 local
      qualifying: "2026-03-14T07:00:00Z", // 15:00 local
      race: "2026-03-15T07:00:00Z", // 15:00 local
    },
    isSprint: true,
    timezone: "Asia/Shanghai",
  },
  {
    round: 3,
    name: "Japanese Grand Prix",
    officialName: "FORMULA 1 ARAMCO JAPANESE GRAND PRIX 2026",
    country: "Japan",
    circuit: "Suzuka International Racing Course",
    circuitId: "suzuka",
    dates: { start: "2026-03-27", end: "2026-03-29" },
    sessions: {
      fp1: "2026-03-27T02:30:00Z", // 11:30 local
      fp2: "2026-03-27T06:00:00Z", // 15:00 local
      fp3: "2026-03-28T02:30:00Z", // 11:30 local
      qualifying: "2026-03-28T06:00:00Z", // 15:00 local
      race: "2026-03-29T05:00:00Z", // 14:00 local
    },
    isSprint: false,
    timezone: "Asia/Tokyo",
  },
  {
    round: 4,
    name: "Bahrain Grand Prix",
    officialName: "FORMULA 1 GULF AIR BAHRAIN GRAND PRIX 2026",
    country: "Bahrain",
    circuit: "Bahrain International Circuit",
    circuitId: "bahrain",
    dates: { start: "2026-04-10", end: "2026-04-12" },
    sessions: {
      fp1: "2026-04-10T11:30:00Z", // 14:30 local
      fp2: "2026-04-10T15:00:00Z", // 18:00 local
      fp3: "2026-04-11T12:30:00Z", // 15:30 local
      qualifying: "2026-04-11T16:00:00Z", // 19:00 local
      race: "2026-04-12T15:00:00Z", // 18:00 local
    },
    isSprint: false,
    timezone: "Asia/Bahrain",
  },
  {
    round: 5,
    name: "Saudi Arabian Grand Prix",
    officialName: "FORMULA 1 STC SAUDI ARABIAN GRAND PRIX 2026",
    country: "Saudi Arabia",
    circuit: "Jeddah Corniche Circuit",
    circuitId: "jeddah",
    dates: { start: "2026-04-17", end: "2026-04-19" },
    sessions: {
      fp1: "2026-04-17T13:30:00Z", // 16:30 local
      fp2: "2026-04-17T17:00:00Z", // 20:00 local
      fp3: "2026-04-18T13:30:00Z", // 16:30 local
      qualifying: "2026-04-18T17:00:00Z", // 20:00 local
      race: "2026-04-19T17:00:00Z", // 20:00 local
    },
    isSprint: false,
    timezone: "Asia/Riyadh",
  },
  {
    round: 6,
    name: "Miami Grand Prix",
    officialName: "FORMULA 1 CRYPTO.COM MIAMI GRAND PRIX 2026",
    country: "USA",
    circuit: "Miami International Autodrome",
    circuitId: "miami",
    dates: { start: "2026-05-01", end: "2026-05-03" },
    sessions: {
      fp1: "2026-05-01T16:30:00Z", // 12:30 local
      sprintQualifying: "2026-05-01T20:30:00Z", // 16:30 local
      sprint: "2026-05-02T16:00:00Z", // 12:00 local
      qualifying: "2026-05-02T20:00:00Z", // 16:00 local
      race: "2026-05-03T20:00:00Z", // 16:00 local
    },
    isSprint: true,
    timezone: "America/New_York",
  },
  {
    round: 7,
    name: "Canadian Grand Prix",
    officialName: "FORMULA 1 LENOVO CANADIAN GRAND PRIX 2026",
    country: "Canada",
    circuit: "Circuit Gilles Villeneuve",
    circuitId: "montreal",
    dates: { start: "2026-05-22", end: "2026-05-24" },
    sessions: {
      fp1: "2026-05-22T17:30:00Z", // 13:30 local
      sprintQualifying: "2026-05-22T21:30:00Z", // 17:30 local
      sprint: "2026-05-23T16:00:00Z", // 12:00 local
      qualifying: "2026-05-23T20:00:00Z", // 16:00 local
      race: "2026-05-24T18:00:00Z", // 14:00 local
    },
    isSprint: true,
    timezone: "America/Toronto",
  },
  {
    round: 8,
    name: "Monaco Grand Prix",
    officialName: "FORMULA 1 LOUIS VUITTON MONACO GRAND PRIX 2026",
    country: "Monaco",
    circuit: "Circuit de Monaco",
    circuitId: "monaco",
    dates: { start: "2026-06-05", end: "2026-06-07" },
    sessions: {
      fp1: "2026-06-05T11:30:00Z", // 13:30 local
      fp2: "2026-06-05T15:00:00Z", // 17:00 local
      fp3: "2026-06-06T10:30:00Z", // 12:30 local
      qualifying: "2026-06-06T14:00:00Z", // 16:00 local
      race: "2026-06-07T13:00:00Z", // 15:00 local
    },
    isSprint: false,
    timezone: "Europe/Monaco",
  },
  {
    round: 9,
    name: "Barcelona-Catalunya Grand Prix",
    officialName: "FORMULA 1 MSC CRUISES BARCELONA-CATALUNYA GRAND PRIX 2026",
    country: "Spain",
    circuit: "Circuit de Barcelona-Catalunya",
    circuitId: "barcelona",
    dates: { start: "2026-06-12", end: "2026-06-14" },
    sessions: {
      fp1: "2026-06-12T11:30:00Z", // 13:30 local
      fp2: "2026-06-12T15:00:00Z", // 17:00 local
      fp3: "2026-06-13T10:30:00Z", // 12:30 local
      qualifying: "2026-06-13T14:00:00Z", // 16:00 local
      race: "2026-06-14T13:00:00Z", // 15:00 local
    },
    isSprint: false,
    timezone: "Europe/Madrid",
  },
  {
    round: 10,
    name: "Austrian Grand Prix",
    officialName: "FORMULA 1 LENOVO AUSTRIAN GRAND PRIX 2026",
    country: "Austria",
    circuit: "Red Bull Ring",
    circuitId: "red_bull_ring",
    dates: { start: "2026-06-26", end: "2026-06-28" },
    sessions: {
      fp1: "2026-06-26T11:30:00Z", // 13:30 local
      fp2: "2026-06-26T15:00:00Z", // 17:00 local
      fp3: "2026-06-27T10:30:00Z", // 12:30 local
      qualifying: "2026-06-27T14:00:00Z", // 16:00 local
      race: "2026-06-28T13:00:00Z", // 15:00 local
    },
    isSprint: false,
    timezone: "Europe/Vienna",
  },
  {
    round: 11,
    name: "British Grand Prix",
    officialName: "FORMULA 1 PIRELLI BRITISH GRAND PRIX 2026",
    country: "Great Britain",
    circuit: "Silverstone Circuit",
    circuitId: "silverstone",
    dates: { start: "2026-07-03", end: "2026-07-05" },
    sessions: {
      fp1: "2026-07-03T11:30:00Z", // 12:30 local
      sprintQualifying: "2026-07-03T15:30:00Z", // 16:30 local
      sprint: "2026-07-04T11:00:00Z", // 12:00 local
      qualifying: "2026-07-04T15:00:00Z", // 16:00 local
      race: "2026-07-05T14:00:00Z", // 15:00 local
    },
    isSprint: true,
    timezone: "Europe/London",
  },
  {
    round: 12,
    name: "Belgian Grand Prix",
    officialName: "FORMULA 1 BELGIAN GRAND PRIX 2026",
    country: "Belgium",
    circuit: "Circuit de Spa-Francorchamps",
    circuitId: "spa",
    dates: { start: "2026-07-17", end: "2026-07-19" },
    sessions: {
      fp1: "2026-07-17T11:30:00Z", // 13:30 local
      fp2: "2026-07-17T15:00:00Z", // 17:00 local
      fp3: "2026-07-18T10:30:00Z", // 12:30 local
      qualifying: "2026-07-18T14:00:00Z", // 16:00 local
      race: "2026-07-19T13:00:00Z", // 15:00 local
    },
    isSprint: false,
    timezone: "Europe/Brussels",
  },
  {
    round: 13,
    name: "Hungarian Grand Prix",
    officialName: "FORMULA 1 AWS HUNGARIAN GRAND PRIX 2026",
    country: "Hungary",
    circuit: "Hungaroring",
    circuitId: "hungaroring",
    dates: { start: "2026-07-24", end: "2026-07-26" },
    sessions: {
      fp1: "2026-07-24T11:30:00Z", // 13:30 local
      fp2: "2026-07-24T15:00:00Z", // 17:00 local
      fp3: "2026-07-25T10:30:00Z", // 12:30 local
      qualifying: "2026-07-25T14:00:00Z", // 16:00 local
      race: "2026-07-26T13:00:00Z", // 15:00 local
    },
    isSprint: false,
    timezone: "Europe/Budapest",
  },
  {
    round: 14,
    name: "Dutch Grand Prix",
    officialName: "FORMULA 1 HEINEKEN DUTCH GRAND PRIX 2026",
    country: "Netherlands",
    circuit: "Circuit Zandvoort",
    circuitId: "zandvoort",
    dates: { start: "2026-08-21", end: "2026-08-23" },
    sessions: {
      fp1: "2026-08-21T10:30:00Z", // 12:30 local
      sprintQualifying: "2026-08-21T14:30:00Z", // 16:30 local
      sprint: "2026-08-22T10:00:00Z", // 12:00 local
      qualifying: "2026-08-22T14:00:00Z", // 16:00 local
      race: "2026-08-23T13:00:00Z", // 15:00 local
    },
    isSprint: true,
    timezone: "Europe/Amsterdam",
  },
  {
    round: 15,
    name: "Italian Grand Prix",
    officialName: "FORMULA 1 PIRELLI ITALIAN GRAND PRIX 2026",
    country: "Italy",
    circuit: "Autodromo Nazionale Monza",
    circuitId: "monza",
    dates: { start: "2026-09-04", end: "2026-09-06" },
    sessions: {
      fp1: "2026-09-04T11:30:00Z", // 13:30 local
      fp2: "2026-09-04T15:00:00Z", // 17:00 local
      fp3: "2026-09-05T10:30:00Z", // 12:30 local
      qualifying: "2026-09-05T14:00:00Z", // 16:00 local
      race: "2026-09-06T13:00:00Z", // 15:00 local
    },
    isSprint: false,
    timezone: "Europe/Rome",
  },
  {
    round: 16,
    name: "Spanish Grand Prix",
    officialName: "FORMULA 1 TAG HEUER SPANISH GRAND PRIX 2026",
    country: "Spain",
    circuit: "Madrid Street Circuit",
    circuitId: "madrid",
    dates: { start: "2026-09-11", end: "2026-09-13" },
    sessions: {
      fp1: "2026-09-11T11:30:00Z", // 13:30 local
      fp2: "2026-09-11T15:00:00Z", // 17:00 local
      fp3: "2026-09-12T10:30:00Z", // 12:30 local
      qualifying: "2026-09-12T14:00:00Z", // 16:00 local
      race: "2026-09-13T13:00:00Z", // 15:00 local
    },
    isSprint: false,
    timezone: "Europe/Madrid",
  },
  {
    round: 17,
    name: "Azerbaijan Grand Prix",
    officialName: "FORMULA 1 QATAR AIRWAYS AZERBAIJAN GRAND PRIX 2026",
    country: "Azerbaijan",
    circuit: "Baku City Circuit",
    circuitId: "baku",
    dates: { start: "2026-09-24", end: "2026-09-26" },
    sessions: {
      fp1: "2026-09-24T08:30:00Z", // 12:30 local
      fp2: "2026-09-24T12:00:00Z", // 16:00 local
      fp3: "2026-09-25T08:30:00Z", // 12:30 local
      qualifying: "2026-09-25T12:00:00Z", // 16:00 local
      race: "2026-09-26T11:00:00Z", // 15:00 local
    },
    isSprint: false,
    timezone: "Asia/Baku",
  },
  {
    round: 18,
    name: "Singapore Grand Prix",
    officialName: "FORMULA 1 SINGAPORE AIRLINES SINGAPORE GRAND PRIX 2026",
    country: "Singapore",
    circuit: "Marina Bay Street Circuit",
    circuitId: "singapore",
    dates: { start: "2026-10-09", end: "2026-10-11" },
    sessions: {
      fp1: "2026-10-09T09:30:00Z", // 17:30 local
      sprintQualifying: "2026-10-09T13:30:00Z", // 21:30 local
      sprint: "2026-10-10T09:00:00Z", // 17:00 local
      qualifying: "2026-10-10T13:00:00Z", // 21:00 local
      race: "2026-10-11T12:00:00Z", // 20:00 local
    },
    isSprint: true,
    timezone: "Asia/Singapore",
  },
  {
    round: 19,
    name: "United States Grand Prix",
    officialName: "FORMULA 1 MSC CRUISES UNITED STATES GRAND PRIX 2026",
    country: "USA",
    circuit: "Circuit of The Americas",
    circuitId: "cota",
    dates: { start: "2026-10-23", end: "2026-10-25" },
    sessions: {
      fp1: "2026-10-23T17:30:00Z", // 12:30 local
      fp2: "2026-10-23T21:00:00Z", // 16:00 local
      fp3: "2026-10-24T18:30:00Z", // 13:30 local
      qualifying: "2026-10-24T22:00:00Z", // 17:00 local
      race: "2026-10-25T19:00:00Z", // 14:00 local
    },
    isSprint: false,
    timezone: "America/Chicago",
  },
  {
    round: 20,
    name: "Mexican Grand Prix",
    officialName: "FORMULA 1 MEXICAN GRAND PRIX 2026",
    country: "Mexico",
    circuit: "Autódromo Hermanos Rodríguez",
    circuitId: "mexico",
    dates: { start: "2026-10-30", end: "2026-11-01" },
    sessions: {
      fp1: "2026-10-30T18:30:00Z", // 12:30 local
      fp2: "2026-10-30T22:00:00Z", // 16:00 local
      fp3: "2026-10-31T17:30:00Z", // 11:30 local
      qualifying: "2026-10-31T21:00:00Z", // 15:00 local
      race: "2026-11-01T20:00:00Z", // 14:00 local
    },
    isSprint: false,
    timezone: "America/Mexico_City",
  },
  {
    round: 21,
    name: "Brazilian Grand Prix",
    officialName: "FORMULA 1 MSC CRUISES BRAZILIAN GRAND PRIX 2026",
    country: "Brazil",
    circuit: "Autódromo José Carlos Pace",
    circuitId: "interlagos",
    dates: { start: "2026-11-06", end: "2026-11-08" },
    sessions: {
      fp1: "2026-11-06T14:30:00Z", // 11:30 local
      fp2: "2026-11-06T18:00:00Z", // 15:00 local
      fp3: "2026-11-07T13:30:00Z", // 10:30 local
      qualifying: "2026-11-07T17:00:00Z", // 14:00 local
      race: "2026-11-08T17:00:00Z", // 14:00 local
    },
    isSprint: false,
    timezone: "America/Sao_Paulo",
  },
  {
    round: 22,
    name: "Las Vegas Grand Prix",
    officialName: "FORMULA 1 HEINEKEN LAS VEGAS GRAND PRIX 2026",
    country: "USA",
    circuit: "Las Vegas Strip Circuit",
    circuitId: "las_vegas",
    dates: { start: "2026-11-20", end: "2026-11-22" },
    sessions: {
      fp1: "2026-11-21T02:30:00Z", // 18:30 local (Thu)
      fp2: "2026-11-21T06:00:00Z", // 22:00 local (Thu)
      fp3: "2026-11-22T02:30:00Z", // 18:30 local (Fri)
      qualifying: "2026-11-22T06:00:00Z", // 22:00 local (Fri)
      race: "2026-11-22T06:00:00Z", // 22:00 local (Sat)
    },
    isSprint: false,
    timezone: "America/Los_Angeles",
  },
  {
    round: 23,
    name: "Qatar Grand Prix",
    officialName: "FORMULA 1 QATAR AIRWAYS QATAR GRAND PRIX 2026",
    country: "Qatar",
    circuit: "Lusail International Circuit",
    circuitId: "lusail",
    dates: { start: "2026-11-27", end: "2026-11-29" },
    sessions: {
      fp1: "2026-11-27T13:30:00Z", // 16:30 local
      fp2: "2026-11-27T17:30:00Z", // 20:30 local
      fp3: "2026-11-28T14:30:00Z", // 17:30 local
      qualifying: "2026-11-28T18:00:00Z", // 21:00 local
      race: "2026-11-29T17:00:00Z", // 20:00 local
    },
    isSprint: false,
    timezone: "Asia/Qatar",
  },
  {
    round: 24,
    name: "Abu Dhabi Grand Prix",
    officialName: "FORMULA 1 ETIHAD AIRWAYS ABU DHABI GRAND PRIX 2026",
    country: "UAE",
    circuit: "Yas Marina Circuit",
    circuitId: "yas_marina",
    dates: { start: "2026-12-04", end: "2026-12-06" },
    sessions: {
      fp1: "2026-12-04T09:30:00Z", // 13:30 local
      fp2: "2026-12-04T13:00:00Z", // 17:00 local
      fp3: "2026-12-05T10:30:00Z", // 14:30 local
      qualifying: "2026-12-05T14:00:00Z", // 18:00 local
      race: "2026-12-06T13:00:00Z", // 17:00 local
    },
    isSprint: false,
    timezone: "Asia/Dubai",
  },
];

// Sprint weekends for 2026
export const SPRINT_ROUNDS_2026 = [2, 6, 7, 11, 14, 18]; // China, Miami, Canada, Britain, Netherlands, Singapore

// Helper function to convert UTC to local timezone
export function convertToTimezone(utcDateString: string, timezone: string): Date {
  const date = new Date(utcDateString);
  return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
}

// Helper to get next upcoming event
export function getNextEvent(): F1Event | PreSeasonEvent | null {
  const now = new Date();

  // Check pre-season events first
  for (const event of PRE_SEASON_2026) {
    const eventDate = new Date(event.dates.start);
    if (eventDate > now) {
      return event;
    }
  }

  // Then check race calendar
  for (const event of CALENDAR_2026) {
    const eventDate = new Date(event.dates.start);
    if (eventDate > now) {
      return event;
    }
  }

  return null;
}

// Helper to get event by round number
export function getEventByRound(round: number): F1Event | undefined {
  return CALENDAR_2026.find((event) => event.round === round);
}

// Get all events for a specific month
export function getEventsByMonth(year: number, month: number): F1Event[] {
  return CALENDAR_2026.filter((event) => {
    const eventDate = new Date(event.dates.start);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });
}

// Format date for display (Malaysia timezone - GMT+8)
export function formatDateMYT(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Get time until next session (in ms)
export function getTimeUntilSession(sessionDateString: string): number {
  const sessionDate = new Date(sessionDateString);
  const now = new Date();
  return sessionDate.getTime() - now.getTime();
}

// Format date for ICS format (YYYYMMDDTHHmmssZ)
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// Generate ICS file content for F1 events
export function generateICS(events: F1Event[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//F1 Dashboard//F1 Calendar 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:F1 2026 Calendar",
    "X-WR-TIMEZONE:UTC",
  ];

  for (const event of events) {
    // Add race event
    const raceStart = new Date(event.sessions.race);
    const raceEnd = new Date(raceStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:f1-2026-${event.round}-race@f1dashboard`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(raceStart)}`);
    lines.push(`DTEND:${formatICSDate(raceEnd)}`);
    lines.push(`SUMMARY:F1: ${event.name} - Race`);
    lines.push(`DESCRIPTION:${event.officialName}\\nCircuit: ${event.circuit}`);
    lines.push(`LOCATION:${event.circuit}, ${event.country}`);
    lines.push("END:VEVENT");

    // Add qualifying event
    const qualStart = new Date(event.sessions.qualifying);
    const qualEnd = new Date(qualStart.getTime() + 60 * 60 * 1000); // 1 hour

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:f1-2026-${event.round}-qualifying@f1dashboard`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(qualStart)}`);
    lines.push(`DTEND:${formatICSDate(qualEnd)}`);
    lines.push(`SUMMARY:F1: ${event.name} - Qualifying`);
    lines.push(`LOCATION:${event.circuit}, ${event.country}`);
    lines.push("END:VEVENT");

    // Add sprint if applicable
    if (event.isSprint && event.sessions.sprint) {
      const sprintStart = new Date(event.sessions.sprint);
      const sprintEnd = new Date(sprintStart.getTime() + 45 * 60 * 1000); // 45 minutes

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:f1-2026-${event.round}-sprint@f1dashboard`);
      lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
      lines.push(`DTSTART:${formatICSDate(sprintStart)}`);
      lines.push(`DTEND:${formatICSDate(sprintEnd)}`);
      lines.push(`SUMMARY:F1: ${event.name} - Sprint`);
      lines.push(`LOCATION:${event.circuit}, ${event.country}`);
      lines.push("END:VEVENT");
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// Generate Google Calendar URL for a single event
export function generateGoogleCalendarUrl(event: F1Event): string {
  const raceStart = new Date(event.sessions.race);
  const raceEnd = new Date(raceStart.getTime() + 2 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `F1: ${event.name} - Race`,
    dates: `${formatICSDate(raceStart)}/${formatICSDate(raceEnd)}`,
    details: `${event.officialName}\nCircuit: ${event.circuit}`,
    location: `${event.circuit}, ${event.country}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Format session time for display (24-hour format)
export function formatSessionTime(dateString: string, timezone: string): string {
  const date = new Date(dateString);

  // Get parts separately for better formatting
  const weekday = date.toLocaleString("en-US", { timeZone: timezone, weekday: "short" });
  const day = date.toLocaleString("en-US", { timeZone: timezone, day: "2-digit" });
  const month = date.toLocaleString("en-US", { timeZone: timezone, month: "short" });
  const time = date.toLocaleString("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false });

  return `${weekday} ${day} ${month}, ${time}`;
}

// Format time only (24-hour format)
export function formatTime24h(dateString: string, timezone: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}
