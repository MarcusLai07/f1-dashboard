import { NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

export async function GET() {
  try {
    // Get sessions from current year (or last year if early in season)
    const currentYear = new Date().getFullYear();
    // During off-season, include previous year's sessions
    const yearToFetch = new Date().getMonth() < 2 ? currentYear - 1 : currentYear;

    // Fetch both sessions and meetings to get meeting names
    const [sessionsRes, meetingsRes] = await Promise.all([
      fetch(`${OPENF1_BASE}/sessions?year=${yearToFetch}`, {
        next: { revalidate: 60 },
      }),
      fetch(`${OPENF1_BASE}/meetings?year=${yearToFetch}`, {
        next: { revalidate: 60 },
      }),
    ]);

    if (!sessionsRes.ok || !meetingsRes.ok) {
      throw new Error(`OpenF1 API error: ${sessionsRes.status}`);
    }

    const [sessions, meetings] = await Promise.all([
      sessionsRes.json(),
      meetingsRes.json(),
    ]);

    // Build meeting name lookup map
    const meetingNameMap = new Map<number, string>(
      meetings.map((m: any) => [m.meeting_key, m.meeting_name])
    );

    // Sort by date descending and find current/latest
    const sortedSessions = sessions.sort(
      (a: any, b: any) =>
        new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
    );

    // Determine if any session is currently live
    const now = new Date();
    const currentSession = sortedSessions.find((session: any) => {
      const start = new Date(session.date_start);
      const end = session.date_end ? new Date(session.date_end) : null;
      // Session is live if started and not ended, or ended within last 2 hours
      if (!end) {
        return start <= now;
      }
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      return start <= now && end >= twoHoursAgo;
    });

    return NextResponse.json({
      current: currentSession
        ? {
            sessionKey: currentSession.session_key,
            sessionName: currentSession.session_name,
            sessionType: currentSession.session_type,
            meetingKey: currentSession.meeting_key,
            meetingName: meetingNameMap.get(currentSession.meeting_key) || currentSession.location || "Unknown GP",
            circuitKey: currentSession.circuit_key,
            circuitShortName: currentSession.circuit_short_name,
            countryName: currentSession.country_name,
            startTime: currentSession.date_start,
            endTime: currentSession.date_end,
            year: currentSession.year,
            status: currentSession.date_end ? "finished" : "live",
          }
        : null,
      recent: sortedSessions.slice(0, 50).map((s: any) => ({
        sessionKey: s.session_key,
        sessionName: s.session_name,
        sessionType: s.session_type,
        meetingKey: s.meeting_key,
        meetingName: meetingNameMap.get(s.meeting_key) || s.location || "Unknown GP",
        circuitShortName: s.circuit_short_name,
        countryName: s.country_name,
        startTime: s.date_start,
        endTime: s.date_end,
        year: s.year,
        status: s.date_end ? "finished" : "live",
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Sessions API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
