/**
 * Circuit Data Migration Script
 *
 * Merges data from:
 * - src/lib/circuitPaths.ts (telemetry-based SVG paths)
 * - src/lib/circuitFeatures.ts (comprehensive circuit features)
 *
 * Into:
 * - src/data/circuits/*.json (comprehensive JSON files)
 *
 * Run with: npx tsx scripts/migrate-circuits.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { circuitPaths } from '../src/lib/circuitPaths';
import { circuitFeatures, type CircuitFeatures, type Turn, type DRSZone, type Sector } from '../src/lib/circuitFeatures';

// Map circuitFeatures keys to our circuit IDs
const circuitIdMap: Record<string, string> = {
  'albert park': 'australia',
  'bahrain': 'bahrain',
  'jeddah': 'saudi-arabia',
  'suzuka': 'japan',
  'shanghai': 'china',
  'miami': 'miami',
  'imola': 'imola',
  'monaco': 'monaco',
  'montreal': 'canada',
  'barcelona': 'spain',
  'austria': 'austria',
  'silverstone': 'great-britain',
  'spa': 'belgium',
  'hungary': 'hungary',
  'zandvoort': 'netherlands',
  'monza': 'italy',
  'baku': 'azerbaijan',
  'singapore': 'singapore',
  'cota': 'usa',
  'mexico': 'mexico',
  'interlagos': 'brazil',
  'las vegas': 'las-vegas',
  'qatar': 'qatar',
  'yas marina': 'abu-dhabi',
};

// Map circuitPaths keys to our circuit IDs
const pathIdMap: Record<string, string> = {
  'bahrain': 'bahrain',
  'jeddah': 'saudi-arabia',
  'melbourne': 'australia',
  'suzuka': 'japan',
  'shanghai': 'china',
  'miami': 'miami',
  'imola': 'imola',
  'monaco': 'monaco',
  'montreal': 'canada',
  'barcelona': 'spain',
  'spielberg': 'austria',
  'silverstone': 'great-britain',
  'spa': 'belgium',
  'hungaroring': 'hungary',
  'zandvoort': 'netherlands',
  'monza': 'italy',
  'baku': 'azerbaijan',
  'austin': 'usa',
  'interlagos': 'brazil',
  'lusail': 'qatar',
};

interface CircuitJson {
  id: string;
  name: string;
  shortName: string;
  location: string;
  country: string;
  length: number;
  turns: number;
  laps: number;
  raceDistance?: number;
  firstGP?: number;
  svg: {
    viewBox: string;
    path: string;
    startFinish?: { x: number; y: number; angle: number };
  };
  corners: Array<{
    number: number;
    name?: string;
    type?: string;
    gear?: number;
    speed?: number;
    position: number;
    labelOffset?: number;
    labelAngle?: number;
  }>;
  drsZones: Array<{
    detection: number;
    activation: number;
    length?: number;
  }>;
  sectors: [
    { number: 1; startPercent: number; endPercent: number; color: string },
    { number: 2; startPercent: number; endPercent: number; color: string },
    { number: 3; startPercent: number; endPercent: number; color: string }
  ];
  pitLaneLength?: number;
  pitLaneTimeLoss?: number;
  speedTrap?: number;
  pathStartOffset?: number;
  records: {
    lapRecord?: { time: string; driver: string; year: number };
  };
  lastUpdated: string;
  dataSource: string;
}

// Get short names from IDs
const shortNames: Record<string, string> = {
  'australia': 'Australia',
  'bahrain': 'Bahrain',
  'saudi-arabia': 'Jeddah',
  'japan': 'Suzuka',
  'china': 'Shanghai',
  'miami': 'Miami',
  'imola': 'Imola',
  'monaco': 'Monaco',
  'canada': 'Montreal',
  'spain': 'Barcelona',
  'austria': 'Austria',
  'great-britain': 'Silverstone',
  'belgium': 'Spa',
  'hungary': 'Hungary',
  'netherlands': 'Zandvoort',
  'italy': 'Monza',
  'azerbaijan': 'Baku',
  'singapore': 'Singapore',
  'usa': 'Austin',
  'mexico': 'Mexico City',
  'brazil': 'Interlagos',
  'las-vegas': 'Las Vegas',
  'qatar': 'Qatar',
  'abu-dhabi': 'Abu Dhabi',
};

function computeViewBox(svgPath: string): string {
  // Extract all coordinates from the SVG path
  const coords: { x: number; y: number }[] = [];
  const regex = /([ML])\s*([\d.]+)\s+([\d.]+)|([CQ])\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s+([\d.]+)\s+([\d.]+))?/g;

  let match;
  while ((match = regex.exec(svgPath)) !== null) {
    if (match[1]) {
      // M or L command
      coords.push({ x: parseFloat(match[2]), y: parseFloat(match[3]) });
    } else if (match[4]) {
      // C or Q command - just get the endpoint
      if (match[9]) {
        coords.push({ x: parseFloat(match[9]), y: parseFloat(match[10]) });
      } else {
        coords.push({ x: parseFloat(match[7]), y: parseFloat(match[8]) });
      }
    }
  }

  // Also parse simple coordinate pairs
  const simpleRegex = /([\d.]+)\s+([\d.]+)/g;
  while ((match = simpleRegex.exec(svgPath)) !== null) {
    const x = parseFloat(match[1]);
    const y = parseFloat(match[2]);
    if (!isNaN(x) && !isNaN(y)) {
      coords.push({ x, y });
    }
  }

  if (coords.length === 0) {
    return "0 0 500 400";
  }

  const minX = Math.min(...coords.map(c => c.x));
  const maxX = Math.max(...coords.map(c => c.x));
  const minY = Math.min(...coords.map(c => c.y));
  const maxY = Math.max(...coords.map(c => c.y));

  const padding = 20;
  const width = Math.ceil(maxX - minX + padding * 2);
  const height = Math.ceil(maxY - minY + padding * 2);

  return `0 0 ${width} ${height}`;
}

function migrate() {
  const outputDir = path.join(__dirname, '../src/data/circuits');
  const manifest: string[] = [];

  console.log('Starting circuit data migration...\n');

  // Process each circuit from circuitFeatures
  for (const [featureKey, features] of Object.entries(circuitFeatures)) {
    const circuitId = circuitIdMap[featureKey];
    if (!circuitId) {
      console.warn(`⚠️  No mapping for feature key: ${featureKey}`);
      continue;
    }

    // Find corresponding path
    let svgPath = '';
    for (const [pathKey, pathValue] of Object.entries(circuitPaths)) {
      if (pathIdMap[pathKey] === circuitId) {
        svgPath = pathValue;
        break;
      }
    }

    if (!svgPath) {
      console.warn(`⚠️  No SVG path found for: ${circuitId}`);
      // Use a placeholder path
      svgPath = 'M 100,200 L 400,200';
    }

    // Create comprehensive JSON
    const circuit: CircuitJson = {
      id: circuitId,
      name: features.name,
      shortName: shortNames[circuitId] || features.location,
      location: features.location,
      country: features.country,
      length: features.length,
      turns: features.turns.length,
      laps: features.laps,
      raceDistance: features.raceDistance,
      firstGP: features.firstGP,
      svg: {
        viewBox: computeViewBox(svgPath),
        path: svgPath,
      },
      corners: features.turns.map((turn: Turn) => ({
        number: turn.number,
        name: turn.name,
        type: turn.type,
        gear: turn.gear,
        speed: turn.speed,
        position: turn.position || 0,
        labelOffset: turn.labelOffset,
        labelAngle: turn.labelAngle,
      })),
      drsZones: features.drsZones.map((zone: DRSZone) => ({
        detection: zone.detection,
        activation: zone.activation,
        length: zone.length,
      })),
      sectors: features.sectors.map((sector: Sector) => ({
        number: sector.number,
        startPercent: sector.startPercent,
        endPercent: sector.endPercent,
        color: sector.color,
      })) as CircuitJson['sectors'],
      pitLaneLength: features.pitLaneLength,
      pitLaneTimeLoss: features.pitLaneTimeLoss,
      speedTrap: features.speedTrap,
      pathStartOffset: features.pathStartOffset,
      records: {
        lapRecord: features.lapRecord,
      },
      lastUpdated: new Date().toISOString().split('T')[0],
      dataSource: 'FastF1 2024 Qualifying + circuitFeatures.ts',
    };

    // Write JSON file
    const outputPath = path.join(outputDir, `${circuitId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(circuit, null, 2));
    manifest.push(circuitId);

    console.log(`✅ Migrated: ${circuitId} (${features.turns.length} turns, ${features.drsZones.length} DRS zones)`);
  }

  // Update manifest
  const manifestPath = path.join(outputDir, '_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    version: '2.0.0',
    lastUpdated: new Date().toISOString(),
    ids: manifest.sort(),
  }, null, 2));

  console.log(`\n✅ Migration complete! ${manifest.length} circuits migrated.`);
  console.log(`📁 Output: ${outputDir}`);
}

migrate();
