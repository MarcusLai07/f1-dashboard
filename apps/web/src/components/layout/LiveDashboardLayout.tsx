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

      {/* Main Content - Flexbox for dynamic sizing */}
      <div className="flex-1 flex min-h-0">
        {/* Timing Tower - Left (takes natural width, max 55% of screen) */}
        <div className="border-r border-border overflow-y-auto overflow-x-hidden shrink-0 max-w-[55%]">
          {timingTower}
        </div>

        {/* Track Map - Center (fills remaining space) */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden min-w-[200px]">
          {trackMap}
        </div>

        {/* Race Info - Right (fixed width) */}
        <div className="w-[280px] shrink-0 border-l border-border overflow-y-auto">
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
