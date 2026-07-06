"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useLiveStore } from "@/stores/liveStore";
import { useReplayStore } from "@/stores/replayStore";
import {
  getSessions,
  getTiming,
  getPositions,
  getLocation,
  getTelemetry,
  getRaceControl,
  getWeather,
} from "@/lib/api";
import { getPollingIntervals, deriveSessionType, type SessionType } from "./useSessionPolling";
import type { RaceControlMessage } from "@/types/f1";

interface UseLiveDataOptions {
  enabled?: boolean;
  sessionKey?: number | null;
  replayMode?: boolean;
  locationStreamActive?: boolean;
  /** When true, SSE handles timing/positions/location/raceControl/weather.
   *  useLiveData only handles session discovery + telemetry polling. */
  sseActive?: boolean;
}

export function useLiveData({ enabled = true, sessionKey, replayMode = false, locationStreamActive = false, sseActive = false }: UseLiveDataOptions = {}) {
  const { isReplayMode } = useReplayStore();

  // Don't poll when in replay mode
  const shouldPoll = enabled && !replayMode && !isReplayMode;
  const {
    setConnected,
    setSession,
    currentSession,
    updateTiming,
    updatePositions,
    updateLocations,
    updateTelemetry,
    addRaceControlMessage,
    updateWeather,
    updateTrackStatus,
    selectedDrivers,
  } = useLiveStore();

  // Derive session type and live status for polling intervals
  const sessionName = currentSession?.sessionName;
  const sessionType: SessionType = useMemo(() => {
    if (!sessionName) return "practice";
    return deriveSessionType(sessionName);
  }, [sessionName]);

  const isLive = currentSession?.status === "live";

  // Get dynamic polling intervals based on session type
  const pollingIntervals = useMemo(
    () => getPollingIntervals(sessionType, isLive),
    [sessionType, isLive]
  );

  const timingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const telemetryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const raceControlIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const weatherIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRaceControlTimestamp = useRef<string | null>(null);
  const raceControlFetchInProgress = useRef<boolean>(false);

  // Fetch and set current session
  const fetchSession = useCallback(async (knownSessionKey?: number | null) => {
    try {
      const { current, recent } = await getSessions();

      // If we have a specific session key, find it in the API response
      if (knownSessionKey) {
        const matchedSession =
          (current?.sessionKey === knownSessionKey ? current : null) ||
          recent.find((s) => s.sessionKey === knownSessionKey) ||
          null;

        if (matchedSession) {
          setSession(matchedSession);
        } else if (current) {
          // Fallback: use current session info
          setSession(current);
        }
      } else {
        setSession(current);
      }

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
      } catch {
        // Silently ignore - polling will retry
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
      } catch {
        // Silently ignore - polling will retry
      }
    },
    [updatePositions]
  );

  // Fetch location data (actual track coordinates)
  const fetchLocation = useCallback(
    async (key: number) => {
      try {
        const { locations, bounds } = await getLocation(key);
        updateLocations(locations, bounds);
      } catch {
        // Silently ignore - polling will retry
      }
    },
    [updateLocations]
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
      } catch {
        // Silently ignore - polling will retry
      }
    },
    [updateTelemetry]
  );

  // Derive track status from race control messages
  const deriveTrackStatus = useCallback((messages: RaceControlMessage[]) => {
    if (messages.length === 0) return;

    // Search from newest to oldest for track status indicators
    for (const msg of messages) {
      const flag = msg.flag?.toUpperCase();
      const message = msg.message?.toLowerCase() || "";
      const category = msg.category?.toUpperCase();

      if (flag === "RED") {
        updateTrackStatus({ status: "Red", message: msg.message });
        return;
      } else if (category === "SAFETY_CAR" || message.includes("safety car deployed")) {
        updateTrackStatus({ status: "SCDeployed", message: msg.message });
        return;
      } else if (category === "VSC" || message.includes("virtual safety car") || message.includes("vsc deployed")) {
        updateTrackStatus({ status: "VSCDeployed", message: msg.message });
        return;
      } else if (flag === "YELLOW" || flag === "DOUBLE_YELLOW" || flag === "DOUBLE YELLOW") {
        updateTrackStatus({ status: "Yellow", message: msg.message });
        return;
      } else if (flag === "GREEN" || message.includes("track clear") || message.includes("green light")) {
        updateTrackStatus({ status: "AllClear", message: msg.message });
        return;
      } else if (message.includes("safety car in") || message.includes("vsc ending")) {
        updateTrackStatus({ status: "AllClear", message: msg.message });
        return;
      }
    }
  }, [updateTrackStatus]);

  // Derive investigation/penalty status from race control messages and update timing
  const deriveIncidentStatus = useCallback((messages: RaceControlMessage[]) => {
    if (messages.length === 0) return;

    const timing = useLiveStore.getState().timing;
    if (timing.length === 0) return;

    // Build a map of driver incidents from messages
    const driverIncidents = new Map<number, { isUnderInvestigation: boolean; hasPenalty: boolean; penaltySeconds?: number }>();

    // Process messages from newest to oldest for each driver
    for (const msg of messages) {
      const driverNumber = msg.driverNumber;
      if (!driverNumber) continue;

      // Skip if we already have a status for this driver (we process newest first)
      if (driverIncidents.has(driverNumber)) continue;

      const msgText = msg.message?.toUpperCase() || "";

      if (msgText.includes("TIME PENALTY") || msgText.includes("SECOND TIME PENALTY") || msgText.includes("SEC PENALTY")) {
        const match = msgText.match(/(\d+)\s*SECOND/);
        driverIncidents.set(driverNumber, {
          isUnderInvestigation: false,
          hasPenalty: true,
          penaltySeconds: match ? parseInt(match[1], 10) : undefined,
        });
      } else if (msgText.includes("PENALTY") && !msgText.includes("NO FURTHER")) {
        driverIncidents.set(driverNumber, {
          isUnderInvestigation: false,
          hasPenalty: true,
          penaltySeconds: undefined,
        });
      } else if (msgText.includes("NO FURTHER ACTION") || msgText.includes("NO INVESTIGATION")) {
        driverIncidents.set(driverNumber, {
          isUnderInvestigation: false,
          hasPenalty: false,
          penaltySeconds: undefined,
        });
      } else if (msgText.includes("UNDER INVESTIGATION") || msgText.includes("NOTED") || msgText.includes("WILL BE INVESTIGATED")) {
        driverIncidents.set(driverNumber, {
          isUnderInvestigation: true,
          hasPenalty: false,
          penaltySeconds: undefined,
        });
      }
    }

    // Update timing data with incident status
    if (driverIncidents.size > 0) {
      const updatedTiming = timing.map((driver) => {
        const incident = driverIncidents.get(driver.driverNumber);
        if (incident) {
          return {
            ...driver,
            isUnderInvestigation: incident.isUnderInvestigation,
            hasPenalty: incident.hasPenalty,
            penaltySeconds: incident.penaltySeconds,
          };
        }
        return driver;
      });
      updateTiming(updatedTiming);
    }
  }, [updateTiming]);

  // Fetch race control messages (with race condition prevention)
  const fetchRaceControl = useCallback(
    async (key: number) => {
      // Prevent concurrent fetches (race condition fix)
      if (raceControlFetchInProgress.current) {
        return;
      }

      raceControlFetchInProgress.current = true;

      try {
        // Capture timestamp before fetch to avoid race conditions
        const timestampForFetch = lastRaceControlTimestamp.current;

        const { messages } = await getRaceControl(
          key,
          timestampForFetch || undefined
        );

        // Read raceControl from store directly to avoid dependency cycle
        const existingMessages = useLiveStore.getState().raceControl;

        // Only add new messages (use Set for O(1) lookup)
        const existingTimestamps = new Set(existingMessages.map((m) => m.timestamp));
        const newMessages = messages.filter(
          (m) => !existingTimestamps.has(m.timestamp)
        );

        newMessages.forEach((msg) => addRaceControlMessage(msg));

        // Update timestamp only if we got messages and it's newer
        if (messages.length > 0) {
          const newestTimestamp = messages[0].timestamp;
          if (!lastRaceControlTimestamp.current ||
              new Date(newestTimestamp) > new Date(lastRaceControlTimestamp.current)) {
            lastRaceControlTimestamp.current = newestTimestamp;
          }
        }

        // Derive track status from all messages (including existing)
        const allMessages = [...newMessages, ...existingMessages];
        deriveTrackStatus(allMessages);

        // Derive investigation/penalty status
        deriveIncidentStatus(allMessages);
      } catch {
        // Silently ignore - polling will retry
      } finally {
        raceControlFetchInProgress.current = false;
      }
    },
    [addRaceControlMessage, deriveTrackStatus, deriveIncidentStatus]
  );

  // Fetch weather
  const fetchWeather = useCallback(
    async (key: number) => {
      try {
        const { weather } = await getWeather(key);
        if (weather) {
          updateWeather(weather);
        }
      } catch {
        // Silently ignore - polling will retry
      }
    },
    [updateWeather]
  );

  // Clear all intervals
  const clearAllIntervals = useCallback(() => {
    if (timingIntervalRef.current) clearInterval(timingIntervalRef.current);
    if (positionIntervalRef.current) clearInterval(positionIntervalRef.current);
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
    if (raceControlIntervalRef.current) clearInterval(raceControlIntervalRef.current);
    if (weatherIntervalRef.current) clearInterval(weatherIntervalRef.current);
  }, []);

  // Start polling with session-aware intervals
  // When sseActive=true, SSE handles timing/positions/location/raceControl/weather
  // so we only poll telemetry here.
  const startPolling = useCallback(
    (key: number) => {
      clearAllIntervals();

      // When SSE is active, skip all data types it handles
      if (sseActive) {
        // Only telemetry polling (handled separately in its own useEffect)
        return;
      }

      // --- Full polling fallback (no SSE, e.g. replay mode) ---

      // Initial fetch
      fetchTiming(key);
      fetchPositions(key);
      if (!locationStreamActive) fetchLocation(key);
      fetchRaceControl(key);
      fetchWeather(key);
      if (selectedDrivers.length > 0) {
        fetchTelemetry(key, selectedDrivers);
      }

      // Set up polling intervals (session-aware: faster for race, slower for practice)
      timingIntervalRef.current = setInterval(
        () => fetchTiming(key),
        pollingIntervals.timing
      );

      positionIntervalRef.current = setInterval(
        () => fetchPositions(key),
        pollingIntervals.position
      );

      // Location updates at same rate as position (actual track coordinates)
      // Skip when MQTT streaming is active — streaming provides ~3.7Hz updates
      if (!locationStreamActive) {
        locationIntervalRef.current = setInterval(
          () => fetchLocation(key),
          pollingIntervals.position
        );
      }

      raceControlIntervalRef.current = setInterval(
        () => fetchRaceControl(key),
        pollingIntervals.raceControl
      );

      weatherIntervalRef.current = setInterval(
        () => fetchWeather(key),
        pollingIntervals.weather
      );
    },
    [
      clearAllIntervals,
      fetchTiming,
      fetchPositions,
      fetchLocation,
      fetchRaceControl,
      fetchWeather,
      fetchTelemetry,
      selectedDrivers,
      pollingIntervals,
      locationStreamActive,
      sseActive,
    ]
  );

  // Use a ref for startPolling to avoid dependency cycles in effects
  const startPollingRef = useRef(startPolling);
  startPollingRef.current = startPolling;

  // Handle telemetry polling separately (depends on selected drivers)
  useEffect(() => {
    // Clear any existing interval first (before checking conditions)
    const currentInterval = telemetryIntervalRef.current;
    if (currentInterval) {
      clearInterval(currentInterval);
      telemetryIntervalRef.current = null;
    }

    if (!shouldPoll || !sessionKey || selectedDrivers.length === 0) {
      return;
    }

    // Use AbortController pattern for fetch cancellation
    let isCancelled = false;

    // Immediate fetch
    fetchTelemetry(sessionKey, selectedDrivers);

    // Set up interval (session-aware)
    const intervalId = setInterval(() => {
      if (!isCancelled) {
        fetchTelemetry(sessionKey, selectedDrivers);
      }
    }, pollingIntervals.telemetry);

    telemetryIntervalRef.current = intervalId;

    return () => {
      isCancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      telemetryIntervalRef.current = null;
    };
  }, [shouldPoll, sessionKey, selectedDrivers, fetchTelemetry, pollingIntervals.telemetry]);

  // Main effect to manage session and polling
  useEffect(() => {
    if (!shouldPoll) {
      clearAllIntervals();
      return;
    }

    let activeSessionKey = sessionKey;

    const init = async () => {
      if (!activeSessionKey) {
        activeSessionKey = await fetchSession();
      } else {
        // Always fetch session info to populate currentSession
        // (needed for circuit name, isLive status, polling intervals)
        await fetchSession(activeSessionKey);
      }

      if (activeSessionKey) {
        startPollingRef.current(activeSessionKey);
      }
    };

    init();

    return () => {
      clearAllIntervals();
    };
  }, [shouldPoll, sessionKey, fetchSession, clearAllIntervals]);

  // Restart polling when polling intervals change (session type or live status changes)
  useEffect(() => {
    if (!shouldPoll || !sessionKey) return;
    // Restart polling with new intervals
    startPollingRef.current(sessionKey);
  }, [pollingIntervals, shouldPoll, sessionKey]);

  return {
    refresh: () => sessionKey && startPolling(sessionKey),
    // Expose for debugging
    sessionType,
    isLive,
    pollingIntervals,
    isReplayMode,
  };
}
