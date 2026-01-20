// GET /api/circuit?name=... - Get circuit by name (legacy endpoint)
// This endpoint maintains backward compatibility with the existing TrackMap3D component
// For new code, prefer using /api/f1/circuits/[id] directly

import { NextRequest, NextResponse } from "next/server";
import { getCircuit, getAllCircuitIds } from "@/data";

// Map various circuit name aliases to canonical IDs in src/data/circuits/
// Uses circuit-based IDs (e.g., "albert-park", "silverstone", "monza")
const CIRCUIT_NAME_MAP: Record<string, string> = {
  // Albert Park (Australia)
  "albert park": "albert-park",
  "albert park circuit": "albert-park",
  "albert park grand prix circuit": "albert-park",
  "melbourne": "albert-park",
  "australia": "albert-park",
  // Bahrain
  "bahrain": "bahrain",
  "bahrain international circuit": "bahrain",
  "sakhir": "bahrain",
  // Baku (Azerbaijan)
  "baku": "baku",
  "baku city circuit": "baku",
  "azerbaijan": "baku",
  // Barcelona (Spain)
  "barcelona": "barcelona",
  "circuit de barcelona-catalunya": "barcelona",
  "spain": "barcelona",
  "catalunya": "barcelona",
  "catalonia": "barcelona",
  // COTA (USA - Austin)
  "cota": "cota",
  "circuit of the americas": "cota",
  "austin": "cota",
  "texas": "cota",
  "usa": "cota",
  // Hungaroring (Hungary)
  "hungaroring": "hungaroring",
  "hungary": "hungaroring",
  "budapest": "hungaroring",
  // Imola
  "imola": "imola",
  "autodromo enzo e dino ferrari": "imola",
  "emilia romagna": "imola",
  "emilia-romagna": "imola",
  // Interlagos (Brazil)
  "interlagos": "interlagos",
  "autódromo josé carlos pace": "interlagos",
  "autodromo jose carlos pace": "interlagos",
  "brazil": "interlagos",
  "sao paulo": "interlagos",
  "são paulo": "interlagos",
  // Jeddah (Saudi Arabia)
  "jeddah": "jeddah",
  "jeddah corniche circuit": "jeddah",
  "saudi arabia": "jeddah",
  "saudi": "jeddah",
  "corniche": "jeddah",
  // Las Vegas
  "las vegas": "las-vegas",
  "las vegas strip circuit": "las-vegas",
  "vegas": "las-vegas",
  // Lusail (Qatar)
  "lusail": "lusail",
  "lusail international circuit": "lusail",
  "qatar": "lusail",
  // Marina Bay (Singapore)
  "marina bay": "marina-bay",
  "marina bay street circuit": "marina-bay",
  "singapore": "marina-bay",
  // Mexico City
  "mexico city": "mexico-city",
  "autódromo hermanos rodríguez": "mexico-city",
  "autodromo hermanos rodriguez": "mexico-city",
  "mexico": "mexico-city",
  "hermanos rodriguez": "mexico-city",
  // Miami
  "miami": "miami",
  "miami international autodrome": "miami",
  // Monaco
  "monaco": "monaco",
  "circuit de monaco": "monaco",
  "monte carlo": "monaco",
  // Montreal (Canada)
  "montreal": "montreal",
  "circuit gilles villeneuve": "montreal",
  "canada": "montreal",
  "gilles villeneuve": "montreal",
  // Monza (Italy)
  "monza": "monza",
  "autodromo nazionale monza": "monza",
  "italy": "monza",
  "italian": "monza",
  // Red Bull Ring (Austria)
  "red bull ring": "red-bull-ring",
  "spielberg": "red-bull-ring",
  "austria": "red-bull-ring",
  // Shanghai (China)
  "shanghai": "shanghai",
  "shanghai international circuit": "shanghai",
  "china": "shanghai",
  // Silverstone (Great Britain)
  "silverstone": "silverstone",
  "silverstone circuit": "silverstone",
  "great britain": "silverstone",
  "britain": "silverstone",
  "uk": "silverstone",
  // Spa (Belgium)
  "spa": "spa",
  "circuit de spa-francorchamps": "spa",
  "spa-francorchamps": "spa",
  "belgium": "spa",
  "francorchamps": "spa",
  // Suzuka (Japan)
  "suzuka": "suzuka",
  "suzuka international racing course": "suzuka",
  "japan": "suzuka",
  // Yas Marina (Abu Dhabi)
  "yas marina": "yas-marina",
  "yas marina circuit": "yas-marina",
  "abu dhabi": "yas-marina",
  "uae": "yas-marina",
  "united arab emirates": "yas-marina",
  // Zandvoort (Netherlands)
  "zandvoort": "zandvoort",
  "circuit zandvoort": "zandvoort",
  "netherlands": "zandvoort",
  "dutch": "zandvoort",
};

// Response format expected by TrackMap3D component
interface CircuitResponse {
  name: string;
  location: string;
  length: number;
  coordinates: [number, number][];
  svgPath: string;
  viewBox: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const circuitName = searchParams.get("name")?.toLowerCase().trim();

  if (!circuitName) {
    return NextResponse.json(
      { error: "Circuit name is required" },
      { status: 400 }
    );
  }

  // Resolve circuit name to canonical ID
  let circuitId: string | null = null;

  // Exact match first
  if (CIRCUIT_NAME_MAP[circuitName]) {
    circuitId = CIRCUIT_NAME_MAP[circuitName];
  }

  // If no exact match, try partial matching
  if (!circuitId) {
    for (const [key, value] of Object.entries(CIRCUIT_NAME_MAP)) {
      if (circuitName.includes(key) || key.includes(circuitName)) {
        circuitId = value;
        break;
      }
    }
  }

  // If still no match, try using the name directly as an ID
  if (!circuitId) {
    circuitId = circuitName.replace(/[\s-]+/g, "_");
  }

  try {
    // Fetch circuit from data layer
    const circuit = await getCircuit(circuitId);

    if (!circuit) {
      // Try one more time with the raw circuit name
      const allIds = await getAllCircuitIds();
      const availableCircuits = allIds.join(", ");

      return NextResponse.json(
        {
          error: `Circuit not found: ${circuitName}`,
          availableCircuits,
        },
        { status: 404 }
      );
    }

    // Transform to response format expected by TrackMap3D
    const result: CircuitResponse = {
      name: circuit.name,
      location: circuit.location,
      length: circuit.length,
      coordinates: [], // Not used by current implementation
      svgPath: circuit.svg.path,
      viewBox: circuit.svg.viewBox,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Circuit API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch circuit data" },
      { status: 500 }
    );
  }
}
