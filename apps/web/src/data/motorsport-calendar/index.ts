// Motorsport Calendar Data Layer
// Aggregates calendar data from all series

import type {
  SeriesInfo,
  SeriesMetadata,
  MotorsportEvent,
  SeriesCalendar,
  MotorsportCategory,
} from "./_schema";

// Cache for loaded data
let seriesMetadataCache: SeriesMetadata | null = null;
const calendarCache = new Map<string, SeriesCalendar>();

// Load series metadata
export async function getSeriesMetadata(): Promise<SeriesInfo[]> {
  if (seriesMetadataCache) {
    return seriesMetadataCache.series;
  }

  const data = await import("./_series.json");
  seriesMetadataCache = data.default as SeriesMetadata;
  return seriesMetadataCache.series;
}

// Get single series info
export async function getSeriesInfo(seriesId: string): Promise<SeriesInfo | null> {
  const series = await getSeriesMetadata();
  return series.find((s) => s.id === seriesId) || null;
}

// Get series by category
export async function getSeriesByCategory(
  category: MotorsportCategory
): Promise<SeriesInfo[]> {
  const series = await getSeriesMetadata();
  return series.filter((s) => s.category === category);
}

// Load calendar for a specific series
async function loadSeriesCalendar(
  seriesId: string,
  year: number
): Promise<SeriesCalendar | null> {
  const cacheKey = `${seriesId}-${year}`;
  if (calendarCache.has(cacheKey)) {
    return calendarCache.get(cacheKey)!;
  }

  const series = await getSeriesInfo(seriesId);
  if (!series) return null;

  const categoryPath = series.category;

  try {
    // Dynamic import based on series category
    let data;
    switch (categoryPath) {
      case "formula":
        data = await import(`./${year}/formula/${seriesId}.json`);
        break;
      case "endurance":
        data = await import(`./${year}/endurance/${seriesId}.json`);
        break;
      case "rally":
        data = await import(`./${year}/rally/${seriesId}.json`);
        break;
      case "touring":
        data = await import(`./${year}/touring/${seriesId}.json`);
        break;
      case "motorcycle":
        data = await import(`./${year}/motorcycle/${seriesId}.json`);
        break;
      case "stock":
        data = await import(`./${year}/stock/${seriesId}.json`);
        break;
      case "special":
        data = await import(`./${year}/special/${seriesId}.json`);
        break;
      default:
        return null;
    }
    const calendar = data.default as SeriesCalendar;
    calendarCache.set(cacheKey, calendar);
    return calendar;
  } catch {
    // Calendar file doesn't exist for this series/year
    return null;
  }
}

// Get all events for a series
export async function getSeriesEvents(
  seriesId: string,
  year: number = 2026
): Promise<MotorsportEvent[]> {
  const calendar = await loadSeriesCalendar(seriesId, year);
  return calendar?.events || [];
}

// Get all events across all series
export async function getAllMotorsportEvents(
  year: number = 2026
): Promise<MotorsportEvent[]> {
  const series = await getSeriesMetadata();
  const allEvents: MotorsportEvent[] = [];

  for (const s of series) {
    const events = await getSeriesEvents(s.id, year);
    allEvents.push(...events);
  }

  // Sort by start date
  return allEvents.sort(
    (a, b) => new Date(a.dates.start).getTime() - new Date(b.dates.start).getTime()
  );
}

// Get events by category
export async function getEventsByCategory(
  category: MotorsportCategory,
  year: number = 2026
): Promise<MotorsportEvent[]> {
  const series = await getSeriesByCategory(category);
  const events: MotorsportEvent[] = [];

  for (const s of series) {
    const seriesEvents = await getSeriesEvents(s.id, year);
    events.push(...seriesEvents);
  }

  return events.sort(
    (a, b) => new Date(a.dates.start).getTime() - new Date(b.dates.start).getTime()
  );
}

// Get events for a specific date
export async function getEventsByDate(
  date: string,
  year: number = 2026
): Promise<MotorsportEvent[]> {
  const allEvents = await getAllMotorsportEvents(year);
  const targetDate = new Date(date);

  return allEvents.filter((event) => {
    const startDate = new Date(event.dates.start);
    const endDate = new Date(event.dates.end);
    return targetDate >= startDate && targetDate <= endDate;
  });
}

// Get events for a date range
export async function getEventsInRange(
  startDate: string,
  endDate: string,
  year: number = 2026
): Promise<MotorsportEvent[]> {
  const allEvents = await getAllMotorsportEvents(year);
  const start = new Date(startDate);
  const end = new Date(endDate);

  return allEvents.filter((event) => {
    const eventStart = new Date(event.dates.start);
    const eventEnd = new Date(event.dates.end);
    return eventStart <= end && eventEnd >= start;
  });
}

// Get next upcoming event across all series
export async function getNextMotorsportEvent(
  year: number = 2026
): Promise<MotorsportEvent | null> {
  const allEvents = await getAllMotorsportEvents(year);
  const now = new Date();

  for (const event of allEvents) {
    const eventEnd = new Date(event.dates.end);
    if (eventEnd >= now) {
      return event;
    }
  }

  return null;
}

// Clear cache
export function clearMotorsportCalendarCache(): void {
  calendarCache.clear();
  seriesMetadataCache = null;
}

// Re-export types
export type {
  SeriesInfo,
  MotorsportEvent,
  MotorsportSession,
  SeriesCalendar,
  MotorsportCategory,
  SessionType,
  EventType,
} from "./_schema";
