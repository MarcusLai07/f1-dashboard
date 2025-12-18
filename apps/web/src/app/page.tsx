"use client";

import { Header } from "@/components/layout/Header";
import { LiveDashboardLayout } from "@/components/layout/LiveDashboardLayout";
import { TimingTower } from "@/components/live/TimingTower";
import { TrackMap } from "@/components/live/TrackMap";
import { TelemetryPanel } from "@/components/live/TelemetryPanel";
import { RaceInfo } from "@/components/live/RaceInfo";
import { useLiveStore } from "@/stores/liveStore";
import { TEAM_COLORS, DRIVER_TEAMS, DRIVER_NUMBERS } from "@/lib/constants";
import type { DriverTiming, CarPosition, DriverTelemetry, Weather, TrackStatus } from "@/types/f1";

// Mock data for demonstration
const mockDrivers: DriverTiming[] = [
  { position: 1, driverCode: "VER", driverNumber: 1, teamName: "Red Bull Racing", teamColor: TEAM_COLORS["Red Bull Racing"], gap: null, interval: null, lastLap: 87.234, bestLap: 86.987, sector1: 28.123, sector2: 34.567, sector3: 24.544, tyre: { compound: "MEDIUM", age: 12, isNew: false }, pitStops: 1, status: "RACING", isPersonalBest: false, isOverallBest: false },
  { position: 2, driverCode: "NOR", driverNumber: 4, teamName: "McLaren", teamColor: TEAM_COLORS["McLaren"], gap: 3.456, interval: 3.456, lastLap: 87.567, bestLap: 87.123, sector1: 28.234, sector2: 34.789, sector3: 24.544, tyre: { compound: "HARD", age: 8, isNew: false }, pitStops: 1, status: "RACING", isPersonalBest: true, isOverallBest: false },
  { position: 3, driverCode: "LEC", driverNumber: 16, teamName: "Ferrari", teamColor: TEAM_COLORS["Ferrari"], gap: 5.789, interval: 2.333, lastLap: 87.890, bestLap: 87.456, sector1: 28.345, sector2: 34.901, sector3: 24.644, tyre: { compound: "MEDIUM", age: 15, isNew: false }, pitStops: 1, status: "RACING", isPersonalBest: false, isOverallBest: false },
  { position: 4, driverCode: "HAM", driverNumber: 44, teamName: "Ferrari", teamColor: TEAM_COLORS["Ferrari"], gap: 8.234, interval: 2.445, lastLap: 88.123, bestLap: 87.789, sector1: 28.456, sector2: 35.012, sector3: 24.655, tyre: { compound: "HARD", age: 20, isNew: false }, pitStops: 2, status: "RACING", isPersonalBest: false, isOverallBest: false },
  { position: 5, driverCode: "RUS", driverNumber: 63, teamName: "Mercedes", teamColor: TEAM_COLORS["Mercedes"], gap: 12.567, interval: 4.333, lastLap: 88.456, bestLap: 88.012, sector1: 28.567, sector2: 35.234, sector3: 24.655, tyre: { compound: "SOFT", age: 3, isNew: true }, pitStops: 2, status: "RACING", isPersonalBest: false, isOverallBest: false },
  { position: 6, driverCode: "PIA", driverNumber: 81, teamName: "McLaren", teamColor: TEAM_COLORS["McLaren"], gap: 15.890, interval: 3.323, lastLap: 88.789, bestLap: 88.345, sector1: 28.678, sector2: 35.456, sector3: 24.655, tyre: { compound: "MEDIUM", age: 10, isNew: false }, pitStops: 1, status: "RACING", isPersonalBest: false, isOverallBest: false },
  { position: 7, driverCode: "ALO", driverNumber: 14, teamName: "Aston Martin", teamColor: TEAM_COLORS["Aston Martin"], gap: 18.234, interval: 2.344, lastLap: 89.012, bestLap: 88.567, sector1: 28.789, sector2: 35.567, sector3: 24.656, tyre: { compound: "HARD", age: 25, isNew: false }, pitStops: 1, status: "RACING", isPersonalBest: false, isOverallBest: false },
  { position: 8, driverCode: "SAI", driverNumber: 55, teamName: "Williams", teamColor: TEAM_COLORS["Williams"], gap: 22.567, interval: 4.333, lastLap: 89.345, bestLap: 88.901, sector1: 28.890, sector2: 35.789, sector3: 24.666, tyre: { compound: "MEDIUM", age: 18, isNew: false }, pitStops: 1, status: "RACING", isPersonalBest: false, isOverallBest: false },
];

const mockPositions: CarPosition[] = mockDrivers.map((d, i) => ({
  driverCode: d.driverCode,
  driverNumber: d.driverNumber,
  teamColor: d.teamColor,
  x: 150 + i * 40,
  y: 100 + Math.sin(i * 0.8) * 80,
  z: 0,
  timestamp: new Date().toISOString(),
}));

const mockWeather: Weather = {
  airTemp: 28,
  trackTemp: 45,
  humidity: 42,
  pressure: 1013,
  windSpeed: 3.2,
  windDirection: 180,
  rainfall: false,
  timestamp: new Date().toISOString(),
};

const mockTrackStatus: TrackStatus = {
  status: "AllClear",
};

export default function LiveDashboard() {
  const { selectedDrivers, toggleDriverSelection, telemetry } = useLiveStore();

  // Generate mock telemetry for selected drivers
  const selectedTelemetry: DriverTelemetry[] = selectedDrivers.map((code) => {
    const driver = mockDrivers.find((d) => d.driverCode === code);
    return {
      driverCode: code,
      driverNumber: driver?.driverNumber || 0,
      teamColor: driver?.teamColor || "#808080",
      speed: 280 + Math.floor(Math.random() * 50),
      throttle: Math.floor(Math.random() * 100),
      brake: Math.floor(Math.random() * 30),
      gear: 6 + Math.floor(Math.random() * 3),
      rpm: 10000 + Math.floor(Math.random() * 2000),
      drs: Math.random() > 0.7 ? 8 : 0,
      timestamp: new Date().toISOString(),
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <Header sessionName="Monaco Grand Prix - Race" isLive={true} />

      <LiveDashboardLayout
        timingTower={
          <TimingTower
            drivers={mockDrivers}
            selectedDrivers={selectedDrivers}
            onDriverSelect={toggleDriverSelection}
          />
        }
        trackMap={
          <TrackMap
            trackId="monaco"
            positions={mockPositions}
            selectedDrivers={selectedDrivers}
          />
        }
        raceInfo={
          <RaceInfo
            lapCount={{ current: 45, total: 78 }}
            sessionTime="1:32:45"
            weather={mockWeather}
            trackStatus={mockTrackStatus}
            recentMessages={[]}
          />
        }
        telemetryPanel={<TelemetryPanel drivers={selectedTelemetry} />}
      />
    </div>
  );
}
