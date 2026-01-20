"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X,
  MapPin,
  Trophy,
  Flag,
  Timer,
  Route,
  Calendar,
  ExternalLink,
  Loader2,
  ChevronRight,
  Gauge,
  Zap,
} from "lucide-react";
import { animate } from "animejs";
import { cn } from "@/lib/utils";
import { getCircuitByName, getTurnTypeColor, type CircuitData } from "@/data";
import { InteractiveTrackMap } from "./InteractiveTrackMap";

// Types for circuit history (optional external API data)
interface RaceResult {
  year: number;
  driver: string;
  driverCode: string;
  team: string;
  time?: string;
  status?: string;
}

interface QualifyingResult {
  year: number;
  driver: string;
  driverCode: string;
  team: string;
  q3Time?: string;
  q2Time?: string;
  q1Time?: string;
}

interface CircuitHistory {
  circuit: {
    circuitId: string;
    circuitName: string;
    locality: string;
    country: string;
    lat: string;
    long: string;
    url: string;
  } | null;
  winners: RaceResult[];
  poles: QualifyingResult[];
  totalRaces: number;
  firstRaceYear: number | null;
  lastRaceYear: number | null;
}

// Turn data for circuits (approximate positions along the track percentage)
const CIRCUIT_TURNS: Record<string, { name: string; number: number; position: number }[]> = {
  "albert park": [
    { name: "Turn 1", number: 1, position: 3 },
    { name: "Turn 2", number: 2, position: 8 },
    { name: "Turn 3", number: 3, position: 12 },
    { name: "Turn 4", number: 4, position: 18 },
    { name: "Turn 5", number: 5, position: 22 },
    { name: "Turn 6", number: 6, position: 30 },
    { name: "Turn 7", number: 7, position: 38 },
    { name: "Turn 8", number: 8, position: 42 },
    { name: "Turn 9", number: 9, position: 52 },
    { name: "Turn 10", number: 10, position: 58 },
    { name: "Turn 11", number: 11, position: 68 },
    { name: "Turn 12", number: 12, position: 75 },
    { name: "Turn 13", number: 13, position: 85 },
    { name: "Turn 14", number: 14, position: 95 },
  ],
  "bahrain": [
    { name: "Turn 1", number: 1, position: 5 },
    { name: "Turn 2", number: 2, position: 8 },
    { name: "Turn 3", number: 3, position: 12 },
    { name: "Turn 4", number: 4, position: 18 },
    { name: "Turn 5", number: 5, position: 25 },
    { name: "Turn 6", number: 6, position: 32 },
    { name: "Turn 7", number: 7, position: 38 },
    { name: "Turn 8", number: 8, position: 45 },
    { name: "Turn 9", number: 9, position: 52 },
    { name: "Turn 10", number: 10, position: 58 },
    { name: "Turn 11", number: 11, position: 68 },
    { name: "Turn 12", number: 12, position: 75 },
    { name: "Turn 13", number: 13, position: 82 },
    { name: "Turn 14", number: 14, position: 90 },
    { name: "Turn 15", number: 15, position: 96 },
  ],
  // Add more circuits as needed
};

interface CircuitInfoSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  circuitName: string;
  eventName: string;
  country: string;
}

export function CircuitInfoSlidePanel({
  isOpen,
  onClose,
  circuitName,
  eventName,
  country,
}: CircuitInfoSlidePanelProps) {
  const [mounted, setMounted] = useState(false);
  const [showDebugMarkers, setShowDebugMarkers] = useState(false);
  const [circuitHistory, setCircuitHistory] = useState<CircuitHistory | null>(null);
  const [circuitFeats, setCircuitFeats] = useState<CircuitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch circuit data when panel opens
  useEffect(() => {
    if (isOpen && circuitName) {
      setLoading(true);
      setError(null);

      // Load local circuit data (contains SVG, corners, DRS zones, etc.)
      getCircuitByName(circuitName)
        .then((circuitData) => {
          if (circuitData) {
            setCircuitFeats(circuitData);

            // Load history from local circuit data if available
            if (circuitData.history) {
              setCircuitHistory({
                circuit: null,
                winners: circuitData.history.winners.map((w) => ({
                  year: w.year,
                  driver: w.driver,
                  driverCode: w.driverCode,
                  team: w.team,
                })),
                poles: circuitData.history.poles.map((p) => ({
                  year: p.year,
                  driver: p.driver,
                  driverCode: p.driverCode,
                  team: p.team,
                  q3Time: p.time,
                })),
                totalRaces: circuitData.history.winners.length,
                firstRaceYear: circuitData.firstGP || null,
                lastRaceYear: circuitData.history.winners[0]?.year || null,
              });
            } else {
              setCircuitHistory(null);
            }

            setLoading(false);
          } else {
            setError("Circuit data not found");
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load circuit data:", err);
          setError("Failed to load circuit data");
          setLoading(false);
        });
    }
  }, [isOpen, circuitName]);

  // Animate panel in/out
  useEffect(() => {
    if (!mounted) return;

    if (isOpen && panelRef.current && backdropRef.current) {
      // Animate in
      document.body.style.overflow = "hidden";

      animate(backdropRef.current, {
        opacity: [0, 1],
        duration: 300,
        easing: "easeOutQuad",
      });

      animate(panelRef.current, {
        translateX: ["100%", "0%"],
        duration: 400,
        easing: "easeOutCubic",
      });
    }
  }, [isOpen, mounted]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (panelRef.current && backdropRef.current) {
      animate(backdropRef.current, {
        opacity: [1, 0],
        duration: 250,
        easing: "easeInQuad",
      });

      animate(panelRef.current, {
        translateX: ["0%", "100%"],
        duration: 350,
        easing: "easeInCubic",
        onComplete: () => {
          document.body.style.overflow = "";
          onClose();
        },
      });
    } else {
      document.body.style.overflow = "";
      onClose();
    }
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  // Get turn positions on SVG path
  const getTurnPosition = (pathElement: SVGPathElement, percentage: number): { x: number; y: number } => {
    const length = pathElement.getTotalLength();
    const point = pathElement.getPointAtLength((percentage / 100) * length);
    return { x: point.x, y: point.y };
  };

  if (!mounted || !isOpen) return null;

  const content = (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={handleClose}
        style={{ opacity: 0 }}
      />

      {/* Slide Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l border-border shadow-2xl z-50 flex flex-col"
        style={{ transform: "translateX(100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">{eventName}</h2>
              <p className="text-sm text-muted-foreground">{circuitName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading circuit data...</span>
              </div>
            ) : error ? (
              <div className="text-center py-20 text-muted-foreground">{error}</div>
            ) : (
              <>
                {/* Track Map Section - Interactive with sectors, DRS zones, turns */}
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Route className="h-4 w-4" />
                      Track Layout
                      {circuitFeats && (
                        <Badge variant="outline" className="text-[10px] ml-auto">
                          {circuitFeats.corners.length} turns • {circuitFeats.drsZones.length} DRS
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {circuitFeats?.svg?.path ? (
                      <div className="relative bg-gradient-to-b from-secondary/30 to-secondary/10 rounded-lg p-2">
                        <InteractiveTrackMap
                          svgPath={circuitFeats.svg.path}
                          viewBox={circuitFeats.svg.viewBox}
                          circuitFeatures={circuitFeats}
                          className="w-full aspect-[4/3]"
                          showAnimation={true}
                          showDebugMarkers={showDebugMarkers}
                        />

                        {/* Track info overlay */}
                        <div className="absolute bottom-2 right-2 flex gap-2">
                          <Badge variant="secondary" className="text-xs bg-black/60">
                            {circuitFeats.length.toFixed(3)}km
                          </Badge>
                        </div>

                        {/* Debug toggle for sector calibration */}
                        <button
                          onClick={() => setShowDebugMarkers(!showDebugMarkers)}
                          className={cn(
                            "absolute bottom-2 left-2 px-2 py-1 rounded text-[10px] font-mono transition-colors",
                            showDebugMarkers
                              ? "bg-yellow-500/80 text-black"
                              : "bg-black/60 text-white/60 hover:text-white"
                          )}
                        >
                          {showDebugMarkers ? "DEBUG ON" : "DEBUG"}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        Track layout not available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Circuit Stats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Circuit Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-secondary/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {circuitFeats?.length?.toFixed(3) || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">Length (km)</div>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">
                          {circuitFeats?.corners?.length || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">Turns</div>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">
                          {circuitFeats?.laps || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">Laps</div>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">
                          {circuitFeats?.raceDistance?.toFixed(1) || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">Race Distance (km)</div>
                      </div>
                    </div>

                    {/* Second row of stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-secondary/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">
                          {circuitFeats?.firstGP || circuitHistory?.firstRaceYear || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">First GP</div>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {circuitFeats?.drsZones?.length || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">DRS Zones</div>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">
                          {circuitHistory?.totalRaces || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Races</div>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">
                          {circuitFeats?.pitLaneTimeLoss ? `${circuitFeats.pitLaneTimeLoss}s` : "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">Pit Loss</div>
                      </div>
                    </div>

                    {/* Lap Record */}
                    {(circuitFeats?.records?.lapRecord || circuitHistory?.winners?.[0]) && (
                      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Timer className="h-3 w-3" />
                          Lap Record
                        </div>
                        <div className="text-xl font-bold text-purple-400">
                          {circuitFeats?.records?.lapRecord?.time || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {circuitFeats?.records?.lapRecord?.driver} ({circuitFeats?.records?.lapRecord?.year})
                        </div>
                      </div>
                    )}

                    {circuitHistory?.circuit?.url && (
                      <a
                        href={circuitHistory.circuit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-4"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View on Wikipedia
                      </a>
                    )}
                  </CardContent>
                </Card>

                {/* DRS Zones & Turn Info */}
                {circuitFeats && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-400" />
                        DRS Zones & Turns
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* DRS Zones */}
                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-2">DRS Activation Zones</div>
                        <div className="space-y-2">
                          {circuitFeats.drsZones.map((zone, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-purple-500/10 rounded">
                              <Zap className="h-4 w-4 text-purple-400" />
                              <div className="flex-1">
                                <div className="text-sm font-medium">DRS Zone {idx + 1}</div>
                                <div className="text-xs text-muted-foreground">
                                  Detection: {zone.detection}% | Activation: {zone.activation}%
                                  {zone.length && ` | Length: ${zone.length}m`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sectors Legend */}
                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-2">Track Sectors</div>
                        <div className="flex gap-2">
                          {circuitFeats.sectors.map((sector) => (
                            <div
                              key={sector.number}
                              className="flex-1 p-2 rounded text-center text-xs font-medium"
                              style={{ backgroundColor: `${sector.color}20`, color: sector.color }}
                            >
                              Sector {sector.number}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Turn Types Legend */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">
                          Turns by Type ({circuitFeats.corners.length} total)
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          {["hairpin", "slow", "medium", "fast", "chicane"].map((type) => {
                            const count = circuitFeats.corners.filter((t) => t.type === type).length;
                            return (
                              <div
                                key={type}
                                className="p-2 rounded text-center"
                                style={{
                                  backgroundColor: `${getTurnTypeColor(type as any)}20`,
                                  color: getTurnTypeColor(type as any),
                                }}
                              >
                                <div className="font-bold">{count}</div>
                                <div className="capitalize text-[10px]">{type}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Turn Details - Expandable */}
                {circuitFeats && circuitFeats.corners.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Turn Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-64 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          {circuitFeats.corners.map((turn) => (
                            <div
                              key={turn.number}
                              className="flex items-center gap-3 p-3 bg-secondary/20 rounded text-sm"
                            >
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                                style={{
                                  backgroundColor: `${getTurnTypeColor(turn.type)}30`,
                                  color: getTurnTypeColor(turn.type),
                                }}
                              >
                                {turn.number}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {turn.name || `Turn ${turn.number}`}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {turn.speed && `${turn.speed}km/h`}
                                  {turn.gear && ` • Gear ${turn.gear}`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* History Tabs */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Race History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="winners" className="w-full">
                      <TabsList className="w-full mb-4">
                        <TabsTrigger value="winners" className="flex-1">
                          <Trophy className="h-3 w-3 mr-1.5 text-yellow-500" />
                          Winners ({circuitHistory?.winners?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="poles" className="flex-1">
                          <Timer className="h-3 w-3 mr-1.5 text-purple-500" />
                          Pole Positions ({circuitHistory?.poles?.length || 0})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="winners" className="mt-0">
                        <div className="max-h-80 overflow-y-auto">
                          {circuitHistory?.winners && circuitHistory.winners.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-card">
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Year</th>
                                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Driver</th>
                                  <th className="text-left py-2 px-2 font-medium text-muted-foreground hidden md:table-cell">Team</th>
                                </tr>
                              </thead>
                              <tbody>
                                {circuitHistory.winners.map((winner, idx) => (
                                  <tr
                                    key={`${winner.year}-winner`}
                                    className={cn(
                                      "border-b border-border/50 hover:bg-secondary/30 transition-colors",
                                      idx === 0 && "bg-yellow-500/10"
                                    )}
                                  >
                                    <td className="py-2 px-2 font-medium">{winner.year}</td>
                                    <td className="py-2 px-2">
                                      <div className="flex items-center gap-1.5">
                                        {winner.driverCode && (
                                          <Badge variant="outline" className="text-[10px] px-1">
                                            {winner.driverCode}
                                          </Badge>
                                        )}
                                        <span className="truncate">{winner.driver}</span>
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-muted-foreground hidden md:table-cell truncate">
                                      {winner.team}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              No winner data available
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="poles" className="mt-0">
                        <div className="max-h-80 overflow-y-auto">
                          {circuitHistory?.poles && circuitHistory.poles.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-card">
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Year</th>
                                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Driver</th>
                                  <th className="text-left py-2 px-2 font-medium text-muted-foreground hidden md:table-cell">Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {circuitHistory.poles.map((pole, idx) => (
                                  <tr
                                    key={`${pole.year}-pole`}
                                    className={cn(
                                      "border-b border-border/50 hover:bg-secondary/30 transition-colors",
                                      idx === 0 && "bg-purple-500/10"
                                    )}
                                  >
                                    <td className="py-2 px-2 font-medium">{pole.year}</td>
                                    <td className="py-2 px-2">
                                      <div className="flex items-center gap-1.5">
                                        {pole.driverCode && (
                                          <Badge variant="outline" className="text-[10px] px-1">
                                            {pole.driverCode}
                                          </Badge>
                                        )}
                                        <span className="truncate">{pole.driver}</span>
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-purple-400 font-mono text-xs hidden md:table-cell">
                                      {pole.q3Time || pole.q2Time || pole.q1Time || "N/A"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              No qualifying data available
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Driver Stats at Circuit */}
                {circuitHistory?.winners && circuitHistory.winners.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Most Wins at {circuitName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {getMostWins(circuitHistory.winners).slice(0, 5).map((stat, idx) => (
                          <div
                            key={stat.driver}
                            className="flex items-center justify-between py-1.5 px-2 bg-secondary/20 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold",
                                idx === 0 ? "bg-yellow-500 text-yellow-950" :
                                idx === 1 ? "bg-gray-400 text-gray-950" :
                                idx === 2 ? "bg-amber-700 text-amber-100" :
                                "bg-muted text-muted-foreground"
                              )}>
                                {idx + 1}
                              </span>
                              <span className="font-medium">{stat.driver}</span>
                            </div>
                            <Badge variant="secondary">{stat.wins} {stat.wins === 1 ? "win" : "wins"}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}

// Helper function to calculate most wins
function getMostWins(winners: RaceResult[]): { driver: string; wins: number }[] {
  const winCounts = new Map<string, number>();

  for (const winner of winners) {
    winCounts.set(winner.driver, (winCounts.get(winner.driver) || 0) + 1);
  }

  return Array.from(winCounts.entries())
    .map(([driver, wins]) => ({ driver, wins }))
    .sort((a, b) => b.wins - a.wins);
}
