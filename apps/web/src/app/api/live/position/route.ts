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
    // Get driver info and positions
    const [driversRes, positionsRes] = await Promise.all([
      fetch(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`),
      fetch(`${OPENF1_BASE}/position?session_key=${sessionKey}`),
    ]);

    const [drivers, positions] = await Promise.all([
      driversRes.json(),
      positionsRes.json(),
    ]);

    // Build driver info map
    const driverMap = new Map(
      drivers.map((d: any) => [
        d.driver_number,
        {
          code: d.name_acronym,
          teamColor: `#${d.team_colour || "808080"}`,
        },
      ])
    );

    // Get latest position for each driver
    const latestPositions = new Map<number, any>();
    for (const pos of positions) {
      const driverNum = pos.driver_number;
      if (
        !latestPositions.has(driverNum) ||
        new Date(pos.date) > new Date(latestPositions.get(driverNum).date)
      ) {
        latestPositions.set(driverNum, pos);
      }
    }

    // Build position data
    const positionData: any[] = [];
    for (const [driverNum, pos] of latestPositions) {
      const driverInfo = driverMap.get(driverNum);
      if (!driverInfo) continue;

      positionData.push({
        driverCode: driverInfo.code,
        driverNumber: driverNum,
        teamColor: driverInfo.teamColor,
        x: pos.x || 0,
        y: pos.y || 0,
        z: pos.z || 0,
        timestamp: pos.date,
      });
    }

    return NextResponse.json({
      positions: positionData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Position API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
