// Utility to load circuit SVG paths from the f1-circuits-svg repository
// SVG data source: https://github.com/julesr0y/f1-circuits-svg

import circuitsData from "@/data/f1-circuits-svg/circuits.json";

export interface CircuitLayout {
  layoutId: string;
  seasons: string;
  otherId?: string;
}

export interface CircuitInfo {
  id: string;
  name: string;
  countryId: string;
  latitude: number;
  longitude: number;
  layouts: CircuitLayout[];
}

// Type the imported data
const circuits = circuitsData as CircuitInfo[];

// Map of circuit IDs to their current (2026) layout file names
export const currentLayoutMap: Record<string, string> = {
  "bahrain": "bahrain-1",
  "jeddah": "jeddah-1",
  "melbourne": "melbourne-2",
  "suzuka": "suzuka-2",
  "shanghai": "shanghai-1",
  "miami": "miami-1",
  "imola": "imola-3",
  "monaco": "monaco-5",
  "montreal": "montreal-6",
  "catalunya": "catalunya-6",
  "spielberg": "spielberg-3", // Red Bull Ring
  "silverstone": "silverstone-8",
  "hungaroring": "hungaroring-3",
  "spa-francorchamps": "spa-francorchamps-4",
  "zandvoort": "zandvoort-5", // 2021-2026 layout
  "monza": "monza-6",
  "baku": "baku-1",
  "marina-bay": "marina-bay-4",
  "austin": "austin-1",
  "mexico-city": "mexico-city-3",
  "interlagos": "interlagos-2",
  "las-vegas": "las-vegas-1",
  "lusail": "lusail-1",
  "yas-marina": "yas-marina-2",
};

// Get circuit info by ID
export function getCircuitInfo(circuitId: string): CircuitInfo | undefined {
  return circuits.find(c => c.id === circuitId);
}

// Get the current layout ID for a circuit (2026 season)
export function getCurrentLayoutId(circuitId: string): string | undefined {
  return currentLayoutMap[circuitId];
}

// Get all current season circuits
export function getCurrentSeasonCircuits(): CircuitInfo[] {
  return circuits.filter(c => currentLayoutMap[c.id] !== undefined);
}

// SVG path cache to avoid re-reading files
const svgPathCache: Record<string, string> = {};

// Extract path from SVG string
export function extractPathFromSvg(svgContent: string): string | null {
  const pathMatch = svgContent.match(/d="([^"]+)"/);
  return pathMatch ? pathMatch[1] : null;
}

// Get the SVG file path for a circuit layout
export function getSvgFilePath(layoutId: string, style: "white" | "black" | "white-outline" | "black-outline" = "white"): string {
  return `/data/f1-circuits-svg/circuits/${style}/${layoutId}.svg`;
}

// Country ID to display name mapping
export const countryNames: Record<string, string> = {
  "australia": "Australia",
  "austria": "Austria",
  "azerbaijan": "Azerbaijan",
  "bahrain": "Bahrain",
  "belgium": "Belgium",
  "brazil": "Brazil",
  "canada": "Canada",
  "china": "China",
  "france": "France",
  "germany": "Germany",
  "hungary": "Hungary",
  "italy": "Italy",
  "japan": "Japan",
  "mexico": "Mexico",
  "monaco": "Monaco",
  "netherlands": "Netherlands",
  "portugal": "Portugal",
  "qatar": "Qatar",
  "russia": "Russia",
  "saudi-arabia": "Saudi Arabia",
  "singapore": "Singapore",
  "spain": "Spain",
  "turkey": "Turkey",
  "united-arab-emirates": "UAE",
  "united-kingdom": "UK",
  "united-states-of-america": "USA",
};

// Get country display name
export function getCountryName(countryId: string): string {
  return countryNames[countryId] || countryId;
}
