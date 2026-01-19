# Modular F1 Data Architecture - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure F1 data (circuits, drivers, calendars) into a modular, maintainable architecture with API integration and manual override support.

**Architecture:** Hybrid data layer where live data comes from OpenF1 API (with caching), circuit visuals are manual JSON files (git-versioned), and surgical overrides allow corrections when API data is incorrect.

**Tech Stack:** Next.js 16, TypeScript, SWR for data fetching, Zod for schema validation

---

## Phase 1: Data Directory Structure & Types

### Task 1.1: Create Data Directory Structure

**Files:**
- Create: `src/data/circuits/.gitkeep`
- Create: `src/data/reference/.gitkeep`
- Create: `src/data/overrides/.gitkeep`
- Create: `src/data/fallback/.gitkeep`

**Step 1: Create directory structure**

```bash
cd /Users/ctg/Documents/GitHub/f1-dashboard/apps/web
mkdir -p src/data/circuits
mkdir -p src/data/reference
mkdir -p src/data/overrides
mkdir -p src/data/fallback
touch src/data/circuits/.gitkeep
touch src/data/reference/.gitkeep
touch src/data/overrides/.gitkeep
touch src/data/fallback/.gitkeep
```

**Step 2: Commit**

```bash
git add src/data/
git commit -m "chore: create modular data directory structure"
```

---

### Task 1.2: Create Circuit Data Schema

**Files:**
- Create: `src/data/circuits/_schema.ts`

**Step 1: Write TypeScript schema**

```typescript
// src/data/circuits/_schema.ts

export interface Position {
  x: number;
  y: number;
}

export interface StartFinishPosition extends Position {
  angle: number;
}

export interface Sector {
  id: 1 | 2 | 3;
  start: number;  // 0-1 position along track
  end: number;    // 0-1 position along track
  color: string;  // hex color
}

export interface Corner {
  number: number;
  name: string;
  position: number;  // 0-1 position along track
  type?: "hairpin" | "chicane" | "fast" | "medium" | "slow";
}

export interface DRSZone {
  detection: number;  // 0-1 position for detection point
  start: number;      // 0-1 position for activation
  end: number;        // 0-1 position for deactivation
}

export interface MarshallingSector {
  id: number;
  start: number;
  end: number;
}

export interface LapRecord {
  time: string;       // "1:12.909" format
  driver: string;
  year: number;
}

export interface CircuitSvg {
  viewBox: string;
  path: string;
  startFinish: StartFinishPosition;
}

export interface CircuitData {
  id: string;
  name: string;
  shortName: string;
  location: string;
  country: string;
  length: number;       // km
  turns: number;
  firstGP?: number;

  svg: CircuitSvg;

  sectors: [Sector, Sector, Sector];  // Always exactly 3
  corners?: Corner[];
  drsZones?: DRSZone[];
  marshallingSectors?: MarshallingSector[];

  records?: {
    lapRecord?: LapRecord;
  };
}

// Manifest for listing all available circuits
export interface CircuitManifest {
  ids: string[];
  lastUpdated: string;
}
```

**Step 2: Commit**

```bash
git add src/data/circuits/_schema.ts
git commit -m "feat(data): add circuit data TypeScript schema"
```

---

### Task 1.3: Create Reference Data Types

**Files:**
- Create: `src/data/types.ts`

**Step 1: Write shared types**

```typescript
// src/data/types.ts

// ============ TEAMS ============
export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  country: string;
  principal?: string;
  engine?: string;
}

// ============ DRIVERS ============
export interface DriverReference {
  code: string;           // "VER", "HAM", etc.
  number: number;
  firstName: string;
  lastName: string;
  teamId: string;
  country: string;
  dateOfBirth?: string;
}

// ============ CALENDAR ============
export interface SessionSchedule {
  fp1?: string;
  fp2?: string;
  fp3?: string;
  sprintQualifying?: string;
  sprint?: string;
  qualifying: string;
  race: string;
}

export interface CalendarEvent {
  round: number;
  name: string;
  officialName: string;
  country: string;
  circuit: string;
  circuitId: string;
  dates: {
    start: string;
    end: string;
  };
  sessions: SessionSchedule;
  isSprint: boolean;
  timezone: string;
}

// ============ OVERRIDES ============
export interface CalendarOverride {
  round?: number;
  sessions?: Partial<SessionSchedule>;
  cancelled?: boolean;
  note?: string;
}

export interface CalendarOverrides {
  [year: string]: {
    [dateKey: string]: CalendarOverride;
  };
}

// ============ API RESPONSES ============
export interface DataSourceInfo {
  source: "api" | "fallback" | "cache";
  timestamp: string;
  hasOverrides: boolean;
}
```

**Step 2: Commit**

```bash
git add src/data/types.ts
git commit -m "feat(data): add shared data types for teams, drivers, calendar"
```

---

## Phase 2: Extract Circuit Data to JSON

### Task 2.1: Create Circuit Manifest

**Files:**
- Create: `src/data/circuits/_manifest.json`

**Step 1: Write manifest file**

```json
{
  "ids": [
    "albert_park",
    "bahrain",
    "barcelona",
    "baku",
    "cota",
    "hungaroring",
    "imola",
    "interlagos",
    "jeddah",
    "las_vegas",
    "lusail",
    "marina_bay",
    "mexico",
    "miami",
    "monaco",
    "montreal",
    "monza",
    "red_bull_ring",
    "shanghai",
    "silverstone",
    "spa",
    "suzuka",
    "yas_marina",
    "zandvoort"
  ],
  "lastUpdated": "2026-01-20"
}
```

**Step 2: Commit**

```bash
git add src/data/circuits/_manifest.json
git commit -m "feat(data): add circuit manifest with all 2026 circuit IDs"
```

---

### Task 2.2: Create First Circuit JSON (Monaco - Template)

**Files:**
- Create: `src/data/circuits/monaco.json`

**Step 1: Write Monaco circuit file**

```json
{
  "id": "monaco",
  "name": "Circuit de Monaco",
  "shortName": "Monaco",
  "location": "Monte Carlo",
  "country": "Monaco",
  "length": 3.337,
  "turns": 19,
  "firstGP": 1950,

  "svg": {
    "viewBox": "0 0 1000 600",
    "path": "M 150,400 L 150,200 C 150,160 180,140 220,140 L 400,140 C 440,140 460,160 480,180 L 520,220 C 560,260 600,260 640,240 L 720,200 C 760,180 800,180 840,200 L 900,260 C 940,300 940,360 900,400 L 800,480 C 760,510 720,520 680,500 L 600,460 C 560,440 520,450 480,480 L 380,560 C 340,590 280,590 240,560 L 180,500 C 150,470 150,440 150,400 Z",
    "startFinish": { "x": 150, "y": 300, "angle": -90 }
  },

  "sectors": [
    { "id": 1, "start": 0, "end": 0.33, "color": "#ef4444" },
    { "id": 2, "start": 0.33, "end": 0.66, "color": "#eab308" },
    { "id": 3, "start": 0.66, "end": 1, "color": "#22d3ee" }
  ],

  "corners": [
    { "number": 1, "name": "Sainte Devote", "position": 0.05, "type": "medium" },
    { "number": 2, "name": "Beau Rivage", "position": 0.10 },
    { "number": 3, "name": "Massenet", "position": 0.15 },
    { "number": 4, "name": "Casino Square", "position": 0.18 },
    { "number": 5, "name": "Mirabeau Haute", "position": 0.22, "type": "slow" },
    { "number": 6, "name": "Grand Hotel Hairpin", "position": 0.28, "type": "hairpin" },
    { "number": 7, "name": "Mirabeau Bas", "position": 0.30 },
    { "number": 8, "name": "Portier", "position": 0.33, "type": "slow" },
    { "number": 10, "name": "Nouvelle Chicane", "position": 0.50, "type": "chicane" },
    { "number": 12, "name": "Tabac", "position": 0.58, "type": "fast" },
    { "number": 13, "name": "Louis Chiron", "position": 0.62 },
    { "number": 15, "name": "Piscine", "position": 0.70, "type": "chicane" },
    { "number": 17, "name": "La Rascasse", "position": 0.88, "type": "hairpin" },
    { "number": 18, "name": "Noghes", "position": 0.92 },
    { "number": 19, "name": "Anthony Noghes", "position": 0.95, "type": "slow" }
  ],

  "drsZones": [
    { "detection": 0.92, "start": 0.95, "end": 0.05 }
  ],

  "records": {
    "lapRecord": { "time": "1:12.909", "driver": "Lewis Hamilton", "year": 2021 }
  }
}
```

**Step 2: Commit**

```bash
git add src/data/circuits/monaco.json
git commit -m "feat(data): add Monaco circuit JSON (template for others)"
```

---

### Task 2.3: Create Script to Convert Existing Circuits

**Files:**
- Create: `scripts/convert-circuits.ts`

**Step 1: Write conversion script**

```typescript
// scripts/convert-circuits.ts
// Run with: npx tsx scripts/convert-circuits.ts

import { circuits } from "../src/lib/circuits";
import * as fs from "fs";
import * as path from "path";

const outputDir = path.join(__dirname, "../src/data/circuits");

// Map old keys to new IDs
const keyToId: Record<string, string> = {
  "yas marina circuit": "yas_marina",
  "monaco": "monaco",
  "silverstone circuit": "silverstone",
  "monza": "monza",
  "spa-francorchamps": "spa",
  "suzuka": "suzuka",
  "marina bay": "marina_bay",
  "cota": "cota",
  "sakhir": "bahrain",
  "jeddah": "jeddah",
  "albert park": "albert_park",
  "imola": "imola",
  "miami": "miami",
  "barcelona": "barcelona",
  "montreal": "montreal",
  "red bull ring": "red_bull_ring",
  "hungaroring": "hungaroring",
  "zandvoort": "zandvoort",
  "mexico": "mexico",
  "interlagos": "interlagos",
  "las vegas": "las_vegas",
  "lusail": "lusail",
};

function convertCircuit(key: string, data: any) {
  const id = keyToId[key] || key.replace(/\s+/g, "_").toLowerCase();

  return {
    id,
    name: data.name,
    shortName: data.shortName,
    location: data.country, // Will need manual update
    country: data.country,
    length: data.length,
    turns: data.turns,
    firstGP: data.firstGP,

    svg: {
      viewBox: data.viewBox,
      path: data.path.replace(/\s+/g, " ").trim(),
      startFinish: data.startFinish,
    },

    sectors: [
      { id: 1, start: 0, end: 0.33, color: "#ef4444" },
      { id: 2, start: 0.33, end: 0.66, color: "#eab308" },
      { id: 3, start: 0.66, end: 1, color: "#22d3ee" },
    ],

    corners: [], // To be filled manually

    drsZones: [], // To be filled manually

    records: data.lapRecord ? {
      lapRecord: data.lapRecord,
    } : undefined,
  };
}

// Convert all circuits
for (const [key, data] of Object.entries(circuits)) {
  const converted = convertCircuit(key, data);
  const filename = path.join(outputDir, `${converted.id}.json`);

  // Don't overwrite existing files
  if (fs.existsSync(filename)) {
    console.log(`Skipping ${converted.id} (already exists)`);
    continue;
  }

  fs.writeFileSync(filename, JSON.stringify(converted, null, 2));
  console.log(`Created ${converted.id}.json`);
}

console.log("Done!");
```

**Step 2: Run the script**

```bash
cd /Users/ctg/Documents/GitHub/f1-dashboard/apps/web
npx tsx scripts/convert-circuits.ts
```

**Step 3: Review generated files and commit**

```bash
git add src/data/circuits/*.json
git add scripts/convert-circuits.ts
git commit -m "feat(data): convert existing circuits to JSON format"
```

---

## Phase 3: Extract Reference Data

### Task 3.1: Create Teams Reference File

**Files:**
- Create: `src/data/reference/teams-2026.json`

**Step 1: Write teams file**

```json
{
  "year": 2026,
  "teams": [
    {
      "id": "red_bull",
      "name": "Red Bull Racing",
      "shortName": "Red Bull",
      "color": "#3671C6",
      "country": "Austria",
      "principal": "Christian Horner",
      "engine": "Honda"
    },
    {
      "id": "ferrari",
      "name": "Ferrari",
      "shortName": "Ferrari",
      "color": "#E8002D",
      "country": "Italy",
      "principal": "Frédéric Vasseur",
      "engine": "Ferrari"
    },
    {
      "id": "mercedes",
      "name": "Mercedes",
      "shortName": "Mercedes",
      "color": "#27F4D2",
      "country": "Germany",
      "principal": "Toto Wolff",
      "engine": "Mercedes"
    },
    {
      "id": "mclaren",
      "name": "McLaren",
      "shortName": "McLaren",
      "color": "#FF8000",
      "country": "United Kingdom",
      "principal": "Andrea Stella",
      "engine": "Mercedes"
    },
    {
      "id": "aston_martin",
      "name": "Aston Martin",
      "shortName": "Aston Martin",
      "color": "#229971",
      "country": "United Kingdom",
      "principal": "Mike Krack",
      "engine": "Honda"
    },
    {
      "id": "alpine",
      "name": "Alpine",
      "shortName": "Alpine",
      "color": "#00A1E8",
      "country": "France",
      "principal": "Oliver Oakes",
      "engine": "Renault"
    },
    {
      "id": "williams",
      "name": "Williams",
      "shortName": "Williams",
      "color": "#1868DB",
      "country": "United Kingdom",
      "principal": "James Vowles",
      "engine": "Mercedes"
    },
    {
      "id": "racing_bulls",
      "name": "Racing Bulls",
      "shortName": "RB",
      "color": "#6692FF",
      "country": "Italy",
      "principal": "Laurent Mekies",
      "engine": "Honda"
    },
    {
      "id": "audi",
      "name": "Audi",
      "shortName": "Audi",
      "color": "#F50537",
      "country": "Switzerland",
      "principal": "Mattia Binotto",
      "engine": "Audi"
    },
    {
      "id": "cadillac",
      "name": "Cadillac",
      "shortName": "Cadillac",
      "color": "#1C1C1C",
      "country": "USA",
      "principal": "TBC",
      "engine": "Ferrari"
    },
    {
      "id": "haas",
      "name": "Haas F1 Team",
      "shortName": "Haas",
      "color": "#B6BABD",
      "country": "USA",
      "principal": "Ayao Komatsu",
      "engine": "Ferrari"
    }
  ]
}
```

**Step 2: Commit**

```bash
git add src/data/reference/teams-2026.json
git commit -m "feat(data): add 2026 teams reference data"
```

---

### Task 3.2: Create Drivers Reference File

**Files:**
- Create: `src/data/reference/drivers-2026.json`

**Step 1: Write drivers file**

```json
{
  "year": 2026,
  "drivers": [
    { "code": "VER", "number": 3, "firstName": "Max", "lastName": "Verstappen", "teamId": "red_bull", "country": "NED" },
    { "code": "HAD", "number": 6, "firstName": "Isack", "lastName": "Hadjar", "teamId": "red_bull", "country": "FRA" },
    { "code": "LEC", "number": 16, "firstName": "Charles", "lastName": "Leclerc", "teamId": "ferrari", "country": "MON" },
    { "code": "HAM", "number": 44, "firstName": "Lewis", "lastName": "Hamilton", "teamId": "ferrari", "country": "GBR" },
    { "code": "NOR", "number": 1, "firstName": "Lando", "lastName": "Norris", "teamId": "mclaren", "country": "GBR" },
    { "code": "PIA", "number": 81, "firstName": "Oscar", "lastName": "Piastri", "teamId": "mclaren", "country": "AUS" },
    { "code": "RUS", "number": 63, "firstName": "George", "lastName": "Russell", "teamId": "mercedes", "country": "GBR" },
    { "code": "ANT", "number": 12, "firstName": "Kimi", "lastName": "Antonelli", "teamId": "mercedes", "country": "ITA" },
    { "code": "ALO", "number": 14, "firstName": "Fernando", "lastName": "Alonso", "teamId": "aston_martin", "country": "ESP" },
    { "code": "STR", "number": 18, "firstName": "Lance", "lastName": "Stroll", "teamId": "aston_martin", "country": "CAN" },
    { "code": "GAS", "number": 10, "firstName": "Pierre", "lastName": "Gasly", "teamId": "alpine", "country": "FRA" },
    { "code": "COL", "number": 43, "firstName": "Franco", "lastName": "Colapinto", "teamId": "alpine", "country": "ARG" },
    { "code": "ALB", "number": 23, "firstName": "Alex", "lastName": "Albon", "teamId": "williams", "country": "THA" },
    { "code": "SAI", "number": 55, "firstName": "Carlos", "lastName": "Sainz", "teamId": "williams", "country": "ESP" },
    { "code": "LAW", "number": 30, "firstName": "Liam", "lastName": "Lawson", "teamId": "racing_bulls", "country": "NZL" },
    { "code": "LIN", "number": 41, "firstName": "Arvid", "lastName": "Lindblad", "teamId": "racing_bulls", "country": "GBR" },
    { "code": "HUL", "number": 27, "firstName": "Nico", "lastName": "Hulkenberg", "teamId": "audi", "country": "GER" },
    { "code": "BOR", "number": 5, "firstName": "Gabriel", "lastName": "Bortoleto", "teamId": "audi", "country": "BRA" },
    { "code": "PER", "number": 11, "firstName": "Sergio", "lastName": "Perez", "teamId": "cadillac", "country": "MEX" },
    { "code": "BOT", "number": 77, "firstName": "Valtteri", "lastName": "Bottas", "teamId": "cadillac", "country": "FIN" },
    { "code": "OCO", "number": 31, "firstName": "Esteban", "lastName": "Ocon", "teamId": "haas", "country": "FRA" },
    { "code": "BEA", "number": 87, "firstName": "Oliver", "lastName": "Bearman", "teamId": "haas", "country": "GBR" }
  ]
}
```

**Step 2: Commit**

```bash
git add src/data/reference/drivers-2026.json
git commit -m "feat(data): add 2026 drivers reference data"
```

---

### Task 3.3: Create Calendar Overrides File (Empty Template)

**Files:**
- Create: `src/data/overrides/calendar-overrides.json`

**Step 1: Write empty overrides file**

```json
{
  "_comment": "Add overrides here when API data needs correction. Format: { '2026': { '2026-03-15': { 'sessions': { 'qualifying': '...' } } } }",
  "2026": {}
}
```

**Step 2: Commit**

```bash
git add src/data/overrides/calendar-overrides.json
git commit -m "feat(data): add calendar overrides template"
```

---

## Phase 4: Unified Data Access Layer

### Task 4.1: Create Data Access Module

**Files:**
- Create: `src/data/index.ts`

**Step 1: Write data access layer**

```typescript
// src/data/index.ts

import type { CircuitData, CircuitManifest } from "./circuits/_schema";
import type {
  Team,
  DriverReference,
  CalendarEvent,
  CalendarOverrides,
  DataSourceInfo,
} from "./types";

// ============================================================================
// CIRCUITS (Manual JSON files)
// ============================================================================

let circuitCache: Map<string, CircuitData> = new Map();

export async function getCircuit(id: string): Promise<CircuitData | null> {
  // Check cache first
  if (circuitCache.has(id)) {
    return circuitCache.get(id)!;
  }

  try {
    const data = await import(`./circuits/${id}.json`);
    const circuit = data.default as CircuitData;
    circuitCache.set(id, circuit);
    return circuit;
  } catch {
    console.warn(`Circuit not found: ${id}`);
    return null;
  }
}

export async function getAllCircuitIds(): Promise<string[]> {
  const manifest = await import("./circuits/_manifest.json");
  return (manifest.default as CircuitManifest).ids;
}

export async function getAllCircuits(): Promise<CircuitData[]> {
  const ids = await getAllCircuitIds();
  const circuits = await Promise.all(ids.map((id) => getCircuit(id)));
  return circuits.filter((c): c is CircuitData => c !== null);
}

export function clearCircuitCache(): void {
  circuitCache.clear();
}

// ============================================================================
// TEAMS (Manual JSON files)
// ============================================================================

export async function getTeams(year: number = 2026): Promise<Team[]> {
  try {
    const data = await import(`./reference/teams-${year}.json`);
    return data.default.teams as Team[];
  } catch {
    console.warn(`Teams not found for year: ${year}`);
    return [];
  }
}

export async function getTeam(
  teamId: string,
  year: number = 2026
): Promise<Team | null> {
  const teams = await getTeams(year);
  return teams.find((t) => t.id === teamId) || null;
}

export async function getTeamColor(teamId: string, year: number = 2026): Promise<string> {
  const team = await getTeam(teamId, year);
  return team?.color || "#808080";
}

// ============================================================================
// DRIVERS (Manual JSON files)
// ============================================================================

export async function getDrivers(year: number = 2026): Promise<DriverReference[]> {
  try {
    const data = await import(`./reference/drivers-${year}.json`);
    return data.default.drivers as DriverReference[];
  } catch {
    console.warn(`Drivers not found for year: ${year}`);
    return [];
  }
}

export async function getDriver(
  code: string,
  year: number = 2026
): Promise<DriverReference | null> {
  const drivers = await getDrivers(year);
  return drivers.find((d) => d.code === code) || null;
}

export async function getDriverByNumber(
  number: number,
  year: number = 2026
): Promise<DriverReference | null> {
  const drivers = await getDrivers(year);
  return drivers.find((d) => d.number === number) || null;
}

// ============================================================================
// CALENDAR OVERRIDES
// ============================================================================

export async function getCalendarOverrides(
  year: number = 2026
): Promise<Record<string, any>> {
  try {
    const data = await import("./overrides/calendar-overrides.json");
    const overrides = data.default as CalendarOverrides;
    return overrides[year.toString()] || {};
  } catch {
    return {};
  }
}

// ============================================================================
// HELPER: Merge data with overrides
// ============================================================================

export function mergeWithOverrides<T extends Record<string, any>>(
  baseData: T,
  overrides: Partial<T>
): T {
  if (!overrides || Object.keys(overrides).length === 0) {
    return baseData;
  }

  const merged = { ...baseData };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === undefined) continue;

    if (typeof value === "object" && !Array.isArray(value)) {
      merged[key as keyof T] = mergeWithOverrides(
        merged[key as keyof T] || {},
        value
      ) as T[keyof T];
    } else {
      merged[key as keyof T] = value as T[keyof T];
    }
  }

  return merged;
}

// ============================================================================
// DEPRECATED: Compatibility layer for old imports
// ============================================================================

/**
 * @deprecated Use getTeams() + lookup instead
 */
export async function getTeamColorByDriverCode(
  driverCode: string,
  year: number = 2026
): Promise<string> {
  const driver = await getDriver(driverCode, year);
  if (!driver) return "#808080";
  return getTeamColor(driver.teamId, year);
}
```

**Step 2: Commit**

```bash
git add src/data/index.ts
git commit -m "feat(data): add unified data access layer"
```

---

### Task 4.2: Create Session-Aware Polling Hook

**Files:**
- Create: `src/hooks/useSessionPolling.ts`

**Step 1: Write session-aware polling hook**

```typescript
// src/hooks/useSessionPolling.ts

import { useMemo } from "react";

export type SessionType =
  | "practice"
  | "qualifying"
  | "sprint"
  | "race"
  | "testing";

interface PollingConfig {
  timing: number;
  position: number;
  telemetry: number;
  raceControl: number;
  weather: number;
}

/**
 * Returns appropriate polling intervals based on session type and live status.
 *
 * During live sessions:
 * - Race/Sprint: Aggressive polling (1.5-2s) for position changes
 * - Qualifying: Medium polling (2-3s) for lap times
 * - Practice/Testing: Relaxed polling (4-5s) to save resources
 *
 * When not live: 60s intervals
 */
export function getPollingIntervals(
  sessionType: SessionType,
  isLive: boolean
): PollingConfig {
  if (!isLive) {
    return {
      timing: 60000,
      position: 60000,
      telemetry: 60000,
      raceControl: 60000,
      weather: 300000, // 5 min
    };
  }

  switch (sessionType) {
    case "race":
    case "sprint":
      return {
        timing: 1500,      // 1.5s - position changes critical
        position: 1500,    // 1.5s - track map updates
        telemetry: 1500,   // 1.5s - speed/throttle data
        raceControl: 2000, // 2s - flags/messages
        weather: 30000,    // 30s
      };

    case "qualifying":
      return {
        timing: 2000,      // 2s - lap times matter
        position: 2500,    // 2.5s - less critical
        telemetry: 2000,   // 2s - for comparison
        raceControl: 2000, // 2s - track limits etc
        weather: 30000,    // 30s
      };

    case "practice":
    case "testing":
      return {
        timing: 4000,      // 4s - less urgent
        position: 5000,    // 5s - save resources
        telemetry: 3000,   // 3s - still useful for analysis
        raceControl: 5000, // 5s
        weather: 60000,    // 1 min
      };

    default:
      return {
        timing: 3000,
        position: 4000,
        telemetry: 2000,
        raceControl: 5000,
        weather: 60000,
      };
  }
}

/**
 * Hook to get polling intervals for current session
 */
export function usePollingIntervals(
  sessionType: SessionType | undefined,
  isLive: boolean
): PollingConfig {
  return useMemo(
    () => getPollingIntervals(sessionType || "practice", isLive),
    [sessionType, isLive]
  );
}

/**
 * Derive session type from session name
 */
export function deriveSessionType(sessionName: string): SessionType {
  const name = sessionName.toLowerCase();

  if (name.includes("race")) return "race";
  if (name.includes("sprint") && !name.includes("qualifying")) return "sprint";
  if (name.includes("qualifying") || name.includes("quali")) return "qualifying";
  if (name.includes("test")) return "testing";
  return "practice";
}
```

**Step 2: Commit**

```bash
git add src/hooks/useSessionPolling.ts
git commit -m "feat(hooks): add session-aware polling intervals"
```

---

## Phase 5: API Routes with Caching

### Task 5.1: Create Calendar API Route

**Files:**
- Create: `src/app/api/f1/calendar/route.ts`

**Step 1: Write calendar API route**

```typescript
// src/app/api/f1/calendar/route.ts

import { NextResponse } from "next/server";
import { getCalendarOverrides, mergeWithOverrides } from "@/data";

// Revalidate every hour
export const revalidate = 3600;

const OPENF1_BASE = "https://api.openf1.org/v1";

interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_name: string;
  circuit_short_name: string;
  date_start: string;
  year: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || "2026", 10);

  try {
    // Fetch from OpenF1
    const response = await fetch(`${OPENF1_BASE}/meetings?year=${year}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.status}`);
    }

    const meetings: OpenF1Meeting[] = await response.json();

    // Load overrides
    const overrides = await getCalendarOverrides(year);

    // Transform and merge with overrides
    const calendar = meetings.map((meeting, index) => {
      const dateKey = meeting.date_start.split("T")[0];
      const eventOverride = overrides[dateKey] || {};

      const baseEvent = {
        round: index + 1,
        name: meeting.meeting_name,
        officialName: meeting.meeting_official_name,
        country: meeting.country_name,
        circuit: meeting.location,
        circuitId: meeting.circuit_short_name.toLowerCase().replace(/\s+/g, "_"),
        dates: {
          start: meeting.date_start,
          end: meeting.date_start, // OpenF1 doesn't provide end date
        },
        year: meeting.year,
      };

      return mergeWithOverrides(baseEvent, eventOverride);
    });

    return NextResponse.json({
      calendar,
      source: "api",
      timestamp: new Date().toISOString(),
      hasOverrides: Object.keys(overrides).length > 0,
    });
  } catch (error) {
    console.error("Calendar API error:", error);

    // Fallback to static data
    try {
      const fallback = await import("@/data/fallback/calendar-2026.json");
      return NextResponse.json({
        calendar: fallback.default,
        source: "fallback",
        timestamp: new Date().toISOString(),
        hasOverrides: false,
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch calendar data" },
        { status: 500 }
      );
    }
  }
}
```

**Step 2: Create fallback calendar file (extract from calendar2026.ts)**

This will be done as a separate sub-task after we verify the route works.

**Step 3: Commit**

```bash
git add src/app/api/f1/calendar/route.ts
git commit -m "feat(api): add calendar endpoint with OpenF1 integration"
```

---

### Task 5.2: Create Circuit API Route

**Files:**
- Create: `src/app/api/f1/circuits/route.ts`
- Create: `src/app/api/f1/circuits/[id]/route.ts`

**Step 1: Write circuits list route**

```typescript
// src/app/api/f1/circuits/route.ts

import { NextResponse } from "next/server";
import { getAllCircuits, getAllCircuitIds } from "@/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsOnly = searchParams.get("ids") === "true";

  try {
    if (idsOnly) {
      const ids = await getAllCircuitIds();
      return NextResponse.json({ ids });
    }

    const circuits = await getAllCircuits();
    return NextResponse.json({ circuits });
  } catch (error) {
    console.error("Circuits API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch circuits" },
      { status: 500 }
    );
  }
}
```

**Step 2: Write single circuit route**

```typescript
// src/app/api/f1/circuits/[id]/route.ts

import { NextResponse } from "next/server";
import { getCircuit } from "@/data";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const circuit = await getCircuit(id);

    if (!circuit) {
      return NextResponse.json(
        { error: `Circuit not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(circuit);
  } catch (error) {
    console.error(`Circuit API error for ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch circuit" },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/f1/circuits/
git commit -m "feat(api): add circuits endpoints"
```

---

## Phase 6: Update Components to Use New Data Layer

### Task 6.1: Update TrackMap3D to Use New Circuit Data

**Files:**
- Modify: `src/components/live/TrackMap3D.tsx`

**Step 1: Update circuit fetching logic**

Replace the existing `fetchCircuit` function to use the new data layer:

```typescript
// In TrackMap3D.tsx, update the fetchCircuit callback:

const fetchCircuit = useCallback(async (name: string) => {
  if (circuitCache.has(name)) {
    const cached = circuitCache.get(name)!;
    setCircuit({
      name: cached.name,
      location: cached.location,
      length: cached.length,
      svgPath: cached.svg.path,
      viewBox: cached.svg.viewBox,
      coordinates: [],
    });
    return;
  }

  try {
    // Use new circuit API
    const res = await fetch(`/api/f1/circuits/${name}`);
    if (!res.ok) return;

    const data = await res.json();

    const circuitData = {
      name: data.name,
      location: data.location,
      length: data.length,
      svgPath: data.svg.path,
      viewBox: data.svg.viewBox,
      coordinates: [],
    };

    circuitCache.set(name, data);
    setCircuit(circuitData);
  } catch (error) {
    console.error("Failed to fetch circuit:", error);
  }
}, []);
```

**Step 2: Commit**

```bash
git add src/components/live/TrackMap3D.tsx
git commit -m "refactor(TrackMap3D): use new circuit data API"
```

---

### Task 6.2: Update Constants to Use Data Layer

**Files:**
- Modify: `src/lib/constants.ts`

**Step 1: Update to re-export from data layer**

Keep the constants file for backward compatibility but have it delegate to the data layer for dynamic lookups:

```typescript
// Add at the end of constants.ts:

// ============================================================================
// DATA LAYER INTEGRATION
// ============================================================================

import { getTeamColorByDriverCode as _getTeamColorByDriverCode } from "@/data";

/**
 * Async version that uses the data layer.
 * For sync usage, use DRIVER_TEAMS + TEAM_COLORS directly.
 */
export const getTeamColorAsync = _getTeamColorByDriverCode;
```

**Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "refactor(constants): add data layer integration"
```

---

## Phase 7: Cleanup & Migration

### Task 7.1: Create Fallback Calendar Data

**Files:**
- Create: `src/data/fallback/calendar-2026.json`

**Step 1: Extract calendar from existing calendar2026.ts**

Create a script or manually extract the CALENDAR_2026 array to JSON format. The fallback ensures the dashboard works even when the API is down.

```bash
# Create the fallback file from existing data
cd /Users/ctg/Documents/GitHub/f1-dashboard/apps/web
npx tsx -e "
import { CALENDAR_2026 } from './src/lib/calendar2026';
import * as fs from 'fs';
fs.writeFileSync(
  './src/data/fallback/calendar-2026.json',
  JSON.stringify(CALENDAR_2026, null, 2)
);
console.log('Created fallback calendar');
"
```

**Step 2: Commit**

```bash
git add src/data/fallback/calendar-2026.json
git commit -m "feat(data): add calendar fallback data"
```

---

### Task 7.2: Update Existing Circuit API Route

**Files:**
- Modify: `src/app/api/circuit/route.ts` (if exists)

**Step 1: Update to use new data layer**

Check if there's an existing circuit route and update it to use the new data layer, or redirect to the new `/api/f1/circuits` endpoint.

**Step 2: Commit any changes**

---

### Task 7.3: Final Cleanup - Remove Old Data Files

**Note:** Only do this after verifying everything works!

**Files to eventually deprecate:**
- `src/lib/circuits.ts` → replaced by `src/data/circuits/*.json`
- `src/lib/calendar2026.ts` → replaced by API + `src/data/fallback/`

**Do NOT delete yet** - keep for reference until all components are migrated and tested.

---

## Testing Checklist

After implementation, verify:

- [ ] `GET /api/f1/circuits` returns list of circuits
- [ ] `GET /api/f1/circuits/monaco` returns Monaco circuit data
- [ ] `GET /api/f1/calendar?year=2026` returns calendar (from API or fallback)
- [ ] TrackMap3D loads and displays circuits correctly
- [ ] Polling intervals adjust based on session type
- [ ] Fallback data loads when OpenF1 is unreachable
- [ ] Calendar overrides merge correctly (test with a dummy override)

---

## Summary

| Phase | Tasks | Key Files |
|-------|-------|-----------|
| 1 | Directory structure, schemas | `src/data/circuits/_schema.ts`, `src/data/types.ts` |
| 2 | Circuit JSON extraction | `src/data/circuits/*.json` |
| 3 | Reference data (teams, drivers) | `src/data/reference/*.json` |
| 4 | Unified data access layer | `src/data/index.ts`, `src/hooks/useSessionPolling.ts` |
| 5 | API routes with caching | `src/app/api/f1/*/route.ts` |
| 6 | Component updates | `TrackMap3D.tsx`, `constants.ts` |
| 7 | Cleanup & fallbacks | `src/data/fallback/*.json` |
