"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { LiveDashboardLayout } from "@/components/layout/LiveDashboardLayout";
import { SessionSelector } from "@/components/layout/SessionSelector";
import { TimingTower } from "@/components/live/TimingTower";
import { TrackMap3D } from "@/components/live/TrackMap3D";
import { TelemetryPanel } from "@/components/live/TelemetryPanel";
import { RaceInfo } from "@/components/live/RaceInfo";
import { ReplayController } from "@/components/live/ReplayController";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { useLiveStore } from "@/stores/liveStore";
import { useDebugStore } from "@/stores/debugStore";
import { useReplayStore } from "@/stores/replayStore";
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
  const {
    isReplayMode,
    isLoading: replayLoading,
    sessionType: replaySessionType,
    sessionStartTime: replaySessionStartTime,
    lapSnapshots: replayLapSnapshots,
    currentLap: replayCurrentLap,
  } = useReplayStore();

  // Live data polling (disabled when in replay mode)
  useLiveData({
    enabled: sessionKey !== null,
    sessionKey,
    replayMode: debugEnabled,
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
  const sessionNameLower = sessionName.toLowerCase();
  const sessionTypeName = currentSession?.sessionType || "";
  const sessionTypeNameLower = sessionTypeName.toLowerCase();

  // Also check replay store's session type (for replay mode)
  const replaySessionTypeLower = (replaySessionType || "").toLowerCase();

  // Check if it's a qualifying session (including sprint qualifying)
  // OpenF1 API returns sessionType values like "Qualifying", "Sprint Qualifying"
  // Also handle short codes like "Q", "SQ"
  const isQualifyingSession =
    sessionNameLower.includes("qualifying") ||
    sessionNameLower.includes("qual") ||
    sessionTypeNameLower.includes("qualifying") ||
    sessionTypeNameLower === "qualifying" ||
    sessionTypeNameLower === "q" ||
    sessionTypeNameLower === "sq" ||
    sessionTypeName === "Q" ||
    sessionTypeName === "SQ" ||
    // Also check replay store's session type
    replaySessionTypeLower.includes("qualifying") ||
    replaySessionTypeLower.includes("shootout");

  // Check if it's a race session (but not sprint qualifying/shootout)
  const isRaceSession =
    ((sessionNameLower.includes("race") || sessionNameLower.includes("sprint")) &&
      !sessionNameLower.includes("qualifying") &&
      !sessionNameLower.includes("qual") &&
      !sessionNameLower.includes("shootout")) ||
    ((replaySessionTypeLower.includes("race") || replaySessionTypeLower.includes("sprint")) &&
      !replaySessionTypeLower.includes("qualifying") &&
      !replaySessionTypeLower.includes("shootout"));

  // When in replay mode, always use detected session type (not simulated)
  // Otherwise, use debug simulated type if enabled, or detect from session
  const sessionType: "race" | "qualifying" | "practice" =
    isReplayMode
      ? (isRaceSession ? "race" : isQualifyingSession ? "qualifying" : "practice")
      : debugEnabled && simulatedSessionType
        ? (simulatedSessionType === "sprint" ? "race" : simulatedSessionType)
        : isRaceSession
          ? "race"
          : isQualifyingSession
            ? "qualifying"
            : "practice";

  // Get year from session for knockout rules
  const sessionYear = currentSession?.year || new Date().getFullYear();

  // Get current snapshot for qualifying round and time calculations
  const currentSnapshot = isReplayMode && replayLapSnapshots.length > 0
    ? replayLapSnapshots[replayCurrentLap]
    : null;

  // Get qualifying round from snapshot (detected from race control messages)
  const snapshotQualifyingRound = currentSnapshot?.qualifyingRound;

  // Detect qualifying round from live race control messages
  const detectQualifyingRoundFromMessages = (): "Q1" | "Q2" | "Q3" | "SQ1" | "SQ2" | "SQ3" | null => {
    if (raceControl.length === 0) return null;

    const isSprintSession = sessionNameLower.includes("sprint") ||
      sessionNameLower.includes("shootout") ||
      replaySessionTypeLower.includes("sprint") ||
      replaySessionTypeLower.includes("shootout");

    // Search from newest to oldest message
    for (const rc of raceControl) {
      const msg = rc.message?.toUpperCase() || "";
      // Check for explicit round mentions
      if (msg.includes("Q3") && !msg.includes("SQ3")) {
        return isSprintSession ? "SQ3" : "Q3";
      } else if (msg.includes("SQ3")) {
        return "SQ3";
      } else if (msg.includes("Q2") && !msg.includes("SQ2")) {
        return isSprintSession ? "SQ2" : "Q2";
      } else if (msg.includes("SQ2")) {
        return "SQ2";
      } else if (msg.includes("Q1") && !msg.includes("SQ1")) {
        return isSprintSession ? "SQ1" : "Q1";
      } else if (msg.includes("SQ1")) {
        return "SQ1";
      }
    }
    return null;
  };

  const liveQualifyingRound = detectQualifyingRoundFromMessages();

  // Determine qualifying round - prefer snapshot (replay), then live detection, then fallback
  const qualifyingRound: "Q1" | "Q2" | "Q3" | "SQ1" | "SQ2" | "SQ3" | null = sessionType === "qualifying"
    ? snapshotQualifyingRound || liveQualifyingRound || (
        sessionNameLower.includes("sprint") || sessionNameLower.includes("shootout") ||
        replaySessionTypeLower.includes("sprint") || replaySessionTypeLower.includes("shootout")
          ? "SQ1" : "Q1"
      )
    : null;

  // Session durations in milliseconds
  const getSessionDuration = (): number => {
    // Practice sessions: 60 minutes
    if (sessionType === "practice") return 60 * 60 * 1000;

    // Qualifying durations depend on round
    if (sessionType === "qualifying" && qualifyingRound) {
      switch (qualifyingRound) {
        case "Q1": return 18 * 60 * 1000;
        case "Q2": return 15 * 60 * 1000;
        case "Q3": return 12 * 60 * 1000;
        case "SQ1": return 12 * 60 * 1000;
        case "SQ2": return 10 * 60 * 1000;
        case "SQ3": return 8 * 60 * 1000;
      }
    }

    return 60 * 60 * 1000; // Default 60 minutes
  };

  // Calculate remaining time for practice/qualifying sessions (countdown)
  const calculateRemainingTime = (): string | undefined => {
    if (!isReplayMode || !replaySessionStartTime || replayLapSnapshots.length === 0) return undefined;
    if (!currentSnapshot?.timestamp) return undefined;

    const startMs = new Date(replaySessionStartTime).getTime();
    const currentMs = new Date(currentSnapshot.timestamp).getTime();
    const elapsedMs = Math.max(0, currentMs - startMs);

    // For practice, calculate from session start
    // For qualifying, this is approximate since rounds have breaks between them
    const durationMs = getSessionDuration();
    const remainingMs = Math.max(0, durationMs - elapsedMs);

    const totalMinutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);

    // If time has run out, show 0:00
    if (remainingMs <= 0) return "0:00";

    return `${totalMinutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const remainingTime = calculateRemainingTime();

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

            {!isConnected && sessionKey && !isReplayMode && !replayLoading && (
              <span className="text-yellow-500 text-sm">Connecting...</span>
            )}
            {replayLoading && (
              <span className="text-primary text-sm">Loading replay...</span>
            )}
            {isReplayMode && (
              <span className="text-green-500 text-sm">Replay Mode</span>
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
              qualifyingRound={qualifyingRound}
              year={sessionYear}
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
            remainingTime={remainingTime}
            sessionType={sessionType}
            qualifyingRound={qualifyingRound}
            weather={weather}
            trackStatus={trackStatus}
            recentMessages={raceControl.slice(0, 10)}
          />
        }
        telemetryPanel={<TelemetryPanel drivers={selectedTelemetry} />}
      />

      {/* Replay Controller - shown when debug mode is enabled and a session is selected */}
      {debugEnabled && sessionKey && (
        <ReplayController
          sessionKey={sessionKey}
          onClose={() => {
            useReplayStore.getState().reset();
          }}
        />
      )}
    </div>
  );
}
