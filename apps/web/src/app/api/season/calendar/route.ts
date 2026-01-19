import { NextResponse } from "next/server";
import { CALENDAR_2026, PRE_SEASON_2026, getNextEvent, type F1Event } from "@/lib/calendar2026";

export interface CalendarResponse {
  preseason: typeof PRE_SEASON_2026;
  races: typeof CALENDAR_2026;
  nextEvent: F1Event | null;
  completedRounds: number[];
  currentRound: number | null;
  timestamp: string;
}

function getCompletedRounds(): number[] {
  const now = new Date();
  return CALENDAR_2026
    .filter((event) => new Date(event.sessions.race) < now)
    .map((event) => event.round);
}

function getCurrentRound(): number | null {
  const now = new Date();

  // Find the next race that hasn't happened yet
  const nextRace = CALENDAR_2026.find((event) => new Date(event.sessions.race) > now);

  if (!nextRace) {
    // Season is over
    return CALENDAR_2026.length;
  }

  // Check if we're currently in a race weekend (between start and race end)
  const currentWeekend = CALENDAR_2026.find((event) => {
    const start = new Date(event.dates.start);
    const raceEnd = new Date(event.sessions.race);
    raceEnd.setHours(raceEnd.getHours() + 3); // Add 3 hours after race start
    return now >= start && now <= raceEnd;
  });

  if (currentWeekend) {
    return currentWeekend.round;
  }

  return nextRace.round;
}

export async function GET() {
  try {
    const nextEvent = getNextEvent();
    const completedRounds = getCompletedRounds();
    const currentRound = getCurrentRound();

    const response: CalendarResponse = {
      preseason: PRE_SEASON_2026,
      races: CALENDAR_2026,
      nextEvent: nextEvent && 'round' in nextEvent ? nextEvent : null,
      completedRounds,
      currentRound,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar" },
      { status: 500 }
    );
  }
}
