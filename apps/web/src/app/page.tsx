"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { LiveDashboardLayout } from "@/components/layout/LiveDashboardLayout";
import { SessionSelector } from "@/components/layout/SessionSelector";
import { TimingTower } from "@/components/live/TimingTower";
import { TrackMap } from "@/components/live/TrackMap";
import { TelemetryPanel } from "@/components/live/TelemetryPanel";
import { RaceInfo } from "@/components/live/RaceInfo";
import { useLiveStore } from "@/stores/liveStore";
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

  // Enable live data polling when we have a session
  useLiveData({
    enabled: sessionKey !== null,
    sessionKey,
  });

  // Build telemetry array for selected drivers
  const selectedTelemetry: DriverTelemetry[] = selectedDrivers
    .map((code) => telemetry[code])
    .filter((t): t is DriverTelemetry => t !== undefined);

  // Calculate lap count from timing data (estimate based on leader's lap)
  const leaderTiming = timing.find((t) => t.position === 1);
  const lapCount = leaderTiming
    ? { current: Math.floor(leaderTiming.lastLap ? timing.length : 1), total: 0 }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header
        sessionName={
          currentSession
            ? `${currentSession.meetingName} - ${currentSession.sessionName}`
            : undefined
        }
        isLive={currentSession?.status === "live"}
      />

      <LiveDashboardLayout
        raceControlMessages={
          <div className="flex items-center gap-4 w-full">
            <SessionSelector
              currentSessionKey={sessionKey}
              onSessionChange={setSessionKey}
            />
            {!isConnected && sessionKey && (
              <span className="text-yellow-500 text-sm">Connecting...</span>
            )}
            {raceControl.length > 0 && (
              <div className="flex-1 overflow-hidden">
                <div className="animate-marquee whitespace-nowrap">
                  {raceControl.slice(0, 5).map((msg, i) => (
                    <span key={i} className="mx-4 text-sm">
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
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {sessionKey ? "Loading timing data..." : "Select a session"}
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
