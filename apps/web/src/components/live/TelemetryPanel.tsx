"use client";

import { cn } from "@/lib/utils";
import type { DriverTelemetry } from "@/types/f1";

interface TelemetryPanelProps {
  drivers: DriverTelemetry[];
}

export function TelemetryPanel({ drivers }: TelemetryPanelProps) {
  if (drivers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Select drivers from the timing tower to view telemetry
      </div>
    );
  }

  return (
    <div className="h-full grid grid-cols-2 gap-4 p-4">
      {drivers.slice(0, 2).map((driver) => (
        <DriverTelemetryCard key={driver.driverCode} driver={driver} />
      ))}
    </div>
  );
}

interface DriverTelemetryCardProps {
  driver: DriverTelemetry;
}

function DriverTelemetryCard({ driver }: DriverTelemetryCardProps) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-secondary/50">
      {/* Driver Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-1.5 h-8 rounded-sm"
          style={{ backgroundColor: driver.teamColor }}
        />
        <span className="font-bold text-lg">{driver.driverCode}</span>
        <span className="text-muted-foreground text-sm">#{driver.driverNumber}</span>
      </div>

      {/* Telemetry Data */}
      <div className="grid grid-cols-2 gap-4">
        {/* Speed */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase">Speed</span>
          <span className="font-mono text-2xl font-bold">
            {driver.speed}
            <span className="text-sm text-muted-foreground ml-1">km/h</span>
          </span>
        </div>

        {/* Gear */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase">Gear</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold">{driver.gear}</span>
            {driver.drs === 8 && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-bold rounded">
                DRS
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Throttle Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground uppercase">Throttle</span>
          <span className="font-mono">{driver.throttle}%</span>
        </div>
        <div className="h-3 bg-background rounded-full overflow-hidden">
          <div
            className="telemetry-bar h-full bg-green-500 rounded-full"
            style={{ width: `${driver.throttle}%` }}
          />
        </div>
      </div>

      {/* Brake Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground uppercase">Brake</span>
          <span className="font-mono">{driver.brake}%</span>
        </div>
        <div className="h-3 bg-background rounded-full overflow-hidden">
          <div
            className="telemetry-bar h-full bg-red-500 rounded-full"
            style={{ width: `${driver.brake}%` }}
          />
        </div>
      </div>
    </div>
  );
}
