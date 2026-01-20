import { NextResponse } from "next/server";
import { getTeamsFull, getDriversFull } from "@/data";

export async function GET() {
  try {
    // Fetch data from unified data layer
    const [teams, drivers] = await Promise.all([
      getTeamsFull(),
      getDriversFull(),
    ]);

    // Build driver lookup by code
    const driverLookup = new Map(drivers.map((d) => [d.code, d]));

    // Try to fetch current standings to merge with team data
    const standingsData: Record<string, number> = {};
    const constructorPoints: Record<string, { points: number; position: number }> = {};

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
    const teamsWithDetails = teams.map((team) => {
      const constructorData = constructorPoints[team.name] || { points: 0, position: 0 };

      const teamDrivers = team.drivers.map((code) => {
        const driver = driverLookup.get(code);
        return {
          code,
          number: driver?.number || 0,
          firstName: driver?.firstName || code,
          lastName: driver?.lastName || "",
          nationality: driver?.nationality || "",
          flag: driver?.flag || "🏁",
          imageUrl: driver?.imageUrl || "",
          points: standingsData[code] || 0,
        };
      });

      return {
        id: team.id,
        name: team.name,
        fullName: team.fullName,
        color: team.color,
        engine: team.engine,
        base: team.base,
        principal: team.principal,
        drivers: teamDrivers,
        points: constructorData.points,
        position: constructorData.position,
        isNew: team.isNew,
      };
    });

    // Sort by championship position (0 = unranked, goes to end)
    teamsWithDetails.sort((a, b) => {
      if (a.position === 0 && b.position === 0) return 0;
      if (a.position === 0) return 1;
      if (b.position === 0) return -1;
      return a.position - b.position;
    });

    return NextResponse.json({
      teams: teamsWithDetails,
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
