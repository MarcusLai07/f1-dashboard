"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useLiveStore } from "@/stores/liveStore";
import { useReplayStore } from "@/stores/replayStore";
import { deriveSessionType, type SessionType } from "./useSessionPolling";
import type { Overtake, RaceControlMessage } from "@/types/f1";

interface UseLiveSSEOptions {
  enabled?: boolean;
  sessionKey?: number | null;
  replayMode?: boolean;
  locationStreamActive?: boolean;
}

/**
 * Live data via Server-Sent Events.
 *
 * Opens a single SSE connection to /api/live/sse. The server handles all
 * OpenF1 polling internally, sharing a cached driver map across data types.
 * This replaces 5-6 independent polling intervals with one persistent stream.
 *
 * Falls back gracefully — if the EventSource errors out, the connection is
 * retried automatically by the browser (built-in EventSource reconnection).
 */
export function useLiveSSE({
  enabled = true,
  sessionKey,
  replayMode = false,
  locationStreamActive = false,
}: UseLiveSSEOptions = {}) {
  const { isReplayMode } = useReplayStore();
  const shouldConnect = enabled && !replayMode && !isReplayMode && !!sessionKey;

  const {
    setConnected,
    currentSession,
    updateTiming,
    updatePositions,
    updateLocations,
    addRaceControlMessage,
    addOvertakes,
    updateWeather,
    updateTrackStatus,
  } = useLiveStore();

  const eventSourceRef = useRef<EventSource | null>(null);
  const raceControlTimestamps = useRef<Set<string>>(new Set());
  const overtakeKeys = useRef<Set<string>>(new Set());

  // Derive session info for the SSE query params
  const sessionName = currentSession?.sessionName;
  const sessionType: SessionType = useMemo(() => {
    if (!sessionName) return "practice";
    return deriveSessionType(sessionName);
  }, [sessionName]);
  const isLive = currentSession?.status === "live";

  // --- Race control deduplication & track status derivation ---
  const deriveTrackStatus = useCallback(
    (messages: RaceControlMessage[]) => {
      if (messages.length === 0) return;
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
    },
    [updateTrackStatus]
  );

  const deriveIncidentStatus = useCallback(
    (messages: RaceControlMessage[]) => {
      if (messages.length === 0) return;
      const timing = useLiveStore.getState().timing;
      if (timing.length === 0) return;

      const driverIncidents = new Map<
        number,
        { isUnderInvestigation: boolean; hasPenalty: boolean; penaltySeconds?: number }
      >();

      for (const msg of messages) {
        const driverNumber = msg.driverNumber;
        if (!driverNumber || driverIncidents.has(driverNumber)) continue;

        const msgText = msg.message?.toUpperCase() || "";

        if (msgText.includes("TIME PENALTY") || msgText.includes("SECOND TIME PENALTY") || msgText.includes("SEC PENALTY")) {
          const match = msgText.match(/(\d+)\s*SECOND/);
          driverIncidents.set(driverNumber, { isUnderInvestigation: false, hasPenalty: true, penaltySeconds: match ? parseInt(match[1], 10) : undefined });
        } else if (msgText.includes("PENALTY") && !msgText.includes("NO FURTHER")) {
          driverIncidents.set(driverNumber, { isUnderInvestigation: false, hasPenalty: true });
        } else if (msgText.includes("NO FURTHER ACTION") || msgText.includes("NO INVESTIGATION")) {
          driverIncidents.set(driverNumber, { isUnderInvestigation: false, hasPenalty: false });
        } else if (msgText.includes("UNDER INVESTIGATION") || msgText.includes("NOTED") || msgText.includes("WILL BE INVESTIGATED")) {
          driverIncidents.set(driverNumber, { isUnderInvestigation: true, hasPenalty: false });
        }
      }

      if (driverIncidents.size > 0) {
        const updatedTiming = timing.map((driver) => {
          const incident = driverIncidents.get(driver.driverNumber);
          if (incident) {
            return { ...driver, ...incident };
          }
          return driver;
        });
        updateTiming(updatedTiming);
      }
    },
    [updateTiming]
  );

  // --- Main SSE connection effect ---
  useEffect(() => {
    if (!shouldConnect || !sessionKey) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const params = new URLSearchParams({
      session_key: String(sessionKey),
      session_type: sessionType,
      is_live: String(isLive ?? false),
      skip_location: String(locationStreamActive),
    });

    const es = new EventSource(`/api/live/sse?${params}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.addEventListener("timing", (e) => {
      try {
        const { timing } = JSON.parse(e.data);
        updateTiming(timing);
      } catch { /* ignore */ }
    });

    es.addEventListener("position", (e) => {
      try {
        const { positions } = JSON.parse(e.data);
        updatePositions(positions);
      } catch { /* ignore */ }
    });

    es.addEventListener("location", (e) => {
      try {
        const { locations, bounds } = JSON.parse(e.data);
        updateLocations(locations, bounds);
      } catch { /* ignore */ }
    });

    es.addEventListener("raceControl", (e) => {
      try {
        const { messages } = JSON.parse(e.data);
        const existingMessages = useLiveStore.getState().raceControl;
        const newMessages = messages.filter(
          (m: RaceControlMessage) => !raceControlTimestamps.current.has(m.timestamp)
        );
        newMessages.forEach((msg: RaceControlMessage) => {
          raceControlTimestamps.current.add(msg.timestamp);
          addRaceControlMessage(msg);
        });

        const allMessages = [...newMessages, ...existingMessages];
        deriveTrackStatus(allMessages);
        deriveIncidentStatus(allMessages);
      } catch { /* ignore */ }
    });

    es.addEventListener("overtakes", (e) => {
      try {
        const { overtakes } = JSON.parse(e.data);
        const fresh = (overtakes as Overtake[]).filter((o) => {
          const key = `${o.timestamp}|${o.overtakingDriverNumber}|${o.overtakenDriverNumber}`;
          if (overtakeKeys.current.has(key)) return false;
          overtakeKeys.current.add(key);
          return true;
        });
        if (fresh.length > 0) addOvertakes(fresh);
      } catch { /* ignore */ }
    });

    es.addEventListener("weather", (e) => {
      try {
        const { weather } = JSON.parse(e.data);
        if (weather) updateWeather(weather);
      } catch { /* ignore */ }
    });

    es.onerror = () => {
      // EventSource auto-reconnects. Mark disconnected so UI can show status.
      setConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
    // We intentionally don't include sessionType/isLive in deps —
    // reconnecting for interval changes would cause a visible blip.
    // The server uses the initial values; for interval changes the
    // client can reconnect manually via refresh().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldConnect, sessionKey, locationStreamActive]);

  const refresh = useCallback(() => {
    // Force reconnect by closing + letting the effect re-run
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  return {
    refresh,
    sessionType,
    isLive: isLive ?? false,
    isReplayMode,
  };
}
