import { create } from "zustand";
import type {
  LiveState,
  Session,
  DriverTiming,
  CarPosition,
  CarLocation,
  LocationBounds,
  DriverTelemetry,
  RaceControlMessage,
  Weather,
  TrackStatus,
} from "@/types/f1";

interface LiveStore extends LiveState {
  // Actions
  setConnected: (connected: boolean) => void;
  setSession: (session: Session | null) => void;
  updateTiming: (timing: DriverTiming[]) => void;
  updatePositions: (positions: CarPosition[]) => void;
  updateLocations: (locations: CarLocation[], bounds: LocationBounds | null) => void;
  updateTelemetry: (driverCode: string, telemetry: DriverTelemetry) => void;
  addRaceControlMessage: (message: RaceControlMessage) => void;
  updateWeather: (weather: Weather) => void;
  updateTrackStatus: (status: TrackStatus) => void;
  selectDriver: (code: string) => void;
  deselectDriver: (code: string) => void;
  toggleDriverSelection: (code: string) => void;
  clearSelectedDrivers: () => void;
  reset: () => void;
}

const initialState: LiveState = {
  isConnected: false,
  currentSession: null,
  timing: [],
  positions: [],
  locations: [],
  locationBounds: null,
  telemetry: {},
  raceControl: [],
  weather: null,
  trackStatus: { status: "AllClear" },
  selectedDrivers: [],
  lastUpdate: null,
};

export const useLiveStore = create<LiveStore>((set) => ({
  ...initialState,

  setConnected: (connected) =>
    set({ isConnected: connected }),

  setSession: (session) =>
    set({ currentSession: session }),

  updateTiming: (timing) =>
    set({ timing, lastUpdate: new Date().toISOString() }),

  updatePositions: (positions) =>
    set({ positions, lastUpdate: new Date().toISOString() }),

  updateLocations: (locations, bounds) =>
    set({ locations, locationBounds: bounds, lastUpdate: new Date().toISOString() }),

  updateTelemetry: (driverCode, telemetry) =>
    set((state) => ({
      telemetry: { ...state.telemetry, [driverCode]: telemetry },
      lastUpdate: new Date().toISOString(),
    })),

  addRaceControlMessage: (message) =>
    set((state) => ({
      raceControl: [message, ...state.raceControl].slice(0, 50), // Keep last 50
      lastUpdate: new Date().toISOString(),
    })),

  updateWeather: (weather) =>
    set({ weather, lastUpdate: new Date().toISOString() }),

  updateTrackStatus: (status) =>
    set({ trackStatus: status, lastUpdate: new Date().toISOString() }),

  selectDriver: (code) =>
    set((state) => ({
      selectedDrivers: state.selectedDrivers.includes(code)
        ? state.selectedDrivers
        : [...state.selectedDrivers, code].slice(0, 2), // Max 2 drivers
    })),

  deselectDriver: (code) =>
    set((state) => ({
      selectedDrivers: state.selectedDrivers.filter((c) => c !== code),
    })),

  toggleDriverSelection: (code) =>
    set((state) => {
      if (state.selectedDrivers.includes(code)) {
        return { selectedDrivers: state.selectedDrivers.filter((c) => c !== code) };
      }
      // Max 2 drivers - replace oldest if at limit
      if (state.selectedDrivers.length >= 2) {
        return { selectedDrivers: [state.selectedDrivers[1], code] };
      }
      return { selectedDrivers: [...state.selectedDrivers, code] };
    }),

  clearSelectedDrivers: () =>
    set({ selectedDrivers: [] }),

  reset: () =>
    set(initialState),
}));
