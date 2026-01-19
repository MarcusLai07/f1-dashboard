import { NextResponse } from "next/server";
import { TEAM_COLORS, DRIVER_TEAMS, DRIVER_NUMBERS } from "@/lib/constants";

// 2026 Team Information
const TEAMS_2026 = [
  {
    id: "mclaren",
    name: "McLaren",
    fullName: "McLaren Formula 1 Team",
    engine: "Mercedes",
    base: "Woking, United Kingdom",
    principal: "Andrea Stella",
    drivers: ["NOR", "PIA"],
    isNew: false,
  },
  {
    id: "ferrari",
    name: "Ferrari",
    fullName: "Scuderia Ferrari",
    engine: "Ferrari",
    base: "Maranello, Italy",
    principal: "Frédéric Vasseur",
    drivers: ["LEC", "HAM"],
    isNew: false,
  },
  {
    id: "redbull",
    name: "Red Bull Racing",
    fullName: "Oracle Red Bull Racing",
    engine: "Red Bull Ford",
    base: "Milton Keynes, United Kingdom",
    principal: "Laurent Mekies",
    drivers: ["VER", "HAD"],
    isNew: false,
  },
  {
    id: "mercedes",
    name: "Mercedes",
    fullName: "Mercedes-AMG Petronas F1 Team",
    engine: "Mercedes",
    base: "Brackley, United Kingdom",
    principal: "Toto Wolff",
    drivers: ["RUS", "ANT"],
    isNew: false,
  },
  {
    id: "astonmartin",
    name: "Aston Martin",
    fullName: "Aston Martin Aramco F1 Team",
    engine: "Honda",
    base: "Silverstone, United Kingdom",
    principal: "Adrian Newey",
    drivers: ["ALO", "STR"],
    isNew: false,
  },
  {
    id: "alpine",
    name: "Alpine",
    fullName: "BWT Alpine F1 Team",
    engine: "Mercedes",
    base: "Enstone, United Kingdom",
    principal: "Flavio Briatore",
    drivers: ["GAS", "COL"],
    isNew: false,
  },
  {
    id: "williams",
    name: "Williams",
    fullName: "Williams Racing",
    engine: "Mercedes",
    base: "Grove, United Kingdom",
    principal: "James Vowles",
    drivers: ["ALB", "SAI"],
    isNew: false,
  },
  {
    id: "racingbulls",
    name: "Racing Bulls",
    fullName: "Visa Cash App Racing Bulls",
    engine: "Red Bull Ford",
    base: "Faenza, Italy",
    principal: "Alan Permane",
    drivers: ["LAW", "LIN"],
    isNew: false,
  },
  {
    id: "audi",
    name: "Audi",
    fullName: "Audi F1 Team",
    engine: "Audi",
    base: "Hinwil, Switzerland",
    principal: "Jonathan Wheatley",
    drivers: ["HUL", "BOR"],
    isNew: false,
  },
  {
    id: "haas",
    name: "Haas F1 Team",
    fullName: "MoneyGram Haas F1 Team",
    engine: "Ferrari",
    base: "Kannapolis, United States",
    principal: "Ayao Komatsu",
    drivers: ["OCO", "BEA"],
    isNew: false,
  },
  {
    id: "cadillac",
    name: "Cadillac",
    fullName: "Cadillac F1 Team",
    engine: "Ferrari",
    base: "United States",
    principal: "Graeme Lowdon",
    drivers: ["PER", "BOT"],
    isNew: true,
  },
];

// F1 Media base URL for driver headshots
// URL pattern: common/f1/2026/[TEAM]/[DRIVER_CODE]/2026[TEAM][DRIVER_CODE]right.webp
// Using g_face for automatic face detection cropping
const F1_MEDIA_BASE = "https://media.formula1.com/image/upload/c_fill,g_face,w_320,h_320/q_auto/f_auto/common/f1/2026";

// Helper to build driver image URL
function driverImg(team: string, code: string): string {
  return `${F1_MEDIA_BASE}/${team}/${code}/2026${team}${code}right.webp`;
}

// Driver details with image URLs
interface DriverDetail {
  firstName: string;
  lastName: string;
  nationality: string;
  flag: string;
  imageUrl: string;
}

const DRIVER_DETAILS: Record<string, DriverDetail> = {
  // Red Bull Racing
  VER: { firstName: "Max", lastName: "Verstappen", nationality: "Dutch", flag: "🇳🇱", imageUrl: driverImg("redbullracing", "maxver01") },
  HAD: { firstName: "Isack", lastName: "Hadjar", nationality: "French", flag: "🇫🇷", imageUrl: driverImg("redbullracing", "isahad01") },
  // Ferrari
  LEC: { firstName: "Charles", lastName: "Leclerc", nationality: "Monégasque", flag: "🇲🇨", imageUrl: driverImg("ferrari", "chalec01") },
  HAM: { firstName: "Lewis", lastName: "Hamilton", nationality: "British", flag: "🇬🇧", imageUrl: driverImg("ferrari", "lewham01") },
  // McLaren
  NOR: { firstName: "Lando", lastName: "Norris", nationality: "British", flag: "🇬🇧", imageUrl: driverImg("mclaren", "lannor01") },
  PIA: { firstName: "Oscar", lastName: "Piastri", nationality: "Australian", flag: "🇦🇺", imageUrl: driverImg("mclaren", "oscpia01") },
  // Mercedes
  RUS: { firstName: "George", lastName: "Russell", nationality: "British", flag: "🇬🇧", imageUrl: driverImg("mercedes", "georus01") },
  ANT: { firstName: "Kimi", lastName: "Antonelli", nationality: "Italian", flag: "🇮🇹", imageUrl: driverImg("mercedes", "andant01") },
  // Aston Martin
  ALO: { firstName: "Fernando", lastName: "Alonso", nationality: "Spanish", flag: "🇪🇸", imageUrl: driverImg("astonmartin", "feralo01") },
  STR: { firstName: "Lance", lastName: "Stroll", nationality: "Canadian", flag: "🇨🇦", imageUrl: driverImg("astonmartin", "lanstr01") },
  // Alpine
  GAS: { firstName: "Pierre", lastName: "Gasly", nationality: "French", flag: "🇫🇷", imageUrl: driverImg("alpine", "piegas01") },
  COL: { firstName: "Franco", lastName: "Colapinto", nationality: "Argentine", flag: "🇦🇷", imageUrl: driverImg("alpine", "fracol01") },
  // Williams
  ALB: { firstName: "Alex", lastName: "Albon", nationality: "Thai", flag: "🇹🇭", imageUrl: driverImg("williams", "alealb01") },
  SAI: { firstName: "Carlos", lastName: "Sainz", nationality: "Spanish", flag: "🇪🇸", imageUrl: driverImg("williams", "carsai01") },
  // Racing Bulls
  LAW: { firstName: "Liam", lastName: "Lawson", nationality: "New Zealander", flag: "🇳🇿", imageUrl: driverImg("racingbulls", "lialaw01") },
  LIN: { firstName: "Arvid", lastName: "Lindblad", nationality: "British", flag: "🇬🇧", imageUrl: driverImg("racingbulls", "arvlin01") },
  // Audi
  HUL: { firstName: "Nico", lastName: "Hulkenberg", nationality: "German", flag: "🇩🇪", imageUrl: driverImg("audi", "nichul01") },
  BOR: { firstName: "Gabriel", lastName: "Bortoleto", nationality: "Brazilian", flag: "🇧🇷", imageUrl: driverImg("audi", "gabbor01") },
  // Cadillac
  PER: { firstName: "Sergio", lastName: "Perez", nationality: "Mexican", flag: "🇲🇽", imageUrl: driverImg("cadillac", "serper01") },
  BOT: { firstName: "Valtteri", lastName: "Bottas", nationality: "Finnish", flag: "🇫🇮", imageUrl: driverImg("cadillac", "valbot01") },
  // Haas
  OCO: { firstName: "Esteban", lastName: "Ocon", nationality: "French", flag: "🇫🇷", imageUrl: driverImg("haas", "estoco01") },
  BEA: { firstName: "Oliver", lastName: "Bearman", nationality: "British", flag: "🇬🇧", imageUrl: driverImg("haas", "olibea01") },
};

export async function GET() {
  try {
    // Try to fetch current standings to merge with team data
    let standingsData: Record<string, number> = {};
    let constructorPoints: Record<string, { points: number; position: number }> = {};

    try {
      const standingsRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/season/standings`,
        { next: { revalidate: 300 } }
      );
      if (standingsRes.ok) {
        const standings = await standingsRes.json();
        // Build driver points lookup
        for (const driver of standings.driverStandings || []) {
          standingsData[driver.driverCode] = driver.points;
        }
        // Build constructor points lookup
        for (const constructor of standings.constructorStandings || []) {
          constructorPoints[constructor.name] = {
            points: constructor.points,
            position: constructor.position,
          };
        }
      }
    } catch {
      // Standings fetch failed, continue with zeros
      console.log("Could not fetch standings for teams, using defaults");
    }

    // Build team response with driver details and standings
    const teams = TEAMS_2026.map((team) => {
      const teamColor = TEAM_COLORS[team.name] || "#808080";
      const constructorData = constructorPoints[team.name] || { points: 0, position: 0 };

      const drivers = team.drivers.map((code) => {
        const details = DRIVER_DETAILS[code];
        return {
          code,
          number: DRIVER_NUMBERS[code] || 0,
          firstName: details?.firstName || code,
          lastName: details?.lastName || "",
          nationality: details?.nationality || "",
          flag: details?.flag || "🏁",
          imageUrl: details?.imageUrl || "",
          points: standingsData[code] || 0,
        };
      });

      return {
        id: team.id,
        name: team.name,
        fullName: team.fullName,
        color: teamColor,
        engine: team.engine,
        base: team.base,
        principal: team.principal,
        drivers,
        points: constructorData.points,
        position: constructorData.position,
        isNew: team.isNew,
      };
    });

    // Sort by championship position (0 = unranked, goes to end)
    teams.sort((a, b) => {
      if (a.position === 0 && b.position === 0) return 0;
      if (a.position === 0) return 1;
      if (b.position === 0) return -1;
      return a.position - b.position;
    });

    return NextResponse.json({
      teams,
      season: 2026,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Teams API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
