"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLiveStore } from "@/stores/liveStore";
import {
  getSessions,
  getTiming,
  getPositions,
  getTelemetry,
  getRaceControl,
  getWeather,
} from "@/lib/api";
import { POLLING_INTERVALS } from "@/lib/constants";

interface UseLiveDataOptions {
  enabled?: boolean;
  sessionKey?: number | null;
}

export function useLiveData({ enabled = true, sessionKey }: UseLiveDataOptions = {}) {
  const {
    setConnected,
    setSession,
    updateTiming,
    updatePositions,
    updateTelemetry,
    addRaceControlMessage,
    updateWeather,
    selectedDrivers,
    raceControl,
  } = useLiveStore();

  const timingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const telemetryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const raceControlIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const weatherIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRaceControlTimestamp = useRef<string | null>(null);

  // Fetch and set current session
  const fetchSession = useCallback(async () => {
    try {
      const { current } = await getSessions();
      setSession(current);
      setConnected(true);
      return current?.sessionKey;
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setConnected(false);
      return null;
    }
  }, [setSession, setConnected]);

  // Fetch timing data
  const fetchTiming = useCallback(
    async (key: number) => {
      try {
        const { timing } = await getTiming(key);
        updateTiming(timing);
      } catch (error) {
        console.error("Failed to fetch timing:", error);
      }
    },
    [updateTiming]
  );

  // Fetch position data
  const fetchPositions = useCallback(
    async (key: number) => {
      try {
        const { positions } = await getPositions(key);
        updatePositions(positions);
      } catch (error) {
        console.error("Failed to fetch positions:", error);
      }
    },
    [updatePositions]
  );

  // Fetch telemetry for selected drivers
  const fetchTelemetry = useCallback(
    async (key: number, drivers: string[]) => {
      if (drivers.length === 0) return;

      try {
        // Convert driver codes to numbers using timing data
        const timing = useLiveStore.getState().timing;
        const driverNumbers = drivers
          .map((code) => timing.find((t) => t.driverCode === code)?.driverNumber)
          .filter((n): n is number => n !== undefined);

        if (driverNumbers.length === 0) return;

        const { telemetry } = await getTelemetry(key, driverNumbers);
        Object.entries(telemetry).forEach(([code, data]) => {
          updateTelemetry(code, data);
        });
      } catch (error) {
        console.error("Failed to fetch telemetry:", error);
      }
    },
    [updateTelemetry]
  );

  // Fetch race control messages
  const fetchRaceControl = useCallback(
    async (key: number) => {
      try {
        const { messages } = await getRaceControl(
          key,
          lastRaceControlTimestamp.current || undefined
        );

        // Only add new messages
        const existingTimestamps = new Set(raceControl.map((m) => m.timestamp));
        const newMessages = messages.filter(
          (m) => !existingTimestamps.has(m.timestamp)
        );

        newMessages.forEach((msg) => addRaceControlMessage(msg));

        if (messages.length > 0) {
          lastRaceControlTimestamp.current = messages[0].timestamp;
        }
      } catch (error) {
        console.error("Failed to fetch race control:", error);
      }
    },
    [addRaceControlMessage, raceControl]
  );

  // Fetch weather
  const fetchWeather = useCallback(
    async (key: number) => {
      try {
        const { weather } = await getWeather(key);
        if (weather) {
          updateWeather(weather);
        }
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      }
    },
    [updateWeather]
  );

  // Clear all intervals
  const clearAllIntervals = useCallback(() => {
    if (timingIntervalRef.current) clearInterval(timingIntervalRef.current);
    if (positionIntervalRef.current) clearInterval(positionIntervalRef.current);
    if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
    if (raceControlIntervalRef.current) clearInterval(raceControlIntervalRef.current);
    if (weatherIntervalRef.current) clearInterval(weatherIntervalRef.current);
  }, []);

  // Start polling
  const startPolling = useCallback(
    (key: number) => {
      clearAllIntervals();

      // Initial fetch
      fetchTiming(key);
      fetchPositions(key);
      fetchRaceControl(key);
      fetchWeather(key);
      if (selectedDrivers.length > 0) {
        fetchTelemetry(key, selectedDrivers);
      }

      // Set up polling intervals
      timingIntervalRef.current = setInterval(
        () => fetchTiming(key),
        POLLING_INTERVALS.timing
      );

      positionIntervalRef.current = setInterval(
        () => fetchPositions(key),
        POLLING_INTERVALS.position
      );

      raceControlIntervalRef.current = setInterval(
        () => fetchRaceControl(key),
        POLLING_INTERVALS.raceControl
      );

      weatherIntervalRef.current = setInterval(
        () => fetchWeather(key),
        POLLING_INTERVALS.weather
      );
    },
    [
      clearAllIntervals,
      fetchTiming,
      fetchPositions,
      fetchRaceControl,
      fetchWeather,
      fetchTelemetry,
      selectedDrivers,
    ]
  );

  // Handle telemetry polling separately (depends on selected drivers)
  useEffect(() => {
    if (!enabled || !sessionKey) return;

    if (telemetryIntervalRef.current) {
      clearInterval(telemetryIntervalRef.current);
    }

    if (selectedDrivers.length > 0) {
      // Immediate fetch
      fetchTelemetry(sessionKey, selectedDrivers);

      // Set up interval
      telemetryIntervalRef.current = setInterval(
        () => fetchTelemetry(sessionKey, selectedDrivers),
        POLLING_INTERVALS.telemetry
      );
    }

    return () => {
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
      }
    };
  }, [enabled, sessionKey, selectedDrivers, fetchTelemetry]);

  // Main effect to manage session and polling
  useEffect(() => {
    if (!enabled) {
      clearAllIntervals();
      return;
    }

    let activeSessionKey = sessionKey;

    const init = async () => {
      if (!activeSessionKey) {
        activeSessionKey = await fetchSession();
      }

      if (activeSessionKey) {
        startPolling(activeSessionKey);
      }
    };

    init();

    return () => {
      clearAllIntervals();
    };
  }, [enabled, sessionKey, fetchSession, startPolling, clearAllIntervals]);

  return {
    refresh: () => sessionKey && startPolling(sessionKey),
  };
}
