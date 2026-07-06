import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Map circuit short names from OpenF1 to our JSON file names
const circuitNameMap: Record<string, string> = {
  // OpenF1 short name -> our file name (without .json)
  "bahrain": "bahrain",
  "sakhir": "bahrain",
  "jeddah": "jeddah",
  "saudi arabia": "jeddah",
  "melbourne": "albert-park",
  "albert park": "albert-park",
  "australia": "albert-park",
  "suzuka": "suzuka",
  "japan": "suzuka",
  "shanghai": "shanghai",
  "china": "shanghai",
  "miami": "miami",
  "imola": "imola",
  "monaco": "monaco",
  "montreal": "montreal",
  "canada": "montreal",
  "barcelona": "barcelona",
  "spain": "barcelona",
  "spielberg": "red-bull-ring",
  "austria": "red-bull-ring",
  "red bull ring": "red-bull-ring",
  "silverstone": "silverstone",
  "great britain": "silverstone",
  "hungaroring": "hungaroring",
  "hungary": "hungaroring",
  "spa": "spa",
  "spa-francorchamps": "spa",
  "belgium": "spa",
  "zandvoort": "zandvoort",
  "netherlands": "zandvoort",
  "monza": "monza",
  "italy": "monza",
  "baku": "baku",
  "azerbaijan": "baku",
  "marina bay": "marina-bay",
  "singapore": "marina-bay",
  "cota": "cota",
  "austin": "cota",
  "americas": "cota",
  "circuit of the americas": "cota",
  "united states": "cota",
  "usa": "cota",
  "texas": "cota",
  "mexico city": "mexico-city",
  "mexico": "mexico-city",
  "interlagos": "interlagos",
  "sao paulo": "interlagos",
  "brazil": "interlagos",
  "las vegas": "las-vegas",
  "lusail": "lusail",
  "qatar": "lusail",
  "yas marina": "yas-marina",
  "abu dhabi": "yas-marina",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "name parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Normalize the name to lowercase for matching
    const normalizedName = name.toLowerCase().trim();

    // Try to find a matching circuit file
    let fileName = circuitNameMap[normalizedName];

    // If no direct match, try partial matching
    if (!fileName) {
      for (const [key, value] of Object.entries(circuitNameMap)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
          fileName = value;
          break;
        }
      }
    }

    // Fallback: try using the name directly as file name
    if (!fileName) {
      fileName = normalizedName.replace(/\s+/g, "-");
    }

    // Read the circuit JSON file
    const circuitsDir = path.join(process.cwd(), "src/data/circuits");
    const filePath = path.join(circuitsDir, `${fileName}.json`);

    if (!fs.existsSync(filePath)) {
      // Try listing available circuits for debugging
      const availableFiles = fs.readdirSync(circuitsDir)
        .filter(f => f.endsWith(".json") && !f.startsWith("_"))
        .map(f => f.replace(".json", ""));

      return NextResponse.json(
        {
          error: `Circuit not found: ${name}`,
          availableCircuits: availableFiles,
        },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const circuitData = JSON.parse(fileContent);

    // Transform to the format expected by TrackMap3D
    const response = {
      name: circuitData.name,
      location: circuitData.location || circuitData.shortName,
      length: circuitData.length,
      svgPath: circuitData.svg?.path || "",
      pitLanePath: circuitData.svg?.pitLanePath || null,
      viewBox: circuitData.svg?.viewBox || "0 0 800 500",
      coordinates: [],
      geojson: circuitData.geojson || null,
      // Track annotations
      sectors: circuitData.sectors || [],
      corners: circuitData.corners || [],
      drsZones: circuitData.drsZones || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Circuit API error:", error);
    return NextResponse.json(
      { error: "Failed to load circuit data" },
      { status: 500 }
    );
  }
}
