import { NextResponse } from "next/server";
import { getRaces, getPreseason, getNextEvent, type F1Event, type PreSeasonEvent } from "@/data";

export interface CalendarResponse {
  preseason: PreSeasonEvent[];
  races: F1Event[];
  nextEvent: F1Event | null;
  completedRounds: number[];
  currentRound: number | null;
  timestamp: string;
}

async function getCompletedRounds(races: F1Event[]): Promise<number[]> {
  const now = new Date();
  return races
    .filter((event) => new Date(event.sessions.race) < now)
    .map((event) => event.round);
}

async function getCurrentRound(races: F1Event[]): Promise<number | null> {
  const now = new Date();

  // Find the next race that hasn't happened yet
  const nextRace = races.find((event) => new Date(event.sessions.race) > now);

  if (!nextRace) {
    // Season is over
    return races.length;
  }

  // Check if we're currently in a race weekend (between start and race end)
  const currentWeekend = races.find((event) => {
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
    // Fetch calendar data from unified data layer
    const [races, preseason, nextEvent] = await Promise.all([
      getRaces(),
      getPreseason(),
      getNextEvent(),
    ]);

    const completedRounds = await getCompletedRounds(races);
    const currentRound = await getCurrentRound(races);

    const response: CalendarResponse = {
      preseason,
      races,
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
