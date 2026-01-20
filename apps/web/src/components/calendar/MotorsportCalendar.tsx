"use client";

import { useState, useEffect, useMemo } from "react";
import { CalendarGrid } from "./CalendarGrid";
import { SeriesFilter } from "./SeriesFilter";
import { EventList } from "./EventList";
import { useCalendarStore } from "@/stores/calendarStore";
import { useSeasonStore } from "@/stores/seasonStore";
import {
  getAllMotorsportEvents,
  getSeriesMetadata,
  type MotorsportEvent,
  type SeriesInfo,
} from "@/data";
import { F1Loader } from "@/components/ui/f1-loader";

export function MotorsportCalendar() {
  const [events, setEvents] = useState<MotorsportEvent[]>([]);
  const [series, setSeries] = useState<SeriesInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { selectedDate, setSelectedDate, enabledSeries } = useCalendarStore();
  const { timezone } = useSeasonStore();

  // Load data on mount - only runs once
  useEffect(() => {
    const currentSelectedDate = selectedDate;
    const currentEnabledSeries = enabledSeries;

    async function loadData() {
      setIsLoading(true);
      try {
        const [eventsData, seriesData] = await Promise.all([
          getAllMotorsportEvents(2026),
          getSeriesMetadata(),
        ]);
        setEvents(eventsData);
        setSeries(seriesData);

        // Set default date to today or next event (only if no date selected)
        if (!currentSelectedDate) {
          const today = new Date().toISOString().split("T")[0];
          const todayEvents = eventsData.filter(
            (e) =>
              e.dates.start <= today &&
              e.dates.end >= today &&
              currentEnabledSeries.includes(e.seriesId)
          );

          if (todayEvents.length > 0) {
            setSelectedDate(today);
          } else {
            // Find next event
            const nextEvent = eventsData.find(
              (e) => e.dates.start >= today && currentEnabledSeries.includes(e.seriesId)
            );
            if (nextEvent) {
              setSelectedDate(nextEvent.dates.start);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load calendar data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter events by enabled series
  const filteredEvents = useMemo(() => {
    return events.filter((e) => enabledSeries.includes(e.seriesId));
  }, [events, enabledSeries]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(
      (e) => e.dates.start <= selectedDate && e.dates.end >= selectedDate
    );
  }, [filteredEvents, selectedDate]);

  // Group events by series for display
  const groupedEvents = useMemo(() => {
    const groups: Record<string, MotorsportEvent[]> = {};
    for (const event of selectedDateEvents) {
      if (!groups[event.seriesId]) {
        groups[event.seriesId] = [];
      }
      groups[event.seriesId].push(event);
    }
    return groups;
  }, [selectedDateEvents]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <F1Loader size="lg" text="Loading calendar..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left side - Calendar (40%) */}
      <div className="lg:w-[40%] border-b lg:border-b-0 lg:border-r border-border p-4 flex flex-col gap-4 overflow-auto">
        <CalendarGrid
          events={filteredEvents}
          series={series}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          timezone={timezone}
        />
      </div>

      {/* Right side - Event List (60%) */}
      <div className="lg:w-[60%] flex flex-col overflow-hidden flex-1">
        <div className="p-4 border-b border-border">
          <SeriesFilter series={series} />
        </div>
        <div className="flex-1 overflow-auto p-4">
          <EventList
            selectedDate={selectedDate}
            groupedEvents={groupedEvents}
            series={series}
            timezone={timezone}
          />
        </div>
      </div>
    </div>
  );
}
