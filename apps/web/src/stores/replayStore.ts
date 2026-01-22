import { create } from "zustand";
import type { DriverTiming, RaceControlMessage, Session, Weather, TrackStatus } from "@/types/f1";
import { useLiveStore } from "./liveStore";

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

  // Session data
  sessionKey: number | null;
  totalLaps: number;
  currentLap: number;
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
  loadSession: (sessionKey: number) => Promise<void>;
  reset: () => void;
}

const initialState = {
  isReplayMode: false,
  isPlaying: false,
  playbackSpeed: 1,
  sessionKey: null,
  totalLaps: 0,
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
    const { totalLaps } = get();
    const clampedLap = Math.max(0, Math.min(lap, totalLaps - 1));
    set({ currentLap: clampedLap });
  },

  nextLap: () => {
    const { currentLap, totalLaps } = get();
    if (currentLap < totalLaps - 1) {
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

  loadSession: async (sessionKey: number) => {
    set({ isLoading: true, error: null, sessionKey });

    try {
      const response = await fetch(`/api/live/replay?session_key=${sessionKey}`);

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
        totalLaps: data.snapshots.length,
        currentLap: 0,
        sessionType: data.session?.sessionType || data.session?.sessionName || null,
        sessionStartTime: data.session?.startTime || firstTimestamp || null,
        sessionEndTime: data.session?.endTime || lastTimestamp || null,
        isLoading: false,
        isReplayMode: true,
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
