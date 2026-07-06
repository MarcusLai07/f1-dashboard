"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useLiveStore } from "@/stores/liveStore";
import type { CarLocation, LocationBounds } from "@/types/f1";

interface MqttLocationMessage {
  driver_number: number;
  x: number;
  y: number;
  z: number;
  date: string;
  session_key: number;
  meeting_key: number;
}

interface UseLocationStreamOptions {
  enabled: boolean;
  sessionKey: number | null;
}

const BATCH_INTERVAL_MS = 150;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

// mqtt.js's browser transport rejects internal promises with the raw
// WebSocket close/error *Event* when a connection is torn down mid-dial
// (e.g. React StrictMode cleanup, session switches). That reaches the page
// as an unhandled rejection of "[object Event]" and crashes the dev overlay.
// Swallow exactly that case — Event reasons from WebSocket targets — and
// let every real Error keep surfacing.
let wsRejectionGuardInstalled = false;
function installWsRejectionGuard() {
  if (wsRejectionGuardInstalled || typeof window === "undefined") return;
  wsRejectionGuardInstalled = true;
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason as unknown;
    if (
      reason instanceof Event &&
      typeof WebSocket !== "undefined" &&
      reason.target instanceof WebSocket
    ) {
      console.warn(
        `[LocationStream] WebSocket ${reason.type} during MQTT teardown (suppressed)`
      );
      e.preventDefault();
    }
  });
}

export function useLocationStream({ enabled, sessionKey }: UseLocationStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);
  const batchRef = useRef<Map<number, MqttLocationMessage>>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<{ accessToken: string; expiresAt: number } | null>(null);
  const sessionKeyRef = useRef<number | null>(sessionKey);
  const connectingRef = useRef(false);
  const hasReceivedDataRef = useRef(false);
  // Bumped on every disconnect; in-flight connects check it after each await
  // so a StrictMode remount or session switch can't leak a zombie client.
  const generationRef = useRef(0);

  // Keep session key ref current for filtering in message handler
  useEffect(() => {
    sessionKeyRef.current = sessionKey;
  }, [sessionKey]);

  const fetchToken = useCallback(async (): Promise<string | null> => {
    if (tokenRef.current && Date.now() < tokenRef.current.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
      return tokenRef.current.accessToken;
    }
    try {
      const res = await fetch("/api/live/stream-token");
      if (!res.ok) return null;
      const data = await res.json();
      tokenRef.current = { accessToken: data.accessToken, expiresAt: data.expiresAt };
      return data.accessToken;
    } catch {
      return null;
    }
  }, []);

  const flushBatch = useCallback(() => {
    const batch = batchRef.current;
    if (batch.size === 0) return;

    const timing = useLiveStore.getState().timing;
    if (timing.length === 0) return; // No driver info yet

    const timingByNumber = new Map(timing.map(t => [t.driverNumber, t]));

    const locations: CarLocation[] = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const [driverNum, msg] of batch) {
      const driver = timingByNumber.get(driverNum);
      if (!driver) continue;

      const hasRealCoords = msg.x !== 0 || msg.y !== 0;
      if (hasRealCoords) {
        minX = Math.min(minX, msg.x); maxX = Math.max(maxX, msg.x);
        minY = Math.min(minY, msg.y); maxY = Math.max(maxY, msg.y);
      }

      locations.push({
        driverCode: driver.driverCode,
        driverNumber: driverNum,
        teamColor: driver.teamColor,
        x: msg.x,
        y: msg.y,
        z: msg.z,
        timestamp: msg.date,
      });
    }

    const hasRealBounds = minX !== Infinity;
    const bounds: LocationBounds | null = hasRealBounds
      ? { minX: minX - 100, maxX: maxX + 100, minY: minY - 100, maxY: maxY + 100 }
      : null;

    useLiveStore.getState().updateLocations(locations, bounds);
  }, []);

  const disconnect = useCallback(() => {
    generationRef.current++;
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (clientRef.current) {
      try {
        clientRef.current.end(true);
      } catch {
        // Ignore cleanup errors
      }
      clientRef.current = null;
    }
    batchRef.current.clear();
    connectingRef.current = false;
    hasReceivedDataRef.current = false;
    setIsStreaming(false);
    useLiveStore.getState().setStreaming(false);
  }, []);

  const connect = useCallback(async () => {
    if (clientRef.current || connectingRef.current) return;
    connectingRef.current = true;
    installWsRejectionGuard();
    const generation = generationRef.current;

    const token = await fetchToken();
    if (generation !== generationRef.current) return; // disconnected while fetching
    if (!token) {
      console.log("[LocationStream] No token available, falling back to polling");
      connectingRef.current = false;
      return;
    }

    try {
      const mqttModule = await import("mqtt");
      if (generation !== generationRef.current) return; // disconnected while loading
      const mqttConnect = mqttModule.connect || mqttModule.default?.connect;

      const client = mqttConnect("wss://mqtt.openf1.org:8084/mqtt", {
        username: "f1-dashboard",
        password: token,
        protocolVersion: 5,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
        clean: true,
      });

      clientRef.current = client;

      client.on("connect", () => {
        console.log("[LocationStream] Connected to MQTT broker");
        connectingRef.current = false;
        // Don't set isStreaming here — wait for actual data to arrive.
        // This prevents SSE from skipping location polling when MQTT is
        // connected but no messages are flowing (e.g. session not started).

        client.subscribe("v1/location", { qos: 0 }, (err: Error | null) => {
          if (err) {
            console.error("[LocationStream] Subscribe error:", err);
          } else {
            console.log("[LocationStream] Subscribed to v1/location");
          }
        });

        if (!flushTimerRef.current) {
          flushTimerRef.current = setInterval(flushBatch, BATCH_INTERVAL_MS);
        }
      });

      client.on("message", (_topic: string, payload: Buffer) => {
        try {
          const msg: MqttLocationMessage = JSON.parse(payload.toString());
          if (sessionKeyRef.current && msg.session_key !== sessionKeyRef.current) return;
          batchRef.current.set(msg.driver_number, msg);

          // Mark as streaming only after first real data arrives
          if (!hasReceivedDataRef.current) {
            hasReceivedDataRef.current = true;
            setIsStreaming(true);
            useLiveStore.getState().setStreaming(true);
            console.log("[LocationStream] Receiving data, switching to stream mode");
          }
        } catch {
          // Ignore malformed messages
        }
      });

      client.on("error", (err: Error) => {
        console.error("[LocationStream] MQTT error:", err);
      });

      client.on("close", () => {
        setIsStreaming(false);
        useLiveStore.getState().setStreaming(false);
      });

      client.on("reconnect", () => {
        console.log("[LocationStream] Reconnecting...");
        fetchToken().then((newToken) => {
          if (newToken && clientRef.current) {
            // Update password for reconnection attempt
            clientRef.current.options.password = newToken;
          }
        });
      });
    } catch (err) {
      console.error("[LocationStream] Failed to initialize MQTT:", err);
      connectingRef.current = false;
    }
   
  }, [fetchToken, flushBatch]);

  useEffect(() => {
    if (enabled && sessionKey) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [enabled, sessionKey, connect, disconnect]);

  return { isStreaming };
}
