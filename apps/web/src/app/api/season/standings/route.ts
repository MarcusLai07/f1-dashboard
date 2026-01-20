import { NextResponse } from "next/server";
import { getTeamColors } from "@/data";

// Jolpica API (Ergast continuation)
const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

interface StandingsResponse {
  driverStandings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
  round: number;
  season: number;
  timestamp: string;
  stale?: boolean;
}

interface DriverStanding {
  position: number;
  driverCode: string;
  driverNumber: number;
  firstName: string;
  lastName: string;
  nationality: string;
  team: string;
  teamColor: string;
  points: number;
  wins: number;
}

interface ConstructorStanding {
  position: number;
  name: string;
  nationality: string;
  points: number;
  wins: number;
  color: string;
}

// Cache standings for 5 minutes
let standingsCache: {
  data: StandingsResponse;
  timestamp: number;
} | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface JolpicaDriver {
  driverId: string;
  code: string;
  permanentNumber: string;
  givenName: string;
  familyName: string;
  nationality: string;
}

interface JolpicaConstructor {
  constructorId: string;
  name: string;
  nationality: string;
}

interface JolpicaDriverStanding {
  position: string;
  points: string;
  wins: string;
  Driver: JolpicaDriver;
  Constructors: JolpicaConstructor[];
}

interface JolpicaConstructorStanding {
  position: string;
  points: string;
  wins: string;
  Constructor: JolpicaConstructor;
}

// Map Jolpica team names to our team names
const teamNameMap: Record<string, string> = {
  "Red Bull": "Red Bull Racing",
  "RB F1 Team": "Racing Bulls",
  "Racing Bulls": "Racing Bulls",
  "Sauber": "Audi",
  "Kick Sauber": "Audi",
  "Audi": "Audi",
  "Haas F1 Team": "Haas F1 Team",
  "Alpine F1 Team": "Alpine",
  "Alpine": "Alpine",
  "McLaren": "McLaren",
  "Ferrari": "Ferrari",
  "Mercedes": "Mercedes",
  "Aston Martin": "Aston Martin",
  "Williams": "Williams",
  "Cadillac": "Cadillac",
};

function normalizeTeamName(name: string): string {
  return teamNameMap[name] || name;
}

export async function GET() {
  try {
    // Check cache
    if (standingsCache && Date.now() - standingsCache.timestamp < CACHE_TTL) {
      return NextResponse.json(standingsCache.data);
    }

    // Fetch team colors from unified data layer
    const teamColors = await getTeamColors();

    // Helper function to get team color
    function getTeamColor(teamName: string): string {
      const normalized = normalizeTeamName(teamName);
      return teamColors[normalized] || "#808080";
    }

    // Fetch both standings in parallel
    const [driverRes, constructorRes] = await Promise.all([
      fetch(`${JOLPICA_BASE}/current/driverStandings.json`, {
        next: { revalidate: 300 }, // 5 min cache
      }),
      fetch(`${JOLPICA_BASE}/current/constructorStandings.json`, {
        next: { revalidate: 300 },
      }),
    ]);

    if (!driverRes.ok || !constructorRes.ok) {
      throw new Error("Failed to fetch standings from Jolpica API");
    }

    const driverData = await driverRes.json();
    const constructorData = await constructorRes.json();

    // Extract standings lists
    const driverStandingsList: JolpicaDriverStanding[] =
      driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
    const constructorStandingsList: JolpicaConstructorStanding[] =
      constructorData?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];

    // Get round info
    const round = parseInt(driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.round || "0");
    const season = parseInt(driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.season || "2026");

    // Transform driver standings
    const driverStandings: DriverStanding[] = driverStandingsList.map((ds) => {
      const teamName = ds.Constructors?.[0]?.name || "Unknown";
      const normalizedTeam = normalizeTeamName(teamName);
      return {
        position: parseInt(ds.position),
        driverCode: ds.Driver.code || ds.Driver.driverId.substring(0, 3).toUpperCase(),
        driverNumber: parseInt(ds.Driver.permanentNumber) || 0,
        firstName: ds.Driver.givenName,
        lastName: ds.Driver.familyName,
        nationality: ds.Driver.nationality,
        team: normalizedTeam,
        teamColor: getTeamColor(teamName),
        points: parseFloat(ds.points),
        wins: parseInt(ds.wins),
      };
    });

    // Transform constructor standings
    const constructorStandings: ConstructorStanding[] = constructorStandingsList.map((cs) => {
      const normalizedName = normalizeTeamName(cs.Constructor.name);
      return {
        position: parseInt(cs.position),
        name: normalizedName,
        nationality: cs.Constructor.nationality,
        points: parseFloat(cs.points),
        wins: parseInt(cs.wins),
        color: getTeamColor(cs.Constructor.name),
      };
    });

    const responseData: StandingsResponse = {
      driverStandings,
      constructorStandings,
      round,
      season,
      timestamp: new Date().toISOString(),
    };

    // Update cache
    standingsCache = {
      data: responseData,
      timestamp: Date.now(),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Standings API error:", error);

    // Return cached data if available, even if stale
    if (standingsCache) {
      return NextResponse.json({
        ...standingsCache.data,
        stale: true,
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}
