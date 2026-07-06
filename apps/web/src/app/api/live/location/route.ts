import { NextRequest, NextResponse } from "next/server";
import { openf1Fetch } from "@/lib/openf1";
import { getCachedDrivers } from "@/lib/driverCache";

interface LocationPoint {
  driverCode: string;
  driverNumber: number;
  teamColor: string;
  x: number;
  y: number;
  z: number;
  timestamp: string;
}

interface LocationResponse {
  locations: LocationPoint[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null;
  timestamp: string;
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
    // Use cached driver info (no redundant /drivers call)
    const driverMap = await getCachedDrivers(sessionKey);

    // Try fetching recent location data (for live sessions)
    // Use date filter for last 30 seconds to reduce payload
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    const locationRes = await openf1Fetch(
      `/location?session_key=${sessionKey}&date%3E${encodeURIComponent(thirtySecondsAgo)}`
    );
    const locationData = await locationRes.json();
    const locations = Array.isArray(locationData) ? locationData : [];

    // If no recent data (historical session), don't try to fetch full history
    // as it could be millions of records. The TrackMap will fall back to estimated positions.
    // For historical sessions, real-time location isn't useful anyway.

    // Get latest location for each driver
    const latestLocations = new Map<number, any>();
    for (const loc of locations) {
      if (!loc?.driver_number || loc.x === undefined || loc.y === undefined) continue;

      const driverNum = loc.driver_number;
      const existingLoc = latestLocations.get(driverNum);

      if (!existingLoc || new Date(loc.date) > new Date(existingLoc.date)) {
        latestLocations.set(driverNum, loc);
      }
    }

    // Build location data and calculate bounds
    const locationPoints: LocationPoint[] = [];
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const [driverNum, loc] of latestLocations) {
      const driverInfo = driverMap.get(driverNum);
      if (!driverInfo) continue;

      // Only include drivers with actual coordinates in bounds
      // (x=0, y=0 means no GPS data, e.g. driver in pits)
      const hasRealCoords = loc.x !== 0 || loc.y !== 0;
      if (hasRealCoords) {
        if (loc.x < minX) minX = loc.x;
        if (loc.x > maxX) maxX = loc.x;
        if (loc.y < minY) minY = loc.y;
        if (loc.y > maxY) maxY = loc.y;
      }

      locationPoints.push({
        driverCode: driverInfo.code,
        driverNumber: driverNum,
        teamColor: driverInfo.teamColor,
        x: loc.x,
        y: loc.y,
        z: loc.z || 0,
        timestamp: loc.date,
      });
    }

    // Calculate bounds (with padding) — only when real GPS coordinates exist
    const hasRealBounds = minX !== Infinity && maxX !== -Infinity;
    const bounds = hasRealBounds ? {
      minX: minX - 100,
      maxX: maxX + 100,
      minY: minY - 100,
      maxY: maxY + 100,
    } : null;

    const response: LocationResponse = {
      locations: locationPoints,
      bounds,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Location API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
