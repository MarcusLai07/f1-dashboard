"use client";

import { useMemo } from "react";
import { TYRE_COLORS } from "@/lib/constants";

interface StintData {
  driverNumber: number;
  driverCode: string;
  teamColor: string;
  stintNumber: number;
  compound: string;
  lapStart: number;
  lapEnd: number | null;
  tyreAge: number;
}

interface DriverInfo {
  driverNumber: number;
  code: string;
  teamColor: string;
}

interface StintChartProps {
  stints: StintData[];
  drivers: DriverInfo[];
  totalLaps?: number;
  selectedDrivers?: number[];
}

export function StintChart({
  stints,
  drivers,
  totalLaps = 60,
  selectedDrivers,
}: StintChartProps) {
  const chartData = useMemo(() => {
    if (stints.length === 0 || drivers.length === 0) return null;

    // Get total laps from data if not provided
    const maxLap = Math.max(...stints.map((s) => s.lapEnd || s.lapStart));
    const laps = totalLaps > 0 ? totalLaps : maxLap;

    // Filter by selected drivers if provided
    const filteredDrivers = selectedDrivers?.length
      ? drivers.filter((d) => selectedDrivers.includes(d.driverNumber))
      : drivers;

    // Group stints by driver
    const stintsByDriver = new Map<number, StintData[]>();
    for (const stint of stints) {
      if (!stintsByDriver.has(stint.driverNumber)) {
        stintsByDriver.set(stint.driverNumber, []);
      }
      stintsByDriver.get(stint.driverNumber)!.push(stint);
    }

    return {
      drivers: filteredDrivers,
      stintsByDriver,
      totalLaps: laps,
    };
  }, [stints, drivers, totalLaps, selectedDrivers]);

  if (!chartData || chartData.drivers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No stint data available
      </div>
    );
  }

  const rowHeight = 36;
  const padding = { top: 30, right: 20, bottom: 20, left: 70 };
  const width = 900;
  const height = padding.top + chartData.drivers.length * rowHeight + padding.bottom;
  const chartWidth = width - padding.left - padding.right;

  const getX = (lap: number) =>
    padding.left + (lap / chartData.totalLaps) * chartWidth;

  // Generate lap tick marks every 10 laps
  const lapTicks = [];
  for (let lap = 0; lap <= chartData.totalLaps; lap += 10) {
    lapTicks.push(lap);
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[700px]">
        {/* Header with lap numbers */}
        {lapTicks.map((lap) => (
          <g key={`lap-${lap}`}>
            <line
              x1={getX(lap)}
              y1={padding.top - 10}
              x2={getX(lap)}
              y2={height - padding.bottom}
              stroke="#27272a"
              strokeDasharray="4 4"
            />
            <text
              x={getX(lap)}
              y={padding.top - 15}
              textAnchor="middle"
              fontSize="10"
              fill="#71717a"
            >
              {lap === 0 ? "Start" : `L${lap}`}
            </text>
          </g>
        ))}

        {/* Driver rows */}
        {chartData.drivers.map((driver, index) => {
          const y = padding.top + index * rowHeight;
          const driverStints = chartData.stintsByDriver.get(driver.driverNumber) || [];

          return (
            <g key={driver.driverNumber}>
              {/* Row background (alternating) */}
              {index % 2 === 1 && (
                <rect
                  x={0}
                  y={y}
                  width={width}
                  height={rowHeight}
                  fill="#18181b"
                  opacity={0.5}
                />
              )}

              {/* Driver label */}
              <g>
                <rect
                  x={4}
                  y={y + 8}
                  width="3"
                  height={rowHeight - 16}
                  fill={driver.teamColor}
                  rx="1"
                />
                <text
                  x={14}
                  y={y + rowHeight / 2 + 4}
                  fontSize="12"
                  fontWeight="bold"
                  fill="#e4e4e7"
                >
                  {driver.code}
                </text>
              </g>

              {/* Stint bars */}
              {driverStints.map((stint, stintIndex) => {
                const stintStart = stint.lapStart || 0;
                const stintEnd = stint.lapEnd || chartData.totalLaps;
                const stintWidth = getX(stintEnd) - getX(stintStart);
                const x = getX(stintStart);
                const compound = stint.compound?.toUpperCase() || "UNKNOWN";
                const color = TYRE_COLORS[compound as keyof typeof TYRE_COLORS] || "#808080";

                return (
                  <g key={`${driver.driverNumber}-${stintIndex}`}>
                    {/* Stint bar */}
                    <rect
                      x={x}
                      y={y + 6}
                      width={Math.max(stintWidth, 4)}
                      height={rowHeight - 12}
                      fill={color}
                      rx="4"
                      opacity={0.9}
                    />
                    {/* Compound label */}
                    {stintWidth > 30 && (
                      <text
                        x={x + stintWidth / 2}
                        y={y + rowHeight / 2 + 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill={compound === "WET" || compound === "INTERMEDIATE" ? "#000" : "#fff"}
                      >
                        {compound.charAt(0)}
                        {stint.tyreAge > 0 && ` +${stint.tyreAge}`}
                      </text>
                    )}
                    {/* Lap count on hover (title) */}
                    <title>
                      {compound} - Laps {stintStart} to {stintEnd} ({stintEnd - stintStart} laps)
                      {stint.tyreAge > 0 && ` - ${stint.tyreAge} lap old tyres`}
                    </title>
                  </g>
                );
              })}

              {/* Pit stop markers */}
              {driverStints.slice(0, -1).map((stint, stintIndex) => {
                const pitLap = stint.lapEnd || 0;
                if (pitLap <= 0 || pitLap >= chartData.totalLaps) return null;

                return (
                  <g key={`pit-${driver.driverNumber}-${stintIndex}`}>
                    <circle
                      cx={getX(pitLap)}
                      cy={y + rowHeight / 2}
                      r="6"
                      fill="#000"
                      stroke="#fbbf24"
                      strokeWidth="2"
                    />
                    <text
                      x={getX(pitLap)}
                      y={y + rowHeight / 2 + 3}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="bold"
                      fill="#fbbf24"
                    >
                      P
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${padding.left}, ${height - 5})`}>
          {["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"].map((compound, i) => {
            const color = TYRE_COLORS[compound as keyof typeof TYRE_COLORS];
            return (
              <g key={compound} transform={`translate(${i * 90}, 0)`}>
                <rect
                  x={0}
                  y={-10}
                  width="12"
                  height="12"
                  fill={color}
                  rx="2"
                />
                <text
                  x={16}
                  y={0}
                  fontSize="9"
                  fill="#71717a"
                >
                  {compound}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
