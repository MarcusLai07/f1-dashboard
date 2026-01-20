// Unified Data Access Layer
// Single entry point for all F1 data - circuits, teams, drivers, calendar

import type { CircuitData, CircuitManifest } from "./circuits/_schema";
import type { MotorsportEvent, MotorsportSession } from "./motorsport-calendar/_schema";

// Legacy types for backward compatibility with Season panel
export interface F1Event {
  round: number;
  name: string;
  officialName: string;
  country: string;
  circuit: string;
  circuitId: string;
  dates: { start: string; end: string };
  sessions: {
    fp1?: string;
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
  dates: { start: string; end: string };
  sessions?: { morning: string; afternoon: string };
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
import type { TeamFull, TeamsData } from "./teams/_schema";
import type { DriverFull, DriversData } from "./drivers/_schema";
import type { CalendarOverrides } from "./types";

// ============================================================================
// CIRCUITS (Manual JSON files)
// ============================================================================

const circuitCache = new Map<string, CircuitData>();

export async function getCircuit(id: string): Promise<CircuitData | null> {
  // Check cache first
  if (circuitCache.has(id)) {
    return circuitCache.get(id)!;
  }

  try {
    const data = await import(`./circuits/${id}.json`);
    const circuit = data.default as CircuitData;
    circuitCache.set(id, circuit);
    return circuit;
  } catch {
    console.warn(`Circuit not found: ${id}`);
    return null;
  }
}

export async function getAllCircuitIds(): Promise<string[]> {
  const manifest = await import("./circuits/_manifest.json");
  return (manifest.default as CircuitManifest).ids;
}

export async function getAllCircuits(): Promise<CircuitData[]> {
  const ids = await getAllCircuitIds();
  const circuits = await Promise.all(ids.map((id) => getCircuit(id)));
  return circuits.filter((c): c is CircuitData => c !== null);
}

export function clearCircuitCache(): void {
  circuitCache.clear();
}

// ============================================================================
// CALENDAR (Reads from unified motorsport-calendar, transforms for Season panel)
// ============================================================================

const calendarCache = new Map<number, CalendarData>();

// Helper to find session time by type
function findSessionTime(sessions: MotorsportSession[], type: string): string | undefined {
  const session = sessions.find((s) => s.type === type || s.shortName === type);
  return session?.dateTime;
}

// Transform unified MotorsportEvent to legacy F1Event format
function transformToF1Event(event: MotorsportEvent): F1Event {
  const sessions = event.sessions;

  // Find FP sessions by shortName
  const fp1 = sessions.find((s) => s.shortName === "FP1")?.dateTime;
  const fp2 = sessions.find((s) => s.shortName === "FP2")?.dateTime;
  const fp3 = sessions.find((s) => s.shortName === "FP3")?.dateTime;
  const sprintQualifying = sessions.find((s) => s.type === "sprint_qualifying")?.dateTime;
  const sprint = sessions.find((s) => s.type === "sprint")?.dateTime;
  const qualifying = sessions.find((s) => s.type === "qualifying")?.dateTime || "";
  const race = sessions.find((s) => s.type === "race")?.dateTime || "";

  return {
    round: event.round || 0,
    name: event.name,
    officialName: event.officialName || event.name,
    country: event.country,
    circuit: event.circuit,
    circuitId: event.circuitId || event.circuit.toLowerCase().replace(/\s+/g, "-"),
    dates: event.dates,
    sessions: {
      fp1,
      fp2,
      fp3,
      sprintQualifying,
      sprint,
      qualifying,
      race,
    },
    isSprint: event.isSprint || false,
    timezone: event.timezone || "UTC",
  };
}

// Transform unified MotorsportEvent to legacy PreSeasonEvent format
function transformToPreSeasonEvent(event: MotorsportEvent): PreSeasonEvent {
  const sessions = event.sessions;
  const morningSession = sessions.find((s) => s.shortName?.includes("AM") || s.name.includes("Morning"));
  const afternoonSession = sessions.find((s) => s.shortName?.includes("PM") || s.name.includes("Afternoon"));

  return {
    name: event.name,
    location: event.location || event.country,
    circuit: event.circuit,
    dates: event.dates,
    sessions: morningSession && afternoonSession ? {
      morning: morningSession.dateTime,
      afternoon: afternoonSession.dateTime,
    } : undefined,
    type: event.eventType === "launch" ? "launch" :
          event.sessions.some((s) => s.type === "shakedown") ? "shakedown" : "testing",
    timezone: event.timezone,
  };
}

export async function getCalendar(year: number = 2026): Promise<CalendarData | null> {
  if (calendarCache.has(year)) {
    return calendarCache.get(year)!;
  }

  try {
    // Load from unified motorsport-calendar
    const data = await import(`./motorsport-calendar/${year}/formula/f1.json`);
    const events = (data.default as { events: MotorsportEvent[] }).events;

    // Separate events by type
    const raceEvents = events.filter((e) => e.eventType === "race");
    const testingEvents = events.filter((e) => e.eventType === "testing");
    const launchEvents = events.filter((e) => e.eventType === "launch");

    // Transform to legacy format
    const races = raceEvents.map(transformToF1Event);
    const preseason = testingEvents.map(transformToPreSeasonEvent);
    const launches = launchEvents.map(transformToPreSeasonEvent);
    const sprintRounds = raceEvents.filter((e) => e.isSprint).map((e) => e.round || 0);

    const calendar: CalendarData = {
      year,
      races,
      preseason,
      launches,
      sprintRounds,
    };

    calendarCache.set(year, calendar);
    return calendar;
  } catch (error) {
    console.warn(`Calendar not found for year: ${year}`, error);
    return null;
  }
}

export async function getRaces(year: number = 2026): Promise<F1Event[]> {
  const calendar = await getCalendar(year);
  return calendar?.races || [];
}

export async function getPreseason(year: number = 2026): Promise<PreSeasonEvent[]> {
  const calendar = await getCalendar(year);
  return calendar?.preseason || [];
}

export async function getLaunches(year: number = 2026): Promise<PreSeasonEvent[]> {
  const calendar = await getCalendar(year);
  return calendar?.launches || [];
}

export async function getSprintRounds(year: number = 2026): Promise<number[]> {
  const calendar = await getCalendar(year);
  return calendar?.sprintRounds || [];
}

export async function getEventByRound(round: number, year: number = 2026): Promise<F1Event | null> {
  const races = await getRaces(year);
  return races.find((r) => r.round === round) || null;
}

export async function getNextEvent(year: number = 2026): Promise<F1Event | PreSeasonEvent | null> {
  const now = new Date();
  const calendar = await getCalendar(year);
  if (!calendar) return null;

  // Combine all events with their dates and sort
  const allEvents: Array<{ event: F1Event | PreSeasonEvent; date: Date }> = [
    ...calendar.launches.map((e) => ({ event: e, date: new Date(e.dates.start) })),
    ...calendar.preseason.map((e) => ({ event: e, date: new Date(e.dates.start) })),
    ...calendar.races.map((e) => ({ event: e, date: new Date(e.dates.start) })),
  ];

  // Sort by date
  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Find next upcoming event
  for (const { event, date } of allEvents) {
    if (date > now) return event;
  }

  return null;
}

export async function getEventsByMonth(year: number, month: number): Promise<F1Event[]> {
  const races = await getRaces(year);
  return races.filter((event) => {
    const eventDate = new Date(event.dates.start);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });
}

export function clearCalendarCache(): void {
  calendarCache.clear();
}

// ============================================================================
// TEAMS FULL (Unified JSON data with colors, engines, etc.)
// ============================================================================

const teamFullCache = new Map<number, TeamFull[]>();

export async function getTeamsFull(year: number = 2026): Promise<TeamFull[]> {
  if (teamFullCache.has(year)) {
    return teamFullCache.get(year)!;
  }

  try {
    const data = await import(`./teams/${year}.json`);
    const teams = (data.default as TeamsData).teams;
    teamFullCache.set(year, teams);
    return teams;
  } catch {
    console.warn(`Teams not found for year: ${year}`);
    return [];
  }
}

export async function getTeamByName(name: string, year: number = 2026): Promise<TeamFull | null> {
  const teams = await getTeamsFull(year);
  return teams.find((t) =>
    t.name.toLowerCase() === name.toLowerCase() ||
    t.shortName.toLowerCase() === name.toLowerCase()
  ) || null;
}

export async function getTeamById(id: string, year: number = 2026): Promise<TeamFull | null> {
  const teams = await getTeamsFull(year);
  return teams.find((t) => t.id === id) || null;
}

export async function getTeamColors(year: number = 2026): Promise<Record<string, string>> {
  const teams = await getTeamsFull(year);
  const colors: Record<string, string> = {};
  for (const team of teams) {
    colors[team.name] = team.color;
  }
  return colors;
}

export function clearTeamFullCache(): void {
  teamFullCache.clear();
}

// ============================================================================
// DRIVERS FULL (Unified JSON data with images, flags, etc.)
// ============================================================================

const driverFullCache = new Map<number, DriverFull[]>();

export async function getDriversFull(year: number = 2026): Promise<DriverFull[]> {
  if (driverFullCache.has(year)) {
    return driverFullCache.get(year)!;
  }

  try {
    const data = await import(`./drivers/${year}.json`);
    const drivers = (data.default as DriversData).drivers;
    driverFullCache.set(year, drivers);
    return drivers;
  } catch {
    console.warn(`Drivers not found for year: ${year}`);
    return [];
  }
}

export async function getDriverByCode(code: string, year: number = 2026): Promise<DriverFull | null> {
  const drivers = await getDriversFull(year);
  return drivers.find((d) => d.code === code) || null;
}

export async function getDriverByNumberFull(number: number, year: number = 2026): Promise<DriverFull | null> {
  const drivers = await getDriversFull(year);
  return drivers.find((d) => d.number === number) || null;
}

export async function getDriverTeams(year: number = 2026): Promise<Record<string, string>> {
  const drivers = await getDriversFull(year);
  const mapping: Record<string, string> = {};
  for (const driver of drivers) {
    // Get team name from teams data
    const team = await getTeamById(driver.teamId, year);
    mapping[driver.code] = team?.name || driver.teamId;
  }
  return mapping;
}

export async function getDriverNumbers(year: number = 2026): Promise<Record<string, number>> {
  const drivers = await getDriversFull(year);
  const mapping: Record<string, number> = {};
  for (const driver of drivers) {
    mapping[driver.code] = driver.number;
  }
  return mapping;
}

export function clearDriverFullCache(): void {
  driverFullCache.clear();
}

// ============================================================================
// CALENDAR OVERRIDES
// ============================================================================

export async function getCalendarOverrides(
  year: number = 2026
): Promise<Record<string, unknown>> {
  try {
    const data = await import("./overrides/calendar-overrides.json");
    // Use unknown first to handle the _comment field in the JSON
    const overrides = data.default as unknown as Record<string, Record<string, unknown>>;
    return overrides[year.toString()] || {};
  } catch {
    return {};
  }
}

// ============================================================================
// HELPER: Merge data with overrides
// ============================================================================

export function mergeWithOverrides<T extends Record<string, unknown>>(
  baseData: T,
  overrides: Partial<T>
): T {
  if (!overrides || Object.keys(overrides).length === 0) {
    return baseData;
  }

  const merged = { ...baseData };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === undefined) continue;

    if (typeof value === "object" && !Array.isArray(value)) {
      merged[key as keyof T] = mergeWithOverrides(
        (merged[key as keyof T] as Record<string, unknown>) || {},
        value as Record<string, unknown>
      ) as T[keyof T];
    } else {
      merged[key as keyof T] = value as T[keyof T];
    }
  }

  return merged;
}

// ============================================================================
// CIRCUIT LOOKUP BY NAME (fuzzy matching for backward compatibility)
// ============================================================================

// Name-to-ID mapping for fuzzy circuit lookup
// Uses circuit-based IDs (e.g., "albert-park", "silverstone", "monza")
const circuitNameToId: Record<string, string> = {
  // Albert Park (Australia)
  "albert park": "albert-park",
  "albert park circuit": "albert-park",
  "albert park grand prix circuit": "albert-park",
  "melbourne": "albert-park",
  "australia": "albert-park",
  // Bahrain
  "bahrain": "bahrain",
  "bahrain international circuit": "bahrain",
  "sakhir": "bahrain",
  // Baku (Azerbaijan)
  "baku": "baku",
  "baku city circuit": "baku",
  "azerbaijan": "baku",
  // Barcelona (Spain)
  "barcelona": "barcelona",
  "circuit de barcelona-catalunya": "barcelona",
  "spain": "barcelona",
  "catalunya": "barcelona",
  // COTA (USA)
  "cota": "cota",
  "circuit of the americas": "cota",
  "austin": "cota",
  "texas": "cota",
  "usa": "cota",
  // Hungaroring (Hungary)
  "hungaroring": "hungaroring",
  "hungary": "hungaroring",
  "budapest": "hungaroring",
  // Imola
  "imola": "imola",
  "autodromo enzo e dino ferrari": "imola",
  "emilia romagna": "imola",
  // Interlagos (Brazil)
  "interlagos": "interlagos",
  "autódromo josé carlos pace": "interlagos",
  "autodromo jose carlos pace": "interlagos",
  "brazil": "interlagos",
  "sao paulo": "interlagos",
  "são paulo": "interlagos",
  // Jeddah (Saudi Arabia)
  "jeddah": "jeddah",
  "jeddah corniche circuit": "jeddah",
  "saudi arabia": "jeddah",
  "saudi": "jeddah",
  // Las Vegas
  "las vegas": "las-vegas",
  "las vegas strip circuit": "las-vegas",
  "vegas": "las-vegas",
  // Lusail (Qatar)
  "lusail": "lusail",
  "lusail international circuit": "lusail",
  "qatar": "lusail",
  // Marina Bay (Singapore)
  "marina bay": "marina-bay",
  "marina bay street circuit": "marina-bay",
  "singapore": "marina-bay",
  // Mexico City
  "mexico city": "mexico-city",
  "autódromo hermanos rodríguez": "mexico-city",
  "autodromo hermanos rodriguez": "mexico-city",
  "mexico": "mexico-city",
  // Miami
  "miami": "miami",
  "miami international autodrome": "miami",
  // Monaco
  "monaco": "monaco",
  "circuit de monaco": "monaco",
  "monte carlo": "monaco",
  // Montreal (Canada)
  "montreal": "montreal",
  "circuit gilles villeneuve": "montreal",
  "canada": "montreal",
  // Monza (Italy)
  "monza": "monza",
  "autodromo nazionale monza": "monza",
  "italy": "monza",
  // Red Bull Ring (Austria)
  "red bull ring": "red-bull-ring",
  "spielberg": "red-bull-ring",
  "austria": "red-bull-ring",
  // Shanghai (China)
  "shanghai": "shanghai",
  "shanghai international circuit": "shanghai",
  "china": "shanghai",
  // Silverstone (Great Britain)
  "silverstone": "silverstone",
  "silverstone circuit": "silverstone",
  "great britain": "silverstone",
  "britain": "silverstone",
  "uk": "silverstone",
  // Spa (Belgium)
  "spa": "spa",
  "circuit de spa-francorchamps": "spa",
  "spa-francorchamps": "spa",
  "belgium": "spa",
  // Suzuka (Japan)
  "suzuka": "suzuka",
  "suzuka international racing course": "suzuka",
  "japan": "suzuka",
  // Yas Marina (Abu Dhabi)
  "yas marina": "yas-marina",
  "yas marina circuit": "yas-marina",
  "abu dhabi": "yas-marina",
  "uae": "yas-marina",
  // Zandvoort (Netherlands)
  "zandvoort": "zandvoort",
  "circuit zandvoort": "zandvoort",
  "netherlands": "zandvoort",
  "dutch": "zandvoort",
};

/**
 * Get circuit by name using fuzzy matching (backward compatible)
 * Supports full names, short names, and partial matches
 */
export async function getCircuitByName(name: string): Promise<CircuitData | null> {
  const searchName = name.toLowerCase().trim();

  // Try direct mapping first
  const mappedId = circuitNameToId[searchName];
  if (mappedId) {
    return getCircuit(mappedId);
  }

  // Try partial match in mapping
  for (const [key, id] of Object.entries(circuitNameToId)) {
    if (key.includes(searchName) || searchName.includes(key)) {
      return getCircuit(id);
    }
  }

  // Try loading all circuits and matching by name/shortName
  const allCircuits = await getAllCircuits();
  for (const circuit of allCircuits) {
    if (
      circuit.name.toLowerCase().includes(searchName) ||
      circuit.shortName.toLowerCase().includes(searchName) ||
      searchName.includes(circuit.name.toLowerCase()) ||
      searchName.includes(circuit.shortName.toLowerCase())
    ) {
      return circuit;
    }
  }

  return null;
}

// ============================================================================
// TURN TYPE COLORS (helper for UI)
// ============================================================================

export type TurnType = "hairpin" | "chicane" | "fast" | "medium" | "slow";

/**
 * Get color for turn type (for UI display)
 */
export function getTurnTypeColor(type?: TurnType | string): string {
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
      return "#3b82f6"; // blue
    default:
      return "#6b7280"; // gray
  }
}

// ============================================================================
// CIRCUIT HELPERS
// ============================================================================

export async function getCircuitCorners(id: string) {
  const circuit = await getCircuit(id);
  return circuit?.corners || [];
}

export async function getCircuitDrsZones(id: string) {
  const circuit = await getCircuit(id);
  return circuit?.drsZones || [];
}

export async function getCircuitSectors(id: string) {
  const circuit = await getCircuit(id);
  return circuit?.sectors || [];
}

export async function getCircuitSvgPath(id: string) {
  const circuit = await getCircuit(id);
  return circuit?.svg.path || null;
}

// Re-export types
export type {
  CircuitData,
  CircuitManifest,
  Turn,
  DRSZone,
  Sector,
  LapRecord,
  CircuitSvg,
} from "./circuits/_schema";
// F1Event, PreSeasonEvent, CalendarData are defined inline above for backward compatibility
export type {
  TeamFull,
  TeamsData,
} from "./teams/_schema";
export type {
  DriverFull,
  DriversData,
} from "./drivers/_schema";
export type {
  Team,
  DriverReference,
  CalendarEvent,
  CalendarOverride,
  CalendarOverrides,
  SessionSchedule,
  DataSourceInfo,
} from "./types";

// ============================================================================
// MOTORSPORT CALENDAR (Unified multi-series calendar)
// ============================================================================

export {
  getSeriesMetadata,
  getSeriesInfo,
  getSeriesByCategory,
  getSeriesEvents,
  getAllMotorsportEvents,
  getEventsByCategory,
  getEventsByDate,
  getEventsInRange,
  getNextMotorsportEvent,
  clearMotorsportCalendarCache,
} from "./motorsport-calendar";

export type {
  SeriesInfo,
  MotorsportEvent,
  MotorsportSession,
  SeriesCalendar,
  MotorsportCategory,
  SessionType,
  EventType,
} from "./motorsport-calendar";
