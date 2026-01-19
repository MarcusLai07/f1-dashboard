// Unified Data Access Layer
// Single entry point for all F1 data - circuits, teams, drivers, calendar

import type { CircuitData, CircuitManifest } from "./circuits/_schema";
import type {
  Team,
  DriverReference,
  CalendarOverrides,
} from "./types";

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
// TEAMS (Manual JSON files)
// ============================================================================

export async function getTeams(year: number = 2026): Promise<Team[]> {
  try {
    const data = await import(`./reference/teams-${year}.json`);
    return data.default.teams as Team[];
  } catch {
    console.warn(`Teams not found for year: ${year}`);
    return [];
  }
}

export async function getTeam(
  teamId: string,
  year: number = 2026
): Promise<Team | null> {
  const teams = await getTeams(year);
  return teams.find((t) => t.id === teamId) || null;
}

export async function getTeamColor(
  teamId: string,
  year: number = 2026
): Promise<string> {
  const team = await getTeam(teamId, year);
  return team?.color || "#808080";
}

// ============================================================================
// DRIVERS (Manual JSON files)
// ============================================================================

export async function getDrivers(year: number = 2026): Promise<DriverReference[]> {
  try {
    const data = await import(`./reference/drivers-${year}.json`);
    return data.default.drivers as DriverReference[];
  } catch {
    console.warn(`Drivers not found for year: ${year}`);
    return [];
  }
}

export async function getDriver(
  code: string,
  year: number = 2026
): Promise<DriverReference | null> {
  const drivers = await getDrivers(year);
  return drivers.find((d) => d.code === code) || null;
}

export async function getDriverByNumber(
  number: number,
  year: number = 2026
): Promise<DriverReference | null> {
  const drivers = await getDrivers(year);
  return drivers.find((d) => d.number === number) || null;
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
// COMPATIBILITY: Helper for getting team color by driver code
// ============================================================================

export async function getTeamColorByDriverCode(
  driverCode: string,
  year: number = 2026
): Promise<string> {
  const driver = await getDriver(driverCode, year);
  if (!driver) return "#808080";
  return getTeamColor(driver.teamId, year);
}

// Re-export types
export type { CircuitData, CircuitManifest } from "./circuits/_schema";
export type {
  Team,
  DriverReference,
  CalendarEvent,
  CalendarOverride,
  CalendarOverrides,
  SessionSchedule,
  DataSourceInfo,
} from "./types";
