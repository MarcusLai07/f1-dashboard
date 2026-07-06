import { create } from "zustand";
import { persist } from "zustand/middleware";

// Session types for Live tab simulation
export type SessionType = "practice" | "qualifying" | "sprint" | "race" | null;

interface DebugState {
  enabled: boolean;
  simulatedDate: string | null; // ISO date string or null for real time
  simulatedSessionType: SessionType; // Session type for Live tab
  showLoader: boolean;
  setEnabled: (enabled: boolean) => void;
  setSimulatedDate: (date: string | null) => void;
  setSimulatedSessionType: (type: SessionType) => void;
  setShowLoader: (show: boolean) => void;
  // Convenience method to set both date and session type at once
  setSimulatedSession: (date: string | null, type: SessionType) => void;
}

export const useDebugStore = create<DebugState>()(
  persist(
    (set) => ({
      enabled: false,
      simulatedDate: null,
      simulatedSessionType: null,
      showLoader: false,
      setEnabled: (enabled) => set({ enabled }),
      setSimulatedDate: (date) => set({ simulatedDate: date }),
      setSimulatedSessionType: (type) => set({ simulatedSessionType: type }),
      setShowLoader: (show) => set({ showLoader: show }),
      setSimulatedSession: (date, type) => set({
        simulatedDate: date,
        simulatedSessionType: type,
        enabled: date !== null,
      }),
    }),
    {
      name: "f1-debug-store",
    }
  )
);

// Helper to get the current time (real or simulated)
export function getSimulatedNow(): number {
  const { enabled, simulatedDate } = useDebugStore.getState();
  if (enabled && simulatedDate) {
    return new Date(simulatedDate).getTime();
  }
  return Date.now();
}

// Preset dates for Season tab (calendar/countdown testing)
export const DEBUG_PRESETS = [
  { label: "Real Time", value: null },
  { label: "Pre-Season (Jan 20, 2026)", value: "2026-01-20T12:00:00Z" },
  { label: "Shakedown Week (Jan 27, 2026)", value: "2026-01-27T12:00:00Z" },
  { label: "Testing 1 (Feb 12, 2026)", value: "2026-02-12T12:00:00Z" },
  { label: "Race 1 Weekend (Mar 7, 2026)", value: "2026-03-07T08:00:00Z" },
  { label: "After Race 1 (Mar 9, 2026)", value: "2026-03-09T12:00:00Z" },
  { label: "Race 2 Weekend (Mar 14, 2026)", value: "2026-03-14T10:00:00Z" },
  { label: "After Race 2 (Mar 16, 2026)", value: "2026-03-16T12:00:00Z" },
  { label: "Race 3 Weekend (Mar 28, 2026)", value: "2026-03-28T08:00:00Z" },
  { label: "After Race 3 (Mar 30, 2026)", value: "2026-03-30T12:00:00Z" },
  { label: "Mid-Season (Jul 15, 2026)", value: "2026-07-15T12:00:00Z" },
  { label: "Season End (Dec 10, 2026)", value: "2026-12-10T12:00:00Z" },
];

// Session presets for Live tab (simulating different session types)
// Uses Australian GP (Round 1) as the example event
export interface SessionPreset {
  label: string;
  value: string | null;
  sessionType: SessionType;
  event?: string;
  description?: string;
}

export const SESSION_PRESETS: SessionPreset[] = [
  { label: "Real Time", value: null, sessionType: null },

  // Pre-Season Testing
  {
    label: "Barcelona Shakedown - Day 1 AM",
    value: "2026-01-26T08:00:00Z",
    sessionType: "practice",
    event: "Barcelona Shakedown Week",
    description: "Shakedown testing at Barcelona",
  },
  {
    label: "Bahrain Testing 1 - Day 1 AM",
    value: "2026-02-11T06:00:00Z",
    sessionType: "practice",
    event: "Pre-Season Testing 1",
    description: "Pre-season testing at Bahrain",
  },
  {
    label: "Bahrain Testing 2 - Day 1 AM",
    value: "2026-02-18T06:00:00Z",
    sessionType: "practice",
    event: "Pre-Season Testing 2",
    description: "Pre-season testing at Bahrain",
  },

  // Practice Sessions - Australian GP (Round 1)
  {
    label: "FP1 - Australian GP",
    value: "2026-03-06T01:30:00Z",
    sessionType: "practice",
    event: "Australian Grand Prix",
    description: "Free Practice 1 at Albert Park",
  },
  {
    label: "FP2 - Australian GP",
    value: "2026-03-06T05:00:00Z",
    sessionType: "practice",
    event: "Australian Grand Prix",
    description: "Free Practice 2 at Albert Park",
  },
  {
    label: "FP3 - Australian GP",
    value: "2026-03-07T01:30:00Z",
    sessionType: "practice",
    event: "Australian Grand Prix",
    description: "Free Practice 3 at Albert Park",
  },
  // Qualifying Session
  {
    label: "Qualifying - Australian GP",
    value: "2026-03-07T05:00:00Z",
    sessionType: "qualifying",
    event: "Australian Grand Prix",
    description: "Qualifying at Albert Park",
  },
  // Race Session
  {
    label: "Race - Australian GP",
    value: "2026-03-08T04:00:00Z",
    sessionType: "race",
    event: "Australian Grand Prix",
    description: "Race at Albert Park",
  },

  // Sprint Weekend Example - Chinese GP (Round 2)
  {
    label: "Sprint Qualifying - Chinese GP",
    value: "2026-03-13T07:30:00Z",
    sessionType: "qualifying",
    event: "Chinese Grand Prix",
    description: "Sprint Qualifying at Shanghai",
  },
  {
    label: "Sprint Race - Chinese GP",
    value: "2026-03-14T03:00:00Z",
    sessionType: "sprint",
    event: "Chinese Grand Prix",
    description: "Sprint Race at Shanghai",
  },

  // Monaco GP (iconic track)
  {
    label: "Race - Monaco GP",
    value: "2026-06-07T13:00:00Z",
    sessionType: "race",
    event: "Monaco Grand Prix",
    description: "Race at Circuit de Monaco",
  },

  // Night Race - Singapore
  {
    label: "Race - Singapore GP",
    value: "2026-10-11T12:00:00Z",
    sessionType: "race",
    event: "Singapore Grand Prix",
    description: "Night Race at Marina Bay",
  },
];
