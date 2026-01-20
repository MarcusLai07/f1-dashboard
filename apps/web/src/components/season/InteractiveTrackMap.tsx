"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { animate } from "animejs";
import { cn } from "@/lib/utils";
import { type CircuitData, type Turn } from "@/data";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";

interface InteractiveTrackMapProps {
  svgPath: string;
  viewBox: string;
  circuitFeatures?: CircuitData | null;
  className?: string;
  showAnimation?: boolean;
  showTurns?: boolean;
  showDebugMarkers?: boolean; // Show percentage markers for calibration
}

interface TurnMarker {
  turn: Turn;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  trackX: number;
  trackY: number;
  normalX: number;
  normalY: number;
}

export function InteractiveTrackMap({
  svgPath,
  viewBox,
  circuitFeatures,
  className,
  showAnimation = true,
  showTurns = true,
  showDebugMarkers = false,
}: InteractiveTrackMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const trackPathRef = useRef<SVGPathElement>(null);
  const racingCarRef = useRef<SVGCircleElement>(null);
  const racingCarGlowRef = useRef<SVGCircleElement>(null);
  const racingCarTrailRef = useRef<SVGCircleElement>(null);

  const [pathLength, setPathLength] = useState(0);
  const [isAnimated, setIsAnimated] = useState(false);
  const [showRacingLine, setShowRacingLine] = useState(false);
  const [turnMarkers, setTurnMarkers] = useState<TurnMarker[]>([]);
  const [trackBounds, setTrackBounds] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);

  // Transform state
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Parse viewBox to get dimensions
  const viewBoxDims = useMemo(() => {
    const parts = viewBox.split(" ").map(Number);
    return { x: parts[0] || 0, y: parts[1] || 0, width: parts[2] || 500, height: parts[3] || 500 };
  }, [viewBox]);

  // Calculate path length and bounds once rendered
  useEffect(() => {
    if (trackPathRef.current) {
      const path = trackPathRef.current;
      const length = path.getTotalLength();
      setPathLength(length);

      // Calculate actual track bounds by sampling points
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const samples = 100;
      for (let i = 0; i <= samples; i++) {
        const point = path.getPointAtLength((i / samples) * length);
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
      setTrackBounds({ minX, minY, maxX, maxY });
    }
  }, [svgPath]);

  // Calculate optimized viewBox that fits the track with padding for markers
  const optimizedViewBox = useMemo(() => {
    if (!trackBounds) return viewBox;

    const padding = 45; // Extra space for turn markers
    const x = trackBounds.minX - padding;
    const y = trackBounds.minY - padding;
    const width = trackBounds.maxX - trackBounds.minX + padding * 2;
    const height = trackBounds.maxY - trackBounds.minY + padding * 2;

    return `${x} ${y} ${width} ${height}`;
  }, [trackBounds, viewBox]);

  // Calculate turn positions outside the track with collision avoidance
  useEffect(() => {
    if (!trackPathRef.current || pathLength === 0 || !circuitFeatures?.corners || !showTurns) {
      setTurnMarkers([]);
      return;
    }

    const path = trackPathRef.current;
    const turns = circuitFeatures.corners;
    const totalTurns = turns.length;
    const baseOffset = 18; // Base distance outside the track
    const markerRadius = 8; // Radius of turn number circle
    const minSeparation = markerRadius * 2.4; // Minimum distance between marker centers
    const epsilon = 5; // Distance for tangent calculation

    // Get the path start offset (where on the SVG path the start/finish line is)
    const pathStartOffset = circuitFeatures.pathStartOffset || 0;

    // Calculate track center for "outward" direction
    const centerX = trackBounds ? (trackBounds.minX + trackBounds.maxX) / 2 : viewBoxDims.x + viewBoxDims.width / 2;
    const centerY = trackBounds ? (trackBounds.minY + trackBounds.maxY) / 2 : viewBoxDims.y + viewBoxDims.height / 2;

    // Calculate all marker data
    const markersData = turns.map((turn, index) => {
      let percent = turn.position !== undefined
        ? turn.position / 100
        : (index + 0.5) / totalTurns;

      percent = ((percent + pathStartOffset / 100) % 1 + 1) % 1;
      const distance = percent * pathLength;

      const point = path.getPointAtLength(distance);
      const pointBefore = path.getPointAtLength(Math.max(0, distance - epsilon));
      const pointAfter = path.getPointAtLength(Math.min(pathLength, distance + epsilon));

      const dx = pointAfter.x - pointBefore.x;
      const dy = pointAfter.y - pointBefore.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;

      // Tangent (along track direction)
      const tx = dx / len;
      const ty = dy / len;

      // Normal perpendicular to tangent
      const nx = -ty;
      const ny = tx;

      // Choose direction that points away from track center
      const pos1X = point.x + nx * baseOffset;
      const pos1Y = point.y + ny * baseOffset;
      const pos2X = point.x - nx * baseOffset;
      const pos2Y = point.y - ny * baseOffset;

      const dist1 = Math.sqrt((pos1X - centerX) ** 2 + (pos1Y - centerY) ** 2);
      const dist2 = Math.sqrt((pos2X - centerX) ** 2 + (pos2Y - centerY) ** 2);

      const outwardSign = dist1 > dist2 ? 1 : -1;

      // Check for manual label positioning overrides
      const manualOffset = turn.labelOffset;
      const manualAngle = turn.labelAngle;

      let finalNormalX = nx * outwardSign;
      let finalNormalY = ny * outwardSign;
      let finalOffset = baseOffset;

      if (manualAngle !== undefined) {
        // Use manual angle override (0 = right, 90 = down, 180 = left, 270 = up)
        const angleRad = (manualAngle * Math.PI) / 180;
        finalNormalX = Math.cos(angleRad);
        finalNormalY = Math.sin(angleRad);
      }

      if (manualOffset !== undefined) {
        if (manualOffset < 0) {
          // Negative offset means flip to opposite side
          finalNormalX = -finalNormalX;
          finalNormalY = -finalNormalY;
          finalOffset = Math.abs(manualOffset);
        } else {
          finalOffset = manualOffset;
        }
      }

      return {
        turn,
        index,
        distance,
        trackX: point.x,
        trackY: point.y,
        normalX: finalNormalX,
        normalY: finalNormalY,
        tangentX: tx,
        tangentY: ty,
        labelOffset: finalOffset,
      };
    });

    // Calculate label positions with collision avoidance
    const resolvedMarkers: TurnMarker[] = markersData.map((data) => ({
      turn: data.turn,
      x: data.trackX,
      y: data.trackY,
      labelX: data.trackX + data.normalX * data.labelOffset,
      labelY: data.trackY + data.normalY * data.labelOffset,
      trackX: data.trackX,
      trackY: data.trackY,
      normalX: data.normalX,
      normalY: data.normalY,
    }));

    // Resolve overlaps by pushing markers along tangent (spread along track) and/or further out
    const maxIterations = 15;

    for (let iter = 0; iter < maxIterations; iter++) {
      let hasOverlap = false;

      for (let i = 0; i < resolvedMarkers.length; i++) {
        for (let j = i + 1; j < resolvedMarkers.length; j++) {
          const mi = resolvedMarkers[i];
          const mj = resolvedMarkers[j];

          const dx = mj.labelX - mi.labelX;
          const dy = mj.labelY - mi.labelY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minSeparation && dist > 0) {
            hasOverlap = true;

            // Calculate separation vector
            const sepX = dx / dist;
            const sepY = dy / dist;

            // Push markers apart along the separation direction
            const pushAmount = (minSeparation - dist) / 2 + 1;

            mi.labelX -= sepX * pushAmount;
            mi.labelY -= sepY * pushAmount;
            mj.labelX += sepX * pushAmount;
            mj.labelY += sepY * pushAmount;
          }
        }
      }

      if (!hasOverlap) break;
    }

    setTurnMarkers(resolvedMarkers);
  }, [pathLength, circuitFeatures?.corners, circuitFeatures?.pathStartOffset, showTurns, viewBoxDims, trackBounds]);

  // Animate the track drawing
  useEffect(() => {
    if (showAnimation && trackPathRef.current && pathLength > 0 && !isAnimated) {
      const path = trackPathRef.current;
      path.style.strokeDasharray = `${pathLength}`;
      path.style.strokeDashoffset = `${pathLength}`;

      animate(path, {
        strokeDashoffset: [pathLength, 0],
        duration: 1500,
        easing: "easeInOutQuad",
        onComplete: () => {
          setIsAnimated(true);
          // Start racing line animation after a small delay
          setTimeout(() => setShowRacingLine(true), 300);
        },
      });
    }
  }, [pathLength, showAnimation, isAnimated]);

  // Animate the racing car indicator along the track using requestAnimationFrame
  useEffect(() => {
    if (!showRacingLine || !trackPathRef.current || pathLength === 0) return;

    const path = trackPathRef.current;
    const carEl = racingCarRef.current;
    const glowEl = racingCarGlowRef.current;
    const trailEl = racingCarTrailRef.current;

    if (!carEl || !glowEl || !trailEl) return;

    const lapDuration = 8000; // 8 seconds per lap
    let startTime: number | null = null;
    let animationFrameId: number;

    const animateFrame = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % lapDuration) / lapDuration;

      const distance = progress * pathLength;
      const point = path.getPointAtLength(distance);

      // Update car position
      carEl.setAttribute("cx", String(point.x));
      carEl.setAttribute("cy", String(point.y));

      // Update glow position
      glowEl.setAttribute("cx", String(point.x));
      glowEl.setAttribute("cy", String(point.y));

      // Update trail (slightly behind)
      const trailProgress = ((progress - 0.015) + 1) % 1;
      const trailDistance = trailProgress * pathLength;
      const trailPoint = path.getPointAtLength(trailDistance);
      trailEl.setAttribute("cx", String(trailPoint.x));
      trailEl.setAttribute("cy", String(trailPoint.y));

      animationFrameId = requestAnimationFrame(animateFrame);
    };

    animationFrameId = requestAnimationFrame(animateFrame);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [showRacingLine, pathLength]);

  // Generate sector dash arrays for coloring
  const sectorSegments = useMemo(() => {
    if (!circuitFeatures?.sectors || pathLength === 0) return null;

    // Get the path start offset
    const pathOffset = circuitFeatures.pathStartOffset || 0;

    const segments: Array<{
      number: number;
      color: string;
      dashArray: string;
      dashOffset: number;
      key: string;
    }> = [];

    circuitFeatures.sectors.forEach((sector) => {
      // Apply path start offset to sector boundaries (handle negative modulo)
      const adjustedStart = ((sector.startPercent + pathOffset) % 100 + 100) % 100;
      const adjustedEnd = ((sector.endPercent + pathOffset) % 100 + 100) % 100;

      // Handle wrap-around case (when end < start after adjustment)
      if (adjustedEnd > adjustedStart) {
        // Normal case - single segment
        const startOffset = (adjustedStart / 100) * pathLength;
        const endOffset = (adjustedEnd / 100) * pathLength;
        const segmentLength = endOffset - startOffset;
        const dashArray = `${segmentLength} ${pathLength}`;
        const dashOffset = -startOffset;
        segments.push({
          number: sector.number,
          color: sector.color,
          dashArray,
          dashOffset,
          key: `sector-${sector.number}`
        });
      } else {
        // Sector wraps around - need TWO segments
        // Segment 1: from adjustedStart to 100%
        const startOffset1 = (adjustedStart / 100) * pathLength;
        const segmentLength1 = pathLength - startOffset1;
        if (segmentLength1 > 0) {
          segments.push({
            number: sector.number,
            color: sector.color,
            dashArray: `${segmentLength1} ${pathLength}`,
            dashOffset: -startOffset1,
            key: `sector-${sector.number}-a`
          });
        }
        // Segment 2: from 0% to adjustedEnd
        const endOffset2 = (adjustedEnd / 100) * pathLength;
        if (endOffset2 > 0) {
          segments.push({
            number: sector.number,
            color: sector.color,
            dashArray: `${endOffset2} ${pathLength}`,
            dashOffset: 0,
            key: `sector-${sector.number}-b`
          });
        }
      }
    });

    return segments;
  }, [circuitFeatures?.sectors, circuitFeatures?.pathStartOffset, pathLength]);

  // Generate debug markers at key percentages for calibration
  const debugMarkers = useMemo(() => {
    if (!showDebugMarkers || !trackPathRef.current || pathLength === 0) return [];

    const path = trackPathRef.current;
    const pathOffset = circuitFeatures?.pathStartOffset || 0;

    // Markers at 0%, 10%, 20%, ..., 90%, and sector boundaries
    const percentages = [0, 10, 20, 27, 30, 33, 35, 40, 50, 60, 62, 70, 80, 90];

    return percentages.map((percent) => {
      const adjustedPercent = ((percent + pathOffset) % 100 + 100) % 100;
      const distance = (adjustedPercent / 100) * pathLength;
      const point = path.getPointAtLength(distance);

      // Determine marker color based on sector
      let color = "#ffffff";
      if (percent <= 33) color = "#ef4444"; // S1 red
      else if (percent <= 60) color = "#3b82f6"; // S2 blue
      else color = "#eab308"; // S3 yellow

      // Highlight sector boundaries
      const isBoundary = [0, 33, 60].includes(percent);

      return {
        percent,
        x: point.x,
        y: point.y,
        color,
        isBoundary,
      };
    });
  }, [showDebugMarkers, pathLength, circuitFeatures?.pathStartOffset]);

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(s * 1.3, 4));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.3, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(Math.max(s * delta, 0.5), 4));
  }, []);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  return (
    <div className={cn("relative overflow-hidden select-none", className)}>
      {/* Zoom/Rotate Controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleRotate}
          className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
          title="Rotate 90°"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Container with transforms */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
      >
        <svg
          ref={svgRef}
          viewBox={optimizedViewBox}
          className="w-full h-full max-w-full max-h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: "visible" }}
        >
          {/* Glow filter definitions */}
          <defs>
            <filter id="carGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="carGlowOuter" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
              </feMerge>
            </filter>
            <radialGradient id="trailGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background track (dark outline) */}
          <path
            d={svgPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-800"
          />

          {/* Sector colored segments */}
          {isAnimated && sectorSegments?.map((segment) => (
            <path
              key={segment.key}
              d={svgPath}
              fill="none"
              stroke={segment.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.dashOffset}
            />
          ))}

          {/* Main track path (animated drawing) */}
          <path
            ref={trackPathRef}
            d={svgPath}
            fill="none"
            stroke={isAnimated ? "transparent" : "currentColor"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isAnimated ? "" : "text-primary"}
          />

          {/* Turn markers - positioned outside track */}
          {isAnimated && showTurns && turnMarkers.map((marker) => {
            // Calculate leader line length for opacity
            const lineLength = Math.sqrt(
              (marker.labelX - marker.trackX) ** 2 +
              (marker.labelY - marker.trackY) ** 2
            );
            // Fade out leader line when marker is close to track
            const lineOpacity = Math.min(0.4, Math.max(0.15, (lineLength - 15) / 40));

            return (
              <g key={marker.turn.number}>
                {/* Leader line from track to label */}
                <line
                  x1={marker.trackX}
                  y1={marker.trackY}
                  x2={marker.labelX}
                  y2={marker.labelY}
                  stroke={`rgba(255,255,255,${lineOpacity})`}
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                />
                {/* Small dot on track */}
                <circle
                  cx={marker.trackX}
                  cy={marker.trackY}
                  r="2.5"
                  fill="white"
                  opacity="0.6"
                />
                {/* Turn number circle - smaller */}
                <circle
                  cx={marker.labelX}
                  cy={marker.labelY}
                  r="8"
                  fill="rgba(0,0,0,0.85)"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="0.8"
                />
                {/* Turn number text */}
                <text
                  x={marker.labelX}
                  y={marker.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="7"
                  fontWeight="600"
                >
                  {marker.turn.number}
                </text>
              </g>
            );
          })}

          {/* Racing car indicator - glowing point that moves around track */}
          {showRacingLine && (
            <g className="racing-car-indicator">
              {/* Outer glow (large, faint) */}
              <circle
                ref={racingCarGlowRef}
                r="12"
                fill="white"
                opacity="0.15"
                filter="url(#carGlowOuter)"
              >
                <animate
                  attributeName="opacity"
                  values="0.1;0.25;0.1"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="10;14;10"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Trail (fading dot behind) */}
              <circle
                ref={racingCarTrailRef}
                r="6"
                fill="url(#trailGradient)"
                opacity="0.5"
              />
              {/* Main car indicator with glow */}
              <circle
                ref={racingCarRef}
                r="4"
                fill="white"
                filter="url(#carGlow)"
              >
                <animate
                  attributeName="r"
                  values="3.5;4.5;3.5"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}

          {/* Debug markers for sector calibration */}
          {showDebugMarkers && debugMarkers.map((marker) => (
            <g key={`debug-${marker.percent}`}>
              {/* Marker dot */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r={marker.isBoundary ? 6 : 4}
                fill={marker.color}
                stroke={marker.isBoundary ? "#ffffff" : "none"}
                strokeWidth={marker.isBoundary ? 2 : 0}
              />
              {/* Percentage label */}
              <text
                x={marker.x}
                y={marker.y - 12}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8"
                fontWeight={marker.isBoundary ? "bold" : "normal"}
                style={{ textShadow: "0 0 3px black, 0 0 3px black" }}
              >
                {marker.percent}%
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend - positioned at top-left */}
      {isAnimated && circuitFeatures && (
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 text-[10px] pointer-events-none">
          {circuitFeatures.sectors.map((sector) => (
            <div
              key={sector.number}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: sector.color }}
              />
              <span style={{ color: sector.color }}>S{sector.number}</span>
            </div>
          ))}
        </div>
      )}

      {/* Zoom level indicator */}
      {scale !== 1 && (
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-[10px] text-white">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
}
