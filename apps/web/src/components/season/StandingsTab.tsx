"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown, Minus } from "lucide-react";
import { useSeasonStore, type DriverStanding, type ConstructorStanding } from "@/stores/seasonStore";
import { getTeamColors, getDriverTeams, getDriverNumbers } from "@/data";
import { F1Loader } from "@/components/ui/f1-loader";
import { animate } from "animejs";

// Position change indicator with animation
interface PositionIndicatorProps {
  change: number; // positive = gained, negative = lost, 0 = same
}

function PositionIndicator({ change }: PositionIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!indicatorRef.current || change === 0) return;

    animate(indicatorRef.current, {
      translateY: change > 0 ? [5, 0] : [-5, 0],
      opacity: [0, 1],
      duration: 400,
      ease: "outBack",
    });
  }, [change]);

  if (change === 0) {
    return (
      <div className="w-5 flex justify-center">
        <Minus className="h-3 w-3 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div
      ref={indicatorRef}
      className={`w-5 flex items-center justify-center text-xs font-bold ${
        change > 0 ? "text-green-500" : "text-red-500"
      }`}
    >
      {change > 0 ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </div>
  );
}

// Points change badge
interface PointsChangeBadgeProps {
  change: number;
}

function PointsChangeBadge({ change }: PointsChangeBadgeProps) {
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!badgeRef.current || change === 0) return;

    animate(badgeRef.current, {
      scale: [0.5, 1.1, 1],
      opacity: [0, 1],
      duration: 500,
      ease: "outElastic(1, 0.5)",
    });
  }, [change]);

  if (change === 0) return null;

  return (
    <span
      ref={badgeRef}
      className={`text-[10px] px-1 py-0.5 rounded ${
        change > 0
          ? "bg-green-500/20 text-green-400"
          : "bg-red-500/20 text-red-400"
      }`}
    >
      {change > 0 ? `+${change}` : change}
    </span>
  );
}

interface PointsBarProps {
  points: number;
  maxPoints: number;
  color: string;
}

function PointsBar({ points, maxPoints, color }: PointsBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const percentage = maxPoints > 0 ? (points / maxPoints) * 100 : 0;

  useEffect(() => {
    if (!barRef.current) return;

    animate(barRef.current, {
      width: `${percentage}%`,
      duration: 800,
      delay: 100,
      ease: "outQuad",
    });
  }, [percentage]);

  return (
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
      <div
        ref={barRef}
        className="h-full rounded-full"
        style={{
          width: 0,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

interface DriverRowProps {
  standing: DriverStanding;
  maxPoints: number;
  onHover?: (team: string | null) => void;
  isHighlighted?: boolean;
  positionChange?: number;
  pointsChange?: number;
  index: number;
}

function DriverRow({ standing, maxPoints, onHover, isHighlighted, positionChange = 0, pointsChange = 0, index }: DriverRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rowRef.current) return;

    animate(rowRef.current, {
      opacity: [0, 1],
      translateX: [-20, 0],
      duration: 300,
      delay: index * 30,
      ease: "outQuad",
    });
  }, [index]);

  return (
    <div
      ref={rowRef}
      className={`py-2 px-3 rounded transition-colors ${isHighlighted ? "bg-secondary/50" : "hover:bg-secondary/30"}`}
      onMouseEnter={() => onHover?.(standing.team)}
      onMouseLeave={() => onHover?.(null)}
      style={{ opacity: 0 }}
    >
      <div className="flex items-center gap-2">
        <span className="w-6 text-right font-mono text-sm text-muted-foreground">
          {standing.position}
        </span>
        <PositionIndicator change={positionChange} />
        <div
          className="w-1 h-8 rounded-full"
          style={{ backgroundColor: standing.teamColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold">{standing.driverCode}</span>
            <span className="text-sm text-muted-foreground truncate">
              {standing.lastName}
            </span>
          </div>
          <PointsBar points={standing.points} maxPoints={maxPoints} color={standing.teamColor} />
        </div>
        <div className="text-right flex items-center gap-1.5">
          <PointsChangeBadge change={pointsChange} />
          <span className="font-mono font-bold">{standing.points}</span>
          {standing.wins > 0 && (
            <span className="text-xs text-muted-foreground">
              ({standing.wins}W)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ConstructorRowProps {
  standing: ConstructorStanding;
  maxPoints: number;
  isHighlighted?: boolean;
  onHover?: (team: string | null) => void;
  positionChange?: number;
  pointsChange?: number;
  index: number;
}

function ConstructorRow({ standing, maxPoints, isHighlighted, onHover, positionChange = 0, pointsChange = 0, index }: ConstructorRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rowRef.current) return;

    animate(rowRef.current, {
      opacity: [0, 1],
      translateX: [-20, 0],
      duration: 300,
      delay: index * 40,
      ease: "outQuad",
    });
  }, [index]);

  return (
    <div
      ref={rowRef}
      className={`py-2 px-3 rounded transition-colors ${isHighlighted ? "bg-secondary/50" : "hover:bg-secondary/30"}`}
      onMouseEnter={() => onHover?.(standing.name)}
      onMouseLeave={() => onHover?.(null)}
      style={{ opacity: 0 }}
    >
      <div className="flex items-center gap-2">
        <span className="w-6 text-right font-mono text-sm text-muted-foreground">
          {standing.position}
        </span>
        <PositionIndicator change={positionChange} />
        <div
          className="w-1 h-8 rounded-full"
          style={{ backgroundColor: standing.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{standing.name}</div>
          <PointsBar points={standing.points} maxPoints={maxPoints} color={standing.color} />
        </div>
        <div className="text-right flex items-center gap-1.5">
          <PointsChangeBadge change={pointsChange} />
          <span className="font-mono font-bold">{standing.points}</span>
          {standing.wins > 0 && (
            <span className="text-xs text-muted-foreground">
              ({standing.wins}W)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Driver info for placeholder standings
const DRIVER_INFO: Record<string, { firstName: string; lastName: string; nationality: string }> = {
  NOR: { firstName: "Lando", lastName: "Norris", nationality: "British" },
  PIA: { firstName: "Oscar", lastName: "Piastri", nationality: "Australian" },
  VER: { firstName: "Max", lastName: "Verstappen", nationality: "Dutch" },
  HAD: { firstName: "Isack", lastName: "Hadjar", nationality: "French" },
  LEC: { firstName: "Charles", lastName: "Leclerc", nationality: "Monegasque" },
  HAM: { firstName: "Lewis", lastName: "Hamilton", nationality: "British" },
  RUS: { firstName: "George", lastName: "Russell", nationality: "British" },
  ANT: { firstName: "Kimi", lastName: "Antonelli", nationality: "Italian" },
  ALO: { firstName: "Fernando", lastName: "Alonso", nationality: "Spanish" },
  STR: { firstName: "Lance", lastName: "Stroll", nationality: "Canadian" },
  GAS: { firstName: "Pierre", lastName: "Gasly", nationality: "French" },
  COL: { firstName: "Franco", lastName: "Colapinto", nationality: "Argentine" },
  ALB: { firstName: "Alex", lastName: "Albon", nationality: "Thai" },
  SAI: { firstName: "Carlos", lastName: "Sainz", nationality: "Spanish" },
  LAW: { firstName: "Liam", lastName: "Lawson", nationality: "New Zealander" },
  LIN: { firstName: "Arvid", lastName: "Lindblad", nationality: "British" },
  HUL: { firstName: "Nico", lastName: "Hulkenberg", nationality: "German" },
  BOR: { firstName: "Gabriel", lastName: "Bortoleto", nationality: "Brazilian" },
  PER: { firstName: "Sergio", lastName: "Perez", nationality: "Mexican" },
  BOT: { firstName: "Valtteri", lastName: "Bottas", nationality: "Finnish" },
  OCO: { firstName: "Esteban", lastName: "Ocon", nationality: "French" },
  BEA: { firstName: "Oliver", lastName: "Bearman", nationality: "British" },
};

// Generate placeholder driver standings based on 2025 championship order
function generatePlaceholderDriverStandings(
  driverTeams: Record<string, string>,
  driverNumbers: Record<string, number>,
  teamColors: Record<string, string>
): DriverStanding[] {
  const driverOrder = ["NOR", "PIA", "VER", "HAD", "LEC", "HAM", "RUS", "ANT", "ALO", "STR", "GAS", "COL", "ALB", "SAI", "LAW", "LIN", "HUL", "BOR", "PER", "BOT", "OCO", "BEA"];

  return driverOrder.map((code, index) => {
    const team = driverTeams[code] || "Unknown";
    const info = DRIVER_INFO[code] || { firstName: "", lastName: code, nationality: "Unknown" };

    return {
      position: index + 1,
      driverCode: code,
      driverNumber: driverNumbers[code] || 0,
      firstName: info.firstName,
      lastName: info.lastName,
      nationality: info.nationality,
      team,
      teamColor: teamColors[team] || "#808080",
      points: 0,
      wins: 0,
    };
  });
}

// Generate placeholder constructor standings
function generatePlaceholderConstructorStandings(
  teamColors: Record<string, string>
): ConstructorStanding[] {
  const teamInfo: { name: string; nationality: string }[] = [
    { name: "McLaren", nationality: "British" },
    { name: "Ferrari", nationality: "Italian" },
    { name: "Red Bull Racing", nationality: "Austrian" },
    { name: "Mercedes", nationality: "German" },
    { name: "Aston Martin", nationality: "British" },
    { name: "Alpine", nationality: "French" },
    { name: "Williams", nationality: "British" },
    { name: "Racing Bulls", nationality: "Italian" },
    { name: "Audi", nationality: "Swiss" },
    { name: "Haas F1 Team", nationality: "American" },
    { name: "Cadillac", nationality: "American" },
  ];

  return teamInfo.map((team, index) => ({
    position: index + 1,
    name: team.name,
    nationality: team.nationality,
    color: teamColors[team.name] || "#808080",
    points: 0,
    wins: 0,
  }));
}

export function StandingsTab() {
  const { driverStandings, constructorStandings, standingsRound, standingsYear, isLoading } =
    useSeasonStore();

  const [highlightedTeam, setHighlightedTeam] = useState<string | null>(null);
  const [teamColors, setTeamColors] = useState<Record<string, string>>({});
  const [driverTeams, setDriverTeams] = useState<Record<string, string>>({});
  const [driverNumbers, setDriverNumbers] = useState<Record<string, number>>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Fetch reference data from the data layer
  useEffect(() => {
    Promise.all([
      getTeamColors(),
      getDriverTeams(),
      getDriverNumbers(),
    ]).then(([colors, teams, numbers]) => {
      setTeamColors(colors);
      setDriverTeams(teams);
      setDriverNumbers(numbers);
      setDataLoaded(true);
    });
  }, []);

  // Use actual standings or placeholder if not available
  const displayDriverStandings = driverStandings.length > 0
    ? driverStandings
    : dataLoaded
      ? generatePlaceholderDriverStandings(driverTeams, driverNumbers, teamColors)
      : [];

  const displayConstructorStandings = constructorStandings.length > 0
    ? constructorStandings
    : dataLoaded
      ? generatePlaceholderConstructorStandings(teamColors)
      : [];

  const isPreSeason = driverStandings.length === 0;

  const maxDriverPoints = displayDriverStandings.length > 0 ? Math.max(displayDriverStandings[0].points, 1) : 1;
  const maxConstructorPoints = displayConstructorStandings.length > 0 ? Math.max(displayConstructorStandings[0].points, 1) : 1;

  if ((isLoading && driverStandings.length === 0) || !dataLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <F1Loader text="Loading standings..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {isPreSeason ? (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            Pre-Season - 2026 Season
          </span>
        ) : (
          <span>
            After Round {standingsRound} - {standingsYear} Season
          </span>
        )}
        {isPreSeason && (
          <span className="text-xs text-muted-foreground/70">
            Standings will update after Round 1
          </span>
        )}
      </div>

      {/* Side by side standings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Driver Championship */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              Drivers Championship
              <span className="text-xs font-normal text-muted-foreground">
                {displayDriverStandings.length} drivers
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[600px] overflow-y-auto">
            {displayDriverStandings.map((standing, index) => (
              <DriverRow
                key={standing.driverCode}
                standing={standing}
                maxPoints={maxDriverPoints}
                onHover={setHighlightedTeam}
                isHighlighted={highlightedTeam === standing.team}
                positionChange={0}
                pointsChange={0}
                index={index}
              />
            ))}
          </CardContent>
        </Card>

        {/* Constructor Championship */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              Constructors Championship
              <span className="text-xs font-normal text-muted-foreground">
                {displayConstructorStandings.length} teams
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[600px] overflow-y-auto">
            {displayConstructorStandings.map((standing, index) => (
              <ConstructorRow
                key={standing.name}
                standing={standing}
                maxPoints={maxConstructorPoints}
                isHighlighted={highlightedTeam === standing.name}
                onHover={setHighlightedTeam}
                positionChange={0}
                pointsChange={0}
                index={index}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
