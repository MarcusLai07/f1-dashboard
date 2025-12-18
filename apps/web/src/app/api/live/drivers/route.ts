import { NextRequest, NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

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
    const response = await fetch(
      `${OPENF1_BASE}/drivers?session_key=${sessionKey}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes (drivers don't change mid-session)
      }
    );

    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.status}`);
    }

    const drivers = await response.json();

    // Transform to our format
    const formattedDrivers = drivers.map((d: any) => ({
      driverNumber: d.driver_number,
      driverCode: d.name_acronym,
      firstName: d.first_name,
      lastName: d.last_name,
      fullName: d.full_name,
      teamName: d.team_name,
      teamColor: `#${d.team_colour || "808080"}`,
      countryCode: d.country_code,
      headshotUrl: d.headshot_url,
    }));

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
