"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import type { CarPosition } from "@/types/f1";

interface TrackMapProps {
  trackName?: string;
  positions: CarPosition[];
  selectedDrivers?: string[];
}

interface CircuitData {
  name: string;
  location: string;
  length: number;
  svgPath: string;
  viewBox: string;
}

// Cache for circuit data
const circuitCache = new Map<string, CircuitData>();

export function TrackMap({
  trackName,
  positions,
  selectedDrivers = [],
}: TrackMapProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [circuit, setCircuit] = useState<CircuitData | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch circuit data
  const fetchCircuit = useCallback(async (name: string) => {
    // Check cache first
    if (circuitCache.has(name)) {
      const cached = circuitCache.get(name)!;
      setCircuit(cached);
      setIsLoaded(true);
      return;
    }

    try {
      const res = await fetch(`/api/circuit?name=${encodeURIComponent(name)}`);
      if (!res.ok) {
        console.warn(`Circuit not found: ${name}`);
        return;
      }
      const data: CircuitData = await res.json();
      circuitCache.set(name, data);
      setCircuit(data);
      setIsDrawing(true);
      setIsLoaded(false);
    } catch (error) {
      console.error("Failed to fetch circuit:", error);
    }
  }, []);

  // Fetch circuit when track name changes
  useEffect(() => {
    if (trackName && trackName !== "track") {
      setCircuit(null);
      setIsLoaded(false);
      fetchCircuit(trackName);
    }
  }, [trackName, fetchCircuit]);

  // Get path length and animate drawing when circuit loads
  useEffect(() => {
    if (pathRef.current && circuit?.svgPath) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);

      if (isDrawing) {
        // Set up for line drawing animation
        pathRef.current.style.strokeDasharray = `${length}`;
        pathRef.current.style.strokeDashoffset = `${length}`;

        // Animate with anime.js
        import("animejs").then(({ animate }) => {
          if (pathRef.current) {
            animate(pathRef.current, {
              strokeDashoffset: [length, 0],
              duration: 2000,
              easing: "easeInOutQuad",
              onComplete: () => {
                setIsDrawing(false);
                setIsLoaded(true);
              },
            });
          }
        });
      }
    }
  }, [circuit?.svgPath, isDrawing]);

  // Sort positions by position field
  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      const posA = (a as any).position || positions.indexOf(a) + 1;
      const posB = (b as any).position || positions.indexOf(b) + 1;
      return posA - posB;
    });
  }, [positions]);

  // Calculate car positions along the track path
  const carPositions = useMemo(() => {
    if (!pathLength || !pathRef.current || !isLoaded) return [];

    const totalCars = sortedPositions.length || 20;
    const path = pathRef.current;

    return sortedPositions.map((car, index) => {
      // Spread cars along the track - leader at start/finish line
      const gapPerCar = 0.04; // 4% of track per position
      const progress = (index * gapPerCar) % 1;
      const lengthPosition = progress * pathLength;

      const point = path.getPointAtLength(lengthPosition);

      return {
        ...car,
        trackX: point.x,
        trackY: point.y,
      };
    });
  }, [sortedPositions, pathLength, isLoaded]);

  // Parse viewBox
  const viewBox = circuit?.viewBox || "0 0 800 500";

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2">
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect x="0" y="0" width="100%" height="100%" fill="transparent" />

        {circuit?.svgPath ? (
          <>
            {/* Track Shadow */}
            <path
              d={circuit.svgPath}
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="28"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Track Surface */}
            <path
              ref={pathRef}
              d={circuit.svgPath}
              fill="none"
              stroke="#3f3f46"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Track Inner Edge */}
            <path
              d={circuit.svgPath}
              fill="none"
              stroke="#27272a"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                opacity: isLoaded ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            />

            {/* Racing Line (dashed) */}
            <path
              d={circuit.svgPath}
              fill="none"
              stroke="#52525b"
              strokeWidth="1"
              strokeDasharray="6 4"
              strokeLinecap="round"
              style={{
                opacity: isLoaded ? 0.6 : 0,
                transition: "opacity 0.3s ease 0.5s",
              }}
            />

            {/* Sector colors - simulate sectors by using gradient */}
            {isLoaded && (
              <>
                <defs>
                  <linearGradient id="sector-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="33%" stopColor="#ef4444" />
                    <stop offset="33%" stopColor="#eab308" />
                    <stop offset="66%" stopColor="#eab308" />
                    <stop offset="66%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <path
                  d={circuit.svgPath}
                  fill="none"
                  stroke="url(#sector-gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.4}
                />
              </>
            )}
          </>
        ) : (
          // Placeholder while loading
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fontSize="14"
            fill="#52525b"
          >
            {trackName ? "Loading circuit..." : "Select a session"}
          </text>
        )}

        {/* Car Positions */}
        {isLoaded && carPositions.map((car, index) => {
          const isSelected = selectedDrivers.includes(car.driverCode);
          const position = index + 1;

          return (
            <g key={car.driverCode}>
              {/* Car glow for selected */}
              {isSelected && (
                <circle
                  cx={car.trackX}
                  cy={car.trackY}
                  r={16}
                  fill={car.teamColor}
                  opacity={0.4}
                >
                  <animate
                    attributeName="opacity"
                    values="0.4;0.2;0.4"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {/* Car dot */}
              <circle
                cx={car.trackX}
                cy={car.trackY}
                r={isSelected ? 10 : 7}
                fill={car.teamColor}
                stroke={isSelected ? "#ffffff" : "#000000"}
                strokeWidth={isSelected ? 2 : 1}
              />
              {/* Position number */}
              <text
                x={car.trackX}
                y={car.trackY + 3}
                textAnchor="middle"
                fontSize={isSelected ? "8" : "6"}
                fontWeight="bold"
                fill="#ffffff"
              >
                {position}
              </text>
              {/* Driver label for selected */}
              {isSelected && (
                <g>
                  <rect
                    x={car.trackX - 16}
                    y={car.trackY - 26}
                    width="32"
                    height="12"
                    fill="rgba(0,0,0,0.85)"
                    rx="2"
                  />
                  <text
                    x={car.trackX}
                    y={car.trackY - 17}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#ffffff"
                  >
                    {car.driverCode}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Circuit Info */}
        {circuit && (
          <g>
            {/* Circuit Name */}
            <text
              x="50%"
              y="94%"
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fill="#a1a1aa"
              className="uppercase tracking-wider"
            >
              {circuit.location || circuit.name}
            </text>
            {/* Circuit Stats */}
            {circuit.length > 0 && (
              <text
                x="50%"
                y="98%"
                textAnchor="middle"
                fontSize="10"
                fill="#52525b"
              >
                {(circuit.length / 1000).toFixed(3)} km
              </text>
            )}
          </g>
        )}
      </svg>

      {/* No data overlay */}
      {positions.length === 0 && circuit && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground text-sm bg-background/80 px-3 py-1 rounded">
            Waiting for position data...
          </p>
        </div>
      )}
    </div>
  );
}
