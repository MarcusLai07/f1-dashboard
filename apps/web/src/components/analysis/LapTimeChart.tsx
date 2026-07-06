"use client";

import { useMemo } from "react";
import { formatLapTime } from "@/lib/constants";

interface LapData {
  driverNumber: number;
  driverCode: string;
  teamColor: string;
  lapNumber: number;
  lapTime: number | null;
  isPitOutLap?: boolean;
}

interface LapTimeChartProps {
  laps: LapData[];
  selectedDrivers: number[];
  height?: number;
}

export function LapTimeChart({
  laps,
  selectedDrivers,
  height = 300,
}: LapTimeChartProps) {
  const chartData = useMemo(() => {
    if (laps.length === 0 || selectedDrivers.length === 0) return null;

    // Filter laps for selected drivers with valid lap times
    const filteredLaps = laps.filter(
      (lap) =>
        selectedDrivers.includes(lap.driverNumber) &&
        lap.lapTime !== null &&
        lap.lapTime > 0 &&
        !lap.isPitOutLap
    );

    if (filteredLaps.length === 0) return null;

    // Get min/max lap times and lap numbers
    const lapTimes = filteredLaps.map((l) => l.lapTime!);
    const lapNumbers = filteredLaps.map((l) => l.lapNumber);

    const minTime = Math.min(...lapTimes);
    const maxTime = Math.max(...lapTimes);
    const minLap = Math.min(...lapNumbers);
    const maxLap = Math.max(...lapNumbers);

    // Group by driver
    const byDriver = new Map<number, LapData[]>();
    for (const lap of filteredLaps) {
      if (!byDriver.has(lap.driverNumber)) {
        byDriver.set(lap.driverNumber, []);
      }
      byDriver.get(lap.driverNumber)!.push(lap);
    }

    return {
      minTime,
      maxTime,
      minLap,
      maxLap,
      byDriver,
      range: maxTime - minTime,
      lapRange: maxLap - minLap + 1,
    };
  }, [laps, selectedDrivers]);

  const padding = { top: 20, right: 60, bottom: 40, left: 70 };
  const width = 800;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate Y-axis ticks (5 evenly spaced) - must be before early return
  const yTicks = useMemo(() => {
    if (!chartData) return [];
    const ticks = [];
    const step = chartData.range / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(chartData.minTime + step * i);
    }
    return ticks;
  }, [chartData]);

  // Generate X-axis ticks - must be before early return
  const xTicks = useMemo(() => {
    if (!chartData) return [];
    const ticks = [];
    const step = Math.max(1, Math.ceil(chartData.lapRange / 10));
    for (let lap = chartData.minLap; lap <= chartData.maxLap; lap += step) {
      ticks.push(lap);
    }
    return ticks;
  }, [chartData]);

  if (!chartData) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Select drivers to view lap time comparison
      </div>
    );
  }

  // Helper to convert data to SVG coordinates
  const getX = (lap: number) =>
    padding.left +
    ((lap - chartData.minLap) / Math.max(chartData.lapRange - 1, 1)) *
      chartWidth;

  const getY = (time: number) =>
    padding.top +
    ((time - chartData.minTime) / Math.max(chartData.range, 0.1)) * chartHeight;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px]">
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={`y-${tick}`}
            x1={padding.left}
            y1={getY(tick)}
            x2={width - padding.right}
            y2={getY(tick)}
            stroke="#27272a"
            strokeDasharray="4 4"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <text
            key={`yl-${tick}`}
            x={padding.left - 8}
            y={getY(tick) + 4}
            textAnchor="end"
            fontSize="11"
            fill="#71717a"
          >
            {formatLapTime(tick)}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((lap) => (
          <text
            key={`xl-${lap}`}
            x={getX(lap)}
            y={height - 10}
            textAnchor="middle"
            fontSize="11"
            fill="#71717a"
          >
            L{lap}
          </text>
        ))}

        {/* Axis labels */}
        <text
          x={padding.left - 50}
          y={height / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#52525b"
          transform={`rotate(-90, ${padding.left - 50}, ${height / 2})`}
        >
          Lap Time
        </text>
        <text
          x={width / 2}
          y={height - 2}
          textAnchor="middle"
          fontSize="12"
          fill="#52525b"
        >
          Lap
        </text>

        {/* Data lines */}
        {Array.from(chartData.byDriver.entries()).map(([driverNum, driverLaps]) => {
          const sortedLaps = [...driverLaps].sort((a, b) => a.lapNumber - b.lapNumber);
          const pathData = sortedLaps
            .filter((l) => l.lapTime !== null)
            .map((l, i) => {
              const x = getX(l.lapNumber);
              const y = getY(l.lapTime!);
              return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");

          const color = sortedLaps[0]?.teamColor || "#808080";
          const code = sortedLaps[0]?.driverCode || "???";

          return (
            <g key={driverNum}>
              {/* Line */}
              <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Points */}
              {sortedLaps
                .filter((l) => l.lapTime !== null)
                .map((l) => (
                  <circle
                    key={`${driverNum}-${l.lapNumber}`}
                    cx={getX(l.lapNumber)}
                    cy={getY(l.lapTime!)}
                    r="3"
                    fill={color}
                  />
                ))}
              {/* Driver label at end */}
              {sortedLaps.length > 0 && (
                <text
                  x={width - padding.right + 8}
                  y={getY(sortedLaps[sortedLaps.length - 1].lapTime!)}
                  fontSize="11"
                  fontWeight="bold"
                  fill={color}
                  dominantBaseline="middle"
                >
                  {code}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
