/**
 * Server-side driver info cache.
 *
 * Driver data barely changes during a session, yet every API route was
 * hitting OpenF1 `/drivers` + local JSON on every request.  This module
 * caches the merged driver map per session_key for 60 seconds, eliminating
 * ~5 redundant upstream calls per second during a live race.
 */

import { openf1Fetch } from "@/lib/openf1";
import { getDriversFull, getTeamsFull } from "@/data";

export interface CachedDriverInfo {
  driverNumber: number;
  code: string;
  teamName: string;
  teamColor: string;
}

interface CacheEntry {
  drivers: Map<number, CachedDriverInfo>;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds

const globalForCache = globalThis as unknown as {
  __driverCache: Map<string, CacheEntry>;
};
if (!globalForCache.__driverCache) {
  globalForCache.__driverCache = new Map();
}

export async function getCachedDrivers(
  sessionKey: string
): Promise<Map<number, CachedDriverInfo>> {
  const cache = globalForCache.__driverCache;
  const existing = cache.get(sessionKey);

  if (existing && Date.now() < existing.expiresAt) {
    return existing.drivers;
  }

  // Fetch from OpenF1 + local fallback in parallel
  const [driversRes, localDrivers, localTeams] = await Promise.all([
    openf1Fetch(`/drivers?session_key=${sessionKey}`),
    getDriversFull().catch(() => []),
    getTeamsFull().catch(() => []),
  ]);

  const driversData = await driversRes.json();
  const drivers = Array.isArray(driversData) ? driversData : [];
  const localDriverMap = new Map(localDrivers.map((d) => [d.number, d]));
  const localTeamMap = new Map(localTeams.map((t) => [t.id, t]));

  const driverMap = new Map<number, CachedDriverInfo>();

  for (const d of drivers) {
    if (d?.driver_number) {
      const local = localDriverMap.get(d.driver_number);
      const localTeam = local?.teamId
        ? localTeamMap.get(local.teamId)
        : undefined;
      driverMap.set(d.driver_number, {
        driverNumber: d.driver_number,
        code: d.name_acronym || local?.code || `D${d.driver_number}`,
        teamName: d.team_name || localTeam?.name || "Unknown",
        teamColor: d.team_colour
          ? `#${d.team_colour}`
          : localTeam?.color || "#808080",
      });
    }
  }

  // Add local drivers not in OpenF1 response
  for (const local of localDrivers) {
    if (!driverMap.has(local.number)) {
      const localTeam = local.teamId
        ? localTeamMap.get(local.teamId)
        : undefined;
      driverMap.set(local.number, {
        driverNumber: local.number,
        code: local.code,
        teamName: localTeam?.name || "Unknown",
        teamColor: localTeam?.color || "#808080",
      });
    }
  }

  cache.set(sessionKey, { drivers: driverMap, expiresAt: Date.now() + CACHE_TTL_MS });

  // Evict stale entries (keep cache bounded)
  for (const [key, entry] of cache) {
    if (Date.now() > entry.expiresAt + CACHE_TTL_MS) {
      cache.delete(key);
    }
  }

  return driverMap;
}
