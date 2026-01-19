// Convert existing circuits.ts to individual JSON files
// Run with: npx tsx scripts/convert-circuits.ts

import { circuits } from "../src/lib/circuits";
import * as fs from "fs";
import * as path from "path";

const outputDir = path.join(__dirname, "../src/data/circuits");

// Map old keys to new IDs
const keyToId: Record<string, string> = {
  "yas marina circuit": "yas_marina",
  "monaco": "monaco",
  "silverstone circuit": "silverstone",
  "monza": "monza",
  "spa-francorchamps": "spa",
  "suzuka": "suzuka",
  "marina bay": "marina_bay",
  "cota": "cota",
  "sakhir": "bahrain",
  "jeddah": "jeddah",
  "albert park": "albert_park",
  "imola": "imola",
  "miami": "miami",
  "barcelona": "barcelona",
  "montreal": "montreal",
  "red bull ring": "red_bull_ring",
  "hungaroring": "hungaroring",
  "zandvoort": "zandvoort",
  "mexico": "mexico",
  "interlagos": "interlagos",
  "las vegas": "las_vegas",
  "lusail": "lusail",
};

// Location mappings (more specific than just country)
const locationMap: Record<string, string> = {
  "yas_marina": "Abu Dhabi",
  "monaco": "Monte Carlo",
  "silverstone": "Northamptonshire",
  "monza": "Monza",
  "spa": "Stavelot",
  "suzuka": "Suzuka",
  "marina_bay": "Singapore",
  "cota": "Austin, Texas",
  "bahrain": "Sakhir",
  "jeddah": "Jeddah",
  "albert_park": "Melbourne",
  "imola": "Imola",
  "miami": "Miami Gardens, Florida",
  "barcelona": "Montmeló",
  "montreal": "Montreal",
  "red_bull_ring": "Spielberg",
  "hungaroring": "Mogyoród",
  "zandvoort": "Zandvoort",
  "mexico": "Mexico City",
  "interlagos": "São Paulo",
  "las_vegas": "Las Vegas, Nevada",
  "lusail": "Lusail",
};

function convertCircuit(key: string, data: any) {
  const id = keyToId[key] || key.replace(/\s+/g, "_").toLowerCase();
  const location = locationMap[id] || data.country;

  const result: any = {
    id,
    name: data.name,
    shortName: data.shortName,
    location,
    country: data.country,
    length: data.length,
    turns: data.turns,
  };

  if (data.firstGP) {
    result.firstGP = data.firstGP;
  }

  result.svg = {
    viewBox: data.viewBox,
    path: data.path.replace(/\s+/g, " ").trim(),
    startFinish: data.startFinish,
  };

  // Default sectors (can be customized per circuit later)
  result.sectors = [
    { id: 1, start: 0, end: 0.33, color: "#ef4444" },
    { id: 2, start: 0.33, end: 0.66, color: "#eab308" },
    { id: 3, start: 0.66, end: 1, color: "#22d3ee" },
  ];

  // Empty arrays for manual customization later
  result.corners = [];
  result.drsZones = [];

  if (data.lapRecord) {
    result.records = {
      lapRecord: data.lapRecord,
    };
  }

  return result;
}

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Convert all circuits
let created = 0;
let skipped = 0;

for (const [key, data] of Object.entries(circuits)) {
  const converted = convertCircuit(key, data);
  const filename = path.join(outputDir, `${converted.id}.json`);

  // Don't overwrite existing files (preserve manual edits)
  if (fs.existsSync(filename)) {
    console.log(`⏭️  Skipping ${converted.id} (already exists)`);
    skipped++;
    continue;
  }

  fs.writeFileSync(filename, JSON.stringify(converted, null, 2) + "\n");
  console.log(`✅ Created ${converted.id}.json`);
  created++;
}

console.log(`\nDone! Created ${created} files, skipped ${skipped} existing files.`);
