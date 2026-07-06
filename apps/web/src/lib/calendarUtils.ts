// Calendar Utility Functions
// Extracted from calendar2026.ts - utilities only, data lives in /data/calendar/

import type { F1Event } from "@/data";

// ============================================================================
// TIMEZONE CONVERSION
// ============================================================================

/**
 * Convert UTC date string to specified timezone
 */
export function convertToTimezone(utcDateString: string, timezone: string): Date {
  const date = new Date(utcDateString);
  return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date for display (Malaysia timezone - GMT+8)
 */
export function formatDateMYT(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format session time for display (24-hour format)
 */
export function formatSessionTime(dateString: string, timezone: string): string {
  const date = new Date(dateString);

  // Get parts separately for better formatting
  const weekday = date.toLocaleString("en-US", { timeZone: timezone, weekday: "short" });
  const day = date.toLocaleString("en-US", { timeZone: timezone, day: "2-digit" });
  const month = date.toLocaleString("en-US", { timeZone: timezone, month: "short" });
  const time = date.toLocaleString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${weekday} ${day} ${month}, ${time}`;
}

/**
 * Format time only (24-hour format)
 */
export function formatTime24h(dateString: string, timezone: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ============================================================================
// TIME CALCULATIONS
// ============================================================================

/**
 * Get time until next session (in ms)
 */
export function getTimeUntilSession(sessionDateString: string): number {
  const sessionDate = new Date(sessionDateString);
  const now = new Date();
  return sessionDate.getTime() - now.getTime();
}

// ============================================================================
// ICS / CALENDAR EXPORT
// ============================================================================

/**
 * Format date for ICS format (YYYYMMDDTHHmmssZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Generate ICS file content for F1 events
 */
export function generateICS(events: F1Event[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//F1 Dashboard//F1 Calendar 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:F1 2026 Calendar",
    "X-WR-TIMEZONE:UTC",
  ];

  for (const event of events) {
    // Add race event
    const raceStart = new Date(event.sessions.race);
    const raceEnd = new Date(raceStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:f1-2026-${event.round}-race@f1dashboard`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(raceStart)}`);
    lines.push(`DTEND:${formatICSDate(raceEnd)}`);
    lines.push(`SUMMARY:F1: ${event.name} - Race`);
    lines.push(`DESCRIPTION:${event.officialName}\\nCircuit: ${event.circuit}`);
    lines.push(`LOCATION:${event.circuit}, ${event.country}`);
    lines.push("END:VEVENT");

    // Add qualifying event
    const qualStart = new Date(event.sessions.qualifying);
    const qualEnd = new Date(qualStart.getTime() + 60 * 60 * 1000); // 1 hour

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:f1-2026-${event.round}-qualifying@f1dashboard`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(qualStart)}`);
    lines.push(`DTEND:${formatICSDate(qualEnd)}`);
    lines.push(`SUMMARY:F1: ${event.name} - Qualifying`);
    lines.push(`LOCATION:${event.circuit}, ${event.country}`);
    lines.push("END:VEVENT");

    // Add sprint if applicable
    if (event.isSprint && event.sessions.sprint) {
      const sprintStart = new Date(event.sessions.sprint);
      const sprintEnd = new Date(sprintStart.getTime() + 45 * 60 * 1000); // 45 minutes

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:f1-2026-${event.round}-sprint@f1dashboard`);
      lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
      lines.push(`DTSTART:${formatICSDate(sprintStart)}`);
      lines.push(`DTEND:${formatICSDate(sprintEnd)}`);
      lines.push(`SUMMARY:F1: ${event.name} - Sprint`);
      lines.push(`LOCATION:${event.circuit}, ${event.country}`);
      lines.push("END:VEVENT");
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Generate Google Calendar URL for a single event
 */
export function generateGoogleCalendarUrl(event: F1Event): string {
  const raceStart = new Date(event.sessions.race);
  const raceEnd = new Date(raceStart.getTime() + 2 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `F1: ${event.name} - Race`,
    dates: `${formatICSDate(raceStart)}/${formatICSDate(raceEnd)}`,
    details: `${event.officialName}\nCircuit: ${event.circuit}`,
    location: `${event.circuit}, ${event.country}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
