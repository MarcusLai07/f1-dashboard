# Motorsport Calendar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a unified motorsport calendar page showing events from multiple racing series (F1, WEC, WRC, MotoGP, etc.) with filtering capabilities, and migrate the Season panel to use the unified data structure.

**Architecture:** Modular data structure with separate JSON files per series, organized by category. New `/calendar` route with calendar grid on left (40%) and filterable event list on right (60%). Series filter chips allow include/exclude. Season panel updated to consume F1 data from unified structure.

**Tech Stack:** Next.js 15, React 19, Zustand, Tailwind CSS, animejs, Radix UI

---

## Task 1: Create Motorsport Calendar Data Schema

**Files:**
- Create: `apps/web/src/data/motorsport-calendar/_schema.ts`

**Step 1: Create the TypeScript schema file**

```typescript
// Motorsport Calendar TypeScript interfaces
// Unified schema for all motorsport series calendars

export interface SeriesInfo {
  id: string;           // e.g., "f1", "wec", "wrc"
  name: string;         // e.g., "FIA Formula 1 World Championship"
  shortName: string;    // e.g., "F1"
  category: MotorsportCategory;
  color: string;        // Hex color for badges/dots
  website?: string;     // Official website URL
}

export type MotorsportCategory =
  | "formula"
  | "endurance"
  | "rally"
  | "touring"
  | "motorcycle"
  | "stock";

export interface MotorsportEvent {
  id: string;           // e.g., "f1-2026-01"
  seriesId: string;     // e.g., "f1"
  name: string;         // e.g., "Australian Grand Prix"
  country: string;      // e.g., "Australia"
  circuit: string;      // e.g., "Albert Park Circuit"
  location?: string;    // City/region
  dates: {
    start: string;      // ISO date: "2026-03-06"
    end: string;        // ISO date: "2026-03-08"
  };
  sessions: MotorsportSession[];
  status?: "confirmed" | "provisional" | "cancelled";
  isFeatured?: boolean; // Major events like 24h Le Mans, Monaco GP
}

export interface MotorsportSession {
  name: string;         // e.g., "Race", "Qualifying", "FP1", "Stage 1"
  shortName?: string;   // e.g., "R", "Q", "FP1", "SS1"
  dateTime: string;     // ISO UTC: "2026-03-08T04:00:00Z"
  duration?: string;    // e.g., "2h", "1h30m"
  type?: SessionType;
}

export type SessionType =
  | "practice"
  | "qualifying"
  | "sprint"
  | "race"
  | "stage"
  | "warmup"
  | "shakedown";

export interface SeriesCalendar {
  seriesId: string;
  year: number;
  events: MotorsportEvent[];
}

export interface SeriesMetadata {
  series: SeriesInfo[];
}

// Aggregated data for display
export interface CalendarDay {
  date: string;         // ISO date
  events: MotorsportEvent[];
}
```

**Step 2: Verify file was created**

Run: `cat apps/web/src/data/motorsport-calendar/_schema.ts | head -20`
Expected: Shows the interface definitions

---

## Task 2: Create Series Metadata Registry

**Files:**
- Create: `apps/web/src/data/motorsport-calendar/_series.json`

**Step 1: Create the series metadata JSON**

```json
{
  "series": [
    {
      "id": "f1",
      "name": "FIA Formula 1 World Championship",
      "shortName": "F1",
      "category": "formula",
      "color": "#E10600",
      "website": "https://www.formula1.com"
    },
    {
      "id": "f2",
      "name": "FIA Formula 2 Championship",
      "shortName": "F2",
      "category": "formula",
      "color": "#0090D0",
      "website": "https://www.fiaformula2.com"
    },
    {
      "id": "f3",
      "name": "FIA Formula 3 Championship",
      "shortName": "F3",
      "category": "formula",
      "color": "#00875F",
      "website": "https://www.fiaformula3.com"
    },
    {
      "id": "fe",
      "name": "ABB FIA Formula E World Championship",
      "shortName": "Formula E",
      "category": "formula",
      "color": "#14B8A6",
      "website": "https://www.fiaformulae.com"
    },
    {
      "id": "wec",
      "name": "FIA World Endurance Championship",
      "shortName": "WEC",
      "category": "endurance",
      "color": "#C41E3A",
      "website": "https://www.fiawec.com"
    },
    {
      "id": "imsa",
      "name": "IMSA WeatherTech SportsCar Championship",
      "shortName": "IMSA",
      "category": "endurance",
      "color": "#003DA5",
      "website": "https://www.imsa.com"
    },
    {
      "id": "wrc",
      "name": "FIA World Rally Championship",
      "shortName": "WRC",
      "category": "rally",
      "color": "#00AEEF",
      "website": "https://www.wrc.com"
    },
    {
      "id": "motogp",
      "name": "MotoGP World Championship",
      "shortName": "MotoGP",
      "category": "motorcycle",
      "color": "#BE0A26",
      "website": "https://www.motogp.com"
    },
    {
      "id": "wsbk",
      "name": "FIM Superbike World Championship",
      "shortName": "WorldSBK",
      "category": "motorcycle",
      "color": "#FF6B00",
      "website": "https://www.worldsbk.com"
    },
    {
      "id": "nascar",
      "name": "NASCAR Cup Series",
      "shortName": "NASCAR",
      "category": "stock",
      "color": "#FFCC00",
      "website": "https://www.nascar.com"
    },
    {
      "id": "indycar",
      "name": "NTT IndyCar Series",
      "shortName": "IndyCar",
      "category": "formula",
      "color": "#DA291C",
      "website": "https://www.indycar.com"
    },
    {
      "id": "dtm",
      "name": "Deutsche Tourenwagen Masters",
      "shortName": "DTM",
      "category": "touring",
      "color": "#1E1E1E",
      "website": "https://www.dtm.com"
    }
  ]
}
```

---

## Task 3: Create Directory Structure and F1 Calendar JSON

**Files:**
- Create: `apps/web/src/data/motorsport-calendar/2026/formula/f1.json`

**Step 1: Create directory structure**

Run: `mkdir -p apps/web/src/data/motorsport-calendar/2026/{formula,endurance,rally,touring,motorcycle,stock}`

**Step 2: Create F1 calendar JSON (converted from existing format)**

The F1 calendar should be converted from the existing `/data/calendar/2026.json` format to the new unified format. This is a large file with 24 races - create programmatically or manually.

Key structure for each event:
```json
{
  "seriesId": "f1",
  "year": 2026,
  "events": [
    {
      "id": "f1-2026-01",
      "seriesId": "f1",
      "name": "Australian Grand Prix",
      "country": "Australia",
      "circuit": "Albert Park Circuit",
      "dates": { "start": "2026-03-06", "end": "2026-03-08" },
      "sessions": [
        { "name": "Free Practice 1", "shortName": "FP1", "dateTime": "2026-03-06T01:30:00Z", "type": "practice" },
        { "name": "Free Practice 2", "shortName": "FP2", "dateTime": "2026-03-06T05:00:00Z", "type": "practice" },
        { "name": "Free Practice 3", "shortName": "FP3", "dateTime": "2026-03-07T01:30:00Z", "type": "practice" },
        { "name": "Qualifying", "shortName": "Q", "dateTime": "2026-03-07T05:00:00Z", "type": "qualifying" },
        { "name": "Race", "shortName": "R", "dateTime": "2026-03-08T04:00:00Z", "type": "race" }
      ],
      "status": "confirmed",
      "isFeatured": false
    }
  ]
}
```

---

## Task 4: Create Sample WEC Calendar JSON

**Files:**
- Create: `apps/web/src/data/motorsport-calendar/2026/endurance/wec.json`

**Step 1: Create WEC calendar with key 2026 events**

```json
{
  "seriesId": "wec",
  "year": 2026,
  "events": [
    {
      "id": "wec-2026-01",
      "seriesId": "wec",
      "name": "Qatar 1812km",
      "country": "Qatar",
      "circuit": "Lusail International Circuit",
      "dates": { "start": "2026-03-28", "end": "2026-03-28" },
      "sessions": [
        { "name": "Free Practice 1", "shortName": "FP1", "dateTime": "2026-03-27T07:00:00Z", "type": "practice" },
        { "name": "Free Practice 2", "shortName": "FP2", "dateTime": "2026-03-27T11:30:00Z", "type": "practice" },
        { "name": "Qualifying", "shortName": "Q", "dateTime": "2026-03-27T15:00:00Z", "type": "qualifying" },
        { "name": "Race", "shortName": "R", "dateTime": "2026-03-28T12:00:00Z", "duration": "8h", "type": "race" }
      ],
      "status": "confirmed"
    },
    {
      "id": "wec-2026-02",
      "seriesId": "wec",
      "name": "6 Hours of Imola",
      "country": "Italy",
      "circuit": "Autodromo Enzo e Dino Ferrari",
      "dates": { "start": "2026-04-19", "end": "2026-04-19" },
      "sessions": [
        { "name": "Free Practice", "shortName": "FP", "dateTime": "2026-04-18T09:00:00Z", "type": "practice" },
        { "name": "Qualifying", "shortName": "Q", "dateTime": "2026-04-18T14:00:00Z", "type": "qualifying" },
        { "name": "Race", "shortName": "R", "dateTime": "2026-04-19T11:00:00Z", "duration": "6h", "type": "race" }
      ],
      "status": "confirmed"
    },
    {
      "id": "wec-2026-03",
      "seriesId": "wec",
      "name": "6 Hours of Spa-Francorchamps",
      "country": "Belgium",
      "circuit": "Circuit de Spa-Francorchamps",
      "dates": { "start": "2026-05-09", "end": "2026-05-09" },
      "sessions": [
        { "name": "Free Practice", "shortName": "FP", "dateTime": "2026-05-08T09:00:00Z", "type": "practice" },
        { "name": "Qualifying", "shortName": "Q", "dateTime": "2026-05-08T14:30:00Z", "type": "qualifying" },
        { "name": "Race", "shortName": "R", "dateTime": "2026-05-09T11:00:00Z", "duration": "6h", "type": "race" }
      ],
      "status": "confirmed"
    },
    {
      "id": "wec-2026-04",
      "seriesId": "wec",
      "name": "24 Hours of Le Mans",
      "country": "France",
      "circuit": "Circuit de la Sarthe",
      "dates": { "start": "2026-06-13", "end": "2026-06-14" },
      "sessions": [
        { "name": "Hyperpole", "shortName": "HP", "dateTime": "2026-06-12T19:00:00Z", "type": "qualifying" },
        { "name": "Race", "shortName": "R", "dateTime": "2026-06-13T14:00:00Z", "duration": "24h", "type": "race" }
      ],
      "status": "confirmed",
      "isFeatured": true
    },
    {
      "id": "wec-2026-05",
      "seriesId": "wec",
      "name": "6 Hours of São Paulo",
      "country": "Brazil",
      "circuit": "Autódromo José Carlos Pace",
      "dates": { "start": "2026-07-12", "end": "2026-07-12" },
      "sessions": [
        { "name": "Race", "shortName": "R", "dateTime": "2026-07-12T14:00:00Z", "duration": "6h", "type": "race" }
      ],
      "status": "confirmed"
    },
    {
      "id": "wec-2026-06",
      "seriesId": "wec",
      "name": "Lone Star Le Mans",
      "country": "USA",
      "circuit": "Circuit of the Americas",
      "dates": { "start": "2026-09-06", "end": "2026-09-06" },
      "sessions": [
        { "name": "Race", "shortName": "R", "dateTime": "2026-09-06T17:00:00Z", "duration": "6h", "type": "race" }
      ],
      "status": "confirmed"
    },
    {
      "id": "wec-2026-07",
      "seriesId": "wec",
      "name": "6 Hours of Fuji",
      "country": "Japan",
      "circuit": "Fuji Speedway",
      "dates": { "start": "2026-09-27", "end": "2026-09-27" },
      "sessions": [
        { "name": "Race", "shortName": "R", "dateTime": "2026-09-27T03:00:00Z", "duration": "6h", "type": "race" }
      ],
      "status": "confirmed"
    },
    {
      "id": "wec-2026-08",
      "seriesId": "wec",
      "name": "8 Hours of Bahrain",
      "country": "Bahrain",
      "circuit": "Bahrain International Circuit",
      "dates": { "start": "2026-11-07", "end": "2026-11-07" },
      "sessions": [
        { "name": "Race", "shortName": "R", "dateTime": "2026-11-07T11:00:00Z", "duration": "8h", "type": "race" }
      ],
      "status": "confirmed"
    }
  ]
}
```

---

## Task 5: Create Sample WRC Calendar JSON

**Files:**
- Create: `apps/web/src/data/motorsport-calendar/2026/rally/wrc.json`

**Step 1: Create WRC calendar with key 2026 events**

```json
{
  "seriesId": "wrc",
  "year": 2026,
  "events": [
    {
      "id": "wrc-2026-01",
      "seriesId": "wrc",
      "name": "Rallye Monte-Carlo",
      "country": "Monaco",
      "circuit": "Monaco Region",
      "dates": { "start": "2026-01-22", "end": "2026-01-25" },
      "sessions": [
        { "name": "Shakedown", "shortName": "SH", "dateTime": "2026-01-22T08:00:00Z", "type": "shakedown" },
        { "name": "SS1-SS6", "shortName": "Day 1", "dateTime": "2026-01-23T07:00:00Z", "type": "stage" },
        { "name": "SS7-SS12", "shortName": "Day 2", "dateTime": "2026-01-24T07:00:00Z", "type": "stage" },
        { "name": "SS13-SS16 (Power Stage)", "shortName": "Day 3", "dateTime": "2026-01-25T07:00:00Z", "type": "stage" }
      ],
      "status": "confirmed",
      "isFeatured": true
    },
    {
      "id": "wrc-2026-02",
      "seriesId": "wrc",
      "name": "Rally Sweden",
      "country": "Sweden",
      "circuit": "Umeå Region",
      "dates": { "start": "2026-02-12", "end": "2026-02-15" },
      "sessions": [
        { "name": "Shakedown", "shortName": "SH", "dateTime": "2026-02-12T08:00:00Z", "type": "shakedown" },
        { "name": "Day 1", "shortName": "D1", "dateTime": "2026-02-13T07:00:00Z", "type": "stage" },
        { "name": "Day 2", "shortName": "D2", "dateTime": "2026-02-14T07:00:00Z", "type": "stage" },
        { "name": "Day 3", "shortName": "D3", "dateTime": "2026-02-15T07:00:00Z", "type": "stage" }
      ],
      "status": "confirmed"
    },
    {
      "id": "wrc-2026-03",
      "seriesId": "wrc",
      "name": "Safari Rally Kenya",
      "country": "Kenya",
      "circuit": "Naivasha Region",
      "dates": { "start": "2026-03-12", "end": "2026-03-15" },
      "sessions": [
        { "name": "Shakedown", "shortName": "SH", "dateTime": "2026-03-12T06:00:00Z", "type": "shakedown" },
        { "name": "Day 1", "shortName": "D1", "dateTime": "2026-03-13T05:00:00Z", "type": "stage" },
        { "name": "Day 2", "shortName": "D2", "dateTime": "2026-03-14T05:00:00Z", "type": "stage" },
        { "name": "Day 3", "shortName": "D3", "dateTime": "2026-03-15T05:00:00Z", "type": "stage" }
      ],
      "status": "confirmed"
    },
    {
      "id": "wrc-2026-04",
      "seriesId": "wrc",
      "name": "Rally de Portugal",
      "country": "Portugal",
      "circuit": "Matosinhos Region",
      "dates": { "start": "2026-05-07", "end": "2026-05-10" },
      "sessions": [
        { "name": "Day 1", "shortName": "D1", "dateTime": "2026-05-08T07:00:00Z", "type": "stage" },
        { "name": "Day 2", "shortName": "D2", "dateTime": "2026-05-09T07:00:00Z", "type": "stage" },
        { "name": "Day 3", "shortName": "D3", "dateTime": "2026-05-10T07:00:00Z", "type": "stage" }
      ],
      "status": "confirmed"
    },
    {
      "id": "wrc-2026-05",
      "seriesId": "wrc",
      "name": "Rally Finland",
      "country": "Finland",
      "circuit": "Jyväskylä Region",
      "dates": { "start": "2026-07-30", "end": "2026-08-02" },
      "sessions": [
        { "name": "Day 1", "shortName": "D1", "dateTime": "2026-07-31T06:00:00Z", "type": "stage" },
        { "name": "Day 2", "shortName": "D2", "dateTime": "2026-08-01T06:00:00Z", "type": "stage" },
        { "name": "Day 3", "shortName": "D3", "dateTime": "2026-08-02T06:00:00Z", "type": "stage" }
      ],
      "status": "confirmed"
    }
  ]
}
```

---

## Task 6: Create Sample MotoGP Calendar JSON

**Files:**
- Create: `apps/web/src/data/motorsport-calendar/2026/motorcycle/motogp.json`

**Step 1: Create MotoGP calendar with key 2026 events**

```json
{
  "seriesId": "motogp",
  "year": 2026,
  "events": [
    {
      "id": "motogp-2026-01",
      "seriesId": "motogp",
      "name": "Thailand Grand Prix",
      "country": "Thailand",
      "circuit": "Chang International Circuit",
      "dates": { "start": "2026-02-27", "end": "2026-03-01" },
      "sessions": [
        { "name": "Practice 1", "shortName": "P1", "dateTime": "2026-02-27T04:45:00Z", "type": "practice" },
        { "name": "Practice 2", "shortName": "P2", "dateTime": "2026-02-27T09:00:00Z", "type": "practice" },
        { "name": "Practice 3", "shortName": "P3", "dateTime": "2026-02-28T04:10:00Z", "type": "practice" },
        { "name": "Qualifying", "shortName": "Q", "dateTime": "2026-02-28T08:50:00Z", "type": "qualifying" },
        { "name": "Sprint", "shortName": "SPR", "dateTime": "2026-02-28T10:00:00Z", "type": "sprint" },
        { "name": "Race", "shortName": "R", "dateTime": "2026-03-01T08:00:00Z", "type": "race" }
      ],
      "status": "confirmed"
    },
    {
      "id": "motogp-2026-02",
      "seriesId": "motogp",
      "name": "Brazilian Grand Prix",
      "country": "Brazil",
      "circuit": "Autódromo Internacional de Goiânia",
      "dates": { "start": "2026-03-20", "end": "2026-03-22" },
      "sessions": [
        { "name": "Practice", "shortName": "P", "dateTime": "2026-03-20T14:00:00Z", "type": "practice" },
        { "name": "Qualifying", "shortName": "Q", "dateTime": "2026-03-21T14:50:00Z", "type": "qualifying" },
        { "name": "Sprint", "shortName": "SPR", "dateTime": "2026-03-21T17:00:00Z", "type": "sprint" },
        { "name": "Race", "shortName": "R", "dateTime": "2026-03-22T16:00:00Z", "type": "race" }
      ],
      "status": "confirmed",
      "isFeatured": true
    },
    {
      "id": "motogp-2026-03",
      "seriesId": "motogp",
      "name": "Spanish Grand Prix",
      "country": "Spain",
      "circuit": "Circuito de Jerez",
      "dates": { "start": "2026-04-24", "end": "2026-04-26" },
      "sessions": [
        { "name": "Practice", "shortName": "P", "dateTime": "2026-04-24T09:45:00Z", "type": "practice" },
        { "name": "Qualifying", "shortName": "Q", "dateTime": "2026-04-25T09:50:00Z", "type": "qualifying" },
        { "name": "Sprint", "shortName": "SPR", "dateTime": "2026-04-25T13:00:00Z", "type": "sprint" },
        { "name": "Race", "shortName": "R", "dateTime": "2026-04-26T12:00:00Z", "type": "race" }
      ],
      "status": "confirmed"
    },
    {
      "id": "motogp-2026-04",
      "seriesId": "motogp",
      "name": "British Grand Prix",
      "country": "Great Britain",
      "circuit": "Silverstone Circuit",
      "dates": { "start": "2026-08-21", "end": "2026-08-23" },
      "sessions": [
        { "name": "Practice", "shortName": "P", "dateTime": "2026-08-21T09:45:00Z", "type": "practice" },
        { "name": "Qualifying", "shortName": "Q", "dateTime": "2026-08-22T09:50:00Z", "type": "qualifying" },
        { "name": "Sprint", "shortName": "SPR", "dateTime": "2026-08-22T13:00:00Z", "type": "sprint" },
        { "name": "Race", "shortName": "R", "dateTime": "2026-08-23T12:00:00Z", "type": "race" }
      ],
      "status": "confirmed"
    },
    {
      "id": "motogp-2026-05",
      "seriesId": "motogp",
      "name": "Valencia Grand Prix",
      "country": "Spain",
      "circuit": "Circuit Ricardo Tormo",
      "dates": { "start": "2026-11-13", "end": "2026-11-15" },
      "sessions": [
        { "name": "Practice", "shortName": "P", "dateTime": "2026-11-13T09:45:00Z", "type": "practice" },
        { "name": "Qualifying", "shortName": "Q", "dateTime": "2026-11-14T09:50:00Z", "type": "qualifying" },
        { "name": "Sprint", "shortName": "SPR", "dateTime": "2026-11-14T13:00:00Z", "type": "sprint" },
        { "name": "Race", "shortName": "R", "dateTime": "2026-11-15T13:00:00Z", "type": "race" }
      ],
      "status": "confirmed"
    }
  ]
}
```

---

## Task 7: Update Data Layer with Motorsport Calendar Functions

**Files:**
- Modify: `apps/web/src/data/index.ts`
- Create: `apps/web/src/data/motorsport-calendar/index.ts`

**Step 1: Create the motorsport calendar data module**

Create `apps/web/src/data/motorsport-calendar/index.ts`:

```typescript
// Motorsport Calendar Data Layer
// Aggregates calendar data from all series

import type {
  SeriesInfo,
  SeriesMetadata,
  MotorsportEvent,
  SeriesCalendar,
  MotorsportCategory
} from "./_schema";

// Cache for loaded data
const seriesMetadataCache: SeriesMetadata | null = null;
const calendarCache = new Map<string, SeriesCalendar>();

// Load series metadata
export async function getSeriesMetadata(): Promise<SeriesInfo[]> {
  if (seriesMetadataCache) {
    return seriesMetadataCache.series;
  }

  const data = await import("./_series.json");
  return (data.default as SeriesMetadata).series;
}

// Get single series info
export async function getSeriesInfo(seriesId: string): Promise<SeriesInfo | null> {
  const series = await getSeriesMetadata();
  return series.find(s => s.id === seriesId) || null;
}

// Get series by category
export async function getSeriesByCategory(category: MotorsportCategory): Promise<SeriesInfo[]> {
  const series = await getSeriesMetadata();
  return series.filter(s => s.category === category);
}

// Load calendar for a specific series
async function loadSeriesCalendar(seriesId: string, year: number): Promise<SeriesCalendar | null> {
  const cacheKey = `${seriesId}-${year}`;
  if (calendarCache.has(cacheKey)) {
    return calendarCache.get(cacheKey)!;
  }

  const series = await getSeriesInfo(seriesId);
  if (!series) return null;

  const categoryPath = series.category;

  try {
    const data = await import(`./${year}/${categoryPath}/${seriesId}.json`);
    const calendar = data.default as SeriesCalendar;
    calendarCache.set(cacheKey, calendar);
    return calendar;
  } catch {
    console.warn(`Calendar not found: ${seriesId} ${year}`);
    return null;
  }
}

// Get all events for a series
export async function getSeriesEvents(seriesId: string, year: number = 2026): Promise<MotorsportEvent[]> {
  const calendar = await loadSeriesCalendar(seriesId, year);
  return calendar?.events || [];
}

// Get all events across all series
export async function getAllMotorsportEvents(year: number = 2026): Promise<MotorsportEvent[]> {
  const series = await getSeriesMetadata();
  const allEvents: MotorsportEvent[] = [];

  for (const s of series) {
    const events = await getSeriesEvents(s.id, year);
    allEvents.push(...events);
  }

  // Sort by start date
  return allEvents.sort((a, b) =>
    new Date(a.dates.start).getTime() - new Date(b.dates.start).getTime()
  );
}

// Get events by category
export async function getEventsByCategory(category: MotorsportCategory, year: number = 2026): Promise<MotorsportEvent[]> {
  const series = await getSeriesByCategory(category);
  const events: MotorsportEvent[] = [];

  for (const s of series) {
    const seriesEvents = await getSeriesEvents(s.id, year);
    events.push(...seriesEvents);
  }

  return events.sort((a, b) =>
    new Date(a.dates.start).getTime() - new Date(b.dates.start).getTime()
  );
}

// Get events for a specific date
export async function getEventsByDate(date: string, year: number = 2026): Promise<MotorsportEvent[]> {
  const allEvents = await getAllMotorsportEvents(year);
  const targetDate = new Date(date);

  return allEvents.filter(event => {
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

  return allEvents.filter(event => {
    const eventStart = new Date(event.dates.start);
    const eventEnd = new Date(event.dates.end);
    return eventStart <= end && eventEnd >= start;
  });
}

// Get next upcoming event across all series
export async function getNextMotorsportEvent(year: number = 2026): Promise<MotorsportEvent | null> {
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
}

// Re-export types
export type {
  SeriesInfo,
  MotorsportEvent,
  MotorsportSession,
  SeriesCalendar,
  MotorsportCategory,
  SessionType
} from "./_schema";
```

**Step 2: Add F1-specific convenience functions to main data/index.ts**

Add to `apps/web/src/data/index.ts`:

```typescript
// ============================================================================
// MOTORSPORT CALENDAR (Unified multi-series calendar)
// ============================================================================

export {
  getSeriesMetadata,
  getSeriesInfo,
  getSeriesByCategory,
  getSeriesEvents,
  getAllMotorsportEvents,
  getEventsByCategory,
  getEventsByDate,
  getEventsInRange,
  getNextMotorsportEvent,
  clearMotorsportCalendarCache,
} from "./motorsport-calendar";

export type {
  SeriesInfo,
  MotorsportEvent,
  MotorsportSession,
  SeriesCalendar,
  MotorsportCategory,
  SessionType,
} from "./motorsport-calendar";

// F1-specific convenience function using unified calendar
export async function getF1Events(year: number = 2026): Promise<MotorsportEvent[]> {
  const { getSeriesEvents } = await import("./motorsport-calendar");
  return getSeriesEvents("f1", year);
}
```

---

## Task 8: Create Calendar Store

**Files:**
- Create: `apps/web/src/stores/calendarStore.ts`

**Step 1: Create Zustand store for calendar state**

```typescript
import { create } from "zustand";

interface CalendarState {
  // Selected date (null = show next event day)
  selectedDate: string | null;

  // Series filter (IDs of enabled series)
  enabledSeries: string[];

  // UI state
  expandedEvents: Set<string>;

  // Loading state
  isLoading: boolean;

  // Actions
  setSelectedDate: (date: string | null) => void;
  toggleSeries: (seriesId: string) => void;
  enableAllSeries: () => void;
  disableAllSeries: () => void;
  setEnabledSeries: (seriesIds: string[]) => void;
  toggleEventExpanded: (eventId: string) => void;
  setLoading: (loading: boolean) => void;
}

// Default: all series enabled
const DEFAULT_SERIES = [
  "f1", "f2", "f3", "fe", "wec", "imsa", "wrc", "motogp", "wsbk", "nascar", "indycar", "dtm"
];

// Load enabled series from localStorage
const loadEnabledSeries = (): string[] => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("motorsport-calendar-series");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_SERIES;
      }
    }
  }
  return DEFAULT_SERIES;
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Initial state
  selectedDate: null,
  enabledSeries: loadEnabledSeries(),
  expandedEvents: new Set(),
  isLoading: false,

  // Actions
  setSelectedDate: (date) => set({ selectedDate: date }),

  toggleSeries: (seriesId) => {
    const current = get().enabledSeries;
    const updated = current.includes(seriesId)
      ? current.filter(id => id !== seriesId)
      : [...current, seriesId];

    if (typeof window !== "undefined") {
      localStorage.setItem("motorsport-calendar-series", JSON.stringify(updated));
    }
    set({ enabledSeries: updated });
  },

  enableAllSeries: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("motorsport-calendar-series", JSON.stringify(DEFAULT_SERIES));
    }
    set({ enabledSeries: DEFAULT_SERIES });
  },

  disableAllSeries: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("motorsport-calendar-series", JSON.stringify([]));
    }
    set({ enabledSeries: [] });
  },

  setEnabledSeries: (seriesIds) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("motorsport-calendar-series", JSON.stringify(seriesIds));
    }
    set({ enabledSeries: seriesIds });
  },

  toggleEventExpanded: (eventId) => {
    const current = get().expandedEvents;
    const updated = new Set(current);
    if (updated.has(eventId)) {
      updated.delete(eventId);
    } else {
      updated.add(eventId);
    }
    set({ expandedEvents: updated });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
```

---

## Task 9: Create Calendar Page and Main Component

**Files:**
- Create: `apps/web/src/app/calendar/page.tsx`
- Create: `apps/web/src/components/calendar/MotorsportCalendar.tsx`
- Create: `apps/web/src/components/calendar/index.ts`

**Step 1: Create the calendar page**

Create `apps/web/src/app/calendar/page.tsx`:

```typescript
"use client";

import { Header } from "@/components/layout/Header";
import { MotorsportCalendar } from "@/components/calendar";

export default function CalendarPage() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-hidden">
        <MotorsportCalendar />
      </main>
    </div>
  );
}
```

**Step 2: Create the main calendar component**

Create `apps/web/src/components/calendar/MotorsportCalendar.tsx`:

```typescript
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
  type SeriesInfo
} from "@/data";
import { F1Loader } from "@/components/ui/f1-loader";

export function MotorsportCalendar() {
  const [events, setEvents] = useState<MotorsportEvent[]>([]);
  const [series, setSeries] = useState<SeriesInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { selectedDate, setSelectedDate, enabledSeries } = useCalendarStore();
  const { timezone } = useSeasonStore();

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [eventsData, seriesData] = await Promise.all([
          getAllMotorsportEvents(2026),
          getSeriesMetadata()
        ]);
        setEvents(eventsData);
        setSeries(seriesData);

        // Set default date to today or next event
        if (!selectedDate) {
          const today = new Date().toISOString().split('T')[0];
          const todayEvents = eventsData.filter(e =>
            e.dates.start <= today && e.dates.end >= today &&
            enabledSeries.includes(e.seriesId)
          );

          if (todayEvents.length > 0) {
            setSelectedDate(today);
          } else {
            // Find next event
            const nextEvent = eventsData.find(e =>
              e.dates.start >= today && enabledSeries.includes(e.seriesId)
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
  }, []);

  // Filter events by enabled series
  const filteredEvents = useMemo(() => {
    return events.filter(e => enabledSeries.includes(e.seriesId));
  }, [events, enabledSeries]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e =>
      e.dates.start <= selectedDate && e.dates.end >= selectedDate
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
    <div className="h-full flex">
      {/* Left side - Calendar (40%) */}
      <div className="w-[40%] border-r border-border p-4 flex flex-col gap-4 overflow-auto">
        <CalendarGrid
          events={filteredEvents}
          series={series}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          timezone={timezone}
        />
      </div>

      {/* Right side - Event List (60%) */}
      <div className="w-[60%] flex flex-col overflow-hidden">
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
```

**Step 3: Create index exports**

Create `apps/web/src/components/calendar/index.ts`:

```typescript
export { MotorsportCalendar } from "./MotorsportCalendar";
export { CalendarGrid } from "./CalendarGrid";
export { SeriesFilter } from "./SeriesFilter";
export { EventList } from "./EventList";
export { EventCard } from "./EventCard";
```

---

## Task 10: Create Calendar Grid Component

**Files:**
- Create: `apps/web/src/components/calendar/CalendarGrid.tsx`

**Step 1: Create the calendar grid component**

```typescript
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
  timezone,
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
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

    // Map of day -> events
    const eventsByDay = new Map<number, { seriesId: string; color: string }[]>();

    for (const event of events) {
      const startDate = new Date(event.dates.start);
      const endDate = new Date(event.dates.end);

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (currentDate.getFullYear() === year && currentDate.getMonth() === month) {
          const day = currentDate.getDate();
          const existing = eventsByDay.get(day) || [];
          // Avoid duplicate series on same day
          if (!existing.some(e => e.seriesId === event.seriesId)) {
            existing.push({
              seriesId: event.seriesId,
              color: seriesColors[event.seriesId] || "#666"
            });
          }
          eventsByDay.set(day, existing);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = isCurrentMonth ? today.getDate() : -1;

    return { year, month, daysInMonth, startDayOfWeek, eventsByDay, todayDate };
  }, [currentMonth, events, seriesColors]);

  const goToPrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleDayClick = (day: number) => {
    const { year, month } = currentMonth;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateSelect(dateStr);
  };

  // Check if a day is selected
  const isSelectedDay = (day: number) => {
    if (!selectedDate) return false;
    const { year, month } = currentMonth;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
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
                "aspect-square flex flex-col items-center justify-center rounded-md text-sm relative transition-colors",
                isToday && "ring-2 ring-primary",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && hasEvents && "bg-secondary/50 hover:bg-secondary",
                !isSelected && !hasEvents && "hover:bg-secondary/30"
              )}
            >
              <span>{day}</span>
              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 4).map((e, i) => (
                    <div
                      key={`${e.seriesId}-${i}`}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: e.color }}
                    />
                  ))}
                  {dayEvents.length > 4 && (
                    <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 4}</span>
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
```

---

## Task 11: Create Series Filter Component

**Files:**
- Create: `apps/web/src/components/calendar/SeriesFilter.tsx`

**Step 1: Create the series filter chips**

```typescript
"use client";

import { useCalendarStore } from "@/stores/calendarStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SeriesInfo } from "@/data";

interface SeriesFilterProps {
  series: SeriesInfo[];
}

export function SeriesFilter({ series }: SeriesFilterProps) {
  const { enabledSeries, toggleSeries, enableAllSeries, disableAllSeries } = useCalendarStore();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Filter by Series</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={enableAllSeries}>
            All
          </Button>
          <Button variant="ghost" size="sm" onClick={disableAllSeries}>
            None
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {series.map(s => {
          const isEnabled = enabledSeries.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggleSeries(s.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                isEnabled
                  ? "border-transparent text-white"
                  : "border-border text-muted-foreground bg-transparent hover:bg-secondary/50"
              )}
              style={{
                backgroundColor: isEnabled ? s.color : undefined,
              }}
            >
              {s.shortName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Task 12: Create Event List Component

**Files:**
- Create: `apps/web/src/components/calendar/EventList.tsx`

**Step 1: Create the event list with grouping**

```typescript
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

export function EventList({ selectedDate, groupedEvents, series, timezone }: EventListProps) {
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

      {seriesIds.map(seriesId => {
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
              {events.map(event => (
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
```

---

## Task 13: Create Event Card Component

**Files:**
- Create: `apps/web/src/components/calendar/EventCard.tsx`

**Step 1: Create the expandable event card**

```typescript
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatSessionTime } from "@/lib/calendarUtils";
import type { MotorsportEvent, SeriesInfo } from "@/data";

// Country flags
const COUNTRY_FLAGS: Record<string, string> = {
  Australia: "🇦🇺", China: "🇨🇳", Japan: "🇯🇵", Bahrain: "🇧🇭",
  "Saudi Arabia": "🇸🇦", USA: "🇺🇸", Canada: "🇨🇦", Monaco: "🇲🇨",
  Spain: "🇪🇸", Austria: "🇦🇹", "Great Britain": "🇬🇧", Belgium: "🇧🇪",
  Hungary: "🇭🇺", Netherlands: "🇳🇱", Italy: "🇮🇹", Azerbaijan: "🇦🇿",
  Singapore: "🇸🇬", Mexico: "🇲🇽", Brazil: "🇧🇷", Qatar: "🇶🇦",
  UAE: "🇦🇪", France: "🇫🇷", Portugal: "🇵🇹", Sweden: "🇸🇪",
  Kenya: "🇰🇪", Finland: "🇫🇮", Thailand: "🇹🇭", Germany: "🇩🇪",
};

interface EventCardProps {
  event: MotorsportEvent;
  seriesInfo: SeriesInfo | undefined;
  timezone: string;
}

export function EventCard({ event, seriesInfo, timezone }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const flag = COUNTRY_FLAGS[event.country] || "🏁";

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <CardContent className="p-3 flex items-center gap-3">
          {/* Expand Icon */}
          <div className="text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>

          {/* Flag */}
          <span className="text-xl">{flag}</span>

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{event.name}</span>
              {event.isFeatured && (
                <Badge variant="outline" className="text-xs">Featured</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.circuit}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {event.status === "provisional" && (
            <Badge variant="secondary" className="text-xs">TBC</Badge>
          )}
        </CardContent>
      </button>

      {/* Expanded Sessions */}
      {isExpanded && (
        <div className="border-t border-border bg-secondary/20 p-3">
          <div className="flex flex-col gap-2">
            {event.sessions.map((session, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      session.type === "race" && "bg-green-500/20 text-green-400 border-green-500/30",
                      session.type === "qualifying" && "bg-purple-500/20 text-purple-400 border-purple-500/30",
                      session.type === "sprint" && "bg-orange-500/20 text-orange-400 border-orange-500/30",
                      session.type === "practice" && "bg-blue-500/20 text-blue-400 border-blue-500/30",
                      session.type === "stage" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    )}
                  >
                    {session.shortName || session.name}
                  </Badge>
                  <span>{session.name}</span>
                  {session.duration && (
                    <span className="text-muted-foreground">({session.duration})</span>
                  )}
                </div>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatSessionTime(session.dateTime, timezone)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
```

---

## Task 14: Update Header Navigation

**Files:**
- Modify: `apps/web/src/components/layout/Header.tsx`

**Step 1: Add Calendar link to navigation**

Find the nav section and add Calendar link after Season:

```typescript
<Link
  href="/calendar"
  className={cn(
    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
    pathname === "/calendar"
      ? "bg-secondary text-foreground"
      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
  )}
>
  Calendar
</Link>
```

---

## Task 15: Migrate F1 Calendar Data to Unified Format

**Files:**
- Create: `apps/web/src/data/motorsport-calendar/2026/formula/f1.json`

**Step 1: Create script or manually convert existing F1 calendar**

The existing F1 calendar at `/data/calendar/2026.json` needs to be converted to the new unified format. This is the largest task - 24 races plus preseason events need conversion.

Key transformations:
- `round` -> used in `id` as `f1-2026-{round}`
- Add `seriesId: "f1"`
- Convert `sessions` object to array format
- Add `type` to each session
- Map session names: fp1 -> "Free Practice 1", qualifying -> "Qualifying", etc.

This task should be done programmatically or manually for accuracy.

---

## Task 16: Update Season CalendarTab to Use Unified Data

**Files:**
- Modify: `apps/web/src/components/season/CalendarTab.tsx`

**Step 1: Update imports and data fetching**

Replace:
```typescript
import { getRaces, getPreseason, type F1Event, type PreSeasonEvent } from "@/data";
```

With:
```typescript
import { getSeriesEvents, type MotorsportEvent } from "@/data";
```

**Step 2: Update data fetching in component**

The CalendarTab needs to:
1. Fetch F1 events using `getSeriesEvents("f1", 2026)`
2. Map the new `MotorsportEvent` type to the component's expected format
3. Handle the sessions array format instead of object format

This requires careful refactoring of the existing CalendarTab component to work with the new data structure while maintaining backward compatibility with the existing UI.

---

## Task 17: Test and Verify

**Step 1: Run development server**

Run: `cd apps/web && npm run dev`

**Step 2: Verify calendar page**

- Navigate to `/calendar`
- Check calendar grid shows events
- Click dates to filter events
- Toggle series filters
- Expand event cards

**Step 3: Verify season page still works**

- Navigate to `/season`
- Check calendar tab shows F1 events
- Verify all functionality preserved

**Step 4: Build check**

Run: `cd apps/web && npm run build`
Expected: Build succeeds without errors

---

## Summary

This implementation plan covers:

1. **Data Structure** (Tasks 1-6): Create unified motorsport calendar schema with modular JSON files per series
2. **Data Layer** (Task 7): Update data index with new functions for multi-series calendar access
3. **State Management** (Task 8): Create Zustand store for calendar filtering and UI state
4. **Components** (Tasks 9-13): Build calendar page with grid, filters, and event list
5. **Navigation** (Task 14): Add Calendar to main header navigation
6. **Migration** (Tasks 15-16): Convert F1 data and update Season panel
7. **Testing** (Task 17): Verify all functionality works
