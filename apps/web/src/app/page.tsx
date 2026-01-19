"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { LiveDashboardLayout } from "@/components/layout/LiveDashboardLayout";
import { SessionSelector } from "@/components/layout/SessionSelector";
import { TimingTower } from "@/components/live/TimingTower";
import { TrackMap3D } from "@/components/live/TrackMap3D";
import { TelemetryPanel } from "@/components/live/TelemetryPanel";
import { RaceInfo } from "@/components/live/RaceInfo";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { useLiveStore } from "@/stores/liveStore";
import { useDebugStore } from "@/stores/debugStore";
import { useLiveData } from "@/hooks/useLiveData";
import type { DriverTelemetry } from "@/types/f1";

export default function LiveDashboard() {
  const [sessionKey, setSessionKey] = useState<number | null>(null);

  const {
    currentSession,
    timing,
    positions,
    telemetry,
    raceControl,
    weather,
    trackStatus,
    selectedDrivers,
    toggleDriverSelection,
    isConnected,
  } = useLiveStore();

  const { enabled: debugEnabled, simulatedSessionType } = useDebugStore();

  // Live data polling
  useLiveData({
    enabled: sessionKey !== null,
    sessionKey,
  });

  // Build telemetry array for selected drivers
  const selectedTelemetry: DriverTelemetry[] = selectedDrivers
    .map((code) => telemetry[code])
    .filter((t): t is DriverTelemetry => t !== undefined);

  // Lap count from timing data
  const lapCount = timing.length > 0
    ? { current: timing[0]?.pitStops ? timing.length : 1, total: 0 }
    : undefined;

  // Session name from current session
  const displaySessionName = currentSession
    ? `${currentSession.meetingName} - ${currentSession.sessionName}`
    : undefined;

  // Circuit name for track map
  const circuitName = currentSession?.circuitShortName || "track";

  // Determine session type for timing tower display
  // Use debug session type if enabled, otherwise derive from session name
  const sessionName = currentSession?.sessionName || "";
  const sessionType: "race" | "qualifying" | "practice" = debugEnabled && simulatedSessionType
    ? (simulatedSessionType === "sprint" ? "race" : simulatedSessionType)
    : sessionName.toLowerCase().includes("race") || sessionName.toLowerCase().includes("sprint")
      ? "race"
      : sessionName.toLowerCase().includes("qualifying")
        ? "qualifying"
        : "practice";

  return (
    <div className="min-h-screen bg-background">
      <Header
        sessionName={displaySessionName}
        isLive={currentSession?.status === "live"}
      />

      {/* Debug Panel */}
      <DebugPanel mode="live" />

      <LiveDashboardLayout
        raceControlMessages={
          <div className="flex items-center gap-4 w-full">
            <SessionSelector
              currentSessionKey={sessionKey}
              onSessionChange={(key) => {
                setSessionKey(key);
                useLiveStore.setState({ raceControl: [], timing: [], positions: [] });
              }}
            />

            {!isConnected && sessionKey && (
              <span className="text-yellow-500 text-sm">Connecting...</span>
            )}

            {raceControl.length > 0 && (
              <div className="flex-1 overflow-hidden">
                <div className="flex gap-8 whitespace-nowrap">
                  {raceControl.slice(0, 3).map((msg, i) => (
                    <span key={i} className="text-sm">
                      <span className="text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      {" - "}
                      <span className={msg.flag ? "text-yellow-500" : ""}>
                        {msg.message}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        }
        timingTower={
          timing.length > 0 ? (
            <TimingTower
              drivers={timing}
              selectedDrivers={selectedDrivers}
              onDriverSelect={toggleDriverSelection}
              sessionType={sessionType}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
              {sessionKey
                ? "Loading timing data..."
                : "Select a session to view data"}
            </div>
          )
        }
        trackMap={
          <TrackMap3D
            trackName={circuitName}
            positions={positions}
            selectedDrivers={selectedDrivers}
          />
        }
        raceInfo={
          <RaceInfo
            lapCount={lapCount}
            sessionTime={
              currentSession?.startTime
                ? new Date(currentSession.startTime).toLocaleTimeString()
                : undefined
            }
            weather={weather}
            trackStatus={trackStatus}
            recentMessages={raceControl.slice(0, 10)}
          />
        }
        telemetryPanel={<TelemetryPanel drivers={selectedTelemetry} />}
      />
    </div>
  );
}
