import { NextRequest, NextResponse } from "next/server";
import { openf1Fetch } from "@/lib/openf1";
import { getCachedDrivers } from "@/lib/driverCache";

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
    // Get driver info (cached) and positions in parallel
    const [driverMap, positionsRes] = await Promise.all([
      getCachedDrivers(sessionKey),
      openf1Fetch(`/position?session_key=${sessionKey}`),
    ]);

    const positionsData = await positionsRes.json();
    const positions = Array.isArray(positionsData) ? positionsData : [];

    // Get latest position for each driver
    const latestPositions = new Map<number, any>();
    for (const pos of positions) {
      if (!pos?.driver_number) continue;
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
