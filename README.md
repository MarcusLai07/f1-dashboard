# F1 Dashboard

A comprehensive Formula 1 dashboard providing real-time telemetry, race analysis, championship standings, and a unified motorsport calendar.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss)

## Features

### Live Timing
Real-time timing tower with lap times, sector times, gaps to leader, intervals, and pit stop information during live F1 sessions.

### Track Map
Interactive 2D and 3D track visualizations showing live car positions with color-coded driver markers, DRS zones, and sector boundaries.

### Race Control
Live race control messages including track status flags, safety car deployments, virtual safety car, and incident notifications.

### Weather Data
Real-time weather conditions including track temperature, air temperature, humidity, wind speed/direction, and rain probability.

### Session Analysis
Historical lap time analysis with:
- Lap time charts and comparisons
- Position change visualizations
- Tyre strategy breakdowns
- Stint analysis and comparisons

### Championship Standings
Driver and constructor championship standings with points, wins, podiums, and position changes.

### Motorsport Calendar
Unified calendar supporting multiple racing series:
- **Formula 1** - Full season with practice, qualifying, sprint, and race sessions
- **WEC** - World Endurance Championship
- **WRC** - World Rally Championship
- **MotoGP** - Motorcycle Grand Prix
- **Formula E, F2, F3, IMSA, IndyCar, NASCAR, DTM, WorldSBK**
- **Special Events** - Goodwood Festival of Speed, Le Mans Classic, and more

### Circuit Database
Detailed information for all F1 circuits including:
- Interactive track layouts with SVG paths from telemetry data
- Corner/turn details with gear, speed, and type
- DRS zones with detection and activation points
- Sector boundaries
- Historical race winners and pole sitters
- Lap records

## Tech Stack

### Framework & Runtime
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Node.js** - Runtime

### Styling & UI
- **TailwindCSS** - Utility-first CSS
- **Radix UI** - Headless UI primitives
- **shadcn/ui** - Component library
- **Lucide Icons** - Icon set

### State Management & Data
- **Zustand** - Lightweight state management
- **SWR** - Data fetching and caching

### Visualization
- **Recharts** - Charts and graphs
- **Anime.js** - Animations
- **Three.js** - 3D track visualization

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MarcusLai07/f1-dashboard.git
cd f1-dashboard
```

2. Install dependencies:
```bash
cd apps/web
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
f1-dashboard/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   │   ├── api/        # API routes
│       │   │   ├── about/      # About page
│       │   │   ├── analysis/   # Session analysis
│       │   │   ├── calendar/   # Motorsport calendar
│       │   │   └── season/     # Season overview
│       │   ├── components/     # React components
│       │   │   ├── calendar/   # Calendar components
│       │   │   ├── layout/     # Layout components
│       │   │   ├── live/       # Live timing components
│       │   │   ├── season/     # Season components
│       │   │   └── ui/         # UI primitives
│       │   ├── data/           # Static data
│       │   │   ├── circuits/   # Circuit JSON files
│       │   │   ├── drivers/    # Driver data
│       │   │   ├── teams/      # Team data
│       │   │   └── motorsport-calendar/  # Calendar data
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utilities
│       │   └── stores/         # Zustand stores
│       └── public/             # Static assets
└── docs/                       # Documentation
```

## Data Sources & Attribution

This project aggregates data from multiple sources. We are grateful to the following:

### APIs

| Source | URL | Usage |
|--------|-----|-------|
| **OpenF1 API** | [openf1.org](https://openf1.org) | Real-time timing, telemetry, positions, weather, race control |
| **Jolpica API** | [github.com/jolpica/jolpica-f1](https://github.com/jolpica/jolpica-f1) | Championship standings, historical data |

### Data & Media

| Source | URL | Usage |
|--------|-----|-------|
| **FastF1** | [github.com/theOehrly/Fast-F1](https://github.com/theOehrly/Fast-F1) | Circuit telemetry, track layouts, corner data |
| **Formula 1** | [formula1.com](https://www.formula1.com) | Official schedules, driver/team info |
| **F1 Media** | [media.formula1.com](https://media.formula1.com) | Driver headshots, team images |
| **Wikipedia** | [wikipedia.org](https://wikipedia.org) | Historical race data, circuit history |

### Motorsport Calendar Sources

Calendar data is compiled from official series websites:

- [Formula 1](https://www.formula1.com)
- [Formula 2](https://www.fiaformula2.com)
- [Formula 3](https://www.fiaformula3.com)
- [Formula E](https://www.fiaformulae.com)
- [WEC](https://www.fiawec.com)
- [IMSA](https://www.imsa.com)
- [WRC](https://www.wrc.com)
- [MotoGP](https://www.motogp.com)
- [WorldSBK](https://www.worldsbk.com)
- [NASCAR](https://www.nascar.com)
- [IndyCar](https://www.indycar.com)
- [DTM](https://www.dtm.com)

## API Routes

| Route | Description |
|-------|-------------|
| `/api/live/sessions` | Available F1 sessions |
| `/api/live/timing` | Real-time timing data |
| `/api/live/position` | Car position telemetry |
| `/api/live/telemetry` | Detailed car telemetry |
| `/api/live/drivers` | Driver information |
| `/api/live/weather` | Weather conditions |
| `/api/live/race-control` | Race control messages |
| `/api/analysis/laps` | Lap time analysis |
| `/api/analysis/stints` | Stint/strategy analysis |
| `/api/season/standings` | Championship standings |
| `/api/season/calendar` | Season calendar |
| `/api/season/teams` | Team information |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is for educational and personal use only.

## Disclaimer

This project is an unofficial fan-made application and is **not affiliated with, endorsed by, or connected to Formula 1, FIA, Formula One Management, or any racing organization**. All trademarks, logos, and brand names are the property of their respective owners.

Formula 1, F1, and related marks are trademarks of Formula One Licensing BV.

---

Made with ❤️ for motorsport fans
