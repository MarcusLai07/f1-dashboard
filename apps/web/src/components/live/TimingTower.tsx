"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatLapTime, formatGap, TYRE_COLORS, TYRE_SHORT } from "@/lib/constants";
import type { DriverTiming, TyreCompound } from "@/types/f1";

interface TimingTowerProps {
  drivers: DriverTiming[];
  selectedDrivers?: string[];
  onDriverSelect?: (code: string) => void;
  sessionType?: "race" | "qualifying" | "practice";
}

// Track previous positions for animation
const previousPositions = new Map<string, number>();

export function TimingTower({
  drivers,
  selectedDrivers = [],
  onDriverSelect,
  sessionType = "race",
}: TimingTowerProps) {
  const isRace = sessionType === "race";

  // Update position tracking
  useEffect(() => {
    drivers.forEach((driver) => {
      previousPositions.set(driver.driverCode, driver.position);
    });
  }, [drivers]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={cn(
        "grid gap-2 px-3 py-2 text-[11px] font-semibold text-muted-foreground border-b border-border bg-zinc-900/80 uppercase tracking-wider sticky top-0 z-10",
        isRace
          ? "grid-cols-[36px_90px_72px_72px_64px_64px_64px_48px_40px]"
          : "grid-cols-[36px_90px_80px_80px_64px_64px_64px_48px_40px]"
      )}>
        <span className="text-center">Pos</span>
        <span>Driver</span>
        <span className="text-right">{isRace ? "Interval" : "Last"}</span>
        <span className="text-right">{isRace ? "Gap" : "Best"}</span>
        <span className="text-right">S1</span>
        <span className="text-right">S2</span>
        <span className="text-right">S3</span>
        <span className="text-center">Tyre</span>
        <span className="text-center">{isRace ? "Pit" : "Age"}</span>
      </div>

      {/* Driver Rows */}
      <div className="flex flex-col overflow-y-auto flex-1">
        {drivers.map((driver, index) => (
          <TimingRow
            key={driver.driverCode}
            driver={driver}
            isSelected={selectedDrivers.includes(driver.driverCode)}
            onClick={() => onDriverSelect?.(driver.driverCode)}
            isRace={isRace}
            prevDriver={index > 0 ? drivers[index - 1] : null}
            previousPosition={previousPositions.get(driver.driverCode)}
          />
        ))}
      </div>
    </div>
  );
}

interface TimingRowProps {
  driver: DriverTiming;
  isSelected: boolean;
  onClick: () => void;
  isRace: boolean;
  prevDriver: DriverTiming | null;
  previousPosition?: number;
}

function TimingRow({ driver, isSelected, onClick, isRace, prevDriver, previousPosition }: TimingRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isInPit = driver.status === "PIT";
  const isOut = driver.status === "OUT";

  // Calculate interval to car ahead
  const interval = prevDriver && driver.gap && prevDriver.gap
    ? driver.gap - prevDriver.gap
    : driver.interval;

  // Determine position change
  const positionChange = previousPosition !== undefined ? previousPosition - driver.position : 0;
  const gainedPositions = positionChange > 0;
  const lostPositions = positionChange < 0;

  // Animate on position change
  useEffect(() => {
    if (rowRef.current && positionChange !== 0) {
      import("animejs").then(({ animate }) => {
        const flashColor = gainedPositions
          ? "rgba(34, 197, 94, 0.25)"
          : "rgba(239, 68, 68, 0.25)";

        animate(rowRef.current!, {
          backgroundColor: [flashColor, "rgba(0,0,0,0)"],
          duration: 1000,
          easing: "easeOutQuad",
        });
      });
    }
  }, [driver.position, positionChange, gainedPositions]);

  return (
    <div
      ref={rowRef}
      className={cn(
        "grid gap-2 px-3 py-1.5 items-center cursor-pointer border-b border-zinc-800/50 transition-all duration-200",
        isRace
          ? "grid-cols-[36px_90px_72px_72px_64px_64px_64px_48px_40px]"
          : "grid-cols-[36px_90px_80px_80px_64px_64px_64px_48px_40px]",
        isSelected && "bg-zinc-700/50 ring-1 ring-zinc-600",
        isOut && "opacity-40",
        isInPit && "bg-yellow-500/5",
        !isSelected && !isOut && "hover:bg-zinc-800/50"
      )}
      onClick={onClick}
    >
      {/* Position */}
      <div className="flex items-center justify-center relative">
        <span
          className={cn(
            "w-7 h-7 flex items-center justify-center font-bold text-sm rounded",
            driver.position === 1 && "bg-yellow-500 text-black",
            driver.position === 2 && "bg-zinc-400 text-black",
            driver.position === 3 && "bg-amber-700 text-white",
            driver.position > 3 && "bg-zinc-800 text-white"
          )}
        >
          {driver.position}
        </span>
        {/* Position change indicator */}
        {positionChange !== 0 && (
          <span
            className={cn(
              "absolute -right-1 -top-1 text-[10px] font-bold",
              gainedPositions && "text-green-400",
              lostPositions && "text-red-400"
            )}
          >
            {gainedPositions ? `▲${positionChange}` : `▼${Math.abs(positionChange)}`}
          </span>
        )}
      </div>

      {/* Driver */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div
          className="w-1 h-6 rounded-sm flex-shrink-0"
          style={{ backgroundColor: driver.teamColor }}
        />
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm truncate">{driver.driverCode}</span>
          <span className="text-[10px] text-zinc-500 font-mono">{driver.driverNumber}</span>
        </div>
      </div>

      {/* Interval / Last Lap */}
      <div className="text-right">
        {isRace ? (
          <span className={cn(
            "font-mono text-sm",
            driver.position === 1 ? "text-zinc-500" : "text-zinc-300"
          )}>
            {driver.position === 1 ? "—" : formatInterval(interval)}
          </span>
        ) : (
          <LapTimeCell
            time={driver.lastLap}
            isOverallBest={driver.isOverallBest}
            isPersonalBest={driver.isPersonalBest}
            isInPit={isInPit}
          />
        )}
      </div>

      {/* Gap / Best Lap */}
      <div className="text-right">
        {isRace ? (
          <span className={cn(
            "font-mono text-sm",
            driver.position === 1 ? "text-zinc-500" : "text-zinc-300"
          )}>
            {driver.position === 1 ? "Leader" : formatGap(driver.gap)}
          </span>
        ) : (
          <LapTimeCell time={driver.bestLap} isOverallBest={false} isPersonalBest={false} />
        )}
      </div>

      {/* Sector 1 */}
      <SectorCell
        time={driver.sector1}
        isOverallBest={false}
        isPersonalBest={false}
      />

      {/* Sector 2 */}
      <SectorCell
        time={driver.sector2}
        isOverallBest={false}
        isPersonalBest={false}
      />

      {/* Sector 3 */}
      <SectorCell
        time={driver.sector3}
        isOverallBest={false}
        isPersonalBest={false}
      />

      {/* Tyre */}
      <div className="flex items-center justify-center">
        <TyreIndicator compound={driver.tyre.compound} age={driver.tyre.age} />
      </div>

      {/* Pit Stops / Tyre Age */}
      <span className="text-center font-mono text-sm text-zinc-400">
        {isRace ? driver.pitStops : driver.tyre.age}
      </span>
    </div>
  );
}

interface LapTimeCellProps {
  time: number | null | undefined;
  isOverallBest: boolean;
  isPersonalBest: boolean;
  isInPit?: boolean;
}

function LapTimeCell({ time, isOverallBest, isPersonalBest, isInPit }: LapTimeCellProps) {
  if (isInPit) {
    return (
      <span className="font-mono px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold">
        IN PIT
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-mono text-sm",
        isOverallBest && "text-purple-400 font-semibold",
        isPersonalBest && !isOverallBest && "text-green-400",
        !isOverallBest && !isPersonalBest && "text-zinc-300"
      )}
    >
      {formatLapTime(time ?? null)}
    </span>
  );
}

interface SectorCellProps {
  time: number | null | undefined;
  isOverallBest: boolean;
  isPersonalBest: boolean;
}

function SectorCell({ time, isOverallBest, isPersonalBest }: SectorCellProps) {
  if (!time) {
    return <span className="text-right font-mono text-sm text-zinc-600">—</span>;
  }

  return (
    <span
      className={cn(
        "text-right font-mono text-sm",
        isOverallBest && "text-purple-400 font-semibold",
        isPersonalBest && !isOverallBest && "text-green-400",
        !isOverallBest && !isPersonalBest && "text-yellow-400"
      )}
    >
      {time.toFixed(3)}
    </span>
  );
}

interface TyreIndicatorProps {
  compound: TyreCompound;
  age?: number;
}

function TyreIndicator({ compound, age }: TyreIndicatorProps) {
  const color = TYRE_COLORS[compound] || "#808080";
  const short = TYRE_SHORT[compound] || "?";

  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
      style={{ backgroundColor: color, color: compound === "INTERMEDIATE" || compound === "WET" ? "#000" : "#fff" }}
      title={`${compound}${age !== undefined ? ` - ${age} laps` : ""}`}
    >
      {short}
    </div>
  );
}

function formatInterval(interval: number | null | undefined): string {
  if (interval === null || interval === undefined) return "—";
  if (interval < 1) return `+${interval.toFixed(3)}`;
  if (interval < 60) return `+${interval.toFixed(1)}`;
  const mins = Math.floor(interval / 60);
  const secs = (interval % 60).toFixed(1);
  return `+${mins}:${secs.padStart(4, '0')}`;
}
