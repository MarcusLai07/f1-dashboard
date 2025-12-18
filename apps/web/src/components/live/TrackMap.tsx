"use client";

import { useEffect, useRef } from "react";
import type { CarPosition } from "@/types/f1";

interface TrackMapProps {
  trackId?: string;
  positions: CarPosition[];
  selectedDrivers?: string[];
  width?: number;
  height?: number;
}

export function TrackMap({
  trackId = "default",
  positions,
  selectedDrivers = [],
  width = 600,
  height = 400,
}: TrackMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Placeholder track outline - in production, load actual track SVGs
  const trackPath =
    "M 100,200 C 100,100 200,50 300,50 C 400,50 500,100 500,200 C 500,300 400,350 300,350 C 200,350 100,300 100,200";

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        ref={svgRef}
        viewBox="0 0 600 400"
        className="w-full h-full max-w-[600px] max-h-[400px]"
        style={{ aspectRatio: "600/400" }}
      >
        {/* Track Background */}
        <path
          d={trackPath}
          fill="none"
          stroke="#27272a"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Track Surface */}
        <path
          d={trackPath}
          fill="none"
          stroke="#3f3f46"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Track Center Line */}
        <path
          d={trackPath}
          fill="none"
          stroke="#52525b"
          strokeWidth="1"
          strokeDasharray="8 8"
          strokeLinecap="round"
        />

        {/* Car Positions */}
        {positions.map((car) => {
          const isSelected = selectedDrivers.includes(car.driverCode);
          // Normalize position to track coordinates (placeholder logic)
          const x = ((car.x % 500) + 500) % 500 + 50;
          const y = ((car.y % 300) + 300) % 300 + 50;

          return (
            <g key={car.driverCode}>
              {/* Car dot */}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 8 : 6}
                fill={car.teamColor}
                stroke={isSelected ? "#ffffff" : "none"}
                strokeWidth={2}
                className="transition-all duration-300"
              />
              {/* Driver label */}
              {isSelected && (
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  className="fill-white text-[10px] font-bold"
                >
                  {car.driverCode}
                </text>
              )}
            </g>
          );
        })}

        {/* Track Name */}
        <text
          x="300"
          y="380"
          textAnchor="middle"
          className="fill-muted-foreground text-sm font-medium"
        >
          {trackId !== "default" ? trackId.toUpperCase() : "TRACK MAP"}
        </text>
      </svg>

      {/* No data overlay */}
      {positions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80">
          <p className="text-muted-foreground text-sm">
            Waiting for position data...
          </p>
        </div>
      )}
    </div>
  );
}
