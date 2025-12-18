"use client";

import { useReplayStore } from "@/stores/replayStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReplayControlsProps {
  onLoadReplay: () => void;
  isLoading?: boolean;
}

export function ReplayControls({ onLoadReplay, isLoading }: ReplayControlsProps) {
  const {
    isReplayMode,
    isPlaying,
    playbackSpeed,
    currentLap,
    totalLaps,
    enableReplayMode,
    disableReplayMode,
    togglePlaying,
    setPlaybackSpeed,
    setCurrentLap,
    nextLap,
    prevLap,
  } = useReplayStore();

  if (!isReplayMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          enableReplayMode();
          onLoadReplay();
        }}
        disabled={isLoading}
        className="bg-purple-500/20 border-purple-500 text-purple-400 hover:bg-purple-500/30"
      >
        {isLoading ? "Loading..." : "Replay Mode"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-secondary/80 rounded-lg px-3 py-1.5">
      {/* Replay indicator */}
      <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
        Replay
      </span>

      <div className="w-px h-4 bg-border" />

      {/* Playback controls */}
      <div className="flex items-center gap-1">
        {/* Previous lap */}
        <button
          onClick={prevLap}
          disabled={currentLap <= 1}
          className="p-1 hover:bg-secondary rounded disabled:opacity-50"
          title="Previous lap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlaying}
          className="p-1.5 hover:bg-secondary rounded bg-primary/20"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next lap */}
        <button
          onClick={nextLap}
          disabled={currentLap >= totalLaps}
          className="p-1 hover:bg-secondary rounded disabled:opacity-50"
          title="Next lap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Lap indicator */}
      <div className="flex items-center gap-1.5 min-w-[80px]">
        <span className="text-xs text-muted-foreground">Lap</span>
        <span className="font-mono font-bold text-sm">
          {currentLap}
          <span className="text-muted-foreground">/{totalLaps}</span>
        </span>
      </div>

      {/* Lap slider */}
      <input
        type="range"
        min={1}
        max={totalLaps || 1}
        value={currentLap}
        onChange={(e) => setCurrentLap(parseInt(e.target.value))}
        className="w-24 h-1 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
      />

      <div className="w-px h-4 bg-border" />

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        {[1, 2, 4, 8].map((speed) => (
          <button
            key={speed}
            onClick={() => setPlaybackSpeed(speed)}
            className={cn(
              "px-1.5 py-0.5 text-xs font-mono rounded",
              playbackSpeed === speed
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            {speed}x
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Exit replay */}
      <button
        onClick={disableReplayMode}
        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
        title="Exit replay"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
