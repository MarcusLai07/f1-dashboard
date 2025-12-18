import { create } from "zustand";

export interface ReplayState {
  isReplayMode: boolean;
  isPlaying: boolean;
  playbackSpeed: number; // 1x, 2x, 4x, 8x
  currentLap: number;
  totalLaps: number;
  currentTime: number; // Progress in ms from race start
  totalTime: number;

  // All data for the session (loaded at once)
  allLapsData: Map<number, any[]>; // lap number -> timing data at that lap
  allPositionsData: Map<number, any[]>;
  allRaceControlData: any[];
  weatherData: any;
}

interface ReplayStore extends ReplayState {
  // Actions
  enableReplayMode: () => void;
  disableReplayMode: () => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setCurrentLap: (lap: number) => void;
  nextLap: () => void;
  prevLap: () => void;
  setTotalLaps: (total: number) => void;
  loadReplayData: (data: {
    lapsData: Map<number, any[]>;
    positionsData: Map<number, any[]>;
    raceControlData: any[];
    weather: any;
    totalLaps: number;
  }) => void;
  reset: () => void;
}

const initialState: ReplayState = {
  isReplayMode: false,
  isPlaying: false,
  playbackSpeed: 1,
  currentLap: 1,
  totalLaps: 0,
  currentTime: 0,
  totalTime: 0,
  allLapsData: new Map(),
  allPositionsData: new Map(),
  allRaceControlData: [],
  weatherData: null,
};

export const useReplayStore = create<ReplayStore>((set, get) => ({
  ...initialState,

  enableReplayMode: () => set({ isReplayMode: true }),

  disableReplayMode: () => set({ isReplayMode: false, isPlaying: false }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setCurrentLap: (lap) => {
    const { totalLaps } = get();
    const clampedLap = Math.max(1, Math.min(lap, totalLaps));
    set({ currentLap: clampedLap });
  },

  nextLap: () => {
    const { currentLap, totalLaps } = get();
    if (currentLap < totalLaps) {
      set({ currentLap: currentLap + 1 });
    } else {
      set({ isPlaying: false }); // Stop at end
    }
  },

  prevLap: () => {
    const { currentLap } = get();
    if (currentLap > 1) {
      set({ currentLap: currentLap - 1 });
    }
  },

  setTotalLaps: (total) => set({ totalLaps: total }),

  loadReplayData: ({ lapsData, positionsData, raceControlData, weather, totalLaps }) =>
    set({
      allLapsData: lapsData,
      allPositionsData: positionsData,
      allRaceControlData: raceControlData,
      weatherData: weather,
      totalLaps,
      currentLap: 1,
    }),

  reset: () => set(initialState),
}));
