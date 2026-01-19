// Session-Aware Polling Hook
// Returns appropriate polling intervals based on session type and live status

import { useMemo } from "react";

export type SessionType =
  | "practice"
  | "qualifying"
  | "sprint"
  | "race"
  | "testing";

export interface PollingConfig {
  timing: number;
  position: number;
  telemetry: number;
  raceControl: number;
  weather: number;
}

/**
 * Returns appropriate polling intervals based on session type and live status.
 *
 * During live sessions:
 * - Race/Sprint: Aggressive polling (1.5-2s) for position changes
 * - Qualifying: Medium polling (2-3s) for lap times
 * - Practice/Testing: Relaxed polling (4-5s) to save resources
 *
 * When not live: 60s intervals
 */
export function getPollingIntervals(
  sessionType: SessionType,
  isLive: boolean
): PollingConfig {
  if (!isLive) {
    return {
      timing: 60000,
      position: 60000,
      telemetry: 60000,
      raceControl: 60000,
      weather: 300000, // 5 min
    };
  }

  switch (sessionType) {
    case "race":
    case "sprint":
      return {
        timing: 1500,      // 1.5s - position changes critical
        position: 1500,    // 1.5s - track map updates
        telemetry: 1500,   // 1.5s - speed/throttle data
        raceControl: 2000, // 2s - flags/messages
        weather: 30000,    // 30s
      };

    case "qualifying":
      return {
        timing: 2000,      // 2s - lap times matter
        position: 2500,    // 2.5s - less critical
        telemetry: 2000,   // 2s - for comparison
        raceControl: 2000, // 2s - track limits etc
        weather: 30000,    // 30s
      };

    case "practice":
    case "testing":
      return {
        timing: 4000,      // 4s - less urgent
        position: 5000,    // 5s - save resources
        telemetry: 3000,   // 3s - still useful for analysis
        raceControl: 5000, // 5s
        weather: 60000,    // 1 min
      };

    default:
      return {
        timing: 3000,
        position: 4000,
        telemetry: 2000,
        raceControl: 5000,
        weather: 60000,
      };
  }
}

/**
 * Hook to get polling intervals for current session
 */
export function usePollingIntervals(
  sessionType: SessionType | undefined,
  isLive: boolean
): PollingConfig {
  return useMemo(
    () => getPollingIntervals(sessionType || "practice", isLive),
    [sessionType, isLive]
  );
}

/**
 * Derive session type from session name
 */
export function deriveSessionType(sessionName: string): SessionType {
  const name = sessionName.toLowerCase();

  if (name.includes("race")) return "race";
  if (name.includes("sprint") && !name.includes("qualifying")) return "sprint";
  if (name.includes("qualifying") || name.includes("quali")) return "qualifying";
  if (name.includes("test")) return "testing";
  return "practice";
}
