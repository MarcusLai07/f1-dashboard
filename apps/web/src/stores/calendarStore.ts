import { create } from "zustand";

interface CalendarState {
  // Selected date (null = show next event day)
  selectedDate: string | null;

  // Series filter (IDs of enabled series)
  enabledSeries: string[];

  // UI state
  expandedEvents: Set<string>;

  // Loading state
  isLoading: boolean;

  // Actions
  setSelectedDate: (date: string | null) => void;
  toggleSeries: (seriesId: string) => void;
  enableAllSeries: () => void;
  disableAllSeries: () => void;
  setEnabledSeries: (seriesIds: string[]) => void;
  toggleEventExpanded: (eventId: string) => void;
  setLoading: (loading: boolean) => void;
}

// Default: all series enabled
const DEFAULT_SERIES = [
  "f1",
  "f2",
  "f3",
  "fe",
  "wec",
  "imsa",
  "wrc",
  "motogp",
  "wsbk",
  "nascar",
  "indycar",
  "dtm",
  "festivals",
];

// Load enabled series from localStorage
const loadEnabledSeries = (): string[] => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("motorsport-calendar-series");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_SERIES;
      }
    }
  }
  return DEFAULT_SERIES;
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Initial state
  selectedDate: null,
  enabledSeries: loadEnabledSeries(),
  expandedEvents: new Set(),
  isLoading: false,

  // Actions
  setSelectedDate: (date) => set({ selectedDate: date }),

  toggleSeries: (seriesId) => {
    const current = get().enabledSeries;
    const updated = current.includes(seriesId)
      ? current.filter((id) => id !== seriesId)
      : [...current, seriesId];

    if (typeof window !== "undefined") {
      localStorage.setItem("motorsport-calendar-series", JSON.stringify(updated));
    }
    set({ enabledSeries: updated });
  },

  enableAllSeries: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "motorsport-calendar-series",
        JSON.stringify(DEFAULT_SERIES)
      );
    }
    set({ enabledSeries: DEFAULT_SERIES });
  },

  disableAllSeries: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("motorsport-calendar-series", JSON.stringify([]));
    }
    set({ enabledSeries: [] });
  },

  setEnabledSeries: (seriesIds) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "motorsport-calendar-series",
        JSON.stringify(seriesIds)
      );
    }
    set({ enabledSeries: seriesIds });
  },

  toggleEventExpanded: (eventId) => {
    const current = get().expandedEvents;
    const updated = new Set(current);
    if (updated.has(eventId)) {
      updated.delete(eventId);
    } else {
      updated.add(eventId);
    }
    set({ expandedEvents: updated });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
