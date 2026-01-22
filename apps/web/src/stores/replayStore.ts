import { create } from "zustand";
import type { DriverTiming, RaceControlMessage, Session, Weather, TrackStatus } from "@/types/f1";
import { useLiveStore } from "./liveStore";

export type ReplayMode = "lap" | "time";

export interface LapSnapshot {
  lap: number;
  timestamp: string;
  timing: DriverTiming[];
  raceControl: RaceControlMessage[];
  weather?: Weather | null;
  trackStatus?: TrackStatus;
  qualifyingRound?: "Q1" | "Q2" | "Q3" | "SQ1" | "SQ2" | "SQ3" | null;
}

interface ReplayState {
  // Replay mode state
  isReplayMode: boolean;
  isPlaying: boolean;
  playbackSpeed: number; // 1 = real-time simulation, 2 = 2x, etc.
  replayMode: ReplayMode; // "lap" for lap-by-lap, "time" for time-based
  intervalSeconds: number; // Interval between snapshots in time mode

  // Session data
  sessionKey: number | null;
  totalLaps: number;
  totalSnapshots: number;
  currentLap: number; // Current snapshot index
  lapSnapshots: LapSnapshot[];

  // Session info for time-based display
  sessionType: string | null; // "Practice 1", "Qualifying", "Sprint Qualifying", "Race", etc.
  sessionStartTime: string | null;
  sessionEndTime: string | null;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  setReplayMode: (enabled: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setCurrentLap: (lap: number) => void;
  nextLap: () => void;
  prevLap: () => void;
  loadSession: (sessionKey: number, mode?: ReplayMode, intervalSeconds?: number) => Promise<void>;
  reset: () => void;
}

const initialState = {
  isReplayMode: false,
  isPlaying: false,
  playbackSpeed: 1,
  replayMode: "time" as ReplayMode, // Default to time-based for realistic simulation
  intervalSeconds: 2, // 2s matches live qualifying polling intervals
  sessionKey: null,
  totalLaps: 0,
  totalSnapshots: 0,
  currentLap: 0,
  lapSnapshots: [] as LapSnapshot[],
  sessionType: null as string | null,
  sessionStartTime: null as string | null,
  sessionEndTime: null as string | null,
  isLoading: false,
  error: null as string | null,
};

export const useReplayStore = create<ReplayState>((set, get) => ({
  ...initialState,

  setReplayMode: (enabled) => set({ isReplayMode: enabled }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setCurrentLap: (lap) => {
    const { totalSnapshots } = get();
    const clampedLap = Math.max(0, Math.min(lap, totalSnapshots - 1));
    set({ currentLap: clampedLap });
  },

  nextLap: () => {
    const { currentLap, totalSnapshots } = get();
    if (currentLap < totalSnapshots - 1) {
      set({ currentLap: currentLap + 1 });
    } else {
      set({ isPlaying: false }); // Stop at end
    }
  },

  prevLap: () => {
    const { currentLap } = get();
    if (currentLap > 0) {
      set({ currentLap: currentLap - 1 });
    }
  },

  loadSession: async (sessionKey: number, mode: ReplayMode = "time", intervalSeconds: number = 5) => {
    set({ isLoading: true, error: null, sessionKey, replayMode: mode, intervalSeconds });

    try {
      const url = `/api/live/replay?session_key=${sessionKey}&mode=${mode}&interval=${intervalSeconds}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to load session" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Set session info in liveStore for qualifying detection
      if (data.session) {
        useLiveStore.getState().setSession(data.session as Session);
      }

      // Get session times from snapshots for time-based display
      const firstTimestamp = data.snapshots[0]?.timestamp;
      const lastTimestamp = data.snapshots[data.snapshots.length - 1]?.timestamp;

      set({
        lapSnapshots: data.snapshots,
        totalLaps: data.totalLaps || data.snapshots.length,
        totalSnapshots: data.totalSnapshots || data.snapshots.length,
        currentLap: 0,
        sessionType: data.session?.sessionType || data.session?.sessionName || null,
        sessionStartTime: data.session?.startTime || firstTimestamp || null,
        sessionEndTime: data.session?.endTime || lastTimestamp || null,
        isLoading: false,
        isReplayMode: true,
        replayMode: data.mode || mode,
        intervalSeconds: data.intervalSeconds || intervalSeconds,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load session",
        isLoading: false,
      });
    }
  },

  reset: () => set(initialState),
}));

// Selector to get current lap snapshot
export function getCurrentSnapshot(state: ReplayState): LapSnapshot | null {
  if (state.lapSnapshots.length === 0) return null;
  return state.lapSnapshots[state.currentLap] || null;
}
