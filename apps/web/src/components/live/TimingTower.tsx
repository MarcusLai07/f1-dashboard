"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  formatLapTime,
  formatGap,
  formatSectorTime,
  TYRE_COLORS,
  TYRE_SHORT,
  TIMING_COLORS,
  STATUS_COLORS,
} from "@/lib/constants";
import type { DriverTiming, TyreCompound } from "@/types/f1";

interface TimingTowerProps {
  drivers: DriverTiming[];
  selectedDrivers?: string[];
  onDriverSelect?: (code: string) => void;
  onTyreHistoryClick?: (driverCode: string) => void;
  sessionType?: "race" | "qualifying" | "practice";
  // Qualifying specific - supports both regular and sprint qualifying
  qualifyingRound?: "Q1" | "Q2" | "Q3" | "SQ1" | "SQ2" | "SQ3" | null;
  year?: number; // For determining knockout rules (2026+ has 22 drivers)
}

// Qualifying rules by year
// Returns [dropZoneStart, knockoutStart]
// - dropZoneStart: First position in the "at risk" zone for current round
// - knockoutStart: First position that is already eliminated (from previous rounds)
// Works the same for both regular Qualifying (Q1/Q2/Q3) and Sprint Qualifying (SQ1/SQ2/SQ3)
function getQualifyingZones(
  round: "Q1" | "Q2" | "Q3" | "SQ1" | "SQ2" | "SQ3",
  year: number,
  totalDrivers: number
): { dropZoneStart: number; knockoutStart: number } {
  const is2026Rules = year >= 2026 || totalDrivers > 20;
  const q1Cutoff = is2026Rules ? 17 : 16; // P17+ or P16+ eliminated after Q1/SQ1

  // Normalize round - SQ rounds follow same knockout rules as Q rounds
  const normalizedRound = round.replace("SQ", "Q") as "Q1" | "Q2" | "Q3";

  if (normalizedRound === "Q1") {
    // Q1/SQ1: P16/17+ are at risk, no one is KO yet
    return { dropZoneStart: q1Cutoff, knockoutStart: totalDrivers + 1 };
  } else if (normalizedRound === "Q2") {
    // Q2/SQ2: P11-P15/16 are at risk, P16/17+ are KO from Q1
    return { dropZoneStart: 11, knockoutStart: q1Cutoff };
  } else {
    // Q3/SQ3: No drop zone (top 10 fight for pole), P11+ are KO
    return { dropZoneStart: totalDrivers + 1, knockoutStart: 11 };
  }
}

interface PopoverState {
  driverCode: string;
  x: number;
  y: number;
  openUpward?: boolean; // If true, popover opens above the button
}

// =============================================================================
// Track previous positions for animation
// =============================================================================

const previousPositions = new Map<string, number>();

// =============================================================================
// Main Component
// =============================================================================

export function TimingTower({
  drivers,
  selectedDrivers = [],
  onDriverSelect,
  onTyreHistoryClick,
  sessionType = "practice",
  qualifyingRound,
  year = 2025,
}: TimingTowerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isRace = sessionType === "race";
  const isQualifying = sessionType === "qualifying";
  const showMiniSectors = !isRace; // Mini-sectors not available in race

  // Calculate drop zone and knockout positions for qualifying
  const { dropZoneStart, knockoutStart } = isQualifying && qualifyingRound
    ? getQualifyingZones(qualifyingRound, year, drivers.length)
    : { dropZoneStart: drivers.length + 1, knockoutStart: drivers.length + 1 };

  // State for tyre history popover
  const [popover, setPopover] = useState<PopoverState | null>(null);

  // Update position tracking
  useEffect(() => {
    drivers.forEach((driver) => {
      previousPositions.set(driver.driverCode, driver.position);
    });
  }, [drivers]);

  // Get driver info for tyre history popover
  const selectedDriver = popover
    ? drivers.find((d) => d.driverCode === popover.driverCode)
    : null;

  const handleTyreClick = useCallback((driverCode: string, buttonRect: DOMRect) => {
    setPopover((prev) => {
      if (prev?.driverCode === driverCode) {
        return null; // Toggle off
      }
      // Position popover to the right of the button
      const containerRect = containerRef.current?.getBoundingClientRect();
      const x = buttonRect.right - (containerRect?.left || 0) + 8;
      const y = buttonRect.top - (containerRect?.top || 0);

      // Check if popover would overflow the viewport bottom
      // Popover is ~300px tall, check if there's enough space below
      const popoverHeight = 300;
      const viewportHeight = window.innerHeight;
      const buttonBottom = buttonRect.bottom;
      const spaceBelow = viewportHeight - buttonBottom;
      const openUpward = spaceBelow < popoverHeight && buttonRect.top > popoverHeight;

      return { driverCode, x, y, openUpward };
    });
    onTyreHistoryClick?.(driverCode);
  }, [onTyreHistoryClick]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popover && containerRef.current) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-tyre-popover]') && !target.closest('[data-tyre-button]')) {
          setPopover(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popover]);

  return (
    <div ref={containerRef} className="relative flex h-full overflow-hidden bg-zinc-950 font-f1">
      {/* Main timing tower */}
      <div className="flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-2 py-1 text-[10px] font-bold text-zinc-500 border-b border-zinc-800 bg-zinc-900/90 uppercase tracking-wide sticky top-0 z-10">
          <span className="min-w-[100px] shrink-0 pl-1">Driver</span>
          {/* Gap and Interval columns - only in race */}
          {isRace && (
            <>
              <span className="min-w-[60px] shrink-0 text-right pr-2">Gap</span>
              <span className="min-w-[55px] shrink-0 text-right pr-2">Int</span>
            </>
          )}
          <span className="min-w-[70px] shrink-0 text-right pr-3">Last</span>
          <span className="min-w-[70px] shrink-0 text-right pr-3">Best</span>
          <span className={cn("shrink-0 text-center", isRace ? "min-w-[120px]" : "min-w-[55px]")}>
            {isRace ? "Tyres" : "Tyre"}
          </span>
          {/* Gap column - only in practice/qualifying */}
          {!isRace && (
            <span className="min-w-[60px] shrink-0 text-right pr-3">Gap</span>
          )}
          {/* Sector columns - width varies based on whether mini-sectors are shown */}
          <span className={cn("shrink-0 pl-2", isRace ? "min-w-[50px]" : "min-w-[110px]")}>S1</span>
          <span className={cn("shrink-0 pl-2", isRace ? "min-w-[50px]" : "min-w-[110px]")}>S2</span>
          <span className={cn("shrink-0 pl-2", isRace ? "min-w-[50px]" : "min-w-[110px]")}>S3</span>
        </div>

        {/* Driver Rows */}
        <div className="flex flex-col overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
          {drivers.map((driver) => {
            // Drop zone: drivers at risk of elimination in current round
            const isInDropZone = isQualifying && driver.position >= dropZoneStart && driver.position < knockoutStart;
            // Knocked out: drivers already eliminated in previous rounds
            const isEliminated = isQualifying && driver.position >= knockoutStart;

            return (
              <React.Fragment key={driver.driverCode}>
                <TimingRow
                  driver={driver}
                  isSelected={selectedDrivers.includes(driver.driverCode)}
                  onClick={() => onDriverSelect?.(driver.driverCode)}
                  onTyreClick={handleTyreClick}
                  showMiniSectors={showMiniSectors}
                  isTyreSelected={popover?.driverCode === driver.driverCode}
                  isInDropZone={isInDropZone}
                  isEliminated={isEliminated}
                  isRace={isRace}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Tyre History Popover - positioned near clicked tyre */}
      {selectedDriver && popover && (
        <TyreHistoryPopover
          driver={selectedDriver}
          position={{ x: popover.x, y: popover.y }}
          openUpward={popover.openUpward}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Timing Row Component
// =============================================================================

interface TimingRowProps {
  driver: DriverTiming;
  isSelected: boolean;
  onClick: () => void;
  onTyreClick: (driverCode: string, buttonRect: DOMRect) => void;
  showMiniSectors: boolean;
  isTyreSelected?: boolean;
  isInDropZone?: boolean; // At risk in current round (yellow warning)
  isEliminated?: boolean; // Already knocked out from previous rounds (red KO)
  isRace?: boolean; // Whether this is a race session (for position diff, mini-sector bars, tyre history)
}

function TimingRow({
  driver,
  isSelected,
  onClick,
  onTyreClick,
  showMiniSectors,
  isTyreSelected = false,
  isInDropZone = false,
  isEliminated = false,
  isRace = false,
}: TimingRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const isInPit = driver.status === "PIT";
  const isOut = driver.status === "OUT" || driver.status === "RETIRED" || driver.status === "STOPPED";
  const isKnockedOut = driver.status === "KNOCKED_OUT" || driver.isKnockedOut || isEliminated;

  // Determine if row should pulse (investigation/penalty)
  const shouldPulse = (driver.isUnderInvestigation ?? false) || (driver.hasPenalty ?? false);

  // Animate on position change
  const previousPosition = previousPositions.get(driver.driverCode);
  const positionChange = previousPosition !== undefined ? previousPosition - driver.position : 0;

  useEffect(() => {
    if (rowRef.current && positionChange !== 0) {
      import("animejs").then(({ animate }) => {
        const flashColor =
          positionChange > 0
            ? "rgba(34, 197, 94, 0.3)"
            : "rgba(239, 68, 68, 0.3)";

        // Determine the base background color (must match CSS classes)
        const baseColor = isKnockedOut
          ? "rgba(69, 10, 10, 0.5)" // bg-red-950/50
          : isInDropZone
            ? "rgba(67, 20, 7, 0.6)" // bg-orange-950/60
            : "rgba(0, 0, 0, 0)"; // transparent

        animate(rowRef.current!, {
          backgroundColor: [flashColor, baseColor],
          duration: 1200,
          easing: "easeOutQuad",
        });
      });
    }
  }, [driver.position, positionChange, isInDropZone, isKnockedOut]);

  return (
    <div
      ref={rowRef}
      className={cn(
        "flex items-center px-2 py-1 cursor-pointer border-b border-zinc-800/50 transition-colors duration-150",
        // Drop zone styling (at risk) - orange warning background
        isInDropZone && !isKnockedOut && "bg-orange-950/60",
        // Eliminated styling (KO from previous rounds) - red, dimmed
        isKnockedOut && "bg-red-950/50 opacity-70",
        // Normal selection styling
        isSelected && !isInDropZone && !isKnockedOut && "bg-zinc-800/70 ring-1 ring-zinc-600",
        isSelected && isInDropZone && "bg-orange-900/70 ring-1 ring-orange-500",
        isSelected && isKnockedOut && "bg-red-900/60 ring-1 ring-red-600 opacity-80",
        isOut && !isKnockedOut && !isInDropZone && "opacity-50",
        !isSelected && !isOut && !isInDropZone && !isKnockedOut && "hover:bg-zinc-800/40",
        !isSelected && isInDropZone && !isKnockedOut && "hover:bg-orange-900/70",
        shouldPulse && "animate-pulse-subtle"
      )}
      onClick={onClick}
    >
      {/* Position + Driver + Diff + Indicator (connected badge) */}
      <div className="min-w-[100px] flex items-center shrink-0">
        <div className="flex items-center">
          <span
            className={cn(
              "w-[22px] h-[20px] flex items-center justify-center font-black text-[11px] rounded-l-md",
              // Normal position styling
              driver.position === 1 && !isInDropZone && !isKnockedOut && "bg-yellow-500 text-black",
              driver.position === 2 && !isInDropZone && !isKnockedOut && "bg-zinc-400 text-black",
              driver.position === 3 && !isInDropZone && !isKnockedOut && "bg-amber-600 text-white",
              driver.position > 3 && !isInDropZone && !isKnockedOut && "bg-zinc-800 text-zinc-300",
              // Drop zone (at risk) - orange warning
              isInDropZone && !isKnockedOut && "bg-orange-600 text-black",
              // Eliminated (KO) - red
              isKnockedOut && "bg-red-700 text-white"
            )}
          >
            {driver.position}
          </span>
          <span
            className="h-[20px] px-1.5 flex items-center font-bold text-[10px] tracking-wide uppercase rounded-r-md"
            style={{
              backgroundColor: driver.teamColor,
              color: isLightColor(driver.teamColor) ? "#000" : "#fff",
            }}
          >
            {driver.driverCode}
          </span>
          {/* Position change indicator - only in race sessions */}
          {isRace && positionChange !== 0 && (
            <span
              className={cn(
                "ml-1 min-w-[18px] h-[16px] flex items-center justify-center text-[9px] font-bold rounded px-0.5",
                positionChange > 0
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              )}
              title={`Position ${positionChange > 0 ? "gained" : "lost"}: ${Math.abs(positionChange)}`}
            >
              {positionChange > 0 ? "▲" : "▼"}{Math.abs(positionChange)}
            </span>
          )}
          {/* Investigation/Penalty indicator */}
          {shouldPulse && (
            <span
              className={cn(
                "ml-1 w-4 h-4 flex items-center justify-center text-[10px] font-black rounded",
                driver.hasPenalty
                  ? "bg-red-600 text-white"
                  : "bg-orange-500 text-black"
              )}
              title={
                driver.hasPenalty
                  ? `Penalty${driver.penaltySeconds ? ` (${driver.penaltySeconds}s)` : ""}`
                  : "Under Investigation"
              }
            >
              !
            </span>
          )}
        </div>
      </div>

      {/* Gap and Interval - only in race */}
      {isRace && (
        <>
          {/* Gap to leader */}
          <div className="min-w-[60px] shrink-0 text-right pr-2">
            <span className={cn(
              "text-[11px] tabular-nums font-bold",
              driver.position === 1 ? "text-zinc-500" : "text-zinc-300"
            )}>
              {driver.position === 1 ? "Leader" : formatGap(driver.gap)}
            </span>
          </div>
          {/* Interval to car ahead */}
          <div className="min-w-[55px] shrink-0 text-right pr-2">
            <span className={cn(
              "text-[11px] tabular-nums font-bold",
              driver.position === 1 ? "text-zinc-500" : "text-yellow-400"
            )}>
              {driver.position === 1 ? "—" : formatGap(driver.interval)}
            </span>
          </div>
        </>
      )}

      {/* Last Lap */}
      <div className="min-w-[70px] shrink-0 text-right pr-3">
        {/* Eliminated (KO from previous rounds) - show KO badge */}
        {isKnockedOut ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">
            KO
          </span>
        ) : isInPit ? (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: STATUS_COLORS.PIT.bg, color: STATUS_COLORS.PIT.text }}
          >
            IN PIT
          </span>
        ) : isOut ? (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: STATUS_COLORS.OUT.bg, color: STATUS_COLORS.OUT.text }}
          >
            OUT
          </span>
        ) : (
          <span
            className={cn(
              "text-[12px] tabular-nums font-bold",
              driver.isOverallBest && "text-purple-400",
              driver.isPersonalBest && !driver.isOverallBest && "text-green-400",
              !driver.isOverallBest && !driver.isPersonalBest && "text-zinc-200"
            )}
          >
            {formatLapTime(driver.lastLap)}
          </span>
        )}
      </div>

      {/* Best Lap */}
      <div className="min-w-[70px] shrink-0 text-right pr-3">
        <span
          className={cn(
            "text-[12px] tabular-nums font-bold",
            driver.isOverallBest && "text-purple-400",
            !driver.isOverallBest && "text-zinc-300"
          )}
        >
          {formatLapTime(driver.bestLap)}
        </span>
      </div>

      {/* Tyre section - inline history for race, popup for practice/qualifying */}
      {isRace ? (
        // Race mode: show all stint history inline
        <div className="min-w-[120px] flex items-center gap-1 shrink-0 px-1">
          {driver.stintHistory && driver.stintHistory.length > 0 ? (
            driver.stintHistory.map((stint, idx) => {
              const isCurrentStint = idx === driver.stintHistory!.length - 1 && stint.endLap === null;
              const lapsOnTyre = stint.endLap
                ? stint.endLap - stint.startLap + 1 + stint.tyreAge
                : (driver.currentLap || 0) - stint.startLap + 1 + stint.tyreAge;

              return (
                <div
                  key={stint.stintNumber}
                  className={cn(
                    "flex items-center gap-0.5",
                    isCurrentStint && "ring-1 ring-zinc-500 rounded px-0.5"
                  )}
                  title={`Stint ${stint.stintNumber}: ${stint.compound} - ${lapsOnTyre} laps`}
                >
                  <span className="text-[10px] text-zinc-300 tabular-nums font-bold">
                    {lapsOnTyre}
                  </span>
                  <TyreIndicatorMini compound={stint.compound} />
                </div>
              );
            })
          ) : (
            // Fallback to current tyre if no stint history
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-zinc-300 tabular-nums font-bold">
                {driver.tyre?.age ?? 0}
              </span>
              <TyreIndicatorMini compound={driver.tyre?.compound || "MEDIUM"} />
            </div>
          )}
        </div>
      ) : (
        // Practice/Qualifying: clickable for popup
        <button
          data-tyre-button
          className={cn(
            "min-w-[55px] flex items-center justify-center gap-1 shrink-0 rounded py-0.5 transition-colors",
            isTyreSelected
              ? "bg-zinc-700/80 ring-1 ring-zinc-500"
              : "hover:bg-zinc-800/60"
          )}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            onTyreClick(driver.driverCode, rect);
          }}
          title="Click to view tyre history"
        >
          <TyreIndicator compound={driver.tyre?.compound || "MEDIUM"} />
          <span className="text-[11px] text-zinc-300 tabular-nums font-bold">
            {driver.tyre?.age ?? 0}
          </span>
        </button>
      )}

      {/* Gap - only in practice/qualifying (race has it earlier) */}
      {!isRace && (
        <div className="min-w-[60px] shrink-0 text-right pr-3">
          <span
            className={cn(
              "text-[11px] tabular-nums font-bold",
              driver.position === 1 ? "text-zinc-600" : "text-zinc-400"
            )}
          >
            {driver.position === 1 ? "—" : formatGap(driver.gap)}
          </span>
        </div>
      )}

      {/* Sector 1 + Mini-sectors */}
      <SectorWithMiniSectors
        time={driver.sector1}
        segments={showMiniSectors ? driver.miniSectors?.sector1 : undefined}
        isBest={driver.sector1Best ?? false}
        isPersonalBest={driver.sector1PersonalBest ?? false}
        showBars={!isRace}
      />

      {/* Sector 2 + Mini-sectors */}
      <SectorWithMiniSectors
        time={driver.sector2}
        segments={showMiniSectors ? driver.miniSectors?.sector2 : undefined}
        isBest={driver.sector2Best ?? false}
        isPersonalBest={driver.sector2PersonalBest ?? false}
        showBars={!isRace}
      />

      {/* Sector 3 + Mini-sectors */}
      <SectorWithMiniSectors
        time={driver.sector3}
        segments={showMiniSectors ? driver.miniSectors?.sector3 : undefined}
        isBest={driver.sector3Best ?? false}
        isPersonalBest={driver.sector3PersonalBest ?? false}
        showBars={!isRace}
      />
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

function TyreIndicator({ compound }: { compound: TyreCompound }) {
  const color = TYRE_COLORS[compound] || "#808080";
  const short = TYRE_SHORT[compound] || "?";
  const textColor = compound === "HARD" || compound === "MEDIUM" ? "#000" : "#fff";

  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shadow-sm"
      style={{ backgroundColor: color, color: textColor }}
      title={compound}
    >
      {short}
    </div>
  );
}

// Mini tyre indicator for inline stint history display in race
function TyreIndicatorMini({ compound }: { compound: TyreCompound }) {
  const color = TYRE_COLORS[compound] || "#808080";
  const short = TYRE_SHORT[compound] || "?";
  const textColor = compound === "HARD" || compound === "MEDIUM" ? "#000" : "#fff";

  return (
    <div
      className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
      style={{ backgroundColor: color, color: textColor }}
    >
      {short}
    </div>
  );
}

// Fixed number of mini-sector bars to display (for consistent alignment)
const MINI_SECTOR_COUNT = 8;

function SectorWithMiniSectors({
  time,
  segments,
  isBest,
  isPersonalBest,
  showBars = true,
}: {
  time: number | null;
  segments?: (number | null)[];
  isBest: boolean;
  isPersonalBest: boolean;
  showBars?: boolean;
}) {
  return (
    <div className={cn("shrink-0 flex items-center gap-2 pl-2", showBars ? "min-w-[110px]" : "min-w-[50px]")}>
      {/* Sector time */}
      <span
        className={cn(
          "text-[11px] tabular-nums font-bold min-w-[42px] text-right",
          time === null && "text-zinc-600",
          isBest && "text-purple-400",
          isPersonalBest && !isBest && "text-green-400",
          !isBest && !isPersonalBest && time !== null && "text-yellow-400"
        )}
      >
        {time !== null ? formatSectorTime(time) : "—"}
      </span>

      {/* Mini-sector bars - only show in non-race sessions */}
      {showBars && (
        <div className="flex items-center gap-[3px]">
          {Array.from({ length: MINI_SECTOR_COUNT }, (_, idx) => {
            const segment = segments?.[idx];
            let color = "#3f3f46"; // Default placeholder - zinc-700 (more visible)

            if (segment === 2048) color = TIMING_COLORS.YELLOW;
            else if (segment === 2049) color = TIMING_COLORS.GREEN;
            else if (segment === 2051) color = TIMING_COLORS.PURPLE;
            else if (segment === 2064) color = "#6b7280"; // Pitlane - gray-500

            return (
              <div
                key={idx}
                className="w-[5px] h-[14px] rounded-[2px] shrink-0"
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Tyre History Popover
// =============================================================================

function TyreHistoryPopover({
  driver,
  position,
  openUpward = false,
  onClose,
}: {
  driver: DriverTiming;
  position: { x: number; y: number };
  openUpward?: boolean;
  onClose: () => void;
}) {
  const stintHistory = driver.stintHistory || [];
  const currentTyre = driver.tyre;
  const popoverRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x: position.x, y: position.y });

  // Adjust position after render to ensure it stays within viewport
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // If opening upward, position above the click point
      if (openUpward) {
        newY = position.y - rect.height - 30; // 30px is roughly the button height
      }

      // Check right edge overflow
      if (rect.right > viewportWidth - 20) {
        newX = Math.max(10, position.x - (rect.right - viewportWidth) - 30);
      }

      // Check bottom edge overflow (if not already opening upward)
      if (!openUpward && rect.bottom > viewportHeight - 20) {
        newY = Math.max(10, position.y - (rect.bottom - viewportHeight) - 30);
      }

      // Check top edge overflow (if opening upward)
      if (openUpward && newY < 10) {
        newY = 10;
      }

      if (newX !== position.x || newY !== position.y) {
        setAdjustedPosition({ x: newX, y: newY });
      }
    }
  }, [position, openUpward]);

  return (
    <div
      ref={popoverRef}
      data-tyre-popover
      className="absolute z-50 w-[220px] bg-zinc-900 border border-zinc-600 rounded-lg shadow-2xl"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        maxHeight: '300px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-[11px] font-bold"
            style={{
              backgroundColor: driver.teamColor,
              color: isLightColor(driver.teamColor) ? "#000" : "#fff",
            }}
          >
            {driver.driverCode}
          </span>
          <span className="text-[11px] text-zinc-400 font-semibold">Tyre History</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors text-[16px] leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-800"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-2 max-h-[250px] overflow-y-auto">
        {/* Pit Stops Count */}
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Pit Stops</span>
          <span className="text-[13px] font-bold text-zinc-200">{driver.pitStops ?? 0}</span>
        </div>

        {/* Stint History */}
        {stintHistory.length > 0 ? (
          <div className="space-y-1.5">
            {stintHistory.map((stint, idx) => {
              const isCurrentStint = idx === stintHistory.length - 1 && stint.endLap === null;
              const lapsOnTyre = stint.endLap
                ? stint.endLap - stint.startLap + 1 + stint.tyreAge
                : (driver.currentLap || 0) - stint.startLap + 1 + stint.tyreAge;

              return (
                <div
                  key={stint.stintNumber}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md",
                    isCurrentStint ? "bg-zinc-800/80 ring-1 ring-zinc-600" : "bg-zinc-800/40"
                  )}
                >
                  <span className="text-[10px] text-zinc-500 w-4">{stint.stintNumber}</span>
                  <TyreIndicatorSmall compound={stint.compound} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-300 font-medium">
                      {stint.compound}
                    </span>
                    <div className="text-right">
                      <span className="text-[11px] text-zinc-400">
                        L{stint.startLap}{stint.endLap ? `-${stint.endLap}` : '+'}
                      </span>
                      <span className="text-[10px] text-zinc-500 ml-1">
                        ({lapsOnTyre} laps)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-2 py-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TyreIndicatorSmall compound={currentTyre?.compound || "MEDIUM"} />
              <span className="text-[12px] font-medium text-zinc-300">
                {currentTyre?.compound || "Unknown"}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">
              {currentTyre?.age ?? 0} laps • {currentTyre?.isNew ? "New" : "Used"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Small tyre indicator for stint history
function TyreIndicatorSmall({ compound }: { compound: TyreCompound }) {
  const color = TYRE_COLORS[compound] || "#808080";
  const short = TYRE_SHORT[compound] || "?";
  const textColor = compound === "HARD" || compound === "MEDIUM" ? "#000" : "#fff";

  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
      style={{ backgroundColor: color, color: textColor }}
      title={compound}
    >
      {short}
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
