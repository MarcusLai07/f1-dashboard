"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  Loader2,
} from "lucide-react";
import { useReplayStore, getCurrentSnapshot } from "@/stores/replayStore";
import { useLiveStore } from "@/stores/liveStore";

interface ReplayControllerProps {
  sessionKey: number;
  onClose?: () => void;
}

export function ReplayController({ sessionKey, onClose }: ReplayControllerProps) {
  const {
    isReplayMode,
    isPlaying,
    playbackSpeed,
    currentLap,
    totalLaps,
    lapSnapshots,
    sessionType,
    sessionStartTime,
    isLoading,
    error,
    setPlaying,
    setPlaybackSpeed,
    setCurrentLap,
    nextLap,
    prevLap,
    loadSession,
    reset,
  } = useReplayStore();

  // Determine if this is a time-based session (practice/qualifying)
  const isTimedSession = sessionType
    ? sessionType.toLowerCase().includes("practice") ||
      sessionType.toLowerCase().includes("qualifying") ||
      sessionType.toLowerCase().includes("shootout")
    : false;

  // Calculate elapsed time for current snapshot
  const getCurrentElapsedTime = () => {
    if (!sessionStartTime || lapSnapshots.length === 0) return null;
    const currentSnapshot = lapSnapshots[currentLap];
    if (!currentSnapshot?.timestamp) return null;

    const startMs = new Date(sessionStartTime).getTime();
    const currentMs = new Date(currentSnapshot.timestamp).getTime();
    const elapsedMs = Math.max(0, currentMs - startMs);

    const totalMinutes = Math.floor(elapsedMs / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);
    return `${totalMinutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Get session duration label
  const getSessionDurationLabel = () => {
    if (!sessionType) return "";
    const typeLower = sessionType.toLowerCase();
    if (typeLower.includes("practice 1") || typeLower === "fp1") return "60:00";
    if (typeLower.includes("practice 2") || typeLower === "fp2") return "60:00";
    if (typeLower.includes("practice 3") || typeLower === "fp3") return "60:00";
    if (typeLower.includes("qualifying") && !typeLower.includes("sprint")) return "Q1-Q2-Q3";
    if (typeLower.includes("sprint") && typeLower.includes("qualifying")) return "SQ1-SQ2-SQ3";
    if (typeLower.includes("shootout")) return "SQ1-SQ2-SQ3";
    return "";
  };

  const elapsedTime = getCurrentElapsedTime();
  const durationLabel = getSessionDurationLabel();

  const { updateTiming, setConnected, updateWeather, updateTrackStatus } = useLiveStore();
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load session data when component mounts
  useEffect(() => {
    if (sessionKey) {
      loadSession(sessionKey);
    }
    return () => {
      // Don't reset on unmount - keep state for resuming
    };
  }, [sessionKey, loadSession]);

  // Update timing data in liveStore when lap changes
  useEffect(() => {
    const snapshot = getCurrentSnapshot(useReplayStore.getState());
    if (snapshot) {
      updateTiming(snapshot.timing);
      setConnected(true);

      // Update weather if available
      if (snapshot.weather) {
        updateWeather(snapshot.weather);
      }

      // Update track status if available
      if (snapshot.trackStatus) {
        updateTrackStatus(snapshot.trackStatus);
      }

      // Update race control messages in liveStore
      if (snapshot.raceControl && snapshot.raceControl.length > 0) {
        useLiveStore.setState((state) => ({
          raceControl: [
            ...snapshot.raceControl,
            ...state.raceControl.filter(
              (existing) => !snapshot.raceControl.some((rc) => rc.timestamp === existing.timestamp && rc.message === existing.message)
            ),
          ].slice(0, 50),
        }));
      }
    }
  }, [currentLap, lapSnapshots, updateTiming, setConnected, updateWeather, updateTrackStatus]);

  // Handle playback
  useEffect(() => {
    if (isPlaying && totalLaps > 0) {
      // Calculate interval based on playback speed
      // Base interval: 2 seconds per lap (adjust as needed)
      const baseInterval = 2000;
      const interval = baseInterval / playbackSpeed;

      playIntervalRef.current = setInterval(() => {
        nextLap();
      }, interval);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, nextLap, totalLaps]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setPlaying(!isPlaying);
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevLap();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextLap();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, setPlaying, prevLap, nextLap]);

  const handleSliderChange = useCallback(
    (value: number[]) => {
      setCurrentLap(value[0]);
    },
    [setCurrentLap]
  );

  const cycleSpeed = () => {
    const speeds = [0.5, 1, 2, 4, 8];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  if (isLoading) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur border border-border rounded-lg p-4 shadow-xl flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading session replay data...</span>
      </div>
    );
  }

  if (error) {
    const isRateLimit = error.includes("Rate limited") || error.includes("429");
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur border border-destructive/50 rounded-lg p-4 shadow-xl max-w-md">
        <p className="text-sm text-destructive">{error}</p>
        {isRateLimit && (
          <p className="text-xs text-muted-foreground mt-1">
            OpenF1 has rate limits. Wait 5-10 seconds before retrying.
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => loadSession(sessionKey)}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!isReplayMode || totalLaps === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur border border-border rounded-lg p-4 shadow-xl min-w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary">REPLAY MODE</span>
          {isTimedSession && elapsedTime ? (
            <span className="text-xs text-muted-foreground">
              {elapsedTime} {durationLabel && `• ${durationLabel}`}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Lap {currentLap + 1} / {totalLaps}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => {
            reset();
            onClose?.();
          }}
        >
          Exit Replay
        </Button>
      </div>

      {/* Progress slider */}
      <div className="mb-3">
        <Slider
          value={[currentLap]}
          onValueChange={handleSliderChange}
          max={totalLaps - 1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          {isTimedSession ? (
            <>
              <span className="text-[10px] text-muted-foreground">Start</span>
              <span className="text-[10px] text-muted-foreground">
                {totalLaps} snapshots
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-muted-foreground">Lap 1</span>
              <span className="text-[10px] text-muted-foreground">Lap {totalLaps}</span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {/* Skip to start */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setCurrentLap(0)}
          title={isTimedSession ? "Jump to start" : "First lap"}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={prevLap}
          disabled={currentLap === 0}
          title={isTimedSession ? "Previous (Left arrow)" : "Previous lap (Left arrow)"}
        >
          <SkipBack className="h-3 w-3" />
        </Button>

        {/* Play/Pause */}
        <Button
          variant={isPlaying ? "secondary" : "default"}
          size="sm"
          className="h-10 w-10 p-0"
          onClick={() => setPlaying(!isPlaying)}
          title="Play/Pause (Space)"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={nextLap}
          disabled={currentLap === totalLaps - 1}
          title={isTimedSession ? "Next (Right arrow)" : "Next lap (Right arrow)"}
        >
          <SkipForward className="h-3 w-3" />
        </Button>

        {/* Skip to end */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setCurrentLap(totalLaps - 1)}
          title={isTimedSession ? "Jump to end" : "Last lap"}
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Speed control */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 ml-2 text-xs gap-1"
          onClick={cycleSpeed}
          title="Change playback speed"
        >
          <FastForward className="h-3 w-3" />
          {playbackSpeed}x
        </Button>
      </div>

      {/* Keyboard hints */}
      <div className="mt-3 pt-2 border-t border-border flex justify-center gap-4 text-[10px] text-muted-foreground">
        <span>Space: Play/Pause</span>
        <span>←→: {isTimedSession ? "Step Back/Forward" : "Prev/Next Lap"}</span>
      </div>
    </div>
  );
}
