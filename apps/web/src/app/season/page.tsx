"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Globe, Calendar, Download } from "lucide-react";
import { CountdownHero } from "@/components/season/CountdownHero";
import { CalendarTab } from "@/components/season/CalendarTab";
import { StandingsTab } from "@/components/season/StandingsTab";
import { TeamsTab } from "@/components/season/TeamsTab";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { useSeasonStore } from "@/stores/seasonStore";
import { useSeasonData } from "@/hooks/useSeasonData";
import { generateICS, CALENDAR_2026 } from "@/lib/calendar2026";

// Common timezones
const TIMEZONES = [
  { value: "Asia/Kuala_Lumpur", label: "Malaysia (GMT+8)" },
  { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
  { value: "Asia/Tokyo", label: "Japan (GMT+9)" },
  { value: "Australia/Sydney", label: "Sydney (GMT+11)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (GMT+1)" },
  { value: "Europe/Berlin", label: "Berlin (GMT+1)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
  { value: "America/Chicago", label: "Chicago (GMT-6)" },
];

function formatTimeSince(date: Date | null): string {
  if (!date) return "Never";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function SeasonPage() {
  const { timezone, setTimezone, lastUpdated, isLoading } = useSeasonStore();
  const { refresh } = useSeasonData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");

  // Update "time ago" display
  const [timeAgo, setTimeAgo] = useState(formatTimeSince(lastUpdated));

  useEffect(() => {
    setTimeAgo(formatTimeSince(lastUpdated));
    const interval = setInterval(() => {
      setTimeAgo(formatTimeSince(lastUpdated));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  // Handle tab change
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
  }, []);

  // Download full calendar
  const handleDownloadCalendar = useCallback(() => {
    const icsContent = generateICS(CALENDAR_2026);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "F1-2026-Calendar.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 z-50">
        <Header sessionName="2026 Season" />
      </div>

      {/* Debug Panel */}
      <DebugPanel />

      {/* Main Content - fills remaining viewport height */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
          {/* Sticky bar with countdown, tabs, and settings */}
          <div className="flex-shrink-0 bg-background border-b border-border px-6 py-4 space-y-4">
            {/* Countdown Hero */}
            <CountdownHero />

            {/* Tabs & Settings */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="standings">Standings</TabsTrigger>
                <TabsTrigger value="teams">Teams & Drivers</TabsTrigger>
              </TabsList>

              {/* Settings */}
              <div className="flex items-center gap-3">
                {/* Calendar Download - only show on calendar tab */}
                {activeTab === "calendar" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCalendar}
                    className="h-8 gap-1.5"
                  >
                    <Download className="h-3 w-3" />
                    <Calendar className="h-3 w-3" />
                    <span className="hidden sm:inline">Full Calendar</span>
                  </Button>
                )}

                {/* Timezone Selector */}
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="w-[180px] h-8 text-sm">
                      <SelectValue placeholder="Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Last Updated & Refresh */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="hidden sm:inline">Updated {timeAgo}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    className="h-8"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-200">
              {activeTab === "calendar" && <CalendarTab hideExport />}
              {activeTab === "standings" && <StandingsTab />}
              {activeTab === "teams" && <TeamsTab />}
            </div>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
