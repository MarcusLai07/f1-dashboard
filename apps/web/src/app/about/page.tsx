"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Calendar,
  BarChart3,
  Trophy,
  Map,
  Gauge,
  Radio,
  Cloud,
  Database,
  ExternalLink,
  Github,
  Code2,
  Heart,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header sessionName="About" />

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-bold text-primary">F1</span>
              <span className="text-4xl font-semibold">Dashboard</span>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive Formula 1 dashboard providing real-time telemetry,
              race analysis, championship standings, and a unified motorsport calendar.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary">Open Source</Badge>
              <Badge variant="outline">Next.js 15</Badge>
              <Badge variant="outline">React 19</Badge>
            </div>
          </div>

          {/* Features Section */}
          <CollapsibleCard
            icon={<Activity className="h-5 w-5 text-primary" />}
            title="Features"
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureItem
                icon={<Gauge className="h-5 w-5 text-red-500" />}
                title="Live Timing"
                description="Real-time timing tower with lap times, sectors, gaps, and pit stop information during live sessions."
              />
              <FeatureItem
                icon={<Map className="h-5 w-5 text-blue-500" />}
                title="Track Map"
                description="Interactive 2D and 3D track visualizations showing live car positions with driver markers."
              />
              <FeatureItem
                icon={<Radio className="h-5 w-5 text-yellow-500" />}
                title="Race Control"
                description="Live race control messages including flags, safety car deployments, and incident notifications."
              />
              <FeatureItem
                icon={<Cloud className="h-5 w-5 text-cyan-500" />}
                title="Weather Data"
                description="Real-time track and air temperature, humidity, wind speed, and rain probability."
              />
              <FeatureItem
                icon={<BarChart3 className="h-5 w-5 text-green-500" />}
                title="Session Analysis"
                description="Historical lap time analysis, position changes, tyre strategy visualization, and stint comparisons."
              />
              <FeatureItem
                icon={<Trophy className="h-5 w-5 text-yellow-500" />}
                title="Championship Standings"
                description="Driver and constructor championship standings with points, wins, and podiums."
              />
              <FeatureItem
                icon={<Calendar className="h-5 w-5 text-purple-500" />}
                title="Motorsport Calendar"
                description="Unified calendar for F1, WEC, WRC, MotoGP, and special motorsport events like Goodwood."
              />
              <FeatureItem
                icon={<Database className="h-5 w-5 text-orange-500" />}
                title="Circuit Database"
                description="Detailed circuit information with track layouts, turn data, DRS zones, and historical race winners."
              />
            </div>
          </CollapsibleCard>

          {/* Data Sources Section */}
          <CollapsibleCard
            icon={<Database className="h-5 w-5 text-primary" />}
            title="Data Sources & Attribution"
            defaultOpen={false}
          >
            <div className="space-y-4">
              {/* APIs */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">APIs</h4>
                <div className="space-y-3">
                  <DataSourceItem
                    name="OpenF1 API"
                    url="https://openf1.org"
                    description="Real-time and historical F1 data including timing, telemetry, weather, and race control."
                    usage="Live timing, car positions, telemetry, weather"
                  />
                  <DataSourceItem
                    name="Jolpica API (Ergast)"
                    url="https://github.com/jolpica/jolpica-f1"
                    description="Continuation of the Ergast Motor Racing Database with F1 statistics since 1950."
                    usage="Championship standings, historical results"
                  />
                </div>
              </div>

              {/* Data & Tools */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Data & Tools</h4>
                <div className="space-y-3">
                  <DataSourceItem
                    name="FastF1"
                    url="https://github.com/theOehrly/Fast-F1"
                    description="Python library for F1 timing and telemetry data. Circuit layouts derived from telemetry."
                    usage="Circuit SVG paths, corner positions, sectors"
                  />
                  <DataSourceItem
                    name="Formula 1 Official"
                    url="https://www.formula1.com"
                    description="Official F1 website providing schedules, driver/team information, and media."
                    usage="Race calendar, session times, naming"
                  />
                </div>
              </div>

              {/* Media */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Media & Images</h4>
                <div className="space-y-3">
                  <DataSourceItem
                    name="Formula 1 Media"
                    url="https://media.formula1.com"
                    description="Official F1 media server for driver headshots and team car images."
                    usage="Driver images, team car renders"
                  />
                  <DataSourceItem
                    name="Wikipedia"
                    url="https://wikipedia.org"
                    description="Reference for historical race data, circuit information, and statistics."
                    usage="Historical winners, pole sitters, circuit history"
                  />
                </div>
              </div>

              {/* Calendar Sources */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Motorsport Calendar Sources</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Calendar data compiled from official series websites:
                </p>
                <div className="flex flex-wrap gap-2">
                  <SeriesSource name="Formula 1" url="https://www.formula1.com" />
                  <SeriesSource name="Formula 2" url="https://www.fiaformula2.com" />
                  <SeriesSource name="Formula 3" url="https://www.fiaformula3.com" />
                  <SeriesSource name="Formula E" url="https://www.fiaformulae.com" />
                  <SeriesSource name="WEC" url="https://www.fiawec.com" />
                  <SeriesSource name="IMSA" url="https://www.imsa.com" />
                  <SeriesSource name="WRC" url="https://www.wrc.com" />
                  <SeriesSource name="MotoGP" url="https://www.motogp.com" />
                  <SeriesSource name="WorldSBK" url="https://www.worldsbk.com" />
                  <SeriesSource name="NASCAR" url="https://www.nascar.com" />
                  <SeriesSource name="IndyCar" url="https://www.indycar.com" />
                  <SeriesSource name="DTM" url="https://www.dtm.com" />
                </div>
              </div>
            </div>
          </CollapsibleCard>

          {/* Technologies Section */}
          <CollapsibleCard
            icon={<Code2 className="h-5 w-5 text-primary" />}
            title="Built With"
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Framework & Runtime</h4>
                <div className="flex flex-wrap gap-2">
                  <TechBadge name="Next.js 15" />
                  <TechBadge name="React 19" />
                  <TechBadge name="TypeScript" />
                  <TechBadge name="Node.js" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Styling & UI</h4>
                <div className="flex flex-wrap gap-2">
                  <TechBadge name="TailwindCSS" />
                  <TechBadge name="Radix UI" />
                  <TechBadge name="Lucide Icons" />
                  <TechBadge name="shadcn/ui" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">State & Data</h4>
                <div className="flex flex-wrap gap-2">
                  <TechBadge name="Zustand" />
                  <TechBadge name="SWR" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Visualization</h4>
                <div className="flex flex-wrap gap-2">
                  <TechBadge name="Recharts" />
                  <TechBadge name="Anime.js" />
                  <TechBadge name="Three.js" />
                </div>
              </div>
            </div>
          </CollapsibleCard>

          {/* Disclaimer */}
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-yellow-500">
                <AlertTriangle className="h-5 w-5" />
                Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This project is an unofficial fan-made application and is not affiliated with, endorsed by,
                or connected to Formula 1, FIA, Formula One Management, or any racing organization.
                All trademarks, logos, and brand names are the property of their respective owners.
                This project is for educational and personal use only.
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-6 space-y-4">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> for motorsport fans
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://github.com/MarcusLai07/f1-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Collapsible Card Component
function CollapsibleCard({
  icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full"
      >
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </CardHeader>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <CardContent className="pt-0 pb-4">{children}</CardContent>
      </div>
    </Card>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-secondary/30">
      <div className="mt-0.5">{icon}</div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function DataSourceItem({
  name,
  url,
  description,
  usage,
}: {
  name: string;
  url: string;
  description: string;
  usage: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-sm">{name}</h3>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
        <Badge variant="outline" className="text-[10px]">
          {usage}
        </Badge>
      </div>
    </div>
  );
}

function SeriesSource({ name, url }: { name: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <span>{name}</span>
      <ExternalLink className="h-3 w-3 text-muted-foreground" />
    </a>
  );
}

function TechBadge({ name }: { name: string }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {name}
    </Badge>
  );
}
