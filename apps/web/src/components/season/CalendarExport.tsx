"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { getRaces, type F1Event } from "@/data";
import { generateICS, generateGoogleCalendarUrl } from "@/lib/calendarUtils";

export function CalendarExport() {
  const [races, setRaces] = useState<F1Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRaces().then((data) => {
      setRaces(data);
      setLoading(false);
    });
  }, []);

  const handleDownloadICS = () => {
    if (races.length === 0) return;
    const icsContent = generateICS(races);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "F1-2026-Calendar.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGoogleCalendar = () => {
    // Open Google Calendar with the first upcoming event
    const now = new Date();
    const nextEvent = races.find(
      (e) => new Date(e.sessions.race) > now
    );
    if (nextEvent) {
      const url = generateGoogleCalendarUrl(nextEvent);
      window.open(url, "_blank");
    }
  };

  const handleAppleCalendar = () => {
    // Apple Calendar uses .ics files
    handleDownloadICS();
  };

  const handleOutlook = () => {
    // Outlook also supports .ics files
    handleDownloadICS();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-card/50 rounded-lg border border-border">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground mr-2">Download Full Calendar:</span>
      <Button variant="outline" size="sm" onClick={handleGoogleCalendar} disabled={loading}>
        Google
      </Button>
      <Button variant="outline" size="sm" onClick={handleAppleCalendar} disabled={loading}>
        Apple / iCal
      </Button>
      <Button variant="outline" size="sm" onClick={handleOutlook} disabled={loading}>
        Outlook
      </Button>
    </div>
  );
}
