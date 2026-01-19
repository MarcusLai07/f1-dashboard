"use client";

import { ReactNode } from "react";

interface LiveDashboardLayoutProps {
  timingTower: ReactNode;
  trackMap: ReactNode;
  raceInfo: ReactNode;
  telemetryPanel: ReactNode;
  raceControlMessages?: ReactNode;
}

export function LiveDashboardLayout({
  timingTower,
  trackMap,
  raceInfo,
  telemetryPanel,
  raceControlMessages,
}: LiveDashboardLayoutProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Race Control Messages Banner */}
      {raceControlMessages && (
        <div className="h-8 border-b border-border bg-card/50 flex items-center px-4 overflow-hidden">
          {raceControlMessages}
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-[minmax(600px,720px)_1fr_300px] gap-0 min-h-0">
        {/* Timing Tower - Left */}
        <div className="border-r border-border overflow-y-auto">
          {timingTower}
        </div>

        {/* Track Map - Center */}
        <div className="flex items-center justify-center p-4 overflow-hidden">
          {trackMap}
        </div>

        {/* Race Info - Right */}
        <div className="border-l border-border overflow-y-auto">
          {raceInfo}
        </div>
      </div>

      {/* Telemetry Panel - Bottom */}
      <div className="h-[200px] border-t border-border bg-card">
        {telemetryPanel}
      </div>
    </div>
  );
}
