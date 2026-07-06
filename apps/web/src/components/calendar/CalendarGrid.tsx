"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MotorsportEvent, SeriesInfo } from "@/data";

interface CalendarGridProps {
  events: MotorsportEvent[];
  series: SeriesInfo[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  timezone: string;
}

export function CalendarGrid({
  events,
  series,
  selectedDate,
  onDateSelect,
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get series color map
  const seriesColors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of series) {
      map[s.id] = s.color;
    }
    return map;
  }, [series]);

  // Build calendar data
  const calendarData = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    // Build series info map for shortName lookup
    const seriesInfoMap = new Map<string, SeriesInfo>();
    for (const s of series) {
      seriesInfoMap.set(s.id, s);
    }

    // Map of day -> calendar entries (events with their display info)
    interface CalendarEntry {
      id: string;
      seriesId: string;
      color: string;
      shortName: string;
      label: string; // Short display label
    }
    const eventsByDay = new Map<number, CalendarEntry[]>();

    for (const event of events) {
      const startDate = new Date(event.dates.start);
      const endDate = new Date(event.dates.end);
      const info = seriesInfoMap.get(event.seriesId);
      const color = seriesColors[event.seriesId] || "#666";
      const shortName = info?.shortName || event.seriesId.toUpperCase();

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (
          currentDate.getFullYear() === year &&
          currentDate.getMonth() === month
        ) {
          const day = currentDate.getDate();
          const existing = eventsByDay.get(day) || [];

          // Create short label for the event
          const label = `${shortName} ${event.name.replace(/Grand Prix|GP/gi, "").replace(/2026/g, "").trim()}`;

          existing.push({
            id: event.id,
            seriesId: event.seriesId,
            color,
            shortName,
            label: label.length > 18 ? label.slice(0, 16) + "…" : label,
          });
          eventsByDay.set(day, existing);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const today = new Date();
    const isCurrentMonth =
      today.getFullYear() === year && today.getMonth() === month;
    const todayDate = isCurrentMonth ? today.getDate() : -1;

    return { year, month, daysInMonth, startDayOfWeek, eventsByDay, todayDate };
  }, [currentMonth, events, series, seriesColors]);

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleDayClick = (day: number) => {
    const { year, month } = currentMonth;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onDateSelect(dateStr);
  };

  // Check if a day is selected
  const isSelectedDay = (day: number) => {
    if (!selectedDate) return false;
    const { year, month } = currentMonth;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return selectedDate === dateStr;
  };

  // Build weeks array
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];

  // Add empty cells for days before the first
  for (let i = 0; i < calendarData.startDayOfWeek; i++) {
    week.push(null);
  }

  for (let day = 1; day <= calendarData.daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  // Fill remaining cells in last week
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {monthNames[calendarData.month]} {calendarData.year}
        </h2>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-muted-foreground py-2 border-b border-border"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 flex-1">
        {weeks.flat().map((day, index) => {
          if (day === null) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[110px] border-b border-r border-border/30"
              />
            );
          }

          const dayEvents = calendarData.eventsByDay.get(day) || [];
          const isToday = day === calendarData.todayDate;
          const isSelected = isSelectedDay(day);
          const hasEvents = dayEvents.length > 0;

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={cn(
                "min-h-[110px] flex flex-col items-stretch justify-start p-1.5 text-sm relative transition-colors border-b border-r border-border/30",
                isToday && "ring-2 ring-primary ring-inset",
                isSelected && "bg-primary/10",
                !isSelected && hasEvents && "hover:bg-secondary/30",
                !isSelected && !hasEvents && "hover:bg-secondary/20"
              )}
            >
              <span className={cn(
                "text-sm font-bold text-center mb-1",
                isSelected && "text-primary",
                isToday && "text-primary"
              )}>{day}</span>
              {/* Event entries - Apple Calendar style */}
              {dayEvents.length > 0 && (
                <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                  {dayEvents.slice(0, 4).map((e) => (
                    <div
                      key={e.id}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate text-white"
                      style={{ backgroundColor: e.color }}
                      title={e.label}
                    >
                      {e.label}
                    </div>
                  ))}
                  {dayEvents.length > 4 && (
                    <span className="text-[10px] text-muted-foreground text-center">
                      +{dayEvents.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}
