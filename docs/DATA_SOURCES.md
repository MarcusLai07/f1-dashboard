# F1 Dashboard - Data Sources Reference

This document contains API references and usage patterns for acquiring F1 telemetry data.

---

## Table of Contents

1. [OpenF1 API](#1-openf1-api)
2. [Fast-F1 Python Library](#2-fast-f1-python-library)
3. [Data Type Reference](#3-data-type-reference)
4. [Architecture Patterns](#4-architecture-patterns)

---

## 1. OpenF1 API

**Base URL:** `https://api.openf1.org/v1`

**Authentication:** None required (public API)

**Response Formats:** JSON, CSV

### Endpoints

#### Sessions
```
GET /sessions
GET /sessions?session_key={key}
GET /sessions?year={year}
GET /sessions?country_name={country}
```

#### Laps
```
GET /laps?session_key={session_key}
GET /laps?session_key={key}&driver_number={number}
GET /laps?session_key={key}&driver_number={number}&lap_number={lap}
```

#### Drivers
```
GET /drivers?session_key={session_key}
GET /drivers?driver_number={number}
```

#### Car Data (Telemetry)
```
GET /car_data?session_key={session_key}&driver_number={number}
```
Returns: speed, throttle, brake, gear, DRS status

#### Position Data
```
GET /position?session_key={session_key}&driver_number={number}
```
Returns: x, y, z coordinates on track

#### Race Control Messages
```
GET /race_control?session_key={session_key}
```
Returns: flags, safety car, incidents

#### Intervals (Gaps)
```
GET /intervals?session_key={session_key}
```
Returns: gap to leader, gap to car ahead

#### Pit Stops
```
GET /pit?session_key={session_key}
```

#### Stints (Tyre Info)
```
GET /stints?session_key={session_key}&driver_number={number}
```
Returns: compound, tyre age, stint number

#### Weather
```
GET /weather?session_key={session_key}
```
Returns: air temp, track temp, humidity, wind speed, rainfall

### Example Requests

```javascript
// Get all drivers in a session
fetch('https://api.openf1.org/v1/drivers?session_key=9161')

// Get specific driver's lap data
fetch('https://api.openf1.org/v1/laps?session_key=9161&driver_number=1')

// Get real-time car telemetry
fetch('https://api.openf1.org/v1/car_data?session_key=9161&driver_number=44')

// Get race control messages (flags, safety car)
fetch('https://api.openf1.org/v1/race_control?session_key=9161')
```

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `session_key` | Unique session identifier | `9161` |
| `driver_number` | Car number | `1`, `44`, `63` |
| `lap_number` | Specific lap | `1`, `15`, `57` |
| `year` | Season year | `2024`, `2025` |
| `country_name` | Grand Prix location | `Monaco`, `Silverstone` |
| `meeting_key` | Race weekend identifier | `1234` |

### Rate Limits

No documented rate limits, but implement reasonable caching (recommended: 1-5 second intervals for live data).

---

## 2. Fast-F1 Python Library

**Installation:** `pip install fastf1`

**Python Version:** >= 3.9

### Core Setup

```python
import fastf1

# IMPORTANT: Enable caching to avoid repeated API calls
fastf1.Cache.enable_cache('/path/to/cache')
```

### Loading Sessions

```python
# Get event schedule
schedule = fastf1.get_event_schedule(2024)

# Load specific session
# Session types: 'FP1', 'FP2', 'FP3', 'Q', 'S' (Sprint), 'R' (Race)
session = fastf1.get_session(2024, 'Monaco', 'R')

# Load session data (specify what you need)
session.load(
    telemetry=True,   # Car telemetry data
    laps=True,        # Lap timing data
    weather=True,     # Weather data
    messages=True     # Race control messages
)
```

### Accessing Lap Data

```python
# All laps in session
all_laps = session.laps

# Filter by driver (use 3-letter code)
driver_laps = session.laps.pick_driver('VER')
driver_laps = session.laps.pick_drivers(['VER', 'HAM'])

# Get fastest lap
fastest = session.laps.pick_fastest()
driver_fastest = session.laps.pick_driver('VER').pick_fastest()

# Lap data columns available:
# Time, Driver, DriverNumber, LapTime, LapNumber, Stint, PitOutTime,
# PitInTime, Sector1Time, Sector2Time, Sector3Time, SpeedI1, SpeedI2,
# SpeedFL, SpeedST, Compound, TyreLife, FreshTyre, Team, IsAccurate
```

### Accessing Telemetry

```python
# Get telemetry for a specific lap
lap = session.laps.pick_driver('VER').pick_fastest()
telemetry = lap.get_telemetry()

# Or get car data specifically
car_data = lap.get_car_data()

# Add distance column for track position
car_data = car_data.add_distance()

# Telemetry columns:
# Time, RPM, Speed, nGear, Throttle, Brake, DRS, Source, Distance
```

### Accessing Weather

```python
weather = session.weather_data

# Columns: Time, AirTemp, Humidity, Pressure, Rainfall,
#          TrackTemp, WindDirection, WindSpeed
```

### Accessing Results

```python
# Session results
results = session.results

# Columns: DriverNumber, BroadcastName, Abbreviation, TeamName,
#          TeamColor, FirstName, LastName, Position, GridPosition,
#          Q1, Q2, Q3, Time, Status, Points
```

### Driver Information

```python
# Get driver info from session
driver_info = session.get_driver('VER')

# Properties: name, team, number, abbreviation, team_color
```

### Useful Patterns

```python
# Compare two drivers' telemetry
ver_lap = session.laps.pick_driver('VER').pick_fastest()
ham_lap = session.laps.pick_driver('HAM').pick_fastest()

ver_tel = ver_lap.get_car_data().add_distance()
ham_tel = ham_lap.get_car_data().add_distance()

# Get all personal best laps
personal_bests = session.laps.pick_quicklaps()

# Filter accurate laps only (removes outliers)
accurate_laps = session.laps.pick_accurate()

# Get laps by compound
soft_laps = session.laps[session.laps['Compound'] == 'SOFT']
```

### Plotting Integration

```python
import matplotlib.pyplot as plt
from fastf1 import plotting

# Setup matplotlib with F1 styling
plotting.setup_mpl()

# Get team color
team_color = plotting.team_color('Red Bull Racing')

# Get driver color
driver_color = plotting.driver_color('VER')
```

---

## 3. Data Type Reference

### Driver Numbers (2024-2025 Reference)

| Number | Driver | Team |
|--------|--------|------|
| 1 | Max Verstappen | Red Bull |
| 11 | Sergio Perez | Red Bull |
| 44 | Lewis Hamilton | Ferrari (2025) |
| 63 | George Russell | Mercedes |
| 16 | Charles Leclerc | Ferrari |
| 55 | Carlos Sainz | Williams (2025) |
| 4 | Lando Norris | McLaren |
| 81 | Oscar Piastri | McLaren |
| 14 | Fernando Alonso | Aston Martin |
| 18 | Lance Stroll | Aston Martin |

### Tyre Compounds

| Compound | Color | Usage |
|----------|-------|-------|
| SOFT | Red | Qualifying, short stints |
| MEDIUM | Yellow | Race strategy balanced |
| HARD | White | Long stints |
| INTERMEDIATE | Green | Light rain |
| WET | Blue | Heavy rain |

### Session Types

| Code | Name | Description |
|------|------|-------------|
| FP1 | Free Practice 1 | Friday practice |
| FP2 | Free Practice 2 | Friday practice |
| FP3 | Free Practice 3 | Saturday practice |
| Q | Qualifying | Grid position determination |
| S | Sprint | Sprint race (select weekends) |
| SQ | Sprint Qualifying | Sprint shootout |
| R | Race | Main grand prix |

### DRS Zones

DRS values from telemetry:
- `0` - DRS disabled/not available
- `1` - DRS available but not activated
- `8` - DRS activated (rear wing open)
- `10-14` - Various DRS states

### Flag Status (Race Control)

| Flag | Meaning |
|------|---------|
| GREEN | Track clear |
| YELLOW | Caution in sector |
| DOUBLE YELLOW | Slow down significantly |
| RED | Session stopped |
| BLUE | Let faster car pass (lapping) |
| BLACK AND WHITE | Warning for unsportsmanlike conduct |
| BLACK | Disqualification |
| CHEQUERED | Session end |

---

## 4. Architecture Patterns

### Real-Time Data Flow

```
OpenF1 API (polling every 1-5s)
        │
        ▼
┌───────────────────┐
│   Your Backend    │
│  (Cache + Process)│
└───────────────────┘
        │
        ▼ (WebSocket or SSE)
┌───────────────────┐
│    Frontend       │
│  (React/Next.js)  │
└───────────────────┘
```

### Historical Data Flow

```
Fast-F1 Library
        │
        ▼
┌───────────────────┐
│  Python Backend   │
│  (Pre-compute)    │
└───────────────────┘
        │
        ▼ (REST API)
┌───────────────────┐
│    Frontend       │
└───────────────────┘
```

### Recommended Caching Strategy

| Data Type | Cache Duration | Reason |
|-----------|---------------|--------|
| Session list | 1 hour | Rarely changes |
| Driver info | 1 hour | Static per session |
| Lap data | 5 seconds (live) | Frequent updates during session |
| Telemetry | 1-2 seconds (live) | High frequency data |
| Historical data | Indefinite | Never changes |

### Hybrid Approach (Recommended)

1. **Live Sessions:** Use OpenF1 API for real-time data
2. **Historical Analysis:** Use Fast-F1 for rich historical data
3. **Pre-computed Data:** Generate analysis with Fast-F1, serve via your API

---

## Quick Reference Card

### OpenF1 - Most Used Endpoints

```javascript
// Live timing
`/laps?session_key=${key}`
`/intervals?session_key=${key}`
`/car_data?session_key=${key}&driver_number=${num}`

// Race info
`/race_control?session_key=${key}`
`/weather?session_key=${key}`
`/stints?session_key=${key}`
```

### Fast-F1 - Most Used Functions

```python
# Setup
fastf1.Cache.enable_cache('cache')
session = fastf1.get_session(year, gp, session_type)
session.load()

# Data access
session.laps.pick_driver('VER')
session.laps.pick_fastest()
lap.get_telemetry()
lap.get_car_data().add_distance()
```

---

## Resources

- OpenF1 API: https://openf1.org
- OpenF1 GitHub: https://github.com/br-g/openf1
- Fast-F1 Docs: https://docs.fastf1.dev
- Fast-F1 GitHub: https://github.com/theOehrly/Fast-F1
- f1-dash (architecture reference): https://github.com/slowlydev/f1-dash
- f1-race-replay (visualization reference): https://github.com/IAmTomShaw/f1-race-replay
