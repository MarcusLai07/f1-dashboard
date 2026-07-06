"use client";

import { cn } from "@/lib/utils";

interface Driver {
  driverNumber: number;
  code: string;
  teamColor: string;
  teamName?: string;
}

interface DriverSelectorProps {
  drivers: Driver[];
  selectedDrivers: number[];
  onToggle: (driverNumber: number) => void;
  maxSelections?: number;
}

export function DriverSelector({
  drivers,
  selectedDrivers,
  onToggle,
  maxSelections = 6,
}: DriverSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {drivers.map((driver) => {
        const isSelected = selectedDrivers.includes(driver.driverNumber);
        const canSelect = isSelected || selectedDrivers.length < maxSelections;

        return (
          <button
            key={driver.driverNumber}
            onClick={() => canSelect && onToggle(driver.driverNumber)}
            disabled={!canSelect}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              isSelected
                ? "ring-2 ring-offset-1 ring-offset-background"
                : "bg-zinc-800/50 hover:bg-zinc-700/50",
              !canSelect && !isSelected && "opacity-40 cursor-not-allowed"
            )}
            style={{
              backgroundColor: isSelected ? driver.teamColor + "30" : undefined,
              borderColor: isSelected ? driver.teamColor : undefined,
              "--tw-ring-color": isSelected ? driver.teamColor : undefined,
            } as React.CSSProperties}
          >
            <div
              className="w-2 h-4 rounded-sm"
              style={{ backgroundColor: driver.teamColor }}
            />
            <span className={isSelected ? "text-white" : "text-zinc-300"}>
              {driver.code}
            </span>
          </button>
        );
      })}
      {drivers.length === 0 && (
        <p className="text-muted-foreground text-sm">Loading drivers...</p>
      )}
    </div>
  );
}
