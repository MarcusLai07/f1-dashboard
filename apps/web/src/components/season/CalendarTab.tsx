"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, ChevronDown, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { useSeasonStore } from "@/stores/seasonStore";
import { useDebugStore } from "@/stores/debugStore";
import { useNotificationPermission, useSessionNotifications } from "@/hooks/useSeasonData";
import { getRaces, getPreseason, type F1Event, type PreSeasonEvent } from "@/data";
import { generateICS, formatSessionTime } from "@/lib/calendarUtils";
import { CalendarExport } from "./CalendarExport";
import { F1Loader } from "@/components/ui/f1-loader";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { animate } from "animejs";
import { getCircuitByName, type CircuitData } from "@/data";
import { MapPin, Trophy, Flag, Timer, Route, Repeat, Info } from "lucide-react";
import { CircuitInfoSlidePanel } from "./CircuitInfoSlidePanel";

// Session type badges for styling (matching Live dropdown)
const SESSION_BADGES: Record<string, { label: string; className: string }> = {
  "FP1": { label: "FP1", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "FP2": { label: "FP2", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "FP3": { label: "FP3", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "QUAL": { label: "QUAL", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  "SQ": { label: "SQ", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  "SPR": { label: "SPRINT", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  "RACE": { label: "RACE", className: "bg-green-500/20 text-green-400 border-green-500/30" },
};

// Get current time (real or simulated)
function useCurrentTime(): number {
  const { enabled, simulatedDate } = useDebugStore();
  if (enabled && simulatedDate) {
    return new Date(simulatedDate).getTime();
  }
  return Date.now();
}

// Country flags
const COUNTRY_FLAGS: Record<string, string> = {
  Australia: "🇦🇺",
  China: "🇨🇳",
  Japan: "🇯🇵",
  Bahrain: "🇧🇭",
  "Saudi Arabia": "🇸🇦",
  USA: "🇺🇸",
  Canada: "🇨🇦",
  Monaco: "🇲🇨",
  Spain: "🇪🇸",
  Austria: "🇦🇹",
  "Great Britain": "🇬🇧",
  Belgium: "🇧🇪",
  Hungary: "🇭🇺",
  Netherlands: "🇳🇱",
  Italy: "🇮🇹",
  Azerbaijan: "🇦🇿",
  Singapore: "🇸🇬",
  Mexico: "🇲🇽",
  Brazil: "🇧🇷",
  Qatar: "🇶🇦",
  UAE: "🇦🇪",
};

// Helper to get all F1 event dates for a month
interface EventDateInfo {
  date: Date;
  events: Array<{ name: string; type: "testing" | "race"; isSprint?: boolean; round?: number; event: F1Event | PreSeasonEvent }>;
}

function getEventDatesForMonth(year: number, month: number, races: F1Event[], preseason: PreSeasonEvent[]): Map<number, EventDateInfo> {
  const eventDates = new Map<number, EventDateInfo>();

  // Add pre-season testing dates
  for (const event of preseason) {
    const startDate = new Date(event.dates.start);
    const endDate = new Date(event.dates.end);

    if (startDate.getFullYear() === year && startDate.getMonth() === month) {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const day = currentDate.getDate();
        const existing = eventDates.get(day);
        if (existing) {
          existing.events.push({ name: event.name, type: "testing", event });
        } else {
          eventDates.set(day, {
            date: new Date(currentDate),
            events: [{ name: event.name, type: "testing", event }],
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  }

  // Add race weekend dates
  for (const event of races) {
    const startDate = new Date(event.dates.start);
    const endDate = new Date(event.dates.end);

    if (startDate.getFullYear() === year && startDate.getMonth() === month) {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const day = currentDate.getDate();
        const existing = eventDates.get(day);
        if (existing) {
          existing.events.push({
            name: event.name,
            type: "race",
            isSprint: event.isSprint,
            round: event.round,
            event,
          });
        } else {
          eventDates.set(day, {
            date: new Date(currentDate),
            events: [{ name: event.name, type: "race", isSprint: event.isSprint, round: event.round, event }],
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  }

  return eventDates;
}

// Mini Calendar Component
interface MiniCalendarProps {
  onEventSelect: (event: F1Event | PreSeasonEvent, type: "testing" | "race") => void;
  now: number;
  races: F1Event[];
  preseason: PreSeasonEvent[];
}

// Get all days that belong to an event
function getEventDays(event: F1Event | PreSeasonEvent, year: number, month: number): Set<number> {
  const days = new Set<number>();
  const startDate = new Date(event.dates.start);
  const endDate = new Date(event.dates.end);

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getFullYear() === year && currentDate.getMonth() === month) {
      days.add(currentDate.getDate());
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
}

function MiniCalendar({ onEventSelect, now, races, preseason }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const currentDate = new Date(now);
    return { year: currentDate.getFullYear(), month: currentDate.getMonth() };
  });
  // Store selected event info instead of just day
  const [selectedEvent, setSelectedEvent] = useState<{
    event: F1Event | PreSeasonEvent;
    type: "testing" | "race";
    days: Set<number>;
  } | null>(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const eventDates = getEventDatesForMonth(year, month, races, preseason);
    const today = new Date(now);
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = isCurrentMonth ? today.getDate() : -1;

    return { year, month, daysInMonth, startDayOfWeek, eventDates, todayDate };
  }, [currentMonth, now, races, preseason]);

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
    setSelectedEvent(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
    setSelectedEvent(null);
  };

  const handleDateClick = (day: number, events: EventDateInfo["events"]) => {
    // Get the first event (or unique event) for this day
    // Deduplicate events by name since the same event spans multiple days
    const uniqueEvents = events.filter((e, i, arr) =>
      arr.findIndex(x => x.name === e.name) === i
    );

    if (uniqueEvents.length > 0) {
      const firstEvent = uniqueEvents[0];
      const eventDays = getEventDays(firstEvent.event, calendarData.year, calendarData.month);
      setSelectedEvent({
        event: firstEvent.event,
        type: firstEvent.type,
        days: eventDays,
      });
    }
  };

  const handleEventClick = () => {
    if (selectedEvent) {
      onEventSelect(selectedEvent.event, selectedEvent.type);
    }
  };

  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    const { daysInMonth, startDayOfWeek, eventDates, todayDate } = calendarData;
    const grid: Array<{ day: number | null; events: EventDateInfo["events"] | null; isToday: boolean }> = [];

    // Add empty cells for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push({ day: null, events: null, isToday: false });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const eventInfo = eventDates.get(day);
      grid.push({
        day,
        events: eventInfo?.events || null,
        isToday: day === todayDate,
      });
    }

    return grid;
  }, [calendarData]);

  // Get event date range string
  const getEventDateRange = (event: F1Event | PreSeasonEvent) => {
    const start = new Date(event.dates.start);
    const end = new Date(event.dates.end);
    const startStr = `${start.getDate().toString().padStart(2, "0")}/${(start.getMonth() + 1).toString().padStart(2, "0")}`;
    const endStr = `${end.getDate().toString().padStart(2, "0")}/${(end.getMonth() + 1).toString().padStart(2, "0")}`;
    return `${startStr} - ${endStr}`;
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-2 sm:p-3 xl:p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 sm:h-7 sm:w-7 xl:h-8 xl:w-8 p-0"
            onClick={goToPrevMonth}
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <span className="text-xs sm:text-sm xl:text-base font-medium">
            {monthNames[currentMonth.month]} {currentMonth.year}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 sm:h-7 sm:w-7 xl:h-8 xl:w-8 p-0"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-[9px] sm:text-[10px] xl:text-xs font-medium text-muted-foreground py-0.5 sm:py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarGrid.map((cell, index) => {
            if (cell.day === null) {
              return <div key={`empty-${index}`} className="h-6 sm:h-7 xl:h-8" />;
            }

            const hasEvents = cell.events && cell.events.length > 0;
            const hasRace = cell.events?.some((e) => e.type === "race");
            const hasTesting = cell.events?.some((e) => e.type === "testing");
            const hasSprint = cell.events?.some((e) => e.isSprint);
            // Check if this day is part of the selected event's date range
            const isPartOfSelectedEvent = selectedEvent?.days.has(cell.day) ?? false;

            return (
              <button
                key={cell.day}
                className={cn(
                  "h-6 sm:h-7 xl:h-8 text-[10px] sm:text-xs xl:text-sm rounded-sm relative transition-all",
                  cell.isToday && "ring-1 ring-primary",
                  isPartOfSelectedEvent && "bg-primary text-primary-foreground",
                  hasEvents && !isPartOfSelectedEvent && "hover:bg-secondary",
                  !hasEvents && "text-muted-foreground/50 hover:bg-secondary/30"
                )}
                onClick={() => hasEvents && cell.events && cell.day !== null && handleDateClick(cell.day, cell.events)}
                disabled={!hasEvents}
              >
                {cell.day}
                {/* Event indicators */}
                {hasEvents && !isPartOfSelectedEvent && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {hasRace && (
                      <span className={`w-1 h-1 xl:w-1.5 xl:h-1.5 rounded-full ${hasSprint ? "bg-purple-500" : "bg-primary"}`} />
                    )}
                    {hasTesting && (
                      <span className="w-1 h-1 xl:w-1.5 xl:h-1.5 rounded-full bg-yellow-500" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">Race</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500" />
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">Sprint</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500" />
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">Testing</span>
          </div>
        </div>

        {/* Selected event details */}
        {selectedEvent && (
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border">
            <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 sm:mb-2">
              {getEventDateRange(selectedEvent.event)}
            </div>
            <button
              className="w-full flex items-center gap-2 p-1.5 sm:p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors text-left"
              onClick={handleEventClick}
            >
              <span className="text-sm sm:text-base">
                {selectedEvent.type === "testing"
                  ? (selectedEvent.event as PreSeasonEvent).location === "Spain" ? "🇪🇸" : "🇧🇭"
                  : COUNTRY_FLAGS[(selectedEvent.event as F1Event).country] || "🏁"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium truncate">
                  {selectedEvent.type === "testing"
                    ? (selectedEvent.event as PreSeasonEvent).name
                    : (selectedEvent.event as F1Event).name}
                </div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                  {selectedEvent.type === "testing" ? (
                    (selectedEvent.event as PreSeasonEvent).circuit
                  ) : (
                    <>
                      {(selectedEvent.event as F1Event).circuit}
                      {(selectedEvent.event as F1Event).isSprint && " • Sprint Weekend"}
                    </>
                  )}
                </div>
              </div>
              {selectedEvent.type === "race" && (
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  R{(selectedEvent.event as F1Event).round}
                </span>
              )}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type EventStatus = "completed" | "next" | "upcoming";

function getEventStatus(event: F1Event, now: number, races: F1Event[]): EventStatus {
  const raceEnd = new Date(event.sessions.race).getTime() + 2 * 60 * 60 * 1000;

  if (now > raceEnd) return "completed";

  // Find the next upcoming event
  const nextEvent = races.find((e) => {
    const eRaceEnd = new Date(e.sessions.race).getTime() + 2 * 60 * 60 * 1000;
    return now <= eRaceEnd;
  });

  if (nextEvent && nextEvent.round === event.round) return "next";
  return "upcoming";
}

interface SessionRowProps {
  label: string;
  time: string | undefined;
  timezone: string;
  eventRound: number;
  sessionType: string;
  showActions?: boolean;
  now: number;
  races: F1Event[];
}

function SessionRow({ label, time, timezone, eventRound, sessionType, showActions, now, races }: SessionRowProps) {
  const { notifications } = useSeasonStore();
  const { requestPermission } = useNotificationPermission();
  const { scheduleNotification, cancelNotification } = useSessionNotifications();

  if (!time) return null;

  const sessionKey = `${eventRound}-${sessionType}`;
  const isSubscribed = notifications.some((n) => n.sessionKey === sessionKey);
  const sessionDate = new Date(time);
  const isPast = sessionDate.getTime() < now;

  const handleNotify = async () => {
    if (isSubscribed) {
      cancelNotification(sessionKey);
    } else {
      const granted = await requestPermission();
      if (granted) {
        scheduleNotification(sessionKey, `Round ${eventRound} - ${label}`, sessionDate, [30, 5]);
      }
    }
  };

  const handleAddToCal = () => {
    const event = races.find((e) => e.round === eventRound);
    if (!event) return;

    const icsContent = generateICS([event]);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `F1-Round${eventRound}-${sessionType}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const badgeInfo = SESSION_BADGES[label] || { label, className: "bg-muted text-muted-foreground border-muted" };

  return (
    <div className={`flex items-center justify-between py-1.5 pl-4 border-l-2 ${isPast ? "border-muted opacity-50" : "border-primary/30"}`}>
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 font-medium w-14 justify-center",
            isPast ? "opacity-60" : "",
            badgeInfo.className
          )}
        >
          {badgeInfo.label}
        </Badge>
        <span className={`text-sm ${isPast ? "text-muted-foreground" : ""}`}>
          {formatSessionTime(time, timezone)}
        </span>
        {isPast && <CheckCircle className="h-3 w-3 text-green-500" />}
      </div>
      {showActions && !isPast && (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleNotify}
          >
            <Bell className={`h-3 w-3 ${isSubscribed ? "fill-current text-primary" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleAddToCal}
          >
            <Calendar className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Circuit Info Button - Opens slide-out panel
interface CircuitInfoButtonProps {
  circuitName: string;
  eventName: string;
  country: string;
  onOpenPanel: () => void;
}

function CircuitInfoButton({ circuitName, eventName, country, onOpenPanel }: CircuitInfoButtonProps) {
  const [circuit, setCircuit] = useState<CircuitData | null>(null);

  useEffect(() => {
    getCircuitByName(circuitName).then(setCircuit);
  }, [circuitName]);

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <button
        className="w-full flex items-center justify-between py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-all group"
        onClick={onOpenPanel}
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          <span>Circuit Info</span>
          {circuit && (
            <span className="text-[10px] text-muted-foreground/70">
              {circuit.length.toFixed(2)}km • {circuit.turns} turns
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform">
          <span className="text-[10px]">View Details</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
}

interface EventCardProps {
  event: F1Event;
  status: EventStatus;
  defaultExpanded?: boolean;
  now: number;
  forceExpanded?: boolean; // When true, forces the card to be expanded (from illumination)
  races: F1Event[];
}

function EventCard({ event, status, defaultExpanded = false, now, forceExpanded, races }: EventCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || status === "next");
  const [circuitPanelOpen, setCircuitPanelOpen] = useState(false);
  const { timezone } = useSeasonStore();
  const flag = COUNTRY_FLAGS[event.country] || "🏁";

  // When forceExpanded changes, update internal state
  useEffect(() => {
    if (forceExpanded !== undefined) {
      setExpanded(forceExpanded);
    }
  }, [forceExpanded]);

  const statusBadge = {
    completed: <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">DONE</span>,
    next: <span className="text-xs px-1.5 py-0.5 bg-primary text-primary-foreground rounded animate-pulse">NEXT</span>,
    upcoming: null,
  };

  return (
    <Card data-event-round={event.round} className={`bg-card border-border transition-all ${status === "next" ? "ring-1 ring-primary" : ""}`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{event.name}</span>
              {event.isSprint && (
                <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">SPRINT</span>
              )}
              {statusBadge[status]}
            </div>
            <span className="text-xs text-muted-foreground">
              {event.circuit} • {event.dates.start.split("-").slice(1).join("/")} - {event.dates.end.split("-").slice(1).join("/")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">R{event.round}</span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <CardContent className="pt-0 pb-3 px-3">
          <div className="space-y-1 mt-2">
            <SessionRow label="FP1" time={event.sessions.fp1} timezone={timezone} eventRound={event.round} sessionType="FP1" now={now} races={races} />
            {event.isSprint ? (
              <>
                <SessionRow label="SQ" time={event.sessions.sprintQualifying} timezone={timezone} eventRound={event.round} sessionType="SQ" now={now} races={races} />
                <SessionRow label="SPR" time={event.sessions.sprint} timezone={timezone} eventRound={event.round} sessionType="Sprint" showActions now={now} races={races} />
              </>
            ) : (
              <>
                <SessionRow label="FP2" time={event.sessions.fp2} timezone={timezone} eventRound={event.round} sessionType="FP2" now={now} races={races} />
                <SessionRow label="FP3" time={event.sessions.fp3} timezone={timezone} eventRound={event.round} sessionType="FP3" now={now} races={races} />
              </>
            )}
            <SessionRow label="QUAL" time={event.sessions.qualifying} timezone={timezone} eventRound={event.round} sessionType="Qualifying" showActions now={now} races={races} />
            <SessionRow label="RACE" time={event.sessions.race} timezone={timezone} eventRound={event.round} sessionType="Race" showActions now={now} races={races} />
          </div>

          {/* Circuit Info Button - Opens slide panel */}
          <CircuitInfoButton
            circuitName={event.circuit}
            eventName={event.name}
            country={event.country}
            onOpenPanel={() => setCircuitPanelOpen(true)}
          />
        </CardContent>
      )}

      {/* Circuit Info Slide Panel */}
      <CircuitInfoSlidePanel
        isOpen={circuitPanelOpen}
        onClose={() => setCircuitPanelOpen(false)}
        circuitName={event.circuit}
        eventName={event.name}
        country={event.country}
      />
    </Card>
  );
}

interface CalendarTabProps {
  hideExport?: boolean;
}

export function CalendarTab({ hideExport = false }: CalendarTabProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [illuminatedEventId, setIlluminatedEventId] = useState<string | null>(null); // Track which event is illuminated/expanded
  const [races, setRaces] = useState<F1Event[]>([]);
  const [preseason, setPreseason] = useState<PreSeasonEvent[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const now = useCurrentTime();

  // Fetch calendar data
  useEffect(() => {
    Promise.all([getRaces(), getPreseason()]).then(([racesData, preseasonData]) => {
      setRaces(racesData);
      setPreseason(preseasonData);
      setDataLoaded(true);
    });
  }, []);

  const { completed, next, upcoming } = useMemo(() => {
    const result = {
      completed: [] as F1Event[],
      next: null as F1Event | null,
      upcoming: [] as F1Event[],
    };

    for (const event of races) {
      const status = getEventStatus(event, now, races);
      if (status === "completed") {
        result.completed.push(event);
      } else if (status === "next") {
        result.next = event;
      } else {
        result.upcoming.push(event);
      }
    }

    return result;
  }, [now, races]);

  // Check if pre-season is completed
  const preSeasonCompleted = useMemo(() => {
    return preseason.every((e) => new Date(e.dates.end).getTime() < now);
  }, [now, preseason]);

  // Scroll to element and apply illumination animation
  const scrollToAndIlluminate = useCallback((element: Element, color: string) => {
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // Cast to HTMLElement for style manipulation
    const htmlElement = element as HTMLElement;

    // Apply illumination animation after scroll starts
    setTimeout(() => {
      animate(htmlElement, {
        backgroundColor: [`rgba(${color}, 0.3)`, "transparent"],
        boxShadow: [
          `0 0 20px rgba(${color}, 0.5), inset 0 0 20px rgba(${color}, 0.1)`,
          "none"
        ],
        duration: 1500,
        ease: "outQuad",
        onComplete: () => {
          // Reset inline styles after animation to prevent color persistence
          htmlElement.style.backgroundColor = "";
          htmlElement.style.boxShadow = "";
        }
      });
    }, 300);
  }, []);

  // Handle event selection from mini calendar
  const handleEventSelect = useCallback((event: F1Event | PreSeasonEvent, type: "testing" | "race") => {
    if (type === "testing") {
      const testingEvent = event as PreSeasonEvent;
      const eventId = `testing-${testingEvent.name}`;

      // Clear previous illumination, set new one
      setIlluminatedEventId(eventId);

      // Use querySelector to find the testing card
      setTimeout(() => {
        const testingCard = document.querySelector(`[data-testing-name="${testingEvent.name}"]`);
        if (testingCard) {
          scrollToAndIlluminate(testingCard, "234, 179, 8"); // Yellow for testing
        }
      }, 50);
    } else {
      const raceEvent = event as F1Event;
      const eventId = `race-${raceEvent.round}`;

      // Clear previous illumination, set new one
      setIlluminatedEventId(eventId);

      // Expand completed section if needed
      if (completed.some(e => e.round === raceEvent.round) && !showCompleted) {
        setShowCompleted(true);
        // Wait for the section to expand before scrolling
        setTimeout(() => {
          const card = document.querySelector(`[data-event-round="${raceEvent.round}"]`);
          if (card) {
            scrollToAndIlluminate(card, "239, 68, 68"); // Red/primary for races
          }
        }, 200);
      } else {
        // Find and scroll to the card
        setTimeout(() => {
          const card = document.querySelector(`[data-event-round="${raceEvent.round}"]`);
          if (card) {
            scrollToAndIlluminate(card, "239, 68, 68"); // Red/primary for races
          }
        }, 50);
      }
    }
  }, [completed, showCompleted, scrollToAndIlluminate]);

  if (!dataLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <F1Loader text="Loading calendar..." />
      </div>
    );
  }

  return (
    <div className="flex gap-3 lg:gap-4">
      {/* Mini Calendar - Responsive sidebar on desktop */}
      <div className="hidden lg:block w-56 xl:w-64 2xl:w-72 flex-shrink-0">
        <div className="sticky top-4">
          <MiniCalendar onEventSelect={handleEventSelect} now={now} races={races} preseason={preseason} />
        </div>
      </div>

      {/* Main Calendar Content */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Mobile Mini Calendar */}
        <div className="lg:hidden max-w-sm mx-auto">
          <MiniCalendar onEventSelect={handleEventSelect} now={now} races={races} preseason={preseason} />
        </div>

        {/* Calendar Export - only show if not hidden */}
        {!hideExport && <CalendarExport />}

        {/* Testing Section */}
        {!preSeasonCompleted && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              TESTING
            </h3>
            <div className="space-y-2">
              {preseason.map((event, i) => {
                const isPast = new Date(event.dates.end).getTime() < now;
                return (
                  <Card
                    key={i}
                    data-testing-name={event.name}
                    className="bg-card/50 border-border transition-all"
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{event.location === "Spain" ? "🇪🇸" : "🇧🇭"}</span>
                        <div>
                          <span className="font-medium">{event.name}</span>
                          <p className="text-xs text-muted-foreground">{event.circuit}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {event.dates.start.split("-").slice(1).join("/")} - {event.dates.end.split("-").slice(1).join("/")}
                        </span>
                        {isPast && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Rounds */}
        {completed.length > 0 && (
          <div className="space-y-2">
            <button
              className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                COMPLETED ({completed.length} rounds)
              </span>
              {showCompleted ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {showCompleted ? (
              <div className="space-y-2">
                {completed.map((event) => (
                  <EventCard
                    key={event.round}
                    event={event}
                    status="completed"
                    now={now}
                    forceExpanded={illuminatedEventId === `race-${event.round}`}
                    races={races}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {completed.map((event) => (
                  <div
                    key={event.round}
                    className="flex items-center gap-1.5 px-2 py-1 bg-card/50 rounded border border-border text-xs"
                  >
                    <span>{COUNTRY_FLAGS[event.country] || "🏁"}</span>
                    <span className="text-muted-foreground">R{event.round}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Next Up */}
        {next && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-primary flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              NEXT UP
            </h3>
            <EventCard
              event={next}
              status="next"
              defaultExpanded
              now={now}
              forceExpanded={illuminatedEventId === `race-${next.round}` ? true : undefined}
              races={races}
            />
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">UPCOMING</h3>
            <div className="space-y-2">
              {upcoming.map((event) => (
                <EventCard
                  key={event.round}
                  event={event}
                  status="upcoming"
                  now={now}
                  forceExpanded={illuminatedEventId === `race-${event.round}`}
                  races={races}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
