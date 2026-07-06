"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { useLiveStore } from "@/stores/liveStore";
import type { CarPosition, CarLocation, LocationBounds } from "@/types/f1";

interface TrackMap3DProps {
  trackName?: string;
  positions: CarPosition[];
  locations?: CarLocation[];
  locationBounds?: LocationBounds | null;
  selectedDrivers?: string[];
}

interface CircuitSector {
  number: number;
  startPercent: number;
  endPercent: number;
  color: string;
}

interface CircuitCorner {
  number: number;
  type: string;
  position: number; // percentage along track
}

interface CircuitDrsZone {
  detection: number;
  activation: number;
  length: number; // meters
}

interface CircuitData {
  name: string;
  location: string;
  length: number; // km
  svgPath: string;
  pitLanePath?: string;
  viewBox: string;
  coordinates: [number, number][];
  sectors?: CircuitSector[];
  corners?: CircuitCorner[];
  drsZones?: CircuitDrsZone[];
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
  const measurePathRef = useRef<SVGPathElement>(null); // Hidden path for measurement
  const pathRef = useRef<SVGPathElement>(null); // Visible path for fallback animation
  const pitLaneRef = useRef<SVGPathElement>(null);
  const hasRenderedCarsRef = useRef(false);

  // SVG path measurement refs
  const pathLengthRef = useRef<number>(0);
  const trackBoundsRef = useRef<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null>(null);

  // Accumulated GPS bounds (expands over time for better alignment)
  const gpsBoundsRef = useRef({
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
  });

  const isStreaming = useLiveStore((s) => s.isStreaming);

  const [circuit, setCircuit] = useState<CircuitData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [gpsBoundsEpoch, setGpsBoundsEpoch] = useState(0);

  // GPS→SVG transform detection: stores the complete frozen affine transform once detected
  const gpsPointsRef = useRef<Set<string>>(new Set());
  const gpsTransformRef = useRef<{
    cosA: number; sinA: number; flip: boolean;
    gpsCX: number; gpsCY: number;
    rotCX: number; rotCY: number;
    scale: number; svgCX: number; svgCY: number;
  } | null>(null);
  const [rotationDetected, setRotationDetected] = useState(false);

  // View mode: "circuit" (SVG track + GPS overlay) or "gps" (raw GPS trail, no transform)
  const [viewMode, setViewMode] = useState<"circuit" | "gps">("circuit");

  // Trail accumulation for GPS mode (raw GPS dots forming track shape)
  const trailPointsRef = useRef<Set<string>>(new Set());

  // Transform state for pan/zoom
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Fetch circuit data
  const fetchCircuit = useCallback(async (name: string) => {
    if (circuitCache.has(name)) {
      setCircuit(circuitCache.get(name)!);
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
      // Reset GPS bounds and rotation for new circuit
      gpsBoundsRef.current = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      gpsPointsRef.current = new Set();
      gpsTransformRef.current = null;
      trailPointsRef.current = new Set();
      setGpsBoundsEpoch(0);
      setRotationDetected(false);
      fetchCircuit(trackName);
    }
  }, [trackName, fetchCircuit]);

  // Check if we have valid GPS location data (3+ drivers with real coords)
  const hasGps = useMemo(() => {
    if (!locationBounds) return false;
    const realGpsCount = locations.filter(
      (loc) => loc.x !== 0 || loc.y !== 0
    ).length;
    return (
      realGpsCount >= 3 &&
      locationBounds.maxX - locationBounds.minX > 10 &&
      locationBounds.maxY - locationBounds.minY > 10
    );
  }, [locations, locationBounds]);

  // Accumulate GPS bounds and sample points for rotation detection
  useEffect(() => {
    if (!hasGps) return;
    const b = gpsBoundsRef.current;
    const pts = gpsPointsRef.current;
    let expanded = false;
    for (const loc of locations) {
      if (loc.x === 0 && loc.y === 0) continue;
      if (loc.x < b.minX) { b.minX = loc.x; expanded = true; }
      if (loc.x > b.maxX) { b.maxX = loc.x; expanded = true; }
      if (loc.y < b.minY) { b.minY = loc.y; expanded = true; }
      if (loc.y > b.maxY) { b.maxY = loc.y; expanded = true; }
      // Quantized GPS point (50-unit grid) for rotation detection
      const key = `${Math.round(loc.x / 50) * 50},${Math.round(loc.y / 50) * 50}`;
      pts.add(key);
      // Finer trail points (10-unit grid) for GPS trail rendering
      const tKey = `${Math.round(loc.x / 10) * 10},${Math.round(loc.y / 10) * 10}`;
      trailPointsRef.current.add(tKey);
    }
    if (expanded) setGpsBoundsEpoch((e) => e + 1);
  }, [locations, hasGps]);

  // Auto-detect the affine transform (rotation + scale + translation) from GPS to SVG space.
  // Uses the hidden measurePathRef for SVG path sampling.
  useEffect(() => {
    if (rotationDetected || !hasGps || !isLoaded || !measurePathRef.current || pathLengthRef.current === 0) return;
    if (gpsPointsRef.current.size < 15) return;

    // Parse accumulated GPS points
    const gpsPoints: { x: number; y: number }[] = [];
    gpsPointsRef.current.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      gpsPoints.push({ x, y });
    });

    // GPS bbox center (stable, only expands)
    const gb = gpsBoundsRef.current;
    const gpsCX = (gb.minX + gb.maxX) / 2;
    const gpsCY = (gb.minY + gb.maxY) / 2;

    // Require points in all 4 quadrants for reliable shape detection
    const q = [false, false, false, false];
    for (const gp of gpsPoints) {
      if (gp.x >= gpsCX && gp.y >= gpsCY) q[0] = true;
      if (gp.x < gpsCX && gp.y >= gpsCY) q[1] = true;
      if (gp.x < gpsCX && gp.y < gpsCY) q[2] = true;
      if (gp.x >= gpsCX && gp.y < gpsCY) q[3] = true;
    }
    if (!q.every(Boolean)) return; // Not enough track coverage yet

    // SVG reference from hidden measurement path
    const path = measurePathRef.current;
    const totalLen = pathLengthRef.current;
    const svg = trackBoundsRef.current!;
    const svgCX = (svg.minX + svg.maxX) / 2;
    const svgCY = (svg.minY + svg.maxY) / 2;
    const svgW = svg.maxX - svg.minX;
    const svgH = svg.maxY - svg.minY;

    // Sample SVG path points as reference shape
    const svgSamples: { x: number; y: number }[] = [];
    const numSamples = 300;
    for (let i = 0; i < numSamples; i++) {
      const pt = path.getPointAtLength((i / numSamples) * totalLen);
      svgSamples.push({ x: pt.x, y: pt.y });
    }

    // Try 24 rotation angles (every 15°) × 2 Y-flip options = 48 candidates
    let bestError = Infinity;
    let bestParams: typeof gpsTransformRef.current = null;

    for (let ai = 0; ai < 24; ai++) {
      const angle = (ai * Math.PI) / 12;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      for (const flip of [true, false]) {
        // Rotate all GPS points around GPS bbox center, compute rotated bbox
        let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
        const rotated = gpsPoints.map((gp) => {
          const dx = gp.x - gpsCX;
          const dy = gp.y - gpsCY;
          const rx = dx * cosA - dy * sinA;
          const ryRaw = dx * sinA + dy * cosA;
          const ry = flip ? -ryRaw : ryRaw;
          rMinX = Math.min(rMinX, rx); rMaxX = Math.max(rMaxX, rx);
          rMinY = Math.min(rMinY, ry); rMaxY = Math.max(rMaxY, ry);
          return { x: rx, y: ry };
        });

        const rotW = rMaxX - rMinX;
        const rotH = rMaxY - rMinY;
        if (rotW < 1 || rotH < 1) continue;

        // Per-candidate scale: map rotated bbox → SVG bbox
        const s = Math.min(svgW / rotW, svgH / rotH);
        const rotCX = (rMinX + rMaxX) / 2;
        const rotCY = (rMinY + rMaxY) / 2;

        // Score: map rotated points to SVG, measure distance to path
        let totalError = 0;
        for (const rp of rotated) {
          const mx = (rp.x - rotCX) * s + svgCX;
          const my = (rp.y - rotCY) * s + svgCY;

          let minDist = Infinity;
          for (const sp of svgSamples) {
            const d = (mx - sp.x) ** 2 + (my - sp.y) ** 2;
            if (d < minDist) minDist = d;
          }
          totalError += minDist;
        }

        if (totalError < bestError) {
          bestError = totalError;
          bestParams = { cosA, sinA, flip, gpsCX, gpsCY, rotCX, rotCY, scale: s, svgCX, svgCY };
        }
      }
    }

    if (bestParams) {
      const angleDeg = Math.atan2(bestParams.sinA, bestParams.cosA) * (180 / Math.PI);
      console.log("[TrackMap] Rotation detected:", {
        angle: angleDeg.toFixed(1),
        flip: bestParams.flip,
        scale: bestParams.scale.toFixed(6),
        gpsBBox: { cx: bestParams.gpsCX.toFixed(0), cy: bestParams.gpsCY.toFixed(0) },
        rotBBox: { cx: bestParams.rotCX.toFixed(1), cy: bestParams.rotCY.toFixed(1) },
        svgBBox: { cx: bestParams.svgCX.toFixed(1), cy: bestParams.svgCY.toFixed(1) },
        gpsPoints: gpsPointsRef.current.size,
        bestError: bestError.toFixed(0),
      });
      gpsTransformRef.current = bestParams;
      setRotationDetected(true);
    }
  }, [hasGps, isLoaded, gpsBoundsEpoch, rotationDetected]);

  // =========================================================================
  // SVG Path measurement (uses hidden measurePathRef, always available)
  // =========================================================================

  useEffect(() => {
    if (!measurePathRef.current || !circuit?.svgPath) return;

    const path = measurePathRef.current;
    const length = path.getTotalLength();
    pathLengthRef.current = length;

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
    trackBoundsRef.current = { minX, minY, maxX, maxY };
    console.log("[TrackMap] Path measured:", {
      totalLength: length.toFixed(1),
      bounds: { minX: minX.toFixed(1), minY: minY.toFixed(1), maxX: maxX.toFixed(1), maxY: maxY.toFixed(1) },
      svgCenter: { x: ((minX + maxX) / 2).toFixed(1), y: ((minY + maxY) / 2).toFixed(1) },
    });
    setIsLoaded(true);
  }, [circuit?.svgPath]);

  // Animate visible path in fallback (no-GPS) mode
  useEffect(() => {
    if (!pathRef.current || !isLoaded || hasGps || pathLengthRef.current === 0) return;
    const path = pathRef.current;
    const length = pathLengthRef.current;
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    import("animejs")
      .then(({ animate }) => {
        animate(path, {
          strokeDashoffset: [length, 0],
          duration: 1500,
          ease: "inOutQuad",
        });
      })
      .catch(() => {
        path.style.strokeDashoffset = "0";
      });
  }, [isLoaded, hasGps]);

  // =========================================================================
  // Inverse transform: maps SVG space → GPS display space
  // Used to overlay the circuit SVG on the GPS coordinate system
  // =========================================================================

  const circuitInverseTransform = useMemo(() => {
    if (!rotationDetected || !gpsTransformRef.current) return null;
    const t = gpsTransformRef.current;
    const F = t.flip ? -1 : 1;
    const s = t.scale;

    // Forward affine matrix: GPS(gpsX, gpsY) → SVG(svgX, svgY)
    // svgX = a*gpsX + c*gpsY + e
    // svgY = b*gpsX + d*gpsY + f
    const a = s * t.cosA;
    const b = F * s * t.sinA;
    const c = -s * t.sinA;
    const d = F * s * t.cosA;
    const e = -a * t.gpsCX - c * t.gpsCY - s * t.rotCX + t.svgCX;
    const f = -b * t.gpsCX - d * t.gpsCY - s * t.rotCY + t.svgCY;

    // Inverse 2x2: SVG → GPS
    const det = a * d - c * b; // = F * s²
    if (Math.abs(det) < 1e-10) return null;
    const ai = d / det;
    const bi = -b / det;
    const ci = -c / det;
    const di = a / det;
    const ei = -(ai * e + ci * f);
    const fi = -(bi * e + di * f);

    // Compose with Y-flip for GPS display: (gpsX, gpsY) → (gpsX, -gpsY)
    // SVG matrix(a,b,c,d,e,f): newX = a*x + c*y + e, newY = b*x + d*y + f
    // Y-flip negates the Y row: b, d, f
    const ma = ai;
    const mb = -bi;
    const mc = ci;
    const md = -di;
    const me = ei;
    const mf = -fi;

    // Verify: forward GPS center → SVG, then inverse SVG → GPS display
    const svgXc = a * t.gpsCX + c * t.gpsCY + e;
    const svgYc = b * t.gpsCX + d * t.gpsCY + f;
    const dispXc = ma * svgXc + mc * svgYc + me;
    const dispYc = mb * svgXc + md * svgYc + mf;
    console.log("[TrackMap] Inverse transform verification:", {
      gpsCenterIn: [t.gpsCX, t.gpsCY],
      svgCenter: [svgXc, svgYc],
      gpsDisplayOut: [dispXc, dispYc],
      expected: [t.gpsCX, -t.gpsCY],
      angle: Math.atan2(t.sinA, t.cosA) * (180 / Math.PI),
      flip: t.flip,
      scale: s,
    });

    return `matrix(${ma},${mb},${mc},${md},${me},${mf})`;
  }, [rotationDetected]);

  // =========================================================================
  // Car positions
  // =========================================================================

  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      const posA = (a as any).position ?? positions.indexOf(a) + 1;
      const posB = (b as any).position ?? positions.indexOf(b) + 1;
      return posA - posB;
    });
  }, [positions]);

  const locationByDriver = useMemo(() => {
    const map = new Map<string, CarLocation>();
    locations.forEach((loc) => map.set(loc.driverCode, loc));
    return map;
  }, [locations]);

  // Fallback positions along SVG path (no GPS data — historical sessions)
  const fallbackPositions = useMemo(() => {
    if (hasGps) return null; // GPS available, use raw positions instead
    if (!isLoaded || !measurePathRef.current || pathLengthRef.current === 0)
      return [];

    const path = measurePathRef.current;
    const pathLength = pathLengthRef.current;
    const totalDrivers = sortedPositions.length;

    const pitCars = sortedPositions.filter((car) => {
      const status = (car as any).status;
      return status === "PIT" || status === "OUT";
    });
    const onTrackCars = totalDrivers - pitCars.length;
    const allInPit = onTrackCars === 0;
    const pitLaneLength = pitLaneRef.current?.getTotalLength() || 0;
    const hasPitLane = pitLaneRef.current && pitLaneLength > 0;

    let pitIdx = 0;
    let trackIdx = 0;

    return sortedPositions.map((car, index) => {
      const racePosition = (car as any).position ?? index + 1;
      const status = (car as any).status;
      const isInPit = status === "PIT" || status === "OUT";

      if (isInPit) {
        if (allInPit) {
          const progress = index / totalDrivers;
          const point = path.getPointAtLength(progress * pathLength);
          return { ...car, trackX: point.x, trackY: point.y, position: racePosition, isInPit: true };
        }
        if (hasPitLane) {
          const pitProgress = pitCars.length > 1 ? pitIdx / (pitCars.length - 1) : 0.5;
          const pitPoint = pitLaneRef.current!.getPointAtLength(pitProgress * pitLaneLength);
          pitIdx++;
          return { ...car, trackX: pitPoint.x, trackY: pitPoint.y, position: racePosition, isInPit: true };
        }
        const pitProgress = 0.90 + (pitIdx / Math.max(pitCars.length, 1)) * 0.10;
        const pitPoint = path.getPointAtLength((pitProgress % 1) * pathLength);
        pitIdx++;
        return { ...car, trackX: pitPoint.x, trackY: pitPoint.y, position: racePosition, isInPit: true };
      }

      const spacing = 1 / Math.max(onTrackCars, 15);
      const progress = (trackIdx * spacing) % 1;
      trackIdx++;
      const point = path.getPointAtLength(progress * pathLength);
      return { ...car, trackX: point.x, trackY: point.y, position: racePosition, isInPit: false };
    });
  }, [hasGps, isLoaded, sortedPositions]);

  // =========================================================================
  // ViewBox and GPS display helpers
  // =========================================================================

  const gpsViewBox = useMemo(() => {
    const b = gpsBoundsRef.current;
    if (b.minX === Infinity) return null;
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    const pad = Math.max(w, h) * 0.12 + 100;
    // Y-flip: GPS Y increases up, SVG Y increases down
    return `${b.minX - pad} ${-(b.maxY + pad)} ${w + 2 * pad} ${h + 2 * pad}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsBoundsEpoch]);

  const trailPathD = useMemo(() => {
    const points = Array.from(trailPointsRef.current);
    if (points.length === 0) return "";
    return points.map((p) => {
      const [x, y] = p.split(",").map(Number);
      return `M${x} ${-y}l0.1 0`;
    }).join("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]); // recompute when new GPS data arrives

  // GPS dot sizing based on GPS extent
  const gpsDotScale = useMemo(() => {
    const b = gpsBoundsRef.current;
    if (b.minX === Infinity) return { r: 40, fs: 30, sw: 4, trailW: 20 };
    const ext = Math.max(b.maxX - b.minX, b.maxY - b.minY);
    return {
      r: ext * 0.008,
      fs: ext * 0.006,
      sw: ext * 0.0008,
      trailW: ext * 0.012,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsBoundsEpoch]);

  // =========================================================================
  // Rendering helpers (circuit annotations — all in SVG coordinate space)
  // =========================================================================

  // Sector-colored track segments
  const sectorPaths = useMemo(() => {
    if (!isLoaded || !circuit?.sectors || pathLengthRef.current === 0) return null;
    const totalLen = pathLengthRef.current;
    return circuit.sectors.map((sector) => {
      const startLen = (sector.startPercent / 100) * totalLen;
      const sectorLen = ((sector.endPercent - sector.startPercent) / 100) * totalLen;
      return (
        <path
          key={`sector-${sector.number}`}
          d={circuit.svgPath}
          fill="none"
          stroke={sector.color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
          strokeDasharray={`0 ${startLen} ${sectorLen} ${totalLen}`}
        />
      );
    });
  }, [isLoaded, circuit]);

  // Corner markers
  const cornerMarkers = useMemo(() => {
    if (!isLoaded || !circuit?.corners || !measurePathRef.current || pathLengthRef.current === 0) return null;
    const totalLen = pathLengthRef.current;
    const path = measurePathRef.current;
    return circuit.corners.map((corner) => {
      const pt = path.getPointAtLength((corner.position / 100) * totalLen);
      const tb = trackBoundsRef.current;
      if (!tb) return null;
      const cx = (tb.minX + tb.maxX) / 2;
      const cy = (tb.minY + tb.maxY) / 2;
      const dx = cx - pt.x;
      const dy = cy - pt.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const offset = 10;
      const mx = pt.x + (len > 0 ? (dx / len) * offset : 0);
      const my = pt.y + (len > 0 ? (dy / len) * offset : 0);
      return (
        <g key={`corner-${corner.number}`} transform={`translate(${mx}, ${my})`}>
          <circle cx={0} cy={0} r={4} fill="#27272a" stroke="#52525b" strokeWidth={0.5} />
          <text
            x={0}
            y={1.5}
            textAnchor="middle"
            fontSize="3.5"
            fontWeight="bold"
            fill="#a1a1aa"
          >
            {corner.number}
          </text>
        </g>
      );
    });
  }, [isLoaded, circuit]);

  // DRS zones
  const drsZonePaths = useMemo(() => {
    if (!isLoaded || !circuit?.drsZones || !circuit.length || pathLengthRef.current === 0) return null;
    const totalLen = pathLengthRef.current;
    const circuitLenM = circuit.length * 1000;
    return circuit.drsZones.map((zone, i) => {
      const activationLen = (zone.activation / 100) * totalLen;
      const drsLenPercent = (zone.length / circuitLenM) * 100;
      const drsLen = (drsLenPercent / 100) * totalLen;
      return (
        <path
          key={`drs-${i}`}
          d={circuit.svgPath}
          fill="none"
          stroke="#22c55e"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.25}
          strokeDasharray={`0 ${activationLen} ${drsLen} ${totalLen}`}
        />
      );
    });
  }, [isLoaded, circuit]);

  // Start/finish marker
  const startFinishMarker = useMemo(() => {
    if (!isLoaded || !measurePathRef.current) return null;
    const pt = measurePathRef.current.getPointAtLength(0);
    const s = 3;
    const h = s / 2;
    return (
      <g transform={`translate(${pt.x}, ${pt.y})`}>
        <rect x={-s} y={-s} width={s * 2} height={s * 2} fill="#fff" stroke="#000" strokeWidth="0.5" />
        <rect x={-s} y={-s} width={h} height={h} fill="#000" />
        <rect x={0} y={-s} width={h} height={h} fill="#000" />
        <rect x={-h} y={-h} width={h} height={h} fill="#000" />
        <rect x={h} y={-h} width={h} height={h} fill="#000" />
        <rect x={-s} y={0} width={h} height={h} fill="#000" />
        <rect x={0} y={0} width={h} height={h} fill="#000" />
        <rect x={-h} y={h} width={h} height={h} fill="#000" />
        <rect x={h} y={h} width={h} height={h} fill="#000" />
      </g>
    );
  }, [isLoaded]);

  // =========================================================================
  // Effects
  // =========================================================================

  // Enable CSS transitions after first render to prevent fly-in
  useEffect(() => {
    const hasDrivers = (hasGps && locations.some(l => l.x !== 0 || l.y !== 0)) ||
                       (!hasGps && fallbackPositions && fallbackPositions.length > 0);
    if (hasDrivers && !hasRenderedCarsRef.current) {
      requestAnimationFrame(() => {
        hasRenderedCarsRef.current = true;
      });
    }
  }, [hasGps, locations, fallbackPositions]);

  useEffect(() => {
    hasRenderedCarsRef.current = false;
  }, [trackName]);

  // Wheel handler for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.5, Math.min(3, prev * delta)));
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setRotation(0);
  }, []);

  // =========================================================================
  // Car dot renderers
  // =========================================================================

  // Fallback mode: renders a car dot at SVG track coordinates
  const renderCarDot = (car: { driverCode: string; teamColor: string; trackX: number; trackY: number; isInPit?: boolean }) => {
    const isSelected = selectedDrivers.includes(car.driverCode);
    const isInPit = car.isInPit;
    const dotRadius = isInPit ? 4 : isSelected ? 5.5 : 5;
    const fontSize = isInPit ? 2.8 : 3.5;
    const strokeW = isSelected ? 0.8 : 0.4;
    const textY = 1.2;

    return (
      <g
        key={car.driverCode}
        transform={`translate(${car.trackX}, ${car.trackY})`}
        style={{
          transition: hasRenderedCarsRef.current
            ? `transform ${isStreaming ? "0.27s" : "2s"} linear`
            : "none",
        }}
        opacity={isInPit ? 0.35 : 1}
      >
        {isSelected && (
          <circle cx={0} cy={0} r={8} fill={car.teamColor} opacity={0.3}>
            <animate attributeName="r" values="8;10;8" dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}
        <circle
          cx={0}
          cy={0}
          r={dotRadius}
          fill={isInPit ? "#52525b" : car.teamColor}
          stroke={isSelected ? "#fff" : isInPit ? "#3f3f46" : "rgba(0,0,0,0.6)"}
          strokeWidth={strokeW}
          strokeDasharray={isInPit ? "1.5 1" : "none"}
        />
        <text
          x={0}
          y={textY}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="bold"
          fill={isInPit ? "#a1a1aa" : "#fff"}
          style={{ textShadow: isInPit ? "none" : "0 0 1px #000" }}
        >
          {car.driverCode.substring(0, 3)}
        </text>
      </g>
    );
  };

  // GPS mode: renders drivers at raw GPS positions (shared between Circuit+GPS and GPS Raw modes)
  const gpsDriverDots = useMemo(() => {
    const { r, fs, sw } = gpsDotScale;
    return locations
      .filter((l) => l.x !== 0 || l.y !== 0)
      .map((loc) => {
        const car = positions.find((p) => p.driverCode === loc.driverCode);
        const status = car ? (car as any).status : "";
        const isInPit = status === "PIT" || status === "OUT";
        const isSelected = selectedDrivers.includes(loc.driverCode);

        return (
          <g
            key={loc.driverCode}
            transform={`translate(${loc.x}, ${-loc.y})`}
            style={{
              transition: hasRenderedCarsRef.current
                ? `transform ${isStreaming ? "0.27s" : "2s"} linear`
                : "none",
            }}
            opacity={isInPit ? 0.35 : 1}
          >
            {isSelected && (
              <circle cx={0} cy={0} r={r * 1.6} fill={loc.teamColor} opacity={0.3}>
                <animate attributeName="r" values={`${r * 1.6};${r * 2};${r * 1.6}`} dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={0}
              cy={0}
              r={r}
              fill={isInPit ? "#52525b" : loc.teamColor}
              stroke={isSelected ? "#fff" : isInPit ? "#3f3f46" : "rgba(0,0,0,0.6)"}
              strokeWidth={sw}
              strokeDasharray={isInPit ? `${r * 0.3} ${r * 0.2}` : "none"}
            />
            <text
              x={0}
              y={fs * 0.35}
              textAnchor="middle"
              fontSize={fs}
              fontWeight="bold"
              fill={isInPit ? "#a1a1aa" : "#fff"}
              style={{ textShadow: isInPit ? "none" : "0 0 2px #000" }}
            >
              {loc.driverCode}
            </text>
          </g>
        );
      });
  }, [locations, positions, selectedDrivers, gpsDotScale, isStreaming]);

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-zinc-950 rounded-lg"
      onWheel={handleWheel}
    >
      {/* Hidden measurement SVG — always in DOM for path measurement & rotation detection */}
      {circuit?.svgPath && (
        <svg
          style={{ position: "absolute", width: "500px", height: "300px", visibility: "hidden", pointerEvents: "none" }}
          viewBox={circuit.viewBox || "0 0 500 300"}
        >
          <path ref={measurePathRef} d={circuit.svgPath} fill="none" />
          {circuit.pitLanePath && (
            <path ref={pitLaneRef} d={circuit.pitLanePath} fill="none" />
          )}
        </svg>
      )}

      {/* Transform Container (zoom/rotate) */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-200"
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
        }}
      >
        {/* ============ CIRCUIT MODE ============ */}
        {viewMode === "circuit" && (
          <>
            {/* Case 1: GPS available — render in GPS coordinate space with circuit overlay */}
            {hasGps ? (
              <svg
                viewBox={gpsViewBox || "0 0 1000 1000"}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              >
                {/* Circuit overlay — inside transform group that maps SVG → GPS display space */}
                {circuitInverseTransform && circuit?.svgPath && (
                  <g transform={circuitInverseTransform} opacity={0.9}>
                    {/* Background track outline */}
                    <path
                      d={circuit.svgPath}
                      fill="none"
                      stroke="#27272a"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* DRS zones */}
                    {drsZonePaths}

                    {/* Sector-colored track */}
                    {sectorPaths}

                    {/* Main track line */}
                    <path
                      d={circuit.svgPath}
                      fill="none"
                      stroke="#3f3f46"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Pit Lane */}
                    {circuit.pitLanePath && (
                      <path
                        d={circuit.pitLanePath}
                        fill="none"
                        stroke="#52525b"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.5}
                      />
                    )}

                    {/* Corner markers */}
                    {cornerMarkers}

                    {/* Start/Finish */}
                    {startFinishMarker}
                  </g>
                )}

                {/* GPS trail dots — visible during calibration, dimmer once circuit shows */}
                {trailPathD && (
                  <path
                    d={trailPathD}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth={gpsDotScale.trailW}
                    strokeLinecap="round"
                    opacity={circuitInverseTransform ? 0.1 : 0.3}
                  />
                )}

                {/* Drivers at raw GPS positions — same as GPS Raw mode (smooth!) */}
                {gpsDriverDots}

                {/* Debug: GPS center cross-hair (red) */}
                {gpsTransformRef.current && (() => {
                  const t = gpsTransformRef.current!;
                  const ext = Math.max(
                    gpsBoundsRef.current.maxX - gpsBoundsRef.current.minX,
                    gpsBoundsRef.current.maxY - gpsBoundsRef.current.minY
                  );
                  const sz = ext * 0.03;
                  return (
                    <g opacity={0.7}>
                      <line x1={t.gpsCX - sz} y1={-t.gpsCY} x2={t.gpsCX + sz} y2={-t.gpsCY} stroke="red" strokeWidth={sz * 0.1} />
                      <line x1={t.gpsCX} y1={-t.gpsCY - sz} x2={t.gpsCX} y2={-t.gpsCY + sz} stroke="red" strokeWidth={sz * 0.1} />
                      <text x={t.gpsCX + sz * 0.3} y={-t.gpsCY - sz * 0.3} fontSize={sz * 0.5} fill="red">GPS Center</text>
                    </g>
                  );
                })()}

                {/* Calibrating indicator */}
                {!circuitInverseTransform && gpsViewBox && (() => {
                  const b = gpsBoundsRef.current;
                  const cx = (b.minX + b.maxX) / 2;
                  const cy = -(b.minY + b.maxY) / 2;
                  const ext = Math.max(b.maxX - b.minX, b.maxY - b.minY);
                  return (
                    <text
                      x={cx}
                      y={cy + ext * 0.45}
                      textAnchor="middle"
                      fontSize={ext * 0.02}
                      fill="#52525b"
                    >
                      Calibrating circuit overlay...
                    </text>
                  );
                })()}
              </svg>
            ) : (
              /* Case 2: No GPS — fallback mode with circuit SVG coordinates */
              <svg
                ref={svgRef}
                viewBox={circuit?.viewBox || "0 0 500 300"}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              >
                <defs>
                  <filter id="carGlow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {circuit?.svgPath ? (
                  <>
                    {/* Background track outline */}
                    <path
                      d={circuit.svgPath}
                      fill="none"
                      stroke="#27272a"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* DRS zones */}
                    {isLoaded && drsZonePaths}

                    {/* Sector-colored track */}
                    {isLoaded && sectorPaths}

                    {/* Main track path (animated on load) */}
                    <path
                      ref={pathRef}
                      d={circuit.svgPath}
                      fill="none"
                      stroke={isLoaded ? "transparent" : "#22d3ee"}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Pit Lane */}
                    {isLoaded && circuit.pitLanePath && (
                      <path
                        d={circuit.pitLanePath}
                        fill="none"
                        stroke="#52525b"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.5}
                      />
                    )}

                    {/* Corner markers */}
                    {isLoaded && cornerMarkers}

                    {/* Start/Finish */}
                    {startFinishMarker}

                    {/* Car positions (estimated along track path) */}
                    {isLoaded && fallbackPositions?.map(renderCarDot)}

                    {/* Circuit name */}
                    {isLoaded && trackBoundsRef.current && (
                      <text
                        x={(trackBoundsRef.current.minX + trackBoundsRef.current.maxX) / 2}
                        y={trackBoundsRef.current.maxY + 15}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="500"
                        fill="#52525b"
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
            )}
          </>
        )}

        {/* ============ GPS RAW MODE ============ */}
        {viewMode === "gps" && (
          <svg
            viewBox={gpsViewBox || "0 0 1000 1000"}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          >
            {/* Accumulated trail dots forming track shape */}
            {trailPathD && (
              <path
                d={trailPathD}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={gpsDotScale.trailW}
                strokeLinecap="round"
                opacity={0.3}
              />
            )}

            {/* Driver dots at raw GPS positions */}
            {gpsDriverDots}
          </svg>
        )}
      </div>

      {/* Mode tabs */}
      <div className="absolute top-2 right-2 flex bg-black/70 backdrop-blur-sm rounded overflow-hidden text-[10px]">
        <button
          onClick={() => setViewMode("circuit")}
          className={`px-2.5 py-1 transition-colors ${viewMode === "circuit" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Circuit
        </button>
        <button
          onClick={() => setViewMode("gps")}
          className={`px-2.5 py-1 transition-colors ${viewMode === "gps" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          GPS Raw
        </button>
      </div>

      {/* Legend */}
      {(isLoaded || hasGps) && (
        <div className="absolute top-2 left-2 flex flex-col gap-1 bg-black/70 backdrop-blur-sm p-2 rounded text-[10px]">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${hasGps ? "bg-green-500" : "bg-yellow-500"}`}
            />
            <span className="text-zinc-400">
              {hasGps
                ? `GPS Live · ${locations.filter((l) => l.x !== 0 || l.y !== 0).length} cars`
                : "Estimated positions"}
            </span>
          </div>
          {viewMode === "circuit" && !hasGps && circuit?.sectors && circuit.sectors.length > 0 && (
            <div className="flex items-center gap-1">
              {circuit.sectors.map((s) => (
                <div
                  key={s.number}
                  className="flex items-center gap-0.5"
                >
                  <div className="w-2 h-1 rounded-sm" style={{ backgroundColor: s.color, opacity: 0.6 }} />
                  <span className="text-zinc-500">S{s.number}</span>
                </div>
              ))}
              {circuit.drsZones && circuit.drsZones.length > 0 && (
                <div className="flex items-center gap-0.5 ml-1">
                  <div className="w-2 h-1 rounded-sm bg-green-500 opacity-40" />
                  <span className="text-zinc-500">DRS</span>
                </div>
              )}
            </div>
          )}
          {viewMode === "circuit" && hasGps && circuitInverseTransform && circuit?.sectors && circuit.sectors.length > 0 && (
            <div className="flex items-center gap-1">
              {circuit.sectors.map((s) => (
                <div
                  key={s.number}
                  className="flex items-center gap-0.5"
                >
                  <div className="w-2 h-1 rounded-sm" style={{ backgroundColor: s.color, opacity: 0.6 }} />
                  <span className="text-zinc-500">S{s.number}</span>
                </div>
              ))}
              {circuit.drsZones && circuit.drsZones.length > 0 && (
                <div className="flex items-center gap-0.5 ml-1">
                  <div className="w-2 h-1 rounded-sm bg-green-500 opacity-40" />
                  <span className="text-zinc-500">DRS</span>
                </div>
              )}
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

      <div className="absolute bottom-2 left-2 text-[10px] text-zinc-600">
        Scroll to zoom
      </div>
    </div>
  );
}
