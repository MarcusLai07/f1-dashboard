import { NextRequest, NextResponse } from "next/server";
import { openf1Fetch } from "@/lib/openf1";
import { getDriversFull, getTeamsFull } from "@/data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionKey = searchParams.get("session_key");

  if (!sessionKey) {
    return NextResponse.json(
      { error: "session_key is required" },
      { status: 400 }
    );
  }

  try {
    const response = await openf1Fetch(
      `/drivers?session_key=${sessionKey}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes (drivers don't change mid-session)
      }
    );

    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.status}`);
    }

    const driversData = await response.json();
    const drivers = Array.isArray(driversData) ? driversData : [];

    // Load local data as fallback
    const [localDrivers, localTeams] = await Promise.all([
      getDriversFull().catch(() => []),
      getTeamsFull().catch(() => []),
    ]);
    const localDriverMap = new Map(localDrivers.map(d => [d.number, d]));
    const localTeamMap = new Map(localTeams.map(t => [t.id, t]));

    // Transform to our format (with local fallback)
    const formattedDrivers = drivers.map((d: any) => {
      const local = localDriverMap.get(d.driver_number);
      const localTeam = local?.teamId ? localTeamMap.get(local.teamId) : undefined;
      return {
        driverNumber: d.driver_number,
        driverCode: d.name_acronym || local?.code || `D${d.driver_number}`,
        firstName: d.first_name || local?.firstName || "",
        lastName: d.last_name || local?.lastName || "",
        fullName: d.full_name || (local ? `${local.firstName} ${local.lastName}` : ""),
        teamName: d.team_name || localTeam?.name || "Unknown",
        teamColor: d.team_colour ? `#${d.team_colour}` : (localTeam?.color || "#808080"),
        countryCode: d.country_code || local?.country || "",
        headshotUrl: d.headshot_url || "",
      };
    });

    return NextResponse.json({
      drivers: formattedDrivers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Drivers API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}
