"use client";

import { cn } from "@/lib/utils";
import { formatLapTime, formatGap, TYRE_COLORS, TYRE_SHORT } from "@/lib/constants";
import type { DriverTiming, TyreCompound } from "@/types/f1";

interface TimingTowerProps {
  drivers: DriverTiming[];
  selectedDrivers?: string[];
  onDriverSelect?: (code: string) => void;
}

export function TimingTower({
  drivers,
  selectedDrivers = [],
  onDriverSelect,
}: TimingTowerProps) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-[40px_48px_1fr_72px_72px_40px_32px] gap-1 px-2 py-2 text-xs font-medium text-muted-foreground border-b border-border bg-card">
        <span className="text-center">POS</span>
        <span></span>
        <span>DRIVER</span>
        <span className="text-right">GAP</span>
        <span className="text-right">LAST</span>
        <span className="text-center">TYRE</span>
        <span className="text-center">PIT</span>
      </div>

      {/* Driver Rows */}
      <div className="flex flex-col">
        {drivers.map((driver) => (
          <TimingRow
            key={driver.driverCode}
            driver={driver}
            isSelected={selectedDrivers.includes(driver.driverCode)}
            onClick={() => onDriverSelect?.(driver.driverCode)}
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
}

function TimingRow({ driver, isSelected, onClick }: TimingRowProps) {
  const tyreColor = TYRE_COLORS[driver.tyre.compound] || "#808080";
  const tyreShort = TYRE_SHORT[driver.tyre.compound] || "?";

  return (
    <div
      className={cn(
        "timing-row grid grid-cols-[40px_48px_1fr_72px_72px_40px_32px] gap-1 px-2 py-1.5 items-center cursor-pointer border-b border-border/50 hover:bg-secondary/50 transition-colors",
        isSelected && "bg-secondary",
        driver.status === "OUT" && "opacity-50",
        driver.status === "PIT" && "bg-yellow-500/10"
      )}
      onClick={onClick}
    >
      {/* Position */}
      <span
        className={cn(
          "text-center font-mono font-bold text-sm",
          driver.position === 1 && "text-yellow-500",
          driver.position === 2 && "text-gray-400",
          driver.position === 3 && "text-amber-600"
        )}
      >
        {driver.position}
      </span>

      {/* Team Color Bar & Number */}
      <div className="flex items-center gap-1">
        <div
          className="w-1 h-6 rounded-sm"
          style={{ backgroundColor: driver.teamColor }}
        />
        <span className="text-xs font-mono text-muted-foreground">
          {driver.driverNumber}
        </span>
      </div>

      {/* Driver Code */}
      <span className="font-semibold text-sm">{driver.driverCode}</span>

      {/* Gap */}
      <span
        className={cn(
          "text-right font-mono text-sm number-animate",
          driver.position === 1 && "text-muted-foreground"
        )}
      >
        {driver.position === 1 ? "LEADER" : formatGap(driver.gap)}
      </span>

      {/* Last Lap */}
      <span
        className={cn(
          "text-right font-mono text-sm",
          driver.isOverallBest && "text-purple-500",
          driver.isPersonalBest && !driver.isOverallBest && "text-green-500"
        )}
      >
        {formatLapTime(driver.lastLap)}
      </span>

      {/* Tyre */}
      <div className="flex items-center justify-center">
        <TyreIndicator compound={driver.tyre.compound} age={driver.tyre.age} />
      </div>

      {/* Pit Stops */}
      <span className="text-center font-mono text-sm text-muted-foreground">
        {driver.pitStops}
      </span>
    </div>
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
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2"
      style={{ borderColor: color, color: color }}
      title={`${compound}${age !== undefined ? ` - ${age} laps` : ""}`}
    >
      {short}
    </div>
  );
}
