"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { LiveDashboardLayout } from "@/components/layout/LiveDashboardLayout";
import { SessionSelector } from "@/components/layout/SessionSelector";
import { TimingTower } from "@/components/live/TimingTower";
import { TrackMap } from "@/components/live/TrackMap";
import { TelemetryPanel } from "@/components/live/TelemetryPanel";
import { RaceInfo } from "@/components/live/RaceInfo";
import { ReplayControls } from "@/components/live/ReplayControls";
import { useLiveStore } from "@/stores/liveStore";
import { useReplayStore } from "@/stores/replayStore";
import { useLiveData } from "@/hooks/useLiveData";
import { useReplayData } from "@/hooks/useReplayData";
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

  const { isReplayMode, currentLap, totalLaps } = useReplayStore();

  // Live data polling (disabled in replay mode)
  useLiveData({
    enabled: sessionKey !== null && !isReplayMode,
    sessionKey,
  });

  // Replay data management
  const { loadSession, isLoading: isReplayLoading } = useReplayData({
    sessionKey,
  });

  // Build telemetry array for selected drivers
  const selectedTelemetry: DriverTelemetry[] = selectedDrivers
    .map((code) => telemetry[code])
    .filter((t): t is DriverTelemetry => t !== undefined);

  // Lap count - use replay lap or estimate from data
  const lapCount = isReplayMode
    ? { current: currentLap, total: totalLaps }
    : timing.length > 0
    ? { current: timing[0]?.pitStops ? timing.length : 1, total: 0 }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header
        sessionName={
          currentSession
            ? `${currentSession.meetingName} - ${currentSession.sessionName}`
            : undefined
        }
        isLive={currentSession?.status === "live" && !isReplayMode}
      />

      <LiveDashboardLayout
        raceControlMessages={
          <div className="flex items-center gap-4 w-full">
            <SessionSelector
              currentSessionKey={sessionKey}
              onSessionChange={(key) => {
                setSessionKey(key);
                // Reset replay when changing session
                if (isReplayMode) {
                  useReplayStore.getState().disableReplayMode();
                }
              }}
            />

            {sessionKey && (
              <ReplayControls
                onLoadReplay={loadSession}
                isLoading={isReplayLoading}
              />
            )}

            {!isConnected && sessionKey && !isReplayMode && (
              <span className="text-yellow-500 text-sm">Connecting...</span>
            )}

            {raceControl.length > 0 && (
              <div className="flex-1 overflow-hidden">
                <div className="flex gap-8 animate-marquee whitespace-nowrap">
                  {raceControl.slice(0, 5).map((msg, i) => (
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
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
              {isReplayLoading
                ? "Loading race data..."
                : sessionKey
                ? "Loading timing data..."
                : "Select a session to view data"}
            </div>
          )
        }
        trackMap={
          <TrackMap
            trackId={currentSession?.circuitShortName || "track"}
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
