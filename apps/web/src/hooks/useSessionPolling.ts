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
 * - Race/Sprint: Most aggressive polling (1-1.5s) for position changes
 * - Qualifying: Aggressive polling (1.5-2s) for lap times
 * - Practice/Testing: Active polling (2-3s) for real-time feel
 *
 * When not live: 30-60s intervals (still responsive for recently ended sessions)
 *
 * Note: OpenF1 free tier has rate limits. These intervals are tuned to stay
 * within limits while maximizing responsiveness. With WebSocket access,
 * data would be pushed instantly (~3s after live event).
 */
export function getPollingIntervals(
  sessionType: SessionType,
  isLive: boolean
): PollingConfig {
  if (!isLive) {
    return {
      timing: 30000,      // 30s - check for updates periodically
      position: 30000,    // 30s
      telemetry: 60000,   // 1 min
      raceControl: 30000, // 30s - catch any late messages
      weather: 300000,    // 5 min
    };
  }

  switch (sessionType) {
    case "race":
    case "sprint":
      return {
        timing: 1000,      // 1s - position changes are critical
        position: 1000,    // 1s - track map needs fast updates
        telemetry: 1500,   // 1.5s - speed/throttle/brake data
        raceControl: 1500, // 1.5s - flags/SC/VSC critical
        weather: 30000,    // 30s - weather changes matter
      };

    case "qualifying":
      return {
        timing: 1500,      // 1.5s - lap times critical
        position: 2000,    // 2s - track position less critical
        telemetry: 1500,   // 1.5s - for comparison
        raceControl: 1500, // 1.5s - track limits, flags
        weather: 30000,    // 30s
      };

    case "practice":
    case "testing":
      // More aggressive than before - Bahrain testing is first live test
      return {
        timing: 2000,      // 2s - want responsive feel
        position: 2500,    // 2.5s - track map updates
        telemetry: 2000,   // 2s - telemetry comparison
        raceControl: 3000, // 3s - flags, track limits
        weather: 60000,    // 1 min
      };

    default:
      return {
        timing: 2000,
        position: 2500,
        telemetry: 2000,
        raceControl: 3000,
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
