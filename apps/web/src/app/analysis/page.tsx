"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { SessionSelector } from "@/components/layout/SessionSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LapTimeChart } from "@/components/analysis/LapTimeChart";
import { PositionChart } from "@/components/analysis/PositionChart";
import { StintChart } from "@/components/analysis/StintChart";
import { DriverSelector } from "@/components/analysis/DriverSelector";

interface LapData {
  driverNumber: number;
  driverCode: string;
  teamColor: string;
  lapNumber: number;
  lapTime: number | null;
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  isPitOutLap: boolean;
  position: number | null;
}

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

interface Driver {
  driverNumber: number;
  code: string;
  teamColor: string;
  teamName?: string;
}

export default function AnalysisPage() {
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [laps, setLaps] = useState<LapData[]>([]);
  const [stints, setStints] = useState<StintData[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when session changes
  const fetchData = useCallback(async (key: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch laps and stints in parallel
      const [lapsRes, stintsRes] = await Promise.all([
        fetch(`/api/analysis/laps?session_key=${key}`),
        fetch(`/api/analysis/stints?session_key=${key}`),
      ]);

      if (!lapsRes.ok || !stintsRes.ok) {
        throw new Error("Failed to fetch analysis data");
      }

      const [lapsData, stintsData] = await Promise.all([
        lapsRes.json(),
        stintsRes.json(),
      ]);

      setLaps(lapsData.laps || []);
      setStints(stintsData.stints || []);
      setDrivers(lapsData.drivers || stintsData.drivers || []);

      // Auto-select first 3 drivers
      const driverNumbers = (lapsData.drivers || []).slice(0, 3).map((d: Driver) => d.driverNumber);
      setSelectedDrivers(driverNumbers);
    } catch (err) {
      console.error("Analysis fetch error:", err);
      setError("Failed to load analysis data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionKey) {
      fetchData(sessionKey);
    } else {
      setLaps([]);
      setStints([]);
      setDrivers([]);
      setSelectedDrivers([]);
    }
  }, [sessionKey, fetchData]);

  const toggleDriver = (driverNumber: number) => {
    setSelectedDrivers((prev) =>
      prev.includes(driverNumber)
        ? prev.filter((d) => d !== driverNumber)
        : [...prev, driverNumber]
    );
  };

  // Get total laps for stint chart
  const totalLaps = laps.length > 0
    ? Math.max(...laps.map((l) => l.lapNumber))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header sessionName="Analysis" />

      <main className="p-6 space-y-6">
        {/* Session Selector */}
        <div className="flex items-center gap-4">
          <div className="w-80">
            <SessionSelector
              currentSessionKey={sessionKey}
              onSessionChange={setSessionKey}
            />
          </div>
          {isLoading && (
            <span className="text-muted-foreground text-sm animate-pulse">
              Loading analysis data...
            </span>
          )}
          {error && (
            <span className="text-red-500 text-sm">{error}</span>
          )}
        </div>

        {/* Driver Selection */}
        {drivers.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Drivers to Compare</CardTitle>
            </CardHeader>
            <CardContent>
              <DriverSelector
                drivers={drivers}
                selectedDrivers={selectedDrivers}
                onToggle={toggleDriver}
                maxSelections={6}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Select up to 6 drivers to compare
              </p>
            </CardContent>
          </Card>
        )}

        {/* Analysis Tabs */}
        {sessionKey && (
          <Tabs defaultValue="laptimes" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="laptimes">Lap Times</TabsTrigger>
              <TabsTrigger value="positions">Position Chart</TabsTrigger>
              <TabsTrigger value="strategy">Tyre Strategy</TabsTrigger>
            </TabsList>

            <TabsContent value="laptimes">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Lap Time Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  {laps.length > 0 ? (
                    <LapTimeChart
                      laps={laps}
                      selectedDrivers={selectedDrivers}
                      height={400}
                    />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      {isLoading ? "Loading lap data..." : "No lap data available"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="positions">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Position Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  {laps.length > 0 ? (
                    <PositionChart
                      laps={laps}
                      selectedDrivers={selectedDrivers}
                      totalDrivers={drivers.length || 20}
                      height={400}
                    />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      {isLoading ? "Loading position data..." : "No position data available"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strategy">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Tyre Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  {stints.length > 0 ? (
                    <StintChart
                      stints={stints}
                      drivers={drivers}
                      totalLaps={totalLaps}
                      selectedDrivers={selectedDrivers.length > 0 ? selectedDrivers : undefined}
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      {isLoading ? "Loading stint data..." : "No stint data available"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!sessionKey && (
          <Card className="bg-card border-border">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-4xl">📊</div>
                <h2 className="text-xl font-semibold">Session Analysis</h2>
                <p className="text-muted-foreground max-w-md">
                  Select a session from the dropdown above to analyze lap times,
                  position changes, and tyre strategies from historical races.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
