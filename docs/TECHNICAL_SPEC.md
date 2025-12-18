# F1 Dashboard - Technical Specification

> A real-time Formula 1 dashboard with live race monitoring and historical analysis capabilities.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Application Structure](#4-application-structure)
5. [Page Specifications](#5-page-specifications)
6. [Component Library](#6-component-library)
7. [Data Flow](#7-data-flow)
8. [API Design](#8-api-design)
9. [Animation System](#9-animation-system)
10. [Styling & Theme](#10-styling--theme)
11. [PWA Configuration](#11-pwa-configuration)
12. [Development Phases](#12-development-phases)

---

## 1. Project Overview

### 1.1 Purpose

A Progressive Web App for F1 enthusiasts to:
- Monitor live race sessions with real-time telemetry
- Analyze historical race data and compare driver performances

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| Live Timing Tower | Real-time positions, gaps, lap times, tyre info |
| Track Map | Visual car positions on circuit layout |
| Live Telemetry | Speed, throttle, brake, gear for selected drivers |
| Race Control Feed | Flags, safety car, incidents, weather |
| Driver Comparison | Side-by-side telemetry and lap analysis |
| Race Replay | Step through historical races |
| Session Explorer | Browse and analyze any past session |

### 1.3 Target Platforms

- **Primary**: Web browsers (Chrome, Firefox, Safari, Edge)
- **Secondary**: Installable PWA on macOS, Windows, iOS, Android

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT                                  │
│                   Next.js 14 App (PWA)                          │
│         ┌─────────────────────────────────────────┐             │
│         │  Pages                                   │             │
│         │  ├── / (Live Dashboard)                 │             │
│         │  └── /analysis (Historical Analysis)    │             │
│         └─────────────────────────────────────────┘             │
│         ┌─────────────────────────────────────────┐             │
│         │  State Management (Zustand)             │             │
│         │  ├── liveStore (real-time data)         │             │
│         │  └── analysisStore (historical data)    │             │
│         └─────────────────────────────────────────┘             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│   NEXT.JS API ROUTES  │       │   PYTHON BACKEND      │
│   (Live Data Proxy)   │       │   (FastAPI)           │
│                       │       │                       │
│ /api/live/sessions    │       │ /api/history/sessions │
│ /api/live/timing      │       │ /api/history/laps     │
│ /api/live/telemetry   │       │ /api/history/telemetry│
│ /api/live/position    │       │ /api/history/compare  │
│ /api/live/race-control│       │ /api/history/replay   │
│ /api/live/weather     │       │                       │
└───────────┬───────────┘       └───────────┬───────────┘
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│     OPENF1 API        │       │     FAST-F1 CACHE     │
│  api.openf1.org/v1    │       │   Local file cache    │
└───────────────────────┘       └───────────────────────┘
```

### 2.2 Data Flow Patterns

#### Live Data (Polling)
```
Client (1-2s interval) → Next.js API Route → OpenF1 API → Response → Client State → UI Update
```

#### Historical Data (On-Demand)
```
Client Request → Python API → Fast-F1 (cached) → Process → Response → Client State → UI Update
```

### 2.3 Service Responsibilities

| Service | Responsibility |
|---------|---------------|
| Next.js Frontend | UI rendering, state management, animations |
| Next.js API Routes | Proxy OpenF1, caching, rate limiting |
| Python Backend | Fast-F1 integration, data processing, analysis computations |

---

## 3. Tech Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework, PWA support |
| TypeScript | 5.x | Type safety |
| React | 18.x | UI library |
| Zustand | 4.x | State management |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | latest | Component primitives |
| anime.js | 3.x | Animations |
| Recharts | 2.x | Telemetry charts |
| next-pwa | 5.x | PWA configuration |

### 3.2 Backend (Python)

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.100+ | API framework |
| Fast-F1 | latest | F1 data library |
| Uvicorn | 0.23+ | ASGI server |
| Pydantic | 2.x | Data validation |

### 3.3 Development Tools

| Tool | Purpose |
|------|---------|
| pnpm | Package manager (frontend) |
| uv / pip | Package manager (backend) |
| ESLint | Linting |
| Prettier | Code formatting |
| Ruff | Python linting |

---

## 4. Application Structure

### 4.1 Monorepo Structure

```
f1-dashboard/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # Live dashboard
│   │   │   ├── analysis/
│   │   │   │   └── page.tsx    # Historical analysis
│   │   │   └── api/
│   │   │       └── live/
│   │   │           ├── sessions/route.ts
│   │   │           ├── timing/route.ts
│   │   │           ├── telemetry/route.ts
│   │   │           ├── position/route.ts
│   │   │           ├── race-control/route.ts
│   │   │           └── weather/route.ts
│   │   ├── components/
│   │   │   ├── ui/             # shadcn components
│   │   │   ├── live/           # Live dashboard components
│   │   │   │   ├── TimingTower.tsx
│   │   │   │   ├── TrackMap.tsx
│   │   │   │   ├── TelemetryPanel.tsx
│   │   │   │   ├── RaceControl.tsx
│   │   │   │   └── WeatherWidget.tsx
│   │   │   ├── analysis/       # Analysis page components
│   │   │   │   ├── DriverComparison.tsx
│   │   │   │   ├── RaceReplay.tsx
│   │   │   │   ├── SessionExplorer.tsx
│   │   │   │   └── TelemetryChart.tsx
│   │   │   └── shared/         # Shared components
│   │   │       ├── DriverTag.tsx
│   │   │       ├── TyreIndicator.tsx
│   │   │       ├── GapDisplay.tsx
│   │   │       └── FlagIndicator.tsx
│   │   ├── lib/
│   │   │   ├── api.ts          # API client functions
│   │   │   ├── animations.ts   # anime.js utilities
│   │   │   ├── constants.ts    # F1 constants (teams, colors)
│   │   │   └── utils.ts        # Helper functions
│   │   ├── stores/
│   │   │   ├── liveStore.ts    # Live data state
│   │   │   └── analysisStore.ts# Analysis data state
│   │   ├── hooks/
│   │   │   ├── useLiveData.ts  # Live data polling hook
│   │   │   ├── useAnimation.ts # Animation hook
│   │   │   └── useAnalysis.ts  # Analysis data hook
│   │   ├── types/
│   │   │   └── f1.ts           # TypeScript types
│   │   ├── public/
│   │   │   ├── tracks/         # Track SVGs
│   │   │   └── icons/          # App icons
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                    # Python backend
│       ├── main.py             # FastAPI app
│       ├── routers/
│       │   ├── sessions.py
│       │   ├── laps.py
│       │   ├── telemetry.py
│       │   └── compare.py
│       ├── services/
│       │   ├── fastf1_service.py
│       │   └── cache_service.py
│       ├── models/
│       │   └── schemas.py
│       ├── requirements.txt
│       └── pyproject.toml
│
├── docs/
│   ├── DATA_SOURCES.md         # API reference
│   └── TECHNICAL_SPEC.md       # This document
│
├── package.json                # Workspace root
└── README.md
```

---

## 5. Page Specifications

### 5.1 Live Dashboard (`/`)

The main page for real-time race monitoring.

#### Layout (Fixed Grid)

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: Session Info | Race Control Messages (scrolling)        │
├─────────────────┬───────────────────────────┬───────────────────┤
│                 │                           │                   │
│  TIMING TOWER   │       TRACK MAP           │   RACE INFO       │
│                 │                           │   • Weather       │
│  • Position     │   • Car positions         │   • Track status  │
│  • Driver       │   • Sector colors         │   • Lap counter   │
│  • Gap          │   • DRS zones             │   • Session time  │
│  • Last lap     │                           │                   │
│  • Tyre         │                           │                   │
│  • Pit stops    │                           │                   │
│                 │                           │                   │
├─────────────────┴───────────────────────────┴───────────────────┤
│                       TELEMETRY PANEL                           │
│  [Driver 1 Select ▼]              [Driver 2 Select ▼]           │
│  ┌─────────────────────────┐      ┌─────────────────────────┐   │
│  │ Speed: 325 km/h         │      │ Speed: 318 km/h         │   │
│  │ Throttle: ████████░░ 80%│      │ Throttle: ██████░░░░ 60%│   │
│  │ Brake:    ░░░░░░░░░░  0%│      │ Brake:    ████░░░░░░ 40%│   │
│  │ Gear: 8  DRS: ON        │      │ Gear: 7  DRS: OFF       │   │
│  └─────────────────────────┘      └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Grid Specifications

| Section | Grid Area | Width | Height |
|---------|-----------|-------|--------|
| Header | Full width | 100% | 48px |
| Timing Tower | Left | 320px | calc(100vh - 48px - 200px) |
| Track Map | Center | flex-1 | calc(100vh - 48px - 200px) |
| Race Info | Right | 240px | calc(100vh - 48px - 200px) |
| Telemetry Panel | Bottom | 100% | 200px |

### 5.2 Analysis Page (`/analysis`)

Historical data analysis with three main views.

#### Layout (Tab-Based)

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: Session Selector [Year ▼] [Grand Prix ▼] [Session ▼]   │
├─────────────────────────────────────────────────────────────────┤
│ TABS: [ Driver Comparison ] [ Race Replay ] [ Session Explorer ]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      TAB CONTENT AREA                           │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Tab: Driver Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│ [Driver 1 ▼] vs [Driver 2 ▼]    Lap: [Fastest ▼] or [#15 ▼]    │
├────────────────────────────────┬────────────────────────────────┤
│         TELEMETRY CHART        │         LAP BREAKDOWN          │
│                                │                                │
│  Speed over distance           │  Sector 1: 28.123 | 28.456    │
│  ───────────────────           │  Sector 2: 35.789 | 35.234    │
│  Throttle comparison           │  Sector 3: 24.567 | 24.890    │
│  ───────────────────           │  ─────────────────────────    │
│  Brake comparison              │  Total:  1:28.479 | 1:28.580  │
│  ───────────────────           │                                │
│                                │  Delta: -0.101s               │
├────────────────────────────────┴────────────────────────────────┤
│                        TRACK MAP                                │
│           (showing speed/throttle/brake at each point)          │
└─────────────────────────────────────────────────────────────────┘
```

#### Tab: Race Replay

```
┌─────────────────────────────────────────────────────────────────┐
│ ◀◀  ◀  [▶ PLAY]  ▶  ▶▶     Lap 23/57     Speed: [1x ▼]         │
├─────────────────┬───────────────────────────────────────────────┤
│                 │                                               │
│  TIMING TOWER   │              TRACK MAP                        │
│  (at this lap)  │         (positions at this lap)               │
│                 │                                               │
│                 │                                               │
├─────────────────┴───────────────────────────────────────────────┤
│                    POSITION CHART (all laps)                    │
│    Shows position changes over race, current lap highlighted    │
└─────────────────────────────────────────────────────────────────┘
```

#### Tab: Session Explorer

```
┌─────────────────────────────────────────────────────────────────┐
│ Filter: [All Drivers ▼] [All Compounds ▼] [Accurate Only ☑]    │
├─────────────────────────────────────────────────────────────────┤
│                        LAP TIME SCATTER                         │
│     (all laps plotted, x=lap number, y=lap time, color=driver) │
├─────────────────────────────────────────────────────────────────┤
│                        LAPS TABLE                               │
│ Driver | Lap | Time     | S1     | S2     | S3     | Tyre | Gap │
│ VER    | 15  | 1:28.123 | 28.123 | 35.789 | 24.211 | SOFT | -   │
│ HAM    | 15  | 1:28.456 | 28.456 | 35.234 | 24.766 | MED  |+0.3 │
│ ...    |     |          |        |        |        |      |     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Component Library

### 6.1 Shared Components

#### DriverTag
Displays driver abbreviation with team color.

```tsx
interface DriverTagProps {
  code: string;           // "VER", "HAM", etc.
  teamColor: string;      // Hex color
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;   // Show car number
}
```

#### TyreIndicator
Shows tyre compound with visual indicator.

```tsx
interface TyreIndicatorProps {
  compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
  age?: number;           // Laps on tyre
  size?: 'sm' | 'md' | 'lg';
}
```

#### GapDisplay
Animated gap time display.

```tsx
interface GapDisplayProps {
  gap: number | null;     // Gap in seconds, null for leader
  intervalToAhead?: number;
  format?: 'toLeader' | 'interval';
  animate?: boolean;      // Animate on change
}
```

#### FlagIndicator
Race status flag display.

```tsx
interface FlagIndicatorProps {
  flag: 'GREEN' | 'YELLOW' | 'RED' | 'SAFETY_CAR' | 'VSC' | 'CHEQUERED';
  animate?: boolean;
}
```

### 6.2 Live Components

#### TimingTower
Full timing tower with all driver rows.

```tsx
interface TimingTowerProps {
  drivers: DriverTiming[];
  selectedDrivers?: string[];  // Highlighted drivers
  onDriverSelect?: (code: string) => void;
}

interface DriverTiming {
  position: number;
  driverCode: string;
  driverNumber: number;
  teamColor: string;
  gap: number | null;
  interval: number | null;
  lastLap: number | null;
  bestLap: number | null;
  tyre: TyreInfo;
  pitStops: number;
  status: 'RACING' | 'PIT' | 'OUT' | 'FINISHED';
}
```

#### TrackMap
SVG-based track visualization with car positions.

```tsx
interface TrackMapProps {
  trackId: string;              // "monaco", "silverstone", etc.
  positions: CarPosition[];
  selectedDrivers?: string[];
  showSectorColors?: boolean;
  showDRSZones?: boolean;
}

interface CarPosition {
  driverCode: string;
  x: number;
  y: number;
  teamColor: string;
}
```

#### TelemetryPanel
Real-time telemetry display for selected drivers.

```tsx
interface TelemetryPanelProps {
  drivers: DriverTelemetry[];   // Max 2 drivers
}

interface DriverTelemetry {
  driverCode: string;
  teamColor: string;
  speed: number;
  throttle: number;         // 0-100
  brake: number;            // 0-100
  gear: number;             // 0-8
  drs: boolean;
  rpm: number;
}
```

#### RaceControl
Live race control messages feed.

```tsx
interface RaceControlProps {
  messages: RaceControlMessage[];
  maxVisible?: number;
}

interface RaceControlMessage {
  timestamp: string;
  category: 'FLAG' | 'SAFETY_CAR' | 'INCIDENT' | 'DRS' | 'OTHER';
  message: string;
  flag?: string;
}
```

### 6.3 Analysis Components

#### TelemetryChart
Recharts-based telemetry comparison.

```tsx
interface TelemetryChartProps {
  data: TelemetryDataPoint[];
  drivers: string[];            // Driver codes to show
  metric: 'speed' | 'throttle' | 'brake' | 'gear';
  xAxis: 'distance' | 'time';
}
```

#### LapTable
Sortable, filterable lap data table.

```tsx
interface LapTableProps {
  laps: LapData[];
  sortBy?: keyof LapData;
  sortOrder?: 'asc' | 'desc';
  filters?: LapFilters;
  onLapSelect?: (lap: LapData) => void;
}
```

---

## 7. Data Flow

### 7.1 Live Data Store (Zustand)

```typescript
interface LiveStore {
  // Connection state
  isConnected: boolean;
  currentSession: Session | null;

  // Timing data
  timing: DriverTiming[];
  raceControl: RaceControlMessage[];

  // Telemetry
  selectedDrivers: string[];
  telemetry: Record<string, DriverTelemetry>;

  // Track
  positions: CarPosition[];

  // Weather
  weather: Weather;

  // Actions
  setSession: (session: Session) => void;
  updateTiming: (timing: DriverTiming[]) => void;
  updateTelemetry: (telemetry: Record<string, DriverTelemetry>) => void;
  updatePositions: (positions: CarPosition[]) => void;
  addRaceControlMessage: (message: RaceControlMessage) => void;
  selectDriver: (code: string) => void;
  deselectDriver: (code: string) => void;
}
```

### 7.2 Analysis Data Store (Zustand)

```typescript
interface AnalysisStore {
  // Session selection
  selectedYear: number;
  selectedGrandPrix: string;
  selectedSession: string;

  // Loaded data
  sessionData: SessionData | null;
  laps: LapData[];

  // Comparison
  comparisonDrivers: [string, string] | null;
  comparisonLaps: [LapData, LapData] | null;

  // Replay
  replayLap: number;
  isPlaying: boolean;
  playbackSpeed: number;

  // Actions
  loadSession: (year: number, gp: string, session: string) => Promise<void>;
  setComparisonDrivers: (drivers: [string, string]) => void;
  setReplayLap: (lap: number) => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
}
```

### 7.3 Polling Strategy

```typescript
// Live data polling intervals
const POLLING_INTERVALS = {
  timing: 1000,       // 1 second - position/gap updates
  telemetry: 500,     // 0.5 seconds - speed/throttle/brake
  position: 1000,     // 1 second - track map positions
  raceControl: 2000,  // 2 seconds - flags/messages
  weather: 30000,     // 30 seconds - weather rarely changes
};
```

---

## 8. API Design

### 8.1 Next.js API Routes (Live Data)

#### GET `/api/live/sessions`
Returns current/upcoming sessions.

```typescript
// Response
interface SessionsResponse {
  current: Session | null;
  upcoming: Session[];
}

interface Session {
  sessionKey: number;
  sessionName: string;      // "Race", "Qualifying", etc.
  meetingName: string;      // "Monaco Grand Prix"
  startTime: string;        // ISO timestamp
  endTime: string | null;
  status: 'upcoming' | 'live' | 'finished';
}
```

#### GET `/api/live/timing?sessionKey={key}`
Returns current timing data for all drivers.

```typescript
// Response
interface TimingResponse {
  timestamp: string;
  drivers: DriverTiming[];
}
```

#### GET `/api/live/telemetry?sessionKey={key}&drivers={codes}`
Returns telemetry for specified drivers.

```typescript
// Request
// drivers: comma-separated driver codes, e.g., "VER,HAM"

// Response
interface TelemetryResponse {
  timestamp: string;
  telemetry: Record<string, DriverTelemetry>;
}
```

#### GET `/api/live/position?sessionKey={key}`
Returns car positions for track map.

```typescript
// Response
interface PositionResponse {
  timestamp: string;
  positions: CarPosition[];
}
```

#### GET `/api/live/race-control?sessionKey={key}&since={timestamp}`
Returns race control messages.

```typescript
// Response
interface RaceControlResponse {
  messages: RaceControlMessage[];
}
```

#### GET `/api/live/weather?sessionKey={key}`
Returns current weather.

```typescript
// Response
interface WeatherResponse {
  airTemp: number;
  trackTemp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainfall: boolean;
}
```

### 8.2 Python API Routes (Historical Data)

#### GET `/api/history/sessions?year={year}`
Returns all sessions for a year.

#### GET `/api/history/laps?year={year}&gp={gp}&session={session}`
Returns all laps for a session.

#### GET `/api/history/telemetry?year={year}&gp={gp}&session={session}&driver={code}&lap={number}`
Returns telemetry for a specific lap.

#### GET `/api/history/compare?year={year}&gp={gp}&session={session}&driver1={code}&driver2={code}&lap={fastest|number}`
Returns comparison data for two drivers.

#### GET `/api/history/replay?year={year}&gp={gp}`
Returns lap-by-lap position data for replay.

---

## 9. Animation System

### 9.1 Animation Library Setup

```typescript
// lib/animations.ts
import anime from 'animejs';

// Reusable animation configs
export const animations = {
  // Number change animation (gaps, lap times)
  numberChange: (target: HTMLElement, newValue: number) => {
    return anime({
      targets: target,
      innerHTML: [target.innerHTML, newValue],
      round: 1000,  // 3 decimal places
      duration: 300,
      easing: 'easeOutQuad',
    });
  },

  // Position change in timing tower
  positionChange: (target: HTMLElement, fromY: number, toY: number) => {
    return anime({
      targets: target,
      translateY: [fromY, toY],
      duration: 500,
      easing: 'easeOutCubic',
    });
  },

  // Car movement on track map
  carMove: (target: SVGElement, path: { x: number; y: number }[]) => {
    return anime({
      targets: target,
      translateX: path.map(p => p.x),
      translateY: path.map(p => p.y),
      duration: 1000,
      easing: 'linear',
    });
  },

  // Telemetry bar update
  barUpdate: (target: HTMLElement, percentage: number) => {
    return anime({
      targets: target,
      width: `${percentage}%`,
      duration: 200,
      easing: 'easeOutQuad',
    });
  },

  // Pulse animation for important changes
  pulse: (target: HTMLElement, color: string) => {
    return anime({
      targets: target,
      backgroundColor: [color, 'transparent'],
      duration: 500,
      easing: 'easeOutQuad',
    });
  },

  // Fade in for new elements
  fadeIn: (target: HTMLElement) => {
    return anime({
      targets: target,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 300,
      easing: 'easeOutQuad',
    });
  },
};
```

### 9.2 Animation Triggers

| Event | Animation | Duration |
|-------|-----------|----------|
| Gap change | Number morph | 300ms |
| Position overtake | Row slide up/down | 500ms |
| Fastest lap | Purple pulse + glow | 500ms |
| Pit stop | Row highlight yellow | 1000ms |
| Car on track | Smooth path follow | 1000ms |
| Telemetry update | Bar width change | 200ms |
| New race control msg | Slide in from right | 300ms |
| DRS activation | Green glow on indicator | 200ms |

### 9.3 Custom Hook

```typescript
// hooks/useAnimation.ts
import { useRef, useCallback } from 'react';
import anime from 'animejs';

export function useAnimation() {
  const animationRef = useRef<anime.AnimeInstance | null>(null);

  const animate = useCallback((config: anime.AnimeParams) => {
    // Cancel previous animation if running
    if (animationRef.current) {
      animationRef.current.pause();
    }
    animationRef.current = anime(config);
    return animationRef.current;
  }, []);

  const cancel = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.pause();
      animationRef.current = null;
    }
  }, []);

  return { animate, cancel };
}
```

---

## 10. Styling & Theme

### 10.1 Color Palette

```typescript
// lib/constants.ts
export const colors = {
  // Background
  bg: {
    primary: '#0a0a0b',      // Main background
    secondary: '#141416',    // Card background
    tertiary: '#1c1c1f',     // Hover states
  },

  // Text
  text: {
    primary: '#ffffff',
    secondary: '#a1a1aa',
    muted: '#71717a',
  },

  // Accent
  accent: {
    red: '#e10600',          // F1 red
    purple: '#9333ea',       // Fastest lap
    green: '#22c55e',        // Positive/DRS
    yellow: '#eab308',       // Warning/flags
    blue: '#3b82f6',         // Info
  },

  // Tyre compounds
  tyre: {
    soft: '#ff0000',
    medium: '#ffd700',
    hard: '#ffffff',
    intermediate: '#43b02a',
    wet: '#0067ad',
  },

  // Flags
  flag: {
    green: '#00ff00',
    yellow: '#ffff00',
    red: '#ff0000',
    blue: '#0000ff',
  },
};

// Team colors (2024-2025)
export const teamColors: Record<string, string> = {
  'Red Bull Racing': '#3671C6',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'McLaren': '#FF8000',
  'Aston Martin': '#229971',
  'Alpine': '#FF87BC',
  'Williams': '#64C4FF',
  'RB': '#6692FF',
  'Kick Sauber': '#52E252',
  'Haas F1 Team': '#B6BABD',
};
```

### 10.2 Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        foreground: '#ffffff',
        card: '#141416',
        'card-hover': '#1c1c1f',
        muted: '#71717a',
        'f1-red': '#e10600',
        'fastest-purple': '#9333ea',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      animation: {
        'pulse-fast': 'pulse 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 10.3 Typography Scale

| Element | Size | Weight | Use |
|---------|------|--------|-----|
| H1 | 24px | 700 | Page titles |
| H2 | 20px | 600 | Section headers |
| H3 | 16px | 600 | Card headers |
| Body | 14px | 400 | General text |
| Small | 12px | 400 | Labels, captions |
| Mono | 14px | 500 | Times, numbers |

---

## 11. PWA Configuration

### 11.1 next.config.js

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // Next.js config
});
```

### 11.2 Manifest

```json
{
  "name": "F1 Dashboard",
  "short_name": "F1 Dash",
  "description": "Real-time F1 timing and analysis",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0b",
  "theme_color": "#e10600",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 12. Development Phases

### Phase 1: Foundation
- [ ] Project setup (Next.js, TypeScript, Tailwind)
- [ ] shadcn/ui installation and configuration
- [ ] Basic layout structure (header, grid)
- [ ] Theme and color system
- [ ] TypeScript types for F1 data

### Phase 2: Live Dashboard - Data Layer
- [ ] Next.js API routes for OpenF1
- [ ] Zustand store for live data
- [ ] Polling hooks with error handling
- [ ] Data transformation utilities

### Phase 3: Live Dashboard - UI Components
- [ ] TimingTower component
- [ ] TrackMap component (with SVG tracks)
- [ ] TelemetryPanel component
- [ ] RaceControl component
- [ ] WeatherWidget component

### Phase 4: Animations
- [ ] anime.js integration
- [ ] Position change animations
- [ ] Number morphing for gaps/times
- [ ] Telemetry bar animations
- [ ] Track map car movement

### Phase 5: Python Backend
- [ ] FastAPI setup
- [ ] Fast-F1 integration
- [ ] Historical data endpoints
- [ ] Caching layer

### Phase 6: Analysis Page
- [ ] Session selector UI
- [ ] Driver comparison view
- [ ] Telemetry charts (Recharts)
- [ ] Race replay feature
- [ ] Session explorer with table

### Phase 7: PWA & Polish
- [ ] PWA configuration
- [ ] Offline support for historical data
- [ ] Performance optimization
- [ ] Error boundaries
- [ ] Loading states

### Phase 8: Testing & Deployment
- [ ] Component tests
- [ ] E2E tests (Playwright)
- [ ] Docker configuration
- [ ] CI/CD pipeline
- [ ] Production deployment

---

## Appendix A: Track SVG Sources

Track layouts can be obtained from:
- Ergast API track data
- F1 official track maps (traced)
- OpenStreetMap data

Store as optimized SVG in `/public/tracks/[circuit-id].svg`

## Appendix B: Useful Commands

```bash
# Start frontend development
cd apps/web && pnpm dev

# Start Python backend
cd apps/api && uvicorn main:app --reload --port 8000

# Build for production
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check
```

---

*Document Version: 1.0*
*Last Updated: 2024-12-18*
