"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import type { CarPosition } from "@/types/f1";

interface TrackMap3DProps {
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
  coordinates: [number, number][];
}

// Cache for circuit data
const circuitCache = new Map<string, CircuitData>();

export function TrackMap3D({
  trackName,
  positions,
  selectedDrivers = [],
}: TrackMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const [circuit, setCircuit] = useState<CircuitData | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  // 2D rotation (flat spin) and zoom
  const [transform, setTransform] = useState({ scale: 1, rotate: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // Fetch circuit data
  const fetchCircuit = useCallback(async (name: string) => {
    if (circuitCache.has(name)) {
      const cached = circuitCache.get(name)!;
      setCircuit(cached);
      return;
    }

    try {
      const res = await fetch(`/api/circuit?name=${encodeURIComponent(name)}`);
      if (!res.ok) return;
      const data: CircuitData = await res.json();
      circuitCache.set(name, data);
      setCircuit(data);
    } catch (error) {
      console.error("Failed to fetch circuit:", error);
    }
  }, []);

  useEffect(() => {
    if (trackName && trackName !== "track") {
      setCircuit(null);
      setIsLoaded(false);
      fetchCircuit(trackName);
    }
  }, [trackName, fetchCircuit]);

  // Animate track drawing with anime.js
  useEffect(() => {
    if (pathRef.current && circuit?.svgPath && !isLoaded) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);

      pathRef.current.style.strokeDasharray = `${length}`;
      pathRef.current.style.strokeDashoffset = `${length}`;

      import("animejs").then(({ animate }) => {
        if (pathRef.current) {
          animate(pathRef.current, {
            strokeDashoffset: [length, 0],
            duration: 2500,
            easing: "easeInOutQuad",
            onComplete: () => setIsLoaded(true),
          });
        }
      });
    }
  }, [circuit?.svgPath, isLoaded]);

  // Mouse handlers for 2D rotation (flat spin like rotating a map)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouse.x;
    // Flat 2D rotation around Z axis
    setTransform(prev => ({
      ...prev,
      rotate: prev.rotate + deltaX * 0.5,
    }));

    setLastMouse({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMouse]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel handler for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * delta)),
    }));
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setTransform({ scale: 1, rotate: 0 });
  }, []);

  // Sort positions by race position
  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      const posA = (a as any).position || positions.indexOf(a) + 1;
      const posB = (b as any).position || positions.indexOf(b) + 1;
      return posA - posB;
    });
  }, [positions]);

  // Calculate car positions along the track
  const carPositions = useMemo(() => {
    if (!pathLength || !pathRef.current || !isLoaded) return [];

    const path = pathRef.current;
    return sortedPositions.map((car, index) => {
      const gapPerCar = 0.04;
      const progress = (index * gapPerCar) % 1;
      const point = path.getPointAtLength(progress * pathLength);
      return { ...car, trackX: point.x, trackY: point.y };
    });
  }, [sortedPositions, pathLength, isLoaded]);

  // Generate sector paths (simple 1/3 splits)
  const sectorPaths = useMemo(() => {
    if (!pathLength || !pathRef.current || !isLoaded) return [];

    const path = pathRef.current;
    const sectorBoundaries = [0.33, 0.66];
    const [s1End, s2End] = sectorBoundaries;

    const generateSectorPath = (start: number, end: number): string => {
      const points: string[] = [];
      const steps = 50;
      for (let i = 0; i <= steps; i++) {
        const t = start + (end - start) * (i / steps);
        const point = path.getPointAtLength(t * pathLength);
        points.push(`${i === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
      }
      return points.join(" ");
    };

    return [
      { path: generateSectorPath(0, s1End), color: "#ef4444", label: "S1" },
      { path: generateSectorPath(s1End, s2End), color: "#eab308", label: "S2" },
      { path: generateSectorPath(s2End, 1), color: "#22d3ee", label: "S3" },
    ];
  }, [pathLength, isLoaded]);

  const viewBox = circuit?.viewBox || "0 0 800 500";

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-zinc-950 rounded-lg"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* 2D Transform Container - flat rotation and zoom */}
      <div
        className="transition-transform duration-100"
        style={{
          transform: `rotate(${transform.rotate}deg) scale(${transform.scale})`,
        }}
      >
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="w-full h-full max-w-[600px] max-h-[450px]"
          style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))" }}
        >
          {/* Definitions */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="shadow">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.5"/>
            </filter>
          </defs>

          {circuit?.svgPath ? (
            <>
              {/* Track Shadow/Base */}
              <path
                d={circuit.svgPath}
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="30"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Track Outline */}
              <path
                d={circuit.svgPath}
                fill="none"
                stroke="#3f3f46"
                strokeWidth="26"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Animated main track path */}
              <path
                ref={pathRef}
                d={circuit.svgPath}
                fill="none"
                stroke="#52525b"
                strokeWidth="20"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Sector colored overlays */}
              {isLoaded && sectorPaths.map((sector, i) => (
                <path
                  key={i}
                  d={sector.path}
                  fill="none"
                  stroke={sector.color}
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                  filter="url(#glow)"
                />
              ))}

              {/* Start/Finish line - checkered flag */}
              {isLoaded && pathRef.current && (() => {
                const startPoint = pathRef.current.getPointAtLength(0);
                return (
                  <g transform={`translate(${startPoint.x}, ${startPoint.y})`}>
                    <rect x="-8" y="-8" width="16" height="16" fill="#fff" />
                    <rect x="-8" y="-8" width="4" height="4" fill="#000" />
                    <rect x="0" y="-8" width="4" height="4" fill="#000" />
                    <rect x="-4" y="-4" width="4" height="4" fill="#000" />
                    <rect x="4" y="-4" width="4" height="4" fill="#000" />
                    <rect x="-8" y="0" width="4" height="4" fill="#000" />
                    <rect x="0" y="0" width="4" height="4" fill="#000" />
                    <rect x="-4" y="4" width="4" height="4" fill="#000" />
                    <rect x="4" y="4" width="4" height="4" fill="#000" />
                  </g>
                );
              })()}

              {/* Car Positions */}
              {isLoaded && carPositions.map((car, index) => {
                const isSelected = selectedDrivers.includes(car.driverCode);
                const position = index + 1;

                return (
                  <g key={car.driverCode}>
                    {isSelected && (
                      <circle
                        cx={car.trackX}
                        cy={car.trackY}
                        r={14}
                        fill={car.teamColor}
                        opacity={0.5}
                        filter="url(#glow)"
                      >
                        <animate
                          attributeName="r"
                          values="14;18;14"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    <circle
                      cx={car.trackX}
                      cy={car.trackY}
                      r={isSelected ? 9 : 6}
                      fill={car.teamColor}
                      stroke={isSelected ? "#fff" : "#000"}
                      strokeWidth={isSelected ? 2 : 1}
                      filter="url(#shadow)"
                    />
                    <text
                      x={car.trackX}
                      y={car.trackY + 3}
                      textAnchor="middle"
                      fontSize={isSelected ? "7" : "5"}
                      fontWeight="bold"
                      fill="#fff"
                    >
                      {position}
                    </text>
                    {isSelected && (
                      <text
                        x={car.trackX}
                        y={car.trackY - 14}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#fff"
                        filter="url(#shadow)"
                      >
                        {car.driverCode}
                      </text>
                    )}
                  </g>
                );
              })}
            </>
          ) : (
            <text x="50%" y="50%" textAnchor="middle" fontSize="14" fill="#52525b">
              {trackName ? "Loading circuit..." : "Select a session"}
            </text>
          )}

          {/* Circuit name */}
          {circuit && (
            <text
              x="50%"
              y="96%"
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fill="#a1a1aa"
              className="uppercase tracking-widest"
            >
              {circuit.location || circuit.name}
            </text>
          )}
        </svg>
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          onClick={resetView}
          className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs rounded transition-colors"
        >
          Reset View
        </button>
      </div>

      {/* Legend */}
      {isLoaded && (
        <div className="absolute top-3 left-3 flex flex-col gap-1 bg-zinc-900/80 p-2 rounded text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1.5 bg-red-500 rounded" />
            <span className="text-zinc-400">Sector 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1.5 bg-yellow-500 rounded" />
            <span className="text-zinc-400">Sector 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1.5 bg-cyan-400 rounded" />
            <span className="text-zinc-400">Sector 3</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-3 left-3 text-xs text-zinc-500">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}
