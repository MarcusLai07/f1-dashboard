// GET /api/circuit?name=... - Get circuit by name (legacy endpoint)
// This endpoint maintains backward compatibility with the existing TrackMap3D component
// For new code, prefer using /api/f1/circuits/[id] directly

import { NextRequest, NextResponse } from "next/server";
import { getCircuit, getAllCircuitIds } from "@/data";

// Map various circuit name aliases to canonical IDs in src/data/circuits/
const CIRCUIT_NAME_MAP: Record<string, string> = {
  // Abu Dhabi / Yas Marina
  "yas marina": "yas_marina",
  "yas_marina": "yas_marina",
  "abu dhabi": "yas_marina",
  "abu_dhabi": "yas_marina",
  "united arab emirates": "yas_marina",
  // Bahrain
  "bahrain": "bahrain",
  "sakhir": "bahrain",
  "bahrain international": "bahrain",
  // Saudi Arabia
  "jeddah": "jeddah",
  "saudi arabia": "jeddah",
  "saudi": "jeddah",
  "corniche": "jeddah",
  // Australia
  "melbourne": "albert_park",
  "albert park": "albert_park",
  "albert_park": "albert_park",
  "australia": "albert_park",
  // Japan
  "suzuka": "suzuka",
  "japan": "suzuka",
  // China
  "shanghai": "shanghai",
  "china": "shanghai",
  // Miami
  "miami": "miami",
  // Imola
  "imola": "imola",
  "emilia romagna": "imola",
  "emilia-romagna": "imola",
  // Monaco
  "monaco": "monaco",
  "monte carlo": "monaco",
  // Canada
  "montreal": "montreal",
  "canada": "montreal",
  "gilles villeneuve": "montreal",
  // Spain
  "barcelona": "barcelona",
  "spain": "barcelona",
  "catalunya": "barcelona",
  "catalonia": "barcelona",
  // Austria
  "spielberg": "red_bull_ring",
  "austria": "red_bull_ring",
  "red bull ring": "red_bull_ring",
  // Silverstone
  "silverstone": "silverstone",
  "uk": "silverstone",
  "britain": "silverstone",
  "great britain": "silverstone",
  // Hungary
  "hungaroring": "hungaroring",
  "hungary": "hungaroring",
  "budapest": "hungaroring",
  // Spa
  "spa": "spa",
  "belgium": "spa",
  "spa-francorchamps": "spa",
  "francorchamps": "spa",
  // Zandvoort
  "zandvoort": "zandvoort",
  "netherlands": "zandvoort",
  "dutch": "zandvoort",
  // Monza
  "monza": "monza",
  "italy": "monza",
  "italian": "monza",
  // Baku
  "baku": "baku",
  "azerbaijan": "baku",
  // Singapore
  "marina bay": "marina_bay",
  "marina-bay": "marina_bay",
  "marina_bay": "marina_bay",
  "singapore": "marina_bay",
  // Austin / COTA
  "cota": "cota",
  "austin": "cota",
  "texas": "cota",
  "circuit of the americas": "cota",
  // Mexico
  "mexico city": "mexico",
  "mexico-city": "mexico",
  "mexico": "mexico",
  "hermanos rodriguez": "mexico",
  // Interlagos
  "interlagos": "interlagos",
  "brazil": "interlagos",
  "sao paulo": "interlagos",
  "são paulo": "interlagos",
  // Las Vegas
  "las vegas": "las_vegas",
  "las-vegas": "las_vegas",
  "las_vegas": "las_vegas",
  "vegas": "las_vegas",
  // Qatar
  "lusail": "lusail",
  "qatar": "lusail",
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
