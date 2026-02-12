import { NextRequest, NextResponse } from "next/server";
import { openf1Fetch } from "@/lib/openf1";
import { getDriversFull, getTeamsFull } from "@/data";

interface DriverInfo {
  code: string;
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
    // Get driver info and positions (OpenF1 + local fallback)
    const [driversRes, positionsRes, localDrivers, localTeams] = await Promise.all([
      openf1Fetch(`/drivers?session_key=${sessionKey}`),
      openf1Fetch(`/position?session_key=${sessionKey}`),
      getDriversFull().catch(() => []),
      getTeamsFull().catch(() => []),
    ]);

    const [driversData, positionsData] = await Promise.all([
      driversRes.json(),
      positionsRes.json(),
    ]);

    // Ensure arrays (API may return empty objects or null)
    const drivers = Array.isArray(driversData) ? driversData : [];
    const positions = Array.isArray(positionsData) ? positionsData : [];
    const localDriverMap = new Map(localDrivers.map(d => [d.number, d]));
    const localTeamMap = new Map(localTeams.map(t => [t.id, t]));

    // Build driver info map (OpenF1 + local fallback)
    const driverMap = new Map<number, DriverInfo>();
    for (const d of drivers) {
      if (d?.driver_number) {
        const local = localDriverMap.get(d.driver_number);
        const localTeam = local?.teamId ? localTeamMap.get(local.teamId) : undefined;
        driverMap.set(d.driver_number, {
          code: d.name_acronym || local?.code || `D${d.driver_number}`,
          teamColor: d.team_colour ? `#${d.team_colour}` : (localTeam?.color || "#808080"),
        });
      }
    }
    // Add local drivers not in OpenF1
    for (const local of localDrivers) {
      if (!driverMap.has(local.number)) {
        const localTeam = local.teamId ? localTeamMap.get(local.teamId) : undefined;
        driverMap.set(local.number, {
          code: local.code,
          teamColor: localTeam?.color || "#808080",
        });
      }
    }

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
