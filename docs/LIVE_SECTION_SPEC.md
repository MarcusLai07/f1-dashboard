# Live Section - Data Display Specification

> **Status**: Active Development
> **Last Updated**: January 2026

This document specifies the data columns and layout for each component in the Live section, organized by session type.

---

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header: Session Selector                                                    │
├──────────────────┬─────────────────────────────────┬────────────────────────┤
│                  │                                 │                        │
│   LEFT PANEL     │       MAIN AREA                │    RIGHT PANEL         │
│                  │                                 │                        │
│   Timing Tower   │       Track Map                │    Session Info        │
│   (scrollable)   │       (3D/2D view)             │    Track Status        │
│                  │                                 │    Weather             │
│                  │                                 │    Race Control        │
│                  │                                 │                        │
├──────────────────┴─────────────────────────────────┴────────────────────────┤
│                                                                              │
│   BOTTOM PANEL: Telemetry Graphs (expandable/collapsible)                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Timing Tower (Left Panel)

The timing tower adapts based on session type.

### Practice Sessions (FP1, FP2, FP3)

| Column | Data | Width | Notes |
|--------|------|-------|-------|
| POS | Position (1-20) | 24px | Current classification |
| Driver | Team color + Code | 60px | e.g., `[■] VER` |
| Gap | Gap to P1 | 70px | `+0.123` or `—` for P1 |
| Best | Best lap time | 85px | `1:23.456` with color coding |
| Last | Last lap time | 85px | `1:24.567` with color coding |
| S1 | Sector 1 | 50px | Time or mini-sector bars |
| S2 | Sector 2 | 50px | Time or mini-sector bars |
| S3 | Sector 3 | 50px | Time or mini-sector bars |
| Tyre | Compound + Age | 45px | `S 12` (Soft, 12 laps) |
| Laps | Total laps | 35px | Lap count |

**Color Coding:**
- Purple: Session best
- Green: Personal best
- Yellow: Slower than personal best
- White: No comparison available

**Mini-Sector Display (Practice/Quali only):**
```
┌─┬─┬─┬─┬─┬─┬─┬─┐  ← 8-10 colored bars per sector
└─┴─┴─┴─┴─┴─┴─┴─┘
```

### Qualifying Sessions (Q, SQ)

| Column | Data | Width | Notes |
|--------|------|-------|-------|
| POS | Position | 24px | Current Q1/Q2/Q3 position |
| Driver | Team color + Code | 60px | |
| Gap | Gap to P1 | 70px | |
| Q1 | Q1 time | 85px | Best Q1 lap |
| Q2 | Q2 time | 85px | Best Q2 lap (or `—`) |
| Q3 | Q3 time | 85px | Best Q3 lap (or `—`) |
| S1 | Sector 1 | 50px | Current lap sectors |
| S2 | Sector 2 | 50px | |
| S3 | Sector 3 | 50px | |
| Tyre | Compound | 35px | Current tyre |
| Status | Knockout | 40px | ❌ if eliminated |

**Qualifying-Specific Features:**
- Elimination zone indicator (positions 16-20 in Q1, 11-15 in Q2)
- Live delta to provisional pole during hot lap
- Time remaining indicator in header

### Race Sessions (R, S)

| Column | Data | Width | Notes |
|--------|------|-------|-------|
| POS | Position | 24px | Race position |
| Driver | Team color + Code | 60px | |
| Interval | Gap to car ahead | 70px | `+1.234` or `DRS` if <1s |
| Gap | Gap to leader | 70px | `+12.345` or `LAP` if lapped |
| Last | Last lap time | 85px | |
| Best | Best race lap | 85px | |
| Tyre | Compound + Age | 45px | |
| Stops | Pit stop count | 30px | |
| Status | Driver status | 50px | Racing/Pit/Out |

**Race-Specific Features:**
- DRS indicator when interval < 1 second
- Pit window indicator for strategy
- Position change arrows (↑↓) from grid
- Fastest lap indicator (purple dot)

---

## 2. Track Map (Main Area)

### Data Displayed

| Element | Source | Update Rate |
|---------|--------|-------------|
| Car positions | `/position` | 4 seconds |
| Car numbers/codes | `/drivers` | Static per session |
| Team colors | `/drivers` | Static per session |
| Yellow sectors | `/race_control` | Real-time |
| Safety car line | `/race_control` | Real-time |
| DRS zones | Static circuit data | Static |
| Sector boundaries | Static circuit data | Static |

### Visual Elements

```
Track Map Features:
├── Car dots (team colored)
│   ├── Driver code label
│   ├── Position number
│   └── Speed indicator (optional trail)
├── Track outline (SVG path)
├── Sector markers (S1, S2, S3)
├── DRS zones (highlighted segments)
├── Yellow flag zones (animated)
└── Start/Finish line
```

### Interaction

- Click driver: Select for telemetry
- Hover driver: Show tooltip (name, gap, tyre, speed)
- Zoom: Mouse wheel or pinch
- Rotate: Drag (3D mode)
- Reset view button

---

## 3. Session Info Panel (Right Panel - Top)

### Session Header

| Field | Example |
|-------|---------|
| Session Type | `QUALIFYING` |
| Grand Prix | `Australian Grand Prix` |
| Circuit | `Albert Park` |
| Local Time | `14:00 AEDT` |
| Session Time | `00:45:23` remaining |
| Lap | `Lap 23 / 58` (race only) |

---

## 4. Track Status (Right Panel)

### Status Indicators

| Status | Display | Color |
|--------|---------|-------|
| All Clear | `● GREEN` | Green |
| Yellow Flag | `● YELLOW - Sector X` | Yellow |
| Double Yellow | `●● DOUBLE YELLOW` | Orange |
| Safety Car | `🚗 SAFETY CAR` | Orange |
| Virtual SC | `VSC DEPLOYED` | Orange |
| Red Flag | `● RED FLAG` | Red |
| Chequered | `🏁 CHEQUERED` | White |

---

## 5. Weather Panel (Right Panel)

| Metric | Unit | Icon |
|--------|------|------|
| Air Temp | °C | 🌡️ |
| Track Temp | °C | 🛣️ |
| Humidity | % | 💧 |
| Wind Speed | km/h | 💨 |
| Wind Direction | Compass | ➤ |
| Rain | Yes/No | 🌧️ |
| Pressure | mbar | — |

### Weather Display

```
┌────────────────────┐
│ WEATHER            │
├────────────────────┤
│ 🌡️ Air    25°C     │
│ 🛣️ Track  42°C     │
│ 💧 Humid  45%      │
│ 💨 Wind   12 km/h ↗│
│ ☀️ Dry            │
└────────────────────┘
```

---

## 6. Race Control Messages (Right Panel)

### Message Categories

| Category | Icon | Examples |
|----------|------|----------|
| Flag | 🚩 | Yellow flag, Red flag |
| Safety Car | 🚗 | SC deployed, SC ending |
| DRS | 📶 | DRS enabled, DRS disabled |
| Incident | ⚠️ | Incident involving CAR X |
| Penalty | ⏱️ | 5 second time penalty |
| Investigation | 🔍 | Under investigation |
| Track Limits | 🚧 | Track limits warning |
| Other | 📢 | General messages |

### Message Display

```
┌────────────────────────────────┐
│ RACE CONTROL                   │
├────────────────────────────────┤
│ 14:32:15  🚩 YELLOW FLAG S2    │
│ 14:31:45  📶 DRS ENABLED       │
│ 14:30:12  ⚠️ VER - TRACK LIMITS│
│ 14:28:33  🚗 SC ENDING         │
│ ...                            │
└────────────────────────────────┘
```

---

## 7. Telemetry Panel (Bottom)

### Displayed When Driver(s) Selected

| Graph | Y-Axis | X-Axis | Notes |
|-------|--------|--------|-------|
| Speed | 0-350 km/h | Distance/Time | Primary telemetry |
| Throttle | 0-100% | Distance/Time | Overlaid or separate |
| Brake | 0-100% | Distance/Time | Overlaid or separate |
| Gear | 1-8 | Distance/Time | Stepped display |
| RPM | 0-15000 | Distance/Time | Optional |
| DRS | On/Off | Distance/Time | Zones highlighted |

### Telemetry Layout Options

**Single Driver Mode:**
```
┌──────────────────────────────────────────────────────────────┐
│ VER - Max Verstappen (Red Bull)                    [Expand]  │
├──────────────────────────────────────────────────────────────┤
│ Speed ═══════════════════════════════════════════════════════│
│ 300 ─┼─────────╱╲─────────────────╱╲──────────────────────── │
│ 200 ─┼────────╱  ╲───────────────╱  ╲─────────────────────── │
│ 100 ─┼───────╱    ╲─────────────╱    ╲────────────────────── │
│   0 ─┼──────╱      ╲───────────╱      ╲───────────────────── │
├──────────────────────────────────────────────────────────────┤
│ Throttle/Brake ══════════════════════════════════════════════│
│ 100% ─┼█████████░░░░░░░░░░░░░░█████████░░░░░░░░░░░░░░░░░░░░░ │
│       └──────────────────────────────────────────────────────│
└──────────────────────────────────────────────────────────────┘
```

**Comparison Mode (2 Drivers):**
```
┌──────────────────────────────────────────────────────────────┐
│ VER vs HAM - Lap Comparison                       [Overlay]  │
├──────────────────────────────────────────────────────────────┤
│ Speed ═══════════════════════════════════════════════════════│
│ 300 ─┼─────────╱╲─────────────────╱╲──────────────────────── │
│      │        (blue=VER, cyan=HAM)                           │
│ Delta ═══════════════════════════════════════════════════════│
│+0.2s ─┼───────────────────────────────────────────────────── │
│   0  ─┼────────────╲╱─────────────╲╱────────────────────────  │
│-0.2s ─┼───────────────────────────────────────────────────── │
└──────────────────────────────────────────────────────────────┘
```

### Live Telemetry Values (Numeric Display)

| Value | Format | Update Rate |
|-------|--------|-------------|
| Speed | `312 km/h` | 2 seconds |
| Gear | `7` | 2 seconds |
| Throttle | `100%` | 2 seconds |
| Brake | `0%` | 2 seconds |
| RPM | `12,450` | 2 seconds |
| DRS | `OPEN` / `CLOSED` | 2 seconds |

---

## 8. Data Update Intervals

| Data Type | Polling Interval | Priority |
|-----------|------------------|----------|
| Timing/Intervals | 3 seconds | Critical |
| Telemetry | 2 seconds | High |
| Positions | 4 seconds | High |
| Race Control | 5 seconds | High |
| Weather | 60 seconds | Low |
| Session Info | 30 seconds | Low |

---

## 9. Session Type Differences Summary

| Feature | FP1/2/3 | Qualifying | Sprint Quali | Sprint | Race |
|---------|---------|------------|--------------|--------|------|
| Mini-sectors | ✅ | ✅ | ✅ | ❌ | ❌ |
| Q1/Q2/Q3 columns | ❌ | ✅ | ✅ | ❌ | ❌ |
| Lap counter | ❌ | ❌ | ❌ | ✅ | ✅ |
| Pit stops column | ❌ | ❌ | ❌ | ✅ | ✅ |
| Interval column | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gap to leader | ✅ (time) | ✅ (time) | ✅ (time) | ✅ (time/laps) | ✅ (time/laps) |
| Elimination zone | ❌ | ✅ | ✅ | ❌ | ❌ |
| DRS indicator | ❌ | ❌ | ❌ | ✅ | ✅ |
| Position changes | ❌ | ❌ | ❌ | ✅ | ✅ |
| Fastest lap badge | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 10. Responsive Behavior

### Desktop (>1280px)
- Full 3-column layout
- All timing columns visible
- Expanded telemetry graphs

### Tablet (768px - 1280px)
- Collapsible side panels
- Abbreviated timing columns (hide S1/S2/S3, show only current sector)
- Stacked telemetry graphs

### Mobile (<768px)
- Single column, tabbed interface
- Tabs: Timing | Map | Info | Telemetry
- Simplified timing: POS, Driver, Gap, Tyre only
- Swipe between drivers in telemetry

---

## 11. Color Palette Reference

| Purpose | Color | Hex |
|---------|-------|-----|
| Session Best (Purple) | Purple | `#A855F7` |
| Personal Best (Green) | Green | `#22C55E` |
| Slower (Yellow) | Yellow | `#EAB308` |
| Neutral (White) | White | `#FFFFFF` |
| Red Flag | Red | `#EF4444` |
| Safety Car | Orange | `#F97316` |
| DRS Zone | Cyan | `#06B6D4` |
| Background | Dark | `#1A1A1A` |
| Panel Background | Darker | `#0D0D0D` |
| Border | Gray | `#333333` |

### Tyre Compound Colors

| Compound | Color | Hex |
|----------|-------|-----|
| Soft | Red | `#EF4444` |
| Medium | Yellow | `#EAB308` |
| Hard | White | `#FFFFFF` |
| Intermediate | Green | `#22C55E` |
| Wet | Blue | `#3B82F6` |

---

## 12. API Endpoints Used

| Component | Endpoints |
|-----------|-----------|
| Timing Tower | `/laps`, `/intervals`, `/stints`, `/drivers` |
| Track Map | `/position`, `/drivers`, `/race_control` |
| Weather | `/weather` |
| Race Control | `/race_control` |
| Telemetry | `/car_data` |
| Session Info | `/sessions`, `/meetings` |
| Pit Stops | `/pit` |

---

*This specification should be updated as features are implemented and refined.*
