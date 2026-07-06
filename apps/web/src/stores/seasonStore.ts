import { create } from "zustand";

export interface DriverStanding {
  position: number;
  driverCode: string;
  driverNumber: number;
  firstName: string;
  lastName: string;
  nationality: string;
  team: string;
  teamColor: string;
  points: number;
  wins: number;
}

export interface ConstructorStanding {
  position: number;
  name: string;
  nationality: string;
  points: number;
  wins: number;
  color: string;
}

export interface TeamInfo {
  name: string;
  fullName: string;
  color: string;
  engine: string;
  base: string;
  principal: string;
  drivers: {
    code: string;
    number: number;
    firstName: string;
    lastName: string;
    nationality: string;
    flag: string;
    imageUrl?: string;
    points: number;
  }[];
  points: number;
  position: number;
  isNew?: boolean;
}

export interface NotificationPreference {
  sessionKey: string;
  eventRound: number;
  sessionType: "qualifying" | "sprint" | "race";
  notifyAt: number[]; // minutes before (e.g., [30, 5])
}

interface SeasonState {
  // Data
  driverStandings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
  teams: TeamInfo[];

  // Meta
  standingsRound: number;
  standingsYear: number;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;

  // User preferences
  timezone: string;
  notifications: NotificationPreference[];
  notificationsEnabled: boolean;

  // Actions
  setDriverStandings: (standings: DriverStanding[]) => void;
  setConstructorStandings: (standings: ConstructorStanding[]) => void;
  setTeams: (teams: TeamInfo[]) => void;
  setStandingsMeta: (round: number, year: number) => void;
  setLastUpdated: (date: Date) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTimezone: (tz: string) => void;
  addNotification: (pref: NotificationPreference) => void;
  removeNotification: (sessionKey: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

// Get user's timezone or default to Malaysia
const getDefaultTimezone = (): string => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("f1-timezone");
    if (stored) return stored;
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuala_Lumpur";
};

// Load notifications from localStorage
const loadNotifications = (): NotificationPreference[] => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("f1-notifications");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
  }
  return [];
};

export const useSeasonStore = create<SeasonState>((set, get) => ({
  // Initial state
  driverStandings: [],
  constructorStandings: [],
  teams: [],
  standingsRound: 0,
  standingsYear: 2026,
  lastUpdated: null,
  isLoading: false,
  error: null,
  timezone: getDefaultTimezone(),
  notifications: loadNotifications(),
  notificationsEnabled: typeof window !== "undefined" && Notification?.permission === "granted",

  // Actions
  setDriverStandings: (standings) => set({ driverStandings: standings }),
  setConstructorStandings: (standings) => set({ constructorStandings: standings }),
  setTeams: (teams) => set({ teams }),
  setStandingsMeta: (round, year) => set({ standingsRound: round, standingsYear: year }),
  setLastUpdated: (date) => set({ lastUpdated: date }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setTimezone: (tz) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("f1-timezone", tz);
    }
    set({ timezone: tz });
  },

  addNotification: (pref) => {
    const current = get().notifications;
    const updated = [...current.filter((n) => n.sessionKey !== pref.sessionKey), pref];
    if (typeof window !== "undefined") {
      localStorage.setItem("f1-notifications", JSON.stringify(updated));
    }
    set({ notifications: updated });
  },

  removeNotification: (sessionKey) => {
    const current = get().notifications;
    const updated = current.filter((n) => n.sessionKey !== sessionKey);
    if (typeof window !== "undefined") {
      localStorage.setItem("f1-notifications", JSON.stringify(updated));
    }
    set({ notifications: updated });
  },

  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
}));
