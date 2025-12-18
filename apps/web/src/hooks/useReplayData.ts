"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useReplayStore } from "@/stores/replayStore";
import { useLiveStore } from "@/stores/liveStore";

interface UseReplayDataOptions {
  sessionKey: number | null;
}

export function useReplayData({ sessionKey }: UseReplayDataOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isReplayMode,
    isPlaying,
    playbackSpeed,
    currentLap,
    totalLaps,
    allLapsData,
    allPositionsData,
    allRaceControlData,
    weatherData,
    loadReplayData,
    nextLap,
  } = useReplayStore();

  const {
    updateTiming,
    updatePositions,
    addRaceControlMessage,
    updateWeather,
    setConnected,
  } = useLiveStore();

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shownRaceControlMessages = useRef<Set<string>>(new Set());

  // Load replay data for a session
  const loadSession = useCallback(async () => {
    if (!sessionKey) return;

    setIsLoading(true);
    setError(null);
    shownRaceControlMessages.current.clear();

    try {
      const response = await fetch(`/api/live/replay?session_key=${sessionKey}`);
      if (!response.ok) {
        throw new Error("Failed to load replay data");
      }

      const data = await response.json();

      // Convert to Maps
      const lapsMap = new Map<number, any[]>();
      for (const [lap, lapData] of Object.entries(data.lapsData)) {
        lapsMap.set(parseInt(lap), lapData as any[]);
      }

      const positionsMap = new Map<number, any[]>();
      for (const [lap, posData] of Object.entries(data.positionsData)) {
        positionsMap.set(parseInt(lap), posData as any[]);
      }

      loadReplayData({
        lapsData: lapsMap,
        positionsData: positionsMap,
        raceControlData: data.raceControlData,
        weather: data.weather,
        totalLaps: data.totalLaps,
      });

      // Set weather immediately
      if (data.weather) {
        updateWeather(data.weather);
      }

      setConnected(true);
    } catch (err) {
      console.error("Failed to load replay:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [sessionKey, loadReplayData, updateWeather, setConnected]);

  // Update display data when current lap changes
  useEffect(() => {
    if (!isReplayMode || totalLaps === 0) return;

    // Get timing data for current lap
    const lapTiming = allLapsData.get(currentLap);
    if (lapTiming && lapTiming.length > 0) {
      // Calculate best laps
      const bestLaps = new Map<string, number>();
      let overallBest: { code: string; time: number } | null = null;

      // Look through all laps up to current to find bests
      for (let lap = 1; lap <= currentLap; lap++) {
        const lapData = allLapsData.get(lap);
        if (!lapData) continue;

        for (const driver of lapData) {
          if (driver.lastLap) {
            const currentBest = bestLaps.get(driver.driverCode);
            if (!currentBest || driver.lastLap < currentBest) {
              bestLaps.set(driver.driverCode, driver.lastLap);
            }
            if (!overallBest || driver.lastLap < overallBest.time) {
              overallBest = { code: driver.driverCode, time: driver.lastLap };
            }
          }
        }
      }

      // Add best lap info to timing data
      const timingWithBests = lapTiming.map((t) => ({
        ...t,
        bestLap: bestLaps.get(t.driverCode) ?? null,
        isOverallBest: overallBest?.code === t.driverCode && t.lastLap === overallBest?.time,
      }));

      updateTiming(timingWithBests);
    }

    // Get position data for current lap
    const lapPositions = allPositionsData.get(currentLap);
    if (lapPositions) {
      updatePositions(lapPositions);
    }

    // Show race control messages up to current lap
    for (const msg of allRaceControlData) {
      if (msg.lapNumber && msg.lapNumber <= currentLap) {
        const msgKey = `${msg.timestamp}-${msg.message}`;
        if (!shownRaceControlMessages.current.has(msgKey)) {
          shownRaceControlMessages.current.add(msgKey);
          addRaceControlMessage(msg);
        }
      }
    }
  }, [
    isReplayMode,
    currentLap,
    totalLaps,
    allLapsData,
    allPositionsData,
    allRaceControlData,
    updateTiming,
    updatePositions,
    addRaceControlMessage,
  ]);

  // Handle auto-playback
  useEffect(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

    if (isReplayMode && isPlaying && currentLap < totalLaps) {
      // Base interval is 2 seconds per lap, divided by playback speed
      const intervalMs = 2000 / playbackSpeed;

      playbackIntervalRef.current = setInterval(() => {
        nextLap();
      }, intervalMs);
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isReplayMode, isPlaying, playbackSpeed, currentLap, totalLaps, nextLap]);

  return {
    loadSession,
    isLoading,
    error,
  };
}
