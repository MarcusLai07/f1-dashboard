# Graph Report - .  (2026-07-05)

## Corpus Check
- 152 files · ~167,185 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 762 nodes · 1550 edges · 42 communities (36 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_srclib route|src/lib: route]]
- [[_COMMUNITY_appsweb package|apps/web: package]]
- [[_COMMUNITY_srclib constants|src/lib: constants]]
- [[_COMMUNITY_webscripts extract-circuit-features|web/scripts: extract-circuit-features]]
- [[_COMMUNITY_componentsseason StandingsTab|components/season: StandingsTab]]
- [[_COMMUNITY_componentsui CircuitInfoSlidePanel|components/ui: CircuitInfoSlidePanel]]
- [[_COMMUNITY_srcdata index|src/data: index]]
- [[_COMMUNITY_componentsui dropdown-menu|components/ui: dropdown-menu]]
- [[_COMMUNITY_srctypes f1|src/types: f1]]
- [[_COMMUNITY_componentslayout SessionSelector|components/layout: SessionSelector]]
- [[_COMMUNITY_componentscalendar calendarStore|components/calendar: calendarStore]]
- [[_COMMUNITY_componentslive TrackMap3D|components/live: TrackMap3D]]
- [[_COMMUNITY_srchooks LiveDashboardLayout|src/hooks: LiveDashboardLayout]]
- [[_COMMUNITY_datamotorsport-calendar index|data/motorsport-calendar: index]]
- [[_COMMUNITY_appsweb tsconfig|apps/web: tsconfig]]
- [[_COMMUNITY_componentsui select|components/ui: select]]
- [[_COMMUNITY_srclib api|src/lib: api]]
- [[_COMMUNITY_f1-dashboarddocs TECHNICAL_SPEC|f1-dashboard/docs: TECHNICAL_SPEC]]
- [[_COMMUNITY_appsweb components|apps/web: components]]
- [[_COMMUNITY_appabout page|app/about: page]]
- [[_COMMUNITY_srchooks useSeasonData|src/hooks: useSeasonData]]
- [[_COMMUNITY_componentsseason CountdownHero|components/season: CountdownHero]]
- [[_COMMUNITY_componentsseason TeamsTab|components/season: TeamsTab]]
- [[_COMMUNITY_componentslive RaceInfo|components/live: RaceInfo]]
- [[_COMMUNITY_componentsseason CalendarTab|components/season: CalendarTab]]
- [[_COMMUNITY_datacircuits _schema|data/circuits: _schema]]
- [[_COMMUNITY_webpublic manifest|web/public: manifest]]
- [[_COMMUNITY_seasoncalendar route|season/calendar: route]]
- [[_COMMUNITY_componentslive TelemetryPanel|components/live: TelemetryPanel]]
- [[_COMMUNITY_srclib calendarUtils|src/lib: calendarUtils]]
- [[_COMMUNITY_srcdata index|src/data: index]]
- [[_COMMUNITY_srcapp layout|src/app: layout]]
- [[_COMMUNITY_webscripts extract-circuit-data|web/scripts: extract-circuit-data]]
- [[_COMMUNITY_datadrivers _schema|data/drivers: _schema]]
- [[_COMMUNITY_apicircuit route|api/circuit: route]]
- [[_COMMUNITY_srcdata index|src/data: index]]
- [[_COMMUNITY_appsweb eslint.config|apps/web: eslint.config]]
- [[_COMMUNITY_appsweb next.config|apps/web: next.config]]
- [[_COMMUNITY_appsweb postcss.config|apps/web: postcss.config]]
- [[_COMMUNITY_appsweb tailwind.config|apps/web: tailwind.config]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 73 edges
2. `openf1Fetch()` - 32 edges
3. `getRaces()` - 18 edges
4. `useLiveData()` - 18 edges
5. `useSeasonStore` - 18 edges
6. `compilerOptions` - 17 edges
7. `useDebugStore` - 15 edges
8. `useLiveStore` - 15 edges
9. `CountdownHero()` - 14 edges
10. `Button()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `CollapsibleCard()` --calls--> `cn()`  [EXTRACTED]
  apps/web/src/app/about/page.tsx → apps/web/src/lib/utils.ts
- `useLiveData()` --calls--> `fetchTiming()`  [INFERRED]
  apps/web/src/hooks/useLiveData.ts → apps/web/src/app/api/live/sse/route.ts
- `useLiveData()` --calls--> `fetchLocation()`  [INFERRED]
  apps/web/src/hooks/useLiveData.ts → apps/web/src/app/api/live/sse/route.ts
- `useLiveData()` --calls--> `fetchRaceControl()`  [INFERRED]
  apps/web/src/hooks/useLiveData.ts → apps/web/src/app/api/live/sse/route.ts
- `useLiveData()` --calls--> `fetchWeather()`  [INFERRED]
  apps/web/src/hooks/useLiveData.ts → apps/web/src/app/api/live/sse/route.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **F1 Hybrid Live/Historical Data Pipeline** — personal_f1_dashboard_docs_data_sources_openf1_api, personal_f1_dashboard_docs_data_sources_fast_f1_library, personal_f1_dashboard_docs_technical_spec_nextjs_api_routes, personal_f1_dashboard_docs_technical_spec_python_fastapi_backend [EXTRACTED 1.00]

## Communities (42 total, 6 thin omitted)

### Community 0 - "src/lib: route"
Cohesion: 0.06
Nodes (52): DriverInfo, GET(), DriverInfo, GET(), GET(), GET(), LocationPoint, LocationResponse (+44 more)

### Community 1 - "apps/web: package"
Cohesion: 0.05
Nodes (40): dependencies, animejs, class-variance-authority, clsx, leaflet, lucide-react, mqtt, next (+32 more)

### Community 2 - "src/lib: constants"
Cohesion: 0.07
Nodes (29): LapData, LapTimeChart(), LapTimeChartProps, DriverInfo, StintChart(), StintChartProps, StintData, getQualifyingZones() (+21 more)

### Community 3 - "web/scripts: extract-circuit-features"
Cohesion: 0.07
Nodes (30): classify_turn(), estimate_gear(), extract_circuit_features(), extract_sector_boundaries(), extract_turn_speeds(), generate_typescript_output(), main(), Extract minimum speeds at each corner from telemetry. (+22 more)

### Community 4 - "components/season: StandingsTab"
Cohesion: 0.07
Nodes (26): ConstructorStanding, DriverStanding, GET(), JolpicaConstructor, JolpicaConstructorStanding, JolpicaDriver, JolpicaDriverStanding, normalizeTeamName() (+18 more)

### Community 5 - "components/ui: CircuitInfoSlidePanel"
Cohesion: 0.11
Nodes (25): Driver, LapData, StintData, LapData, PositionChart(), PositionChartProps, CIRCUIT_TURNS, CircuitHistory (+17 more)

### Community 6 - "src/data: index"
Cohesion: 0.09
Nodes (21): calendarCache, CalendarData, circuitCache, circuitNameToId, driverFullCache, getCalendar(), getLaunches(), getSprintRounds() (+13 more)

### Community 7 - "components/ui: dropdown-menu"
Cohesion: 0.10
Nodes (15): Driver, DriverSelector(), DriverSelectorProps, DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem() (+7 more)

### Community 8 - "src/types: f1"
Cohesion: 0.08
Nodes (25): TimingTowerProps, AnalysisState, APIError, APIResponse, DriverComparison, DriverStatus, DriverTiming, DriverTimingWithMiniSectors (+17 more)

### Community 9 - "components/layout: SessionSelector"
Cohesion: 0.12
Nodes (20): CircuitEditor, CircuitEditorPage(), buildEvents(), EventType, formatShortTime(), HistoricalSessionsPanel(), HistoricalSessionsPanelProps, SelectableEvent (+12 more)

### Community 10 - "components/calendar: calendarStore"
Cohesion: 0.21
Nodes (15): CalendarGrid(), CalendarGridProps, COUNTRY_FLAGS, EventCard(), EventCardProps, EventList(), EventListProps, MotorsportCalendar() (+7 more)

### Community 11 - "components/live: TrackMap3D"
Cohesion: 0.14
Nodes (18): circuitCache, CircuitCorner, CircuitData, CircuitDrsZone, CircuitSector, TrackMap3DProps, circuitCache, CircuitData (+10 more)

### Community 12 - "src/hooks: LiveDashboardLayout"
Cohesion: 0.18
Nodes (17): LiveDashboard(), DebugPanel(), LiveDashboardLayout(), LiveDashboardLayoutProps, ReplayController(), ReplayControllerProps, TrackMap3D(), Slider() (+9 more)

### Community 14 - "data/motorsport-calendar: index"
Cohesion: 0.18
Nodes (19): calendarCache, clearMotorsportCalendarCache(), getAllMotorsportEvents(), getEventsByCategory(), getEventsByDate(), getEventsInRange(), getNextMotorsportEvent(), getSeriesByCategory() (+11 more)

### Community 15 - "apps/web: tsconfig"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 16 - "components/ui: select"
Cohesion: 0.18
Nodes (15): TIMEZONES, ConnectionTestResult, DebugPanelProps, SESSION_TYPE_COLORS, Button(), buttonVariants, Select(), SelectContent() (+7 more)

### Community 17 - "src/lib: api"
Cohesion: 0.26
Nodes (17): useLiveData(), UseLiveDataOptions, getPollingIntervals(), PollingConfig, SessionType, usePollingIntervals(), fetchAPI(), getAllLiveData() (+9 more)

### Community 18 - "f1-dashboard/docs: TECHNICAL_SPEC"
Cohesion: 0.13
Nodes (20): Modular F1 Data Architecture, Override Merging Pattern, Session-Aware Polling, Circuit Data JSON Schema, Unified Data Access Layer (src/data/index.ts), calendarStore (Zustand), Unified Motorsport Calendar, Fast-F1 Python Library (+12 more)

### Community 19 - "apps/web: components"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 20 - "app/about: page"
Cohesion: 0.19
Nodes (5): CollapsibleCard(), Header(), HeaderProps, Badge(), badgeVariants

### Community 21 - "src/hooks: useSeasonData"
Cohesion: 0.21
Nodes (15): formatTimeSince(), SeasonPage(), EventCard(), SessionRow(), calculateRefreshInterval(), getTimeToNextSession(), isSessionLive(), REFRESH_INTERVALS (+7 more)

### Community 22 - "components/season: CountdownHero"
Cohesion: 0.16
Nodes (12): CountdownDigitProps, CountdownHero(), CountdownProgressProps, COUNTRY_FLAGS, DaytimeIconProps, getNextEvent(), getTimeOfDay(), getTimeRemaining() (+4 more)

### Community 23 - "components/season: TeamsTab"
Cohesion: 0.16
Nodes (9): CAR_IMAGES, DriverCardProps, LightboxProps, TeamCardProps, TeamsTab(), F1Loader(), F1LoaderProps, MiniF1Car() (+1 more)

### Community 24 - "components/live: RaceInfo"
Cohesion: 0.23
Nodes (11): RaceInfo(), RaceInfoProps, TrackStatusIndicator(), TrackStatusIndicatorProps, WeatherItemProps, initialState, LapSnapshot, ReplayState (+3 more)

### Community 25 - "components/season: CalendarTab"
Cohesion: 0.19
Nodes (13): CalendarTab(), CalendarTabProps, CircuitInfoButtonProps, COUNTRY_FLAGS, EventCardProps, EventStatus, getEventDatesForMonth(), getEventDays() (+5 more)

### Community 26 - "data/circuits: _schema"
Cohesion: 0.19
Nodes (11): InteractiveTrackMap(), InteractiveTrackMapProps, TurnMarker, CircuitData, CircuitManifest, CircuitSvg, DRSZone, LapRecord (+3 more)

### Community 27 - "web/public: manifest"
Cohesion: 0.17
Nodes (11): background_color, categories, description, display, icons, name, orientation, screenshots (+3 more)

### Community 28 - "season/calendar: route"
Cohesion: 0.33
Nodes (10): CalendarResponse, GET(), getCompletedRounds(), getCurrentRound(), EventDateInfo, MiniCalendarProps, F1Event, getNextEvent() (+2 more)

### Community 29 - "components/live: TelemetryPanel"
Cohesion: 0.22
Nodes (9): cleanupTelemetryHistory(), DriverTelemetryCard(), DriverTelemetryCardProps, telemetryHistory, TelemetryPanel(), TelemetryPanelProps, TelemetrySnapshot, TelemetryTraceProps (+1 more)

### Community 30 - "src/lib: calendarUtils"
Cohesion: 0.33
Nodes (4): CalendarExport(), formatICSDate(), generateGoogleCalendarUrl(), generateICS()

### Community 31 - "src/data: index"
Cohesion: 0.25
Nodes (9): CircuitInfoButton(), getAllCircuitIds(), getAllCircuits(), getCircuit(), getCircuitByName(), getCircuitCorners(), getCircuitDrsZones(), getCircuitSectors() (+1 more)

### Community 32 - "src/app: layout"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, metadata, titilliumWeb, viewport

### Community 33 - "web/scripts: extract-circuit-data"
Cohesion: 0.50
Nodes (4): extract_circuit_data(), main(), Extract data for all circuits and output as JSON., Extract corner and sector data for a circuit.

### Community 36 - "src/data: index"
Cohesion: 0.67
Nodes (3): getEventByRound(), getEventsByMonth(), getRaces()

## Knowledge Gaps
- **254 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+249 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `components/ui: dropdown-menu` to `src/lib: constants`, `components/ui: CircuitInfoSlidePanel`, `components/layout: SessionSelector`, `components/calendar: calendarStore`, `components/ui: select`, `app/about: page`, `src/hooks: useSeasonData`, `components/live: RaceInfo`, `components/season: CalendarTab`, `data/circuits: _schema`, `components/live: TelemetryPanel`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `useLiveData()` (e.g. with `fetchLocation()` and `fetchRaceControl()`) actually correct?**
  _`useLiveData()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _268 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `src/lib: route` be split into smaller, more focused modules?**
  _Cohesion score 0.056692242114237 - nodes in this community are weakly interconnected._
- **Should `apps/web: package` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `src/lib: constants` be split into smaller, more focused modules?**
  _Cohesion score 0.0728744939271255 - nodes in this community are weakly interconnected._
- **Should `web/scripts: extract-circuit-features` be split into smaller, more focused modules?**
  _Cohesion score 0.06685633001422475 - nodes in this community are weakly interconnected._