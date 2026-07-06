import { NextRequest, NextResponse } from "next/server";
import { openf1Fetch } from "@/lib/openf1";

interface DriverInfo {
  code: string;
  teamName: string;
  teamColor: string;
}

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
    // Fetch stints and driver info in parallel
    const [stintsRes, driversRes] = await Promise.all([
      openf1Fetch(`/stints?session_key=${sessionKey}`),
      openf1Fetch(`/drivers?session_key=${sessionKey}`),
    ]);

    const [stintsData, driversData] = await Promise.all([
      stintsRes.json(),
      driversRes.json(),
    ]);

    const stints = Array.isArray(stintsData) ? stintsData : [];
    const drivers = Array.isArray(driversData) ? driversData : [];

    // Build driver map
    const driverMap = new Map<number, DriverInfo>(
      drivers.map((d: any) => [
        d.driver_number,
        {
          code: d.name_acronym,
          teamName: d.team_name,
          teamColor: d.team_colour ? `#${d.team_colour}` : "#808080",
        },
      ])
    );

    // Process stint data
    const processedStints = stints.map((stint: any) => ({
      driverNumber: stint.driver_number,
      driverCode: driverMap.get(stint.driver_number)?.code || "???",
      teamColor: driverMap.get(stint.driver_number)?.teamColor || "#808080",
      stintNumber: stint.stint_number,
      compound: stint.compound,
      lapStart: stint.lap_start,
      lapEnd: stint.lap_end,
      tyreAge: stint.tyre_age_at_start || 0,
    }));

    // Sort by driver, then stint number
    processedStints.sort((a: any, b: any) => {
      if (a.driverNumber !== b.driverNumber) return a.driverNumber - b.driverNumber;
      return a.stintNumber - b.stintNumber;
    });

    // Group by driver for easier rendering
    const stintsByDriver = new Map<number, any[]>();
    for (const stint of processedStints) {
      if (!stintsByDriver.has(stint.driverNumber)) {
        stintsByDriver.set(stint.driverNumber, []);
      }
      stintsByDriver.get(stint.driverNumber)!.push(stint);
    }

    return NextResponse.json({
      stints: processedStints,
      stintsByDriver: Object.fromEntries(stintsByDriver),
      drivers: Array.from(driverMap.entries()).map(([num, info]) => ({
        driverNumber: num,
        ...info,
      })),
    });
  } catch (error) {
    console.error("Stints API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stint data" },
      { status: 500 }
    );
  }
}
