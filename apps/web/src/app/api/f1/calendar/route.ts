// GET /api/f1/calendar - Get season calendar from OpenF1 API
import { NextResponse } from "next/server";
import { getCalendarOverrides, mergeWithOverrides } from "@/data";

// Revalidate every hour
export const revalidate = 3600;

const OPENF1_BASE = "https://api.openf1.org/v1";

interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_name: string;
  circuit_short_name: string;
  date_start: string;
  year: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || "2026", 10);

  try {
    // Fetch from OpenF1
    const response = await fetch(`${OPENF1_BASE}/meetings?year=${year}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.status}`);
    }

    const meetings: OpenF1Meeting[] = await response.json();

    // Load overrides
    const overrides = await getCalendarOverrides(year);

    // Transform and merge with overrides
    const calendar = meetings.map((meeting, index) => {
      const dateKey = meeting.date_start.split("T")[0];
      const eventOverride = (overrides[dateKey] || {}) as Record<string, unknown>;

      const baseEvent = {
        round: index + 1,
        name: meeting.meeting_name,
        officialName: meeting.meeting_official_name,
        country: meeting.country_name,
        circuit: meeting.location,
        circuitId: meeting.circuit_short_name.toLowerCase().replace(/\s+/g, "_"),
        dates: {
          start: meeting.date_start,
          end: meeting.date_start, // OpenF1 doesn't provide end date
        },
        year: meeting.year,
      };

      return mergeWithOverrides(baseEvent, eventOverride);
    });

    return NextResponse.json({
      calendar,
      source: "api",
      timestamp: new Date().toISOString(),
      hasOverrides: Object.keys(overrides).length > 0,
    });
  } catch (error) {
    console.error("Calendar API error:", error);

    // Fallback to static data
    try {
      const fallback = await import("@/data/fallback/calendar-2026.json");
      return NextResponse.json({
        calendar: fallback.default,
        source: "fallback",
        timestamp: new Date().toISOString(),
        hasOverrides: false,
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch calendar data" },
        { status: 500 }
      );
    }
  }
}
