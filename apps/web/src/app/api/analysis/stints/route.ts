import { NextRequest, NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

interface DriverInfo {
  code: string;
  teamName: string;
  teamColor: string;
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      if (i === retries - 1) return [];
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return [];
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
    const [stints, drivers] = await Promise.all([
      fetchWithRetry(`${OPENF1_BASE}/stints?session_key=${sessionKey}`),
      fetchWithRetry(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`),
    ]);

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
