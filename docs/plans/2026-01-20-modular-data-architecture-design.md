# Modular F1 Data Architecture

> Design document for making F1 data (circuits, drivers, calendars) modular and dynamically updatable.

## Overview

**Problem:** F1 data (circuits, drivers, team lineups, race calendars) is hardcoded in TypeScript files, requiring code changes for any update.

**Solution:** A hybrid architecture that:
- Fetches live data from external APIs (OpenF1, Ergast)
- Stores manual circuit visuals in JSON files (git-versioned)
- Supports surgical overrides when API data needs correction
- Clear separation of concerns between data sources

## Data Categories

| Category | Source | Examples | Update Frequency |
|----------|--------|----------|------------------|
| **API-driven** | OpenF1/Ergast | Calendar, session times, drivers, standings, results | Real-time to hourly |
| **Manual assets** | Git JSON files | Circuit SVGs, sector boundaries, corner names, DRS zones | As needed |
| **Reference data** | Git JSON files | Team colors, driver numbers, abbreviations | Once per season |
| **Overrides** | Git JSON files | API corrections (usually empty) | Rare edge cases |

## Directory Structure

```
src/data/
├── circuits/                    # Manual - circuit visuals
│   ├── monaco.json
│   ├── silverstone.json
│   ├── spa.json
│   ├── _manifest.json           # List of all circuit IDs
│   └── _schema.ts               # TypeScript types
├── reference/                   # Manual - stable season data
│   ├── teams-2026.json          # Team colors, names
│   └── drivers-2026.json        # Driver numbers, abbreviations
├── overrides/                   # Manual - API corrections
│   └── calendar-overrides.json  # Usually empty
├── fallback/                    # Backup when API fails
│   └── calendar-2026.json
├── types.ts                     # Shared TypeScript types
└── index.ts                     # Unified data access layer
```

## Circuit Data Schema

Each circuit has its own JSON file for clean diffs and easy editing:

```json
{
  "id": "monaco",
  "name": "Circuit de Monaco",
  "location": "Monte Carlo, Monaco",
  "country": "Monaco",
  "length": 3.337,
  "turns": 19,
  "firstGP": 1950,

  "svg": {
    "viewBox": "0 0 1000 600",
    "path": "M 150,400 L 150,200 C 150,160...",
    "startFinish": { "x": 150, "y": 300, "angle": -90 }
  },

  "sectors": [
    { "id": 1, "start": 0, "end": 0.33, "color": "#ef4444" },
    { "id": 2, "start": 0.33, "end": 0.66, "color": "#eab308" },
    { "id": 3, "start": 0.66, "end": 1, "color": "#22d3ee" }
  ],

  "corners": [
    { "number": 1, "name": "Sainte Devote", "position": 0.05 },
    { "number": 2, "name": "Beau Rivage", "position": 0.12 },
    { "number": 6, "name": "Grand Hotel Hairpin", "position": 0.28 }
  ],

  "drsZones": [
    { "detection": 0.85, "start": 0.88, "end": 0.02 }
  ],

  "marshallingSectors": [],

  "records": {
    "lapRecord": { "time": "1:12.909", "driver": "Lewis Hamilton", "year": 2021 }
  }
}
```

**Notes:**
- `position` values are 0-1 (percentage along track path)
- Works with existing `getPointAtLength()` visualization logic
- Add circuits by creating new JSON files + updating `_manifest.json`

## API Integration Layer

### Route Structure

```
src/app/api/f1/
├── calendar/route.ts        # Season calendar + session times
├── drivers/route.ts         # Current driver lineup
├── standings/route.ts       # Championship standings
└── sessions/[key]/route.ts  # Live session data
```

### Override Merging Pattern

```ts
// src/app/api/f1/calendar/route.ts
import { getCalendarOverrides } from '@/data';

export const revalidate = 3600; // Cache 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || new Date().getFullYear();

  try {
    // 1. Fetch from OpenF1
    const apiData = await fetch(
      `https://api.openf1.org/v1/meetings?year=${year}`
    ).then(r => r.json());

    // 2. Load overrides (usually empty)
    const overrides = await getCalendarOverrides(year);

    // 3. Merge: API base + surgical overrides
    const calendar = mergeWithOverrides(apiData, overrides);

    return Response.json(calendar);
  } catch (error) {
    // Fallback to static data if API fails
    const fallback = await import(`@/data/fallback/calendar-${year}.json`);
    return Response.json(fallback.default, {
      headers: { 'X-Data-Source': 'fallback' }
    });
  }
}
```

### Override File Format

Only specify fields you need to change:

```json
// src/data/overrides/calendar-overrides.json
{
  "2026": {
    "2026-03-15": {
      "round": 2,
      "sessions": {
        "qualifying": "2026-03-14T08:00:00Z"
      }
    }
  }
}
```

## Unified Data Access Layer

Single entry point abstracting data sources:

```ts
// src/data/index.ts
import type { CircuitData } from './circuits/_schema';
import type { CalendarEvent, Driver, Team } from './types';

// ============ CIRCUITS (Manual JSON) ============
export async function getCircuit(id: string): Promise<CircuitData | null> {
  try {
    const data = await import(`./circuits/${id}.json`);
    return data.default;
  } catch {
    return null;
  }
}

export async function getAllCircuits(): Promise<CircuitData[]> {
  const manifest = await import('./circuits/_manifest.json');
  return Promise.all(
    manifest.ids.map((id: string) => getCircuit(id))
  ).then(circuits => circuits.filter(Boolean) as CircuitData[]);
}

// ============ CALENDAR (API + Overrides) ============
export async function getCalendar(year: number): Promise<CalendarEvent[]> {
  const res = await fetch(`/api/f1/calendar?year=${year}`);
  return res.json();
}

// ============ REFERENCE DATA (Manual JSON) ============
export async function getTeams(year: number): Promise<Team[]> {
  const data = await import(`./reference/teams-${year}.json`);
  return data.default;
}

export async function getDrivers(year: number): Promise<Driver[]> {
  const data = await import(`./reference/drivers-${year}.json`);
  return data.default;
}

// ============ OVERRIDES ============
export async function getCalendarOverrides(year: number) {
  try {
    const data = await import('./overrides/calendar-overrides.json');
    return data.default[year] || {};
  } catch {
    return {};
  }
}
```

## Caching & Refresh Strategy

| Data Type | Cache Duration | Refresh Trigger |
|-----------|----------------|-----------------|
| Circuit visuals | Forever (static) | Git push / redeploy |
| Reference (teams, drivers) | Forever (static) | Git push / redeploy |
| Calendar & session times | 1 hour | ISR auto-refresh |
| Live session data | 1.5-5 seconds | Client polling (session-aware) |
| Overrides | Forever (static) | Git push / redeploy |

### Session-Aware Polling

Different session types need different polling intervals:

```ts
// src/hooks/useLiveSession.ts
type SessionType = 'practice' | 'qualifying' | 'sprint' | 'race' | 'testing';

function getPollingInterval(type: SessionType, isLive: boolean): number {
  if (!isLive) return 60000; // 1 min when not live

  switch (type) {
    case 'race':
    case 'sprint':
      return 1500;    // 1.5s - position changes critical
    case 'qualifying':
      return 2000;    // 2s - lap times matter
    case 'practice':
    case 'testing':
      return 5000;    // 5s - less urgent, save resources
    default:
      return 3000;
  }
}

export function useLiveSession(sessionKey: number, sessionType: SessionType) {
  const [isLive, setIsLive] = useState(false);

  return useSWR(
    sessionKey ? `/api/live/timing?session=${sessionKey}` : null,
    fetcher,
    {
      refreshInterval: getPollingInterval(sessionType, isLive),
      dedupingInterval: 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: (data) => setIsLive(data?.status === 'live'),
    }
  );
}
```

### Testing Considerations

- Test coverage should include scenarios for each session type
- Mock different polling rates in integration tests
- Add debug panel to show current polling rate during development

## Migration Path

### Phase 1: Extract Circuit Data
1. Create `src/data/circuits/` directory structure
2. Convert `circuits.ts` to individual JSON files
3. Create `_schema.ts` with TypeScript types
4. Update `TrackMap3D` to use new data layer

### Phase 2: Extract Reference Data
1. Create `src/data/reference/` for teams and drivers
2. Convert hardcoded team colors/driver info to JSON
3. Add year-based file naming (`teams-2026.json`)

### Phase 3: API Integration
1. Create `/api/f1/` routes for calendar, drivers, standings
2. Implement OpenF1 fetching with ISR caching
3. Add override merging logic
4. Create fallback files from current static data

### Phase 4: Unified Access Layer
1. Create `src/data/index.ts` entry point
2. Update all components to use unified layer
3. Remove old `calendar2026.ts` and `circuits.ts`
4. Add session-aware polling hooks

## Benefits

- **Easy updates**: Edit JSON files, push to git
- **API-first**: Live data from OpenF1 without manual updates
- **Resilient**: Fallbacks when API fails
- **Type-safe**: TypeScript schemas for all data
- **Testable**: Mock data sources independently
- **Scalable**: Add new circuits/seasons by adding files
