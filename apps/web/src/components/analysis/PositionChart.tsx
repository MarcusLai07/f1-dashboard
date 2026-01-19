"use client";

import { useMemo } from "react";

interface LapData {
  driverNumber: number;
  driverCode: string;
  teamColor: string;
  lapNumber: number;
  position: number | null;
}

interface PositionChartProps {
  laps: LapData[];
  selectedDrivers: number[];
  totalDrivers?: number;
  height?: number;
}

export function PositionChart({
  laps,
  selectedDrivers,
  totalDrivers = 20,
  height = 300,
}: PositionChartProps) {
  const chartData = useMemo(() => {
    if (laps.length === 0 || selectedDrivers.length === 0) return null;

    // Filter laps for selected drivers with valid positions
    const filteredLaps = laps.filter(
      (lap) =>
        selectedDrivers.includes(lap.driverNumber) &&
        lap.position !== null &&
        lap.position > 0
    );

    if (filteredLaps.length === 0) return null;

    // Get lap range
    const lapNumbers = filteredLaps.map((l) => l.lapNumber);
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
      minLap,
      maxLap,
      byDriver,
      lapRange: maxLap - minLap + 1,
    };
  }, [laps, selectedDrivers]);

  const padding = { top: 20, right: 60, bottom: 40, left: 50 };
  const width = 800;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate Y-axis ticks (positions 1, 5, 10, 15, 20)
  const yTicks = [1, 5, 10, 15, 20].filter((p) => p <= totalDrivers);

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
        Select drivers to view position history
      </div>
    );
  }

  // Helper to convert data to SVG coordinates
  const getX = (lap: number) =>
    padding.left +
    ((lap - chartData.minLap) / Math.max(chartData.lapRange - 1, 1)) *
      chartWidth;

  // Positions: P1 at top, P20 at bottom
  const getY = (position: number) =>
    padding.top + ((position - 1) / (totalDrivers - 1)) * chartHeight;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px]">
        {/* Grid lines */}
        {yTicks.map((pos) => (
          <line
            key={`y-${pos}`}
            x1={padding.left}
            y1={getY(pos)}
            x2={width - padding.right}
            y2={getY(pos)}
            stroke="#27272a"
            strokeDasharray="4 4"
          />
        ))}

        {/* Podium highlight zone */}
        <rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={getY(4) - padding.top}
          fill="#22c55e"
          opacity={0.05}
        />

        {/* Points zone (top 10) */}
        <rect
          x={padding.left}
          y={getY(4)}
          width={chartWidth}
          height={getY(11) - getY(4)}
          fill="#eab308"
          opacity={0.03}
        />

        {/* Y-axis labels */}
        {yTicks.map((pos) => (
          <text
            key={`yl-${pos}`}
            x={padding.left - 8}
            y={getY(pos) + 4}
            textAnchor="end"
            fontSize="11"
            fill="#71717a"
          >
            P{pos}
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
          x={padding.left - 35}
          y={height / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#52525b"
          transform={`rotate(-90, ${padding.left - 35}, ${height / 2})`}
        >
          Position
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
            .filter((l) => l.position !== null)
            .map((l, i) => {
              const x = getX(l.lapNumber);
              const y = getY(l.position!);
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
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Start marker */}
              {sortedLaps.length > 0 && sortedLaps[0].position !== null && (
                <circle
                  cx={getX(sortedLaps[0].lapNumber)}
                  cy={getY(sortedLaps[0].position!)}
                  r="4"
                  fill={color}
                  stroke="#000"
                  strokeWidth="1"
                />
              )}
              {/* End marker */}
              {sortedLaps.length > 0 && sortedLaps[sortedLaps.length - 1].position !== null && (
                <circle
                  cx={getX(sortedLaps[sortedLaps.length - 1].lapNumber)}
                  cy={getY(sortedLaps[sortedLaps.length - 1].position!)}
                  r="4"
                  fill={color}
                  stroke="#000"
                  strokeWidth="1"
                />
              )}
              {/* Driver label at end */}
              {sortedLaps.length > 0 && sortedLaps[sortedLaps.length - 1].position !== null && (
                <text
                  x={width - padding.right + 8}
                  y={getY(sortedLaps[sortedLaps.length - 1].position!)}
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
