"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useSeasonStore } from "@/stores/seasonStore";
import { getRaces, type F1Event } from "@/data";

// Event-aware refresh intervals (in milliseconds)
const REFRESH_INTERVALS = {
  distant: 24 * 60 * 60 * 1000, // > 7 days: every 24 hours
  week: 6 * 60 * 60 * 1000, // 1-7 days: every 6 hours
  day: 60 * 60 * 1000, // < 24 hours: every 1 hour
  soon: 15 * 60 * 1000, // < 2 hours: every 15 minutes
  live: 5 * 60 * 1000, // During session: every 5 minutes
  postSession: 2 * 60 * 1000, // Just ended: every 2 minutes
};

function getTimeToNextSession(races: F1Event[]): number {
  const now = Date.now();

  for (const event of races) {
    const sessions = [
      event.sessions.fp1,
      event.sessions.fp2,
      event.sessions.fp3,
      event.sessions.sprintQualifying,
      event.sessions.sprint,
      event.sessions.qualifying,
      event.sessions.race,
    ].filter(Boolean);

    for (const session of sessions) {
      if (!session) continue;
      const sessionTime = new Date(session).getTime();
      if (sessionTime > now) {
        return sessionTime - now;
      }
    }
  }

  return Infinity; // Season over
}

function isSessionLive(races: F1Event[]): boolean {
  const now = Date.now();

  for (const event of races) {
    const sessions = [
      { time: event.sessions.fp1, duration: 60 },
      { time: event.sessions.fp2, duration: 60 },
      { time: event.sessions.fp3, duration: 60 },
      { time: event.sessions.sprintQualifying, duration: 30 },
      { time: event.sessions.sprint, duration: 45 },
      { time: event.sessions.qualifying, duration: 60 },
      { time: event.sessions.race, duration: 120 },
    ];

    for (const session of sessions) {
      if (!session.time) continue;
      const start = new Date(session.time).getTime();
      const end = start + session.duration * 60 * 1000;
      if (now >= start && now <= end) {
        return true;
      }
    }
  }

  return false;
}

function sessionJustEnded(races: F1Event[]): boolean {
  const now = Date.now();
  const thirtyMinutesAgo = now - 30 * 60 * 1000;

  for (const event of races) {
    const sessions = [
      { time: event.sessions.qualifying, duration: 60 },
      { time: event.sessions.sprint, duration: 45 },
      { time: event.sessions.race, duration: 120 },
    ];

    for (const session of sessions) {
      if (!session.time) continue;
      const start = new Date(session.time).getTime();
      const end = start + session.duration * 60 * 1000;
      if (end >= thirtyMinutesAgo && end <= now) {
        return true;
      }
    }
  }

  return false;
}

function calculateRefreshInterval(races: F1Event[]): number {
  // Check special conditions first
  if (sessionJustEnded(races)) {
    return REFRESH_INTERVALS.postSession;
  }

  if (isSessionLive(races)) {
    return REFRESH_INTERVALS.live;
  }

  const timeToNext = getTimeToNextSession(races);

  if (timeToNext === Infinity) {
    return REFRESH_INTERVALS.distant;
  }

  const hours = timeToNext / (60 * 60 * 1000);
  const days = hours / 24;

  if (hours < 2) {
    return REFRESH_INTERVALS.soon;
  } else if (hours < 24) {
    return REFRESH_INTERVALS.day;
  } else if (days < 7) {
    return REFRESH_INTERVALS.week;
  }

  return REFRESH_INTERVALS.distant;
}

interface UseSeasonDataOptions {
  enabled?: boolean;
}

export function useSeasonData(options: UseSeasonDataOptions = {}) {
  const { enabled = true } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);
  const [races, setRaces] = useState<F1Event[]>([]);

  const {
    setDriverStandings,
    setConstructorStandings,
    setTeams,
    setStandingsMeta,
    setLastUpdated,
    setLoading,
    setError,
  } = useSeasonStore();

  // Fetch races data for refresh interval calculations
  useEffect(() => {
    getRaces().then(setRaces);
  }, []);

  const fetchStandings = useCallback(async () => {
    try {
      const res = await fetch("/api/season/standings");
      if (!res.ok) throw new Error("Failed to fetch standings");
      const data = await res.json();

      setDriverStandings(data.driverStandings || []);
      setConstructorStandings(data.constructorStandings || []);
      setStandingsMeta(data.round || 0, data.season || 2026);
    } catch (error) {
      console.error("Error fetching standings:", error);
      throw error;
    }
  }, [setDriverStandings, setConstructorStandings, setStandingsMeta]);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/season/teams");
      if (!res.ok) throw new Error("Failed to fetch teams");
      const data = await res.json();

      setTeams(data.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
  }, [setTeams]);

  const fetchAll = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) {
      return;
    }
    lastFetchRef.current = now;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchStandings(), fetchTeams()]);
      setLastUpdated(new Date());
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [fetchStandings, fetchTeams, setLoading, setError, setLastUpdated]);

  const scheduleNextRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }

    const interval = calculateRefreshInterval(races);
    console.log(`[SeasonData] Next refresh in ${Math.round(interval / 60000)} minutes`);

    intervalRef.current = setTimeout(() => {
      fetchAll().then(() => {
        scheduleNextRefresh();
      });
    }, interval);
  }, [fetchAll, races]);

  // Initial fetch and setup
  useEffect(() => {
    if (!enabled) return;

    // Fetch immediately
    fetchAll().then(() => {
      scheduleNextRefresh();
    });

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [enabled, fetchAll, scheduleNextRefresh]);

  // Manual refresh function
  const refresh = useCallback(() => {
    lastFetchRef.current = 0; // Reset throttle
    return fetchAll();
  }, [fetchAll]);

  return { refresh };
}

// Hook for checking/requesting notification permission
export function useNotificationPermission() {
  const { notificationsEnabled, setNotificationsEnabled } = useSeasonStore();

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("Notifications not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      setNotificationsEnabled(granted);
      return granted;
    }

    return false;
  }, [setNotificationsEnabled]);

  return {
    enabled: notificationsEnabled,
    supported: typeof window !== "undefined" && "Notification" in window,
    permission: typeof window !== "undefined" ? Notification?.permission : "default",
    requestPermission,
  };
}

// Hook for scheduling session notifications
export function useSessionNotifications() {
  const { notifications, addNotification, removeNotification } = useSeasonStore();
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout[]>>(new Map());

  const scheduleNotification = useCallback(
    (
      sessionKey: string,
      sessionName: string,
      sessionTime: Date,
      minutesBefore: number[] = [30, 5]
    ) => {
      // Clear existing timeouts for this session
      const existing = timeoutsRef.current.get(sessionKey);
      if (existing) {
        existing.forEach((t) => clearTimeout(t));
      }

      const newTimeouts: NodeJS.Timeout[] = [];
      const now = Date.now();

      for (const minutes of minutesBefore) {
        const notifyTime = sessionTime.getTime() - minutes * 60 * 1000;
        const delay = notifyTime - now;

        if (delay > 0) {
          const timeout = setTimeout(() => {
            if (Notification.permission === "granted") {
              new Notification(`F1: ${sessionName}`, {
                body: `Starting in ${minutes} minutes!`,
                icon: "/f1-icon.png",
                tag: sessionKey,
              });
            }
          }, delay);
          newTimeouts.push(timeout);
        }
      }

      timeoutsRef.current.set(sessionKey, newTimeouts);
    },
    []
  );

  const cancelNotification = useCallback((sessionKey: string) => {
    const existing = timeoutsRef.current.get(sessionKey);
    if (existing) {
      existing.forEach((t) => clearTimeout(t));
      timeoutsRef.current.delete(sessionKey);
    }
    removeNotification(sessionKey);
  }, [removeNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeouts) => {
        timeouts.forEach((t) => clearTimeout(t));
      });
    };
  }, []);

  return {
    notifications,
    addNotification,
    scheduleNotification,
    cancelNotification,
  };
}
