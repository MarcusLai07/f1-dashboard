"use client";

import { useMemo } from "react";
import { EventCard } from "./EventCard";
import type { MotorsportEvent, SeriesInfo } from "@/data";

interface EventListProps {
  selectedDate: string | null;
  groupedEvents: Record<string, MotorsportEvent[]>;
  series: SeriesInfo[];
  timezone: string;
}

export function EventList({
  selectedDate,
  groupedEvents,
  series,
  timezone,
}: EventListProps) {
  // Create series lookup
  const seriesMap = useMemo(() => {
    const map: Record<string, SeriesInfo> = {};
    for (const s of series) {
      map[s.id] = s;
    }
    return map;
  }, [series]);

  // Format selected date for display
  const displayDate = useMemo(() => {
    if (!selectedDate) return "No date selected";
    const date = new Date(selectedDate + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  const seriesIds = Object.keys(groupedEvents);

  if (!selectedDate) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Select a date to view events
      </div>
    );
  }

  if (seriesIds.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{displayDate}</h2>
        <div className="text-muted-foreground">
          No events scheduled for this date with current filters.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">{displayDate}</h2>

      {seriesIds.map((seriesId) => {
        const seriesInfo = seriesMap[seriesId];
        const events = groupedEvents[seriesId];

        return (
          <div key={seriesId} className="flex flex-col gap-3">
            {/* Series Header */}
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: seriesInfo?.color || "#666" }}
              />
              <span className="font-medium">
                {seriesInfo?.shortName || seriesId}
              </span>
              <span className="text-sm text-muted-foreground">
                ({events.length} event{events.length !== 1 ? "s" : ""})
              </span>
            </div>

            {/* Events */}
            <div className="flex flex-col gap-2 pl-5">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  seriesInfo={seriesInfo}
                  timezone={timezone}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
