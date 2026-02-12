"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import type { CarPosition, CarLocation, LocationBounds } from "@/types/f1";

interface TrackMap3DProps {
  trackName?: string;
  positions: CarPosition[];
  locations?: CarLocation[];
  locationBounds?: LocationBounds | null;
  selectedDrivers?: string[];
}

interface CircuitData {
  name: string;
  location: string;
  length: number;
  svgPath: string;
  pitLanePath?: string;
  viewBox: string;
  coordinates: [number, number][];
  geojson?: {
    source: string;
    file: string;
    bounds: {
      minLng: number;
      maxLng: number;
      minLat: number;
      maxLat: number;
    };
    startFinish?: [number, number];
  } | null;
}

// Cache for circuit data
const circuitCache = new Map<string, CircuitData>();

export function TrackMap3D({
  trackName,
  positions,
  locations = [],
  locationBounds = null,
  selectedDrivers = [],
}: TrackMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pitLaneRef = useRef<SVGPathElement>(null);

  // Stable bounds refs (persist across renders)
  const stableBoundsRef = useRef<LocationBounds | null>(null);
  const stableBoundsCircuitRef = useRef<string | null>(null);
  const hasRenderedCarsRef = useRef(false);

  // GPS trail accumulation
  const trailPointsRef = useRef<Set<string>>(new Set());
  const trailCircuitRef = useRef<string | null>(null);

  // Fallback mode refs (SVG path measurement)
  const fallbackPathLengthRef = useRef<number>(0);
  const fallbackTrackBoundsRef = useRef<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null>(null);

  const [circuit, setCircuit] = useState<CircuitData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Transform state for pan/zoom
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Fetch circuit data (for fallback mode)
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

  // Measure SVG path and animate track drawing (fallback mode only)
  useEffect(() => {
    if (pathRef.current && circuit?.svgPath) {
      const path = pathRef.current;
      const length = path.getTotalLength();
      fallbackPathLengthRef.current = length;

      // Calculate track bounds by sampling
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      const samples = 100;
      for (let i = 0; i <= samples; i++) {
        const point = path.getPointAtLength((i / samples) * length);
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
      fallbackTrackBoundsRef.current = { minX, minY, maxX, maxY };

      // Animate track drawing
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;

      import("animejs")
        .then(({ animate }) => {
          animate(path, {
            strokeDashoffset: [length, 0],
            duration: 1500,
            easing: "easeInOutQuad",
            onComplete: () => setIsLoaded(true),
          });
        })
        .catch(() => {
          path.style.strokeDashoffset = "0";
          setIsLoaded(true);
        });
    }
  }, [circuit?.svgPath]);

  // Sort positions by race position
  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      const posA = (a as any).position ?? positions.indexOf(a) + 1;
      const posB = (b as any).position ?? positions.indexOf(b) + 1;
      return posA - posB;
    });
  }, [positions]);

  // Check if we have valid location data
  const hasValidLocations = useMemo(() => {
    return (
      locations.length > 0 &&
      locationBounds &&
      locationBounds.maxX - locationBounds.minX > 10 &&
      locationBounds.maxY - locationBounds.minY > 10
    );
  }, [locations, locationBounds]);

  // Build a lookup map of driver locations by code
  const locationByDriver = useMemo(() => {
    const map = new Map<string, CarLocation>();
    locations.forEach((loc) => {
      map.set(loc.driverCode, loc);
    });
    return map;
  }, [locations]);

  // Stable location bounds — lock first valid bounds, only update on large changes
  const stableLocationBounds = useMemo(() => {
    if (!locationBounds) return stableBoundsRef.current;

    const circuitId = circuit?.name || trackName || "";

    // Reset if circuit changed
    if (circuitId !== stableBoundsCircuitRef.current) {
      stableBoundsRef.current = null;
      stableBoundsCircuitRef.current = circuitId;
    }

    const prev = stableBoundsRef.current;
    if (!prev) {
      stableBoundsRef.current = locationBounds;
      return locationBounds;
    }

    // Only update if bounds expanded by >20%
    const prevW = prev.maxX - prev.minX;
    const prevH = prev.maxY - prev.minY;
    const newW = locationBounds.maxX - locationBounds.minX;
    const newH = locationBounds.maxY - locationBounds.minY;
    if (
      Math.abs(newW - prevW) / prevW > 0.2 ||
      Math.abs(newH - prevH) / prevH > 0.2
    ) {
      stableBoundsRef.current = locationBounds;
      return locationBounds;
    }

    return prev;
  }, [locationBounds, circuit?.name, trackName]);

  // GPS-mode scale factor: sizes in SVG user units (meters) need to be visible
  // For a 700m circuit, gpsUnit ≈ 2.3, making dot r=9*2.3=21m ≈ 15px on screen
  const gpsUnit = useMemo(() => {
    if (!stableLocationBounds || !hasValidLocations) return 1;
    const w = stableLocationBounds.maxX - stableLocationBounds.minX;
    const h = stableLocationBounds.maxY - stableLocationBounds.minY;
    return Math.max(w, h) / 300;
  }, [stableLocationBounds, hasValidLocations]);

  // =========================================================================
  // GPS MODE: Accumulate trail + build path, direct coordinate rendering
  // =========================================================================

  // Accumulate GPS trail and build SVG path string for track outline
  const trailPath = useMemo(() => {
    if (!hasValidLocations) return "";

    const circuitId = trackName || "";

    // Reset trail on circuit change
    if (circuitId !== trailCircuitRef.current) {
      trailPointsRef.current = new Set();
      trailCircuitRef.current = circuitId;
    }

    const trail = trailPointsRef.current;

    // Add current locations to trail (round to ~1m resolution for dedup)
    for (const loc of locations) {
      if (loc.x === 0 && loc.y === 0) continue;
      const key = `${Math.round(loc.x)},${Math.round(loc.y)}`;
      if (trail.size < 6000) {
        trail.add(key);
      }
    }

    // Build SVG path: each point is a tiny line segment (renders as dot with round linecap)
    const parts: string[] = [];
    for (const key of trail) {
      const [x, y] = key.split(",");
      parts.push(`M${x},${-Number(y)} l0.1,0`);
    }

    return parts.join(" ");
  }, [locations, hasValidLocations, trackName]);

  // GPS-mode car positions: direct OpenF1 coordinates with Y-flip
  const gpsCarPositions = useMemo(() => {
    if (!hasValidLocations) return null;

    return sortedPositions.map((car, index) => {
      const racePosition = (car as any).position ?? index + 1;
      const location = locationByDriver.get(car.driverCode);

      if (location && (location.x !== 0 || location.y !== 0)) {
        return {
          ...car,
          trackX: location.x,
          trackY: -location.y, // Y-flip: geographic Y↑ → SVG Y↓
          position: racePosition,
          isInPit: false,
          isHidden: false,
        };
      }

      // No GPS data — hide from track map
      return {
        ...car,
        trackX: 0,
        trackY: 0,
        position: racePosition,
        isInPit: true,
        isHidden: true,
      };
    });
  }, [hasValidLocations, sortedPositions, locationByDriver]);

  // GPS-mode viewBox: derived from stableLocationBounds with Y-flip
  const gpsViewBox = useMemo(() => {
    if (!stableLocationBounds) return null;

    const { minX, maxX, minY, maxY } = stableLocationBounds;
    const w = maxX - minX;
    const h = maxY - minY;
    // 5% padding on each side for visual breathing room
    const px = w * 0.05;
    const py = h * 0.05;

    // Y is negated: top of SVG is -(maxY + padding)
    return `${minX - px} ${-(maxY + py)} ${w + 2 * px} ${h + 2 * py}`;
  }, [stableLocationBounds]);

  // =========================================================================
  // FALLBACK MODE: Distribute along SVG path (no GPS data)
  // =========================================================================

  const fallbackCarPositions = useMemo(() => {
    if (hasValidLocations) return null;
    if (!isLoaded || !pathRef.current || fallbackPathLengthRef.current === 0)
      return [];

    const path = pathRef.current;
    const pathLength = fallbackPathLengthRef.current;
    const trackBounds = fallbackTrackBoundsRef.current;
    const totalDrivers = sortedPositions.length;

    const pitCars = sortedPositions.filter((car) => {
      const status = (car as any).status;
      return status === "PIT" || status === "OUT";
    });
    let pitIndex = 0;

    const pitLaneLength = pitLaneRef.current?.getTotalLength() || 0;

    return sortedPositions.map((car, index) => {
      const racePosition = (car as any).position ?? index + 1;
      const status = (car as any).status;
      const isInPit = status === "PIT" || status === "OUT";

      if (isInPit) {
        if (pitLaneRef.current && pitLaneLength > 0) {
          const pitProgress =
            pitCars.length > 1 ? pitIndex / (pitCars.length - 1) : 0.5;
          const pitPoint = pitLaneRef.current.getPointAtLength(
            pitProgress * pitLaneLength
          );
          pitIndex++;

          return {
            ...car,
            trackX: pitPoint.x,
            trackY: pitPoint.y,
            position: racePosition,
            isInPit: true,
          };
        }

        if (trackBounds) {
          const pitProgress = 0.95 + (index % 6) * 0.008;
          const pitPoint = path.getPointAtLength(
            (pitProgress % 1) * pathLength
          );
          const centerX = (trackBounds.minX + trackBounds.maxX) / 2;
          const centerY = (trackBounds.minY + trackBounds.maxY) / 2;
          const dx = centerX - pitPoint.x;
          const dy = centerY - pitPoint.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const pitOffset = 15;

          return {
            ...car,
            trackX: pitPoint.x + (dx / len) * pitOffset,
            trackY: pitPoint.y + (dy / len) * pitOffset,
            position: racePosition,
            isInPit: true,
          };
        }
      }

      const onTrackDrivers = totalDrivers - pitCars.length;
      const onTrackIndex = index - pitIndex;
      const spacing = 1 / Math.max(onTrackDrivers, 15);
      const progress = (onTrackIndex * spacing * 1.2) % 1;

      const point = path.getPointAtLength(progress * pathLength);

      return {
        ...car,
        trackX: point.x,
        trackY: point.y,
        position: racePosition,
        isInPit: false,
      };
    });
  }, [hasValidLocations, isLoaded, sortedPositions]);

  // =========================================================================
  // Combined: GPS mode takes priority, then fallback
  // =========================================================================

  const carPositions = gpsCarPositions ?? fallbackCarPositions ?? [];

  const viewBox = useMemo(() => {
    if (hasValidLocations && gpsViewBox) return gpsViewBox;
    if (circuit?.viewBox) return circuit.viewBox;
    return "0 0 500 300";
  }, [hasValidLocations, gpsViewBox, circuit?.viewBox]);

  const isReady = hasValidLocations || isLoaded;

  // Enable CSS transitions after first render to prevent fly-in from (0,0)
  useEffect(() => {
    if (carPositions.length > 0 && !hasRenderedCarsRef.current) {
      requestAnimationFrame(() => {
        hasRenderedCarsRef.current = true;
      });
    }
  }, [carPositions.length]);

  // Reset transition flag when circuit changes
  useEffect(() => {
    hasRenderedCarsRef.current = false;
  }, [trackName]);

  // Wheel handler for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.5, Math.min(3, prev * delta)));
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setScale(1);
    setRotation(0);
  }, []);

  // Helper to render car dots (shared between GPS and fallback modes)
  // scale: multiplier for sizes (gpsUnit in GPS mode, 1 in fallback)
  const renderCarDot = (car: (typeof carPositions)[number], scale: number = 1) => {
    if ((car as any).isHidden) return null;

    const isSelected = selectedDrivers.includes(car.driverCode);
    const isInPit = (car as any).isInPit;
    const dotRadius = (isInPit ? 8 : isSelected ? 10 : 9) * scale;
    const glowR = 14 * scale;
    const glowRMax = 18 * scale;
    const fontSize = (isInPit ? 6 : 7) * scale;
    const strokeW = (isSelected ? 2 : 1) * scale;
    const textY = 3 * scale;

    return (
      <g
        key={car.driverCode}
        transform={`translate(${car.trackX}, ${car.trackY})`}
        style={{
          transition: hasRenderedCarsRef.current
            ? "transform 2s linear"
            : "none",
        }}
        opacity={isInPit ? 0.7 : 1}
      >
        {/* Selection glow */}
        {isSelected && (
          <circle
            cx={0}
            cy={0}
            r={glowR}
            fill={car.teamColor}
            opacity={0.4}
            filter="url(#carGlow)"
          >
            <animate
              attributeName="r"
              values={`${glowR};${glowRMax};${glowR}`}
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        {/* Car dot with team color */}
        <circle
          cx={0}
          cy={0}
          r={dotRadius}
          fill={car.teamColor}
          stroke={isSelected ? "#fff" : "#000"}
          strokeWidth={strokeW}
        />
        {/* Driver code inside dot */}
        <text
          x={0}
          y={textY}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="bold"
          fill="#fff"
          style={{ textShadow: "0 0 2px #000" }}
        >
          {car.driverCode.substring(0, 3)}
        </text>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-zinc-950 rounded-lg"
      onWheel={handleWheel}
    >
      {/* Transform Container */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-200"
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
        }}
      >
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: "100%", maxHeight: "100%", overflow: "visible" }}
        >
          {/* Definitions */}
          <defs>
            <filter id="carGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation={gpsUnit * 2} result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {hasValidLocations && gpsViewBox ? (
            /* ============================================================
               GPS MODE: Direct OpenF1 coordinate rendering
               ============================================================ */
            <>
              {/* Track outline from accumulated GPS trail points */}
              {trailPath && (
                <path
                  d={trailPath}
                  fill="none"
                  stroke="#52525b"
                  strokeWidth={gpsUnit * 5}
                  strokeLinecap="round"
                />
              )}

              {/* Car Positions */}
              {carPositions.map((car) => renderCarDot(car, gpsUnit))}
            </>
          ) : circuit?.svgPath ? (
            /* ============================================================
               FALLBACK MODE: SVG path + estimated positions
               ============================================================ */
            <>
              {/* Background track (dark outline) */}
              <path
                d={circuit.svgPath}
                fill="none"
                stroke="#27272a"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Main track path (for animation) */}
              <path
                ref={pathRef}
                d={circuit.svgPath}
                fill="none"
                stroke={isLoaded ? "#3f3f46" : "#22d3ee"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pit Lane */}
              {isLoaded && circuit.pitLanePath && (
                <path
                  ref={pitLaneRef}
                  d={circuit.pitLanePath}
                  fill="none"
                  stroke="#52525b"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.5}
                />
              )}

              {/* Start/Finish marker */}
              {isLoaded &&
                pathRef.current &&
                (() => {
                  const startPoint = pathRef.current.getPointAtLength(0);
                  return (
                    <g
                      transform={`translate(${startPoint.x}, ${startPoint.y})`}
                    >
                      <rect
                        x="-5"
                        y="-5"
                        width="10"
                        height="10"
                        fill="#fff"
                        stroke="#000"
                        strokeWidth="1"
                      />
                      <rect
                        x="-5"
                        y="-5"
                        width="2.5"
                        height="2.5"
                        fill="#000"
                      />
                      <rect
                        x="0"
                        y="-5"
                        width="2.5"
                        height="2.5"
                        fill="#000"
                      />
                      <rect
                        x="-2.5"
                        y="-2.5"
                        width="2.5"
                        height="2.5"
                        fill="#000"
                      />
                      <rect
                        x="2.5"
                        y="-2.5"
                        width="2.5"
                        height="2.5"
                        fill="#000"
                      />
                      <rect
                        x="-5"
                        y="0"
                        width="2.5"
                        height="2.5"
                        fill="#000"
                      />
                      <rect
                        x="0"
                        y="0"
                        width="2.5"
                        height="2.5"
                        fill="#000"
                      />
                      <rect
                        x="-2.5"
                        y="2.5"
                        width="2.5"
                        height="2.5"
                        fill="#000"
                      />
                      <rect
                        x="2.5"
                        y="2.5"
                        width="2.5"
                        height="2.5"
                        fill="#000"
                      />
                    </g>
                  );
                })()}

              {/* Car Positions (fallback) */}
              {isLoaded && carPositions.map(renderCarDot)}

              {/* Circuit name */}
              {circuit && fallbackTrackBoundsRef.current && (
                <text
                  x={
                    (fallbackTrackBoundsRef.current.minX +
                      fallbackTrackBoundsRef.current.maxX) /
                    2
                  }
                  y={fallbackTrackBoundsRef.current.maxY + 25}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="500"
                  fill="#71717a"
                  className="uppercase tracking-widest"
                >
                  {circuit.location || circuit.name}
                </text>
              )}
            </>
          ) : (
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
        </svg>
      </div>

      {/* Legend */}
      {isReady && (
        <div className="absolute top-2 left-2 flex flex-col gap-1 bg-black/70 backdrop-blur-sm p-2 rounded text-[10px]">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${hasValidLocations ? "bg-green-500" : "bg-yellow-500"}`}
            />
            <span className="text-zinc-400">
              {hasValidLocations
                ? `GPS Live · ${carPositions.filter((c) => !(c as any).isHidden).length} cars`
                : "Estimated positions"}
            </span>
          </div>
          {hasValidLocations && trailPointsRef.current.size > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-zinc-600 rounded-sm" />
              <span className="text-zinc-600">
                {trailPointsRef.current.size.toLocaleString()} trail pts
              </span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        <button
          onClick={resetView}
          className="px-2 py-1 bg-black/70 hover:bg-black/90 text-zinc-300 text-[10px] rounded transition-colors"
        >
          Reset View
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-2 left-2 text-[10px] text-zinc-600">
        Scroll to zoom
      </div>
    </div>
  );
}
