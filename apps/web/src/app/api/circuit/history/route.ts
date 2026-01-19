import { NextRequest, NextResponse } from "next/server";

// Map circuit names to Ergast circuit IDs
const ERGAST_CIRCUIT_IDS: Record<string, string> = {
  // Abu Dhabi
  "yas marina": "yas_marina",
  "abu dhabi": "yas_marina",
  // Australia
  "albert park": "albert_park",
  "melbourne": "albert_park",
  "australia": "albert_park",
  // Bahrain
  "bahrain": "bahrain",
  "sakhir": "bahrain",
  "bahrain international": "bahrain",
  // Belgium
  "spa": "spa",
  "spa-francorchamps": "spa",
  "belgium": "spa",
  // Brazil
  "interlagos": "interlagos",
  "brazil": "interlagos",
  "sao paulo": "interlagos",
  // Canada
  "montreal": "villeneuve",
  "canada": "villeneuve",
  "gilles villeneuve": "villeneuve",
  // China
  "shanghai": "shanghai",
  "china": "shanghai",
  // Hungary
  "hungaroring": "hungaroring",
  "hungary": "hungaroring",
  "budapest": "hungaroring",
  // Italy - Imola
  "imola": "imola",
  "emilia romagna": "imola",
  // Italy - Monza
  "monza": "monza",
  "italy": "monza",
  "italian": "monza",
  // Japan
  "suzuka": "suzuka",
  "japan": "suzuka",
  // Mexico
  "mexico": "rodriguez",
  "mexico city": "rodriguez",
  "hermanos rodriguez": "rodriguez",
  // Monaco
  "monaco": "monaco",
  "monte carlo": "monaco",
  // Netherlands
  "zandvoort": "zandvoort",
  "netherlands": "zandvoort",
  // Austria
  "austria": "red_bull_ring",
  "red bull ring": "red_bull_ring",
  "spielberg": "red_bull_ring",
  // Azerbaijan
  "baku": "baku",
  "azerbaijan": "baku",
  // Saudi Arabia
  "jeddah": "jeddah",
  "saudi arabia": "jeddah",
  // Singapore
  "singapore": "marina_bay",
  "marina bay": "marina_bay",
  // Spain
  "barcelona": "catalunya",
  "spain": "catalunya",
  "catalunya": "catalunya",
  // Great Britain
  "silverstone": "silverstone",
  "uk": "silverstone",
  "britain": "silverstone",
  "great britain": "silverstone",
  // USA - COTA
  "cota": "americas",
  "austin": "americas",
  "circuit of the americas": "americas",
  // USA - Miami
  "miami": "miami",
  // USA - Las Vegas
  "las vegas": "vegas",
  "vegas": "vegas",
  // Qatar
  "qatar": "losail",
  "lusail": "losail",
};

interface RaceResult {
  year: number;
  driver: string;
  driverCode: string;
  team: string;
  time?: string;
  status?: string;
}

interface QualifyingResult {
  year: number;
  driver: string;
  driverCode: string;
  team: string;
  q3Time?: string;
  q2Time?: string;
  q1Time?: string;
}

interface CircuitInfo {
  circuitId: string;
  circuitName: string;
  locality: string;
  country: string;
  lat: string;
  long: string;
  url: string;
}

interface HistoryResponse {
  circuit: CircuitInfo | null;
  winners: RaceResult[];
  poles: QualifyingResult[];
  totalRaces: number;
  firstRaceYear: number | null;
  lastRaceYear: number | null;
}

// Jolpica F1 API - Ergast replacement (ergast.com was deprecated in 2024)
const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const circuitName = searchParams.get("circuit")?.toLowerCase().trim();

  if (!circuitName) {
    return NextResponse.json(
      { error: "Circuit name is required" },
      { status: 400 }
    );
  }

  // Find Ergast circuit ID
  let circuitId: string | null = null;

  // Exact match first
  if (ERGAST_CIRCUIT_IDS[circuitName]) {
    circuitId = ERGAST_CIRCUIT_IDS[circuitName];
  }

  // Partial match
  if (!circuitId) {
    for (const [key, value] of Object.entries(ERGAST_CIRCUIT_IDS)) {
      if (circuitName.includes(key) || key.includes(circuitName)) {
        circuitId = value;
        break;
      }
    }
  }

  if (!circuitId) {
    return NextResponse.json(
      { error: `Circuit not found: ${circuitName}` },
      { status: 404 }
    );
  }

  try {
    // Fetch race results and qualifying results in parallel
    const [resultsRes, qualifyingRes, circuitRes] = await Promise.all([
      fetch(`${JOLPICA_BASE}/circuits/${circuitId}/results/1.json?limit=1000`, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      }),
      fetch(`${JOLPICA_BASE}/circuits/${circuitId}/qualifying/1.json?limit=500`, {
        next: { revalidate: 86400 },
      }),
      fetch(`${JOLPICA_BASE}/circuits/${circuitId}.json`, {
        next: { revalidate: 86400 },
      }),
    ]);

    const [resultsData, qualifyingData, circuitData] = await Promise.all([
      resultsRes.json(),
      qualifyingRes.json(),
      circuitRes.json(),
    ]);

    // Parse circuit info
    const circuitInfo = circuitData?.MRData?.CircuitTable?.Circuits?.[0] || null;
    const circuit: CircuitInfo | null = circuitInfo ? {
      circuitId: circuitInfo.circuitId,
      circuitName: circuitInfo.circuitName,
      locality: circuitInfo.Location?.locality || "",
      country: circuitInfo.Location?.country || "",
      lat: circuitInfo.Location?.lat || "",
      long: circuitInfo.Location?.long || "",
      url: circuitInfo.url || "",
    } : null;

    // Parse winners (race results - position 1)
    const races = resultsData?.MRData?.RaceTable?.Races || [];
    const winners: RaceResult[] = races.map((race: any) => {
      const result = race.Results?.[0];
      if (!result) return null;
      return {
        year: parseInt(race.season),
        driver: `${result.Driver?.givenName || ""} ${result.Driver?.familyName || ""}`.trim(),
        driverCode: result.Driver?.code || "",
        team: result.Constructor?.name || "",
        time: result.Time?.time || null,
        status: result.status || "",
      };
    }).filter(Boolean).reverse(); // Reverse to show most recent first

    // Parse pole sitters (qualifying results - position 1)
    const qualifyingRaces = qualifyingData?.MRData?.RaceTable?.Races || [];
    const poles: QualifyingResult[] = qualifyingRaces.map((race: any) => {
      const result = race.QualifyingResults?.[0];
      if (!result) return null;
      return {
        year: parseInt(race.season),
        driver: `${result.Driver?.givenName || ""} ${result.Driver?.familyName || ""}`.trim(),
        driverCode: result.Driver?.code || "",
        team: result.Constructor?.name || "",
        q3Time: result.Q3 || null,
        q2Time: result.Q2 || null,
        q1Time: result.Q1 || null,
      };
    }).filter(Boolean).reverse(); // Reverse to show most recent first

    // Calculate stats
    const years = winners.map((w) => w.year);
    const firstRaceYear = years.length > 0 ? Math.min(...years) : null;
    const lastRaceYear = years.length > 0 ? Math.max(...years) : null;

    const response: HistoryResponse = {
      circuit,
      winners,
      poles,
      totalRaces: winners.length,
      firstRaceYear,
      lastRaceYear,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Circuit history API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch circuit history" },
      { status: 500 }
    );
  }
}
