"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { DriverTelemetry } from "@/types/f1";

interface TelemetryPanelProps {
  drivers: DriverTelemetry[];
}

// Store telemetry history for traces
const telemetryHistory = new Map<string, TelemetrySnapshot[]>();
const MAX_HISTORY = 50; // Keep last 50 data points

interface TelemetrySnapshot {
  timestamp: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
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
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
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
  const throttleBarRef = useRef<HTMLDivElement>(null);
  const brakeBarRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const prevSpeedRef = useRef<number>(driver.speed);
  const [history, setHistory] = useState<TelemetrySnapshot[]>([]);

  // Update history when driver telemetry changes
  useEffect(() => {
    const now = Date.now();
    const snapshot: TelemetrySnapshot = {
      timestamp: now,
      speed: driver.speed,
      throttle: driver.throttle,
      brake: driver.brake,
      gear: driver.gear,
      rpm: driver.rpm,
    };

    // Get existing history or create new
    let driverHistory = telemetryHistory.get(driver.driverCode) || [];
    driverHistory = [...driverHistory, snapshot].slice(-MAX_HISTORY);
    telemetryHistory.set(driver.driverCode, driverHistory);
    setHistory(driverHistory);
  }, [driver]);

  // Animate bars
  useEffect(() => {
    import("animejs").then(({ animate }) => {
      if (throttleBarRef.current) {
        animate(throttleBarRef.current, {
          width: `${driver.throttle}%`,
          duration: 150,
          easing: "easeOutQuad",
        });
      }
      if (brakeBarRef.current) {
        animate(brakeBarRef.current, {
          width: `${driver.brake}%`,
          duration: 150,
          easing: "easeOutQuad",
        });
      }
    });
  }, [driver.throttle, driver.brake]);

  // Animate speed counter
  useEffect(() => {
    if (speedRef.current && prevSpeedRef.current !== driver.speed) {
      import("animejs").then(({ animate }) => {
        const obj = { value: prevSpeedRef.current };
        animate(obj, {
          value: driver.speed,
          duration: 200,
          easing: "easeOutQuad",
          onUpdate: () => {
            if (speedRef.current) {
              speedRef.current.textContent = Math.round(obj.value).toString();
            }
          },
        });
      });
      prevSpeedRef.current = driver.speed;
    }
  }, [driver.speed]);

  // Generate gear indicator lights
  const gearLights = useMemo(() => {
    const maxGear = 8;
    const lights = [];
    for (let i = 1; i <= maxGear; i++) {
      lights.push(
        <div
          key={i}
          className={cn(
            "w-3 h-3 rounded-full transition-all duration-100",
            i <= driver.gear
              ? i <= 3
                ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"
                : i <= 6
                  ? "bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]"
                  : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse"
              : "bg-zinc-800"
          )}
        />
      );
    }
    return lights;
  }, [driver.gear]);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-secondary/50">
      {/* Driver Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-8 rounded-sm"
            style={{ backgroundColor: driver.teamColor }}
          />
          <span className="font-bold text-lg">{driver.driverCode}</span>
          <span className="text-muted-foreground text-sm">#{driver.driverNumber}</span>
        </div>
        {/* DRS Indicator */}
        <div
          className={cn(
            "px-2 py-0.5 rounded text-xs font-bold",
            driver.drs === 8
              ? "bg-green-500/20 text-green-400 ring-1 ring-green-500"
              : "bg-zinc-800 text-zinc-500"
          )}
        >
          DRS {driver.drs === 8 ? "OPEN" : "—"}
        </div>
      </div>

      {/* Speed and Gear Section */}
      <div className="flex items-center gap-6">
        {/* Speed Display */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Speed</span>
          <div className="flex items-baseline gap-1">
            <span ref={speedRef} className="font-mono text-4xl font-bold tabular-nums">
              {driver.speed}
            </span>
            <span className="text-sm text-muted-foreground">km/h</span>
          </div>
        </div>

        {/* Gear Display */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Gear</span>
          <span className="font-mono text-4xl font-bold">
            {driver.gear === 0 ? "N" : driver.gear}
          </span>
        </div>

        {/* RPM Gauge */}
        <div className="flex flex-col flex-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide mb-1">RPM</span>
          <div className="flex items-center gap-1">
            {gearLights}
          </div>
          <span className="font-mono text-sm text-zinc-400 mt-1">
            {(driver.rpm / 1000).toFixed(1)}k
          </span>
        </div>
      </div>

      {/* Throttle/Brake Trace */}
      <TelemetryTrace history={history} teamColor={driver.teamColor} />

      {/* Throttle Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground uppercase tracking-wide">Throttle</span>
          <span className="font-mono font-semibold text-green-400">{driver.throttle}%</span>
        </div>
        <div className="h-5 bg-zinc-900 rounded overflow-hidden relative">
          <div
            ref={throttleBarRef}
            className="h-full bg-gradient-to-r from-green-700 to-green-400 rounded transition-all"
            style={{ width: `${driver.throttle}%` }}
          />
          {/* Tick marks */}
          <div className="absolute inset-0 flex justify-between px-0.5">
            {[25, 50, 75].map((tick) => (
              <div
                key={tick}
                className="w-px h-full bg-zinc-700"
                style={{ marginLeft: `${tick}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Brake Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground uppercase tracking-wide">Brake</span>
          <span className="font-mono font-semibold text-red-400">{driver.brake}%</span>
        </div>
        <div className="h-5 bg-zinc-900 rounded overflow-hidden relative">
          <div
            ref={brakeBarRef}
            className="h-full bg-gradient-to-r from-red-700 to-red-400 rounded transition-all"
            style={{ width: `${driver.brake}%` }}
          />
          {/* Tick marks */}
          <div className="absolute inset-0 flex justify-between px-0.5">
            {[25, 50, 75].map((tick) => (
              <div
                key={tick}
                className="w-px h-full bg-zinc-700"
                style={{ marginLeft: `${tick}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TelemetryTraceProps {
  history: TelemetrySnapshot[];
  teamColor: string;
}

function TelemetryTrace({ history, teamColor }: TelemetryTraceProps) {
  if (history.length < 2) {
    return (
      <div className="h-20 bg-zinc-900/50 rounded flex items-center justify-center text-xs text-muted-foreground">
        Building telemetry trace...
      </div>
    );
  }

  const width = 300;
  const height = 80;
  const padding = { top: 5, right: 5, bottom: 5, left: 5 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate SVG paths for throttle, brake, and speed
  const getX = (index: number) =>
    padding.left + (index / (history.length - 1)) * chartWidth;

  const throttlePath = history
    .map((h, i) => {
      const x = getX(i);
      const y = padding.top + chartHeight - (h.throttle / 100) * chartHeight;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const brakePath = history
    .map((h, i) => {
      const x = getX(i);
      const y = padding.top + chartHeight - (h.brake / 100) * chartHeight;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Speed normalized to 0-100 (assuming max 350 km/h)
  const maxSpeed = 350;
  const speedPath = history
    .map((h, i) => {
      const x = getX(i);
      const normalizedSpeed = Math.min(h.speed / maxSpeed, 1);
      const y = padding.top + chartHeight - normalizedSpeed * chartHeight;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="bg-zinc-900/50 rounded overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
        {/* Grid */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight / 2}
          x2={width - padding.right}
          y2={padding.top + chartHeight / 2}
          stroke="#27272a"
          strokeDasharray="2 2"
        />

        {/* Speed trace (dimmed) */}
        <path
          d={speedPath}
          fill="none"
          stroke={teamColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.4}
        />

        {/* Throttle trace */}
        <path
          d={throttlePath}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Brake trace */}
        <path
          d={brakePath}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Legend */}
        <g transform="translate(8, 12)">
          <rect x="0" y="-4" width="8" height="2" fill="#22c55e" rx="1" />
          <text x="12" y="0" fontSize="7" fill="#71717a">THR</text>
          <rect x="35" y="-4" width="8" height="2" fill="#ef4444" rx="1" />
          <text x="47" y="0" fontSize="7" fill="#71717a">BRK</text>
          <rect x="70" y="-4" width="8" height="2" fill={teamColor} opacity="0.6" rx="1" />
          <text x="82" y="0" fontSize="7" fill="#71717a">SPD</text>
        </g>
      </svg>
    </div>
  );
}
