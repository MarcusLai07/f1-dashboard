"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Flag, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessions } from "@/lib/api";
import { getRaces, getPreseason, type F1Event, type PreSeasonEvent } from "@/data";
import { useDebugStore, getSimulatedNow } from "@/stores/debugStore";
import type { Session } from "@/types/f1";

interface SessionSelectorProps {
  onSessionChange: (sessionKey: number | null) => void;
  currentSessionKey?: number | null;
}

// Event types for the selector
type EventType = "testing" | "race";

interface SelectableEvent {
  id: string;
  name: string;
  shortName: string;
  type: EventType;
  dates: { start: string; end: string };
  isSprint?: boolean;
  sessions: SelectableSession[];
}

interface SelectableSession {
  key: string;
  name: string;
  shortName: string;
  time: string;
  badge: { label: string; className: string };
  isPast: boolean;
  isNow: boolean;
}

// Session type badges for styling
const SESSION_BADGES: Record<string, { label: string; className: string }> = {
  "FP1": { label: "FP1", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "FP2": { label: "FP2", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "FP3": { label: "FP3", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "QUAL": { label: "QUAL", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  "SQ": { label: "SQ", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  "SPRINT": { label: "SPRINT", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  "RACE": { label: "RACE", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  "AM": { label: "AM", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  "PM": { label: "PM", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
};

function formatShortTime(dateString: string, timezone: string = "Asia/Kuala_Lumpur"): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Build selectable events from calendar data
function buildEvents(now: Date, debugEnabled: boolean, races: F1Event[], preseason: PreSeasonEvent[]): SelectableEvent[] {
  const events: SelectableEvent[] = [];

  // Add pre-season testing events
  for (const test of preseason) {
    if (test.type !== "testing" && test.type !== "shakedown") continue;

    const eventEnd = new Date(test.dates.end);
    const isPastEvent = eventEnd < now;
    if (isPastEvent && !debugEnabled) continue;

    const sessions: SelectableSession[] = [];
    if (test.sessions) {
      const startDate = new Date(test.dates.start);
      const endDate = new Date(test.dates.end);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      for (let day = 0; day < days; day++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + day);
        const dayStr = dayDate.toISOString().split("T")[0];

        // Morning session
        const morningTime = test.sessions.morning.replace(/^\d{4}-\d{2}-\d{2}/, dayStr);
        const isPastAM = new Date(morningTime) < now;
        const isNowAM = Math.abs(new Date(morningTime).getTime() - now.getTime()) < 4 * 60 * 60 * 1000;
        sessions.push({
          key: `test-${test.name.replace(/\s+/g, "-").toLowerCase()}-d${day + 1}-am`,
          name: `Day ${day + 1} Morning`,
          shortName: `D${day + 1} AM`,
          time: morningTime,
          badge: SESSION_BADGES["AM"],
          isPast: isPastAM,
          isNow: isNowAM && !isPastAM,
        });

        // Afternoon session
        const afternoonTime = test.sessions.afternoon.replace(/^\d{4}-\d{2}-\d{2}/, dayStr);
        const isPastPM = new Date(afternoonTime) < now;
        const isNowPM = Math.abs(new Date(afternoonTime).getTime() - now.getTime()) < 4 * 60 * 60 * 1000;
        sessions.push({
          key: `test-${test.name.replace(/\s+/g, "-").toLowerCase()}-d${day + 1}-pm`,
          name: `Day ${day + 1} Afternoon`,
          shortName: `D${day + 1} PM`,
          time: afternoonTime,
          badge: SESSION_BADGES["PM"],
          isPast: isPastPM,
          isNow: isNowPM && !isPastPM,
        });
      }
    }

    events.push({
      id: test.name.replace(/\s+/g, "-").toLowerCase(),
      name: test.name,
      shortName: test.type === "shakedown" ? "Barcelona" : test.name.replace("Pre-Season ", ""),
      type: "testing",
      dates: test.dates,
      sessions,
    });
  }

  // Add race events
  for (const race of races) {
    const eventEnd = new Date(race.dates.end);
    const isPastEvent = eventEnd < now;
    if (isPastEvent && !debugEnabled) continue;

    const sessions: SelectableSession[] = [];

    // FP1
    if (race.sessions.fp1) {
      const isPast = new Date(race.sessions.fp1) < now;
      const isNow = Math.abs(new Date(race.sessions.fp1).getTime() - now.getTime()) < 3 * 60 * 60 * 1000;
      sessions.push({
        key: `${race.round}-fp1`,
        name: "Free Practice 1",
        shortName: "FP1",
        time: race.sessions.fp1,
        badge: SESSION_BADGES["FP1"],
        isPast,
        isNow: isNow && !isPast,
      });
    }

    // FP2
    if (race.sessions.fp2) {
      const isPast = new Date(race.sessions.fp2) < now;
      const isNow = Math.abs(new Date(race.sessions.fp2).getTime() - now.getTime()) < 3 * 60 * 60 * 1000;
      sessions.push({
        key: `${race.round}-fp2`,
        name: "Free Practice 2",
        shortName: "FP2",
        time: race.sessions.fp2,
        badge: SESSION_BADGES["FP2"],
        isPast,
        isNow: isNow && !isPast,
      });
    }

    // FP3
    if (race.sessions.fp3) {
      const isPast = new Date(race.sessions.fp3) < now;
      const isNow = Math.abs(new Date(race.sessions.fp3).getTime() - now.getTime()) < 3 * 60 * 60 * 1000;
      sessions.push({
        key: `${race.round}-fp3`,
        name: "Free Practice 3",
        shortName: "FP3",
        time: race.sessions.fp3,
        badge: SESSION_BADGES["FP3"],
        isPast,
        isNow: isNow && !isPast,
      });
    }

    // Sprint Qualifying
    if (race.sessions.sprintQualifying) {
      const isPast = new Date(race.sessions.sprintQualifying) < now;
      const isNow = Math.abs(new Date(race.sessions.sprintQualifying).getTime() - now.getTime()) < 2 * 60 * 60 * 1000;
      sessions.push({
        key: `${race.round}-sq`,
        name: "Sprint Qualifying",
        shortName: "Sprint Quali",
        time: race.sessions.sprintQualifying,
        badge: SESSION_BADGES["SQ"],
        isPast,
        isNow: isNow && !isPast,
      });
    }

    // Sprint
    if (race.sessions.sprint) {
      const isPast = new Date(race.sessions.sprint) < now;
      const isNow = Math.abs(new Date(race.sessions.sprint).getTime() - now.getTime()) < 2 * 60 * 60 * 1000;
      sessions.push({
        key: `${race.round}-sprint`,
        name: "Sprint Race",
        shortName: "Sprint",
        time: race.sessions.sprint,
        badge: SESSION_BADGES["SPRINT"],
        isPast,
        isNow: isNow && !isPast,
      });
    }

    // Qualifying
    const qualIsPast = new Date(race.sessions.qualifying) < now;
    const qualIsNow = Math.abs(new Date(race.sessions.qualifying).getTime() - now.getTime()) < 2 * 60 * 60 * 1000;
    sessions.push({
      key: `${race.round}-qual`,
      name: "Qualifying",
      shortName: "Qualifying",
      time: race.sessions.qualifying,
      badge: SESSION_BADGES["QUAL"],
      isPast: qualIsPast,
      isNow: qualIsNow && !qualIsPast,
    });

    // Race
    const raceIsPast = new Date(race.sessions.race) < now;
    const raceIsNow = Math.abs(new Date(race.sessions.race).getTime() - now.getTime()) < 3 * 60 * 60 * 1000;
    sessions.push({
      key: `${race.round}-race`,
      name: "Race",
      shortName: "Race",
      time: race.sessions.race,
      badge: SESSION_BADGES["RACE"],
      isPast: raceIsPast,
      isNow: raceIsNow && !raceIsPast,
    });

    // Sort sessions by time
    sessions.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    events.push({
      id: `race-${race.round}`,
      name: race.name,
      shortName: race.name.replace(" Grand Prix", "").replace("Barcelona-Catalunya", "Barcelona"),
      type: "race",
      dates: race.dates,
      isSprint: race.isSprint,
      sessions,
    });
  }

  return events;
}

export function SessionSelector({
  onSessionChange,
  currentSessionKey,
}: SessionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedCalendarKey, setSelectedCalendarKey] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [races, setRaces] = useState<F1Event[]>([]);
  const [preseason, setPreseason] = useState<PreSeasonEvent[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { enabled: debugEnabled } = useDebugStore();

  // Fetch calendar data
  useEffect(() => {
    Promise.all([getRaces(), getPreseason()]).then(([racesData, preseasonData]) => {
      setRaces(racesData);
      setPreseason(preseasonData);
      setDataLoaded(true);
    });
  }, []);

  // Get simulated time
  const now = useMemo(() => new Date(getSimulatedNow()), [debugEnabled]);

  // Build events list
  const events = useMemo(() => {
    if (!dataLoaded) return [];
    return buildEvents(now, debugEnabled, races, preseason);
  }, [now, debugEnabled, dataLoaded, races, preseason]);

  // Fetch API sessions - always fetch 2025 for historical data
  useEffect(() => {
    async function fetchSessions() {
      try {
        // Fetch 2025 season for historical debugging
        const { recent } = await getSessions(2025);
        setSessions(recent);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  // Auto-select first event and nearest upcoming session
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      // Find the first event with an upcoming session
      let foundEvent: SelectableEvent | null = null;
      let foundSession: SelectableSession | null = null;

      for (const event of events) {
        // Find first non-past session in this event
        const upcomingSession = event.sessions.find(s => !s.isPast);
        if (upcomingSession) {
          foundEvent = event;
          foundSession = upcomingSession;
          break;
        }
      }

      // If no upcoming session found, just use first event
      if (!foundEvent && events.length > 0) {
        foundEvent = events[0];
        foundSession = events[0].sessions[0] || null;
      }

      if (foundEvent) {
        setSelectedEventId(foundEvent.id);
        if (foundSession) {
          setSelectedCalendarKey(foundSession.key);
        }
      }
    }
  }, [events, selectedEventId]);

  // Get selected event
  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Find selected calendar session for display
  const selectedCalendarSession = selectedEvent?.sessions.find(s => s.key === selectedCalendarKey);

  // Find selected API session (for debug mode)
  const selectedApiSession = sessions.find(s => s.sessionKey === currentSessionKey);

  // Handle event selection
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  // Handle calendar session selection
  const handleSessionSelect = (sessionKey: string) => {
    setSelectedCalendarKey(sessionKey);
    // For calendar sessions, we don't have API data yet
    // Clear the API session key since this is a future session
    onSessionChange(null);
    setOpen(false);
  };

  // Handle API session selection (debug mode)
  const handleApiSessionSelect = (sessionKey: number) => {
    onSessionChange(sessionKey);
    setSelectedCalendarKey(null); // Clear calendar selection
    setOpen(false);
  };

  if (loading || !dataLoaded) {
    return <div className="h-9 w-72 bg-secondary animate-pulse rounded-md" />;
  }

  // Determine what to display in the button
  const displayEvent = selectedEvent;
  const displaySession = selectedCalendarSession;
  const displayApiSession = currentSessionKey ? selectedApiSession : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-80 justify-between bg-secondary border-border"
        >
          {displayApiSession ? (
            // Show API session (debug mode selection)
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">{displayApiSession.countryName}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1 py-0",
                  SESSION_BADGES[displayApiSession.sessionName === "Practice 1" ? "FP1" :
                    displayApiSession.sessionName === "Practice 2" ? "FP2" :
                    displayApiSession.sessionName === "Practice 3" ? "FP3" :
                    displayApiSession.sessionName === "Qualifying" ? "QUAL" :
                    displayApiSession.sessionName === "Sprint Qualifying" ? "SQ" :
                    displayApiSession.sessionName === "Sprint" ? "SPRINT" :
                    displayApiSession.sessionName === "Race" ? "RACE" : "FP1"
                  ]?.className
                )}
              >
                {displayApiSession.sessionName === "Practice 1" ? "FP1" :
                  displayApiSession.sessionName === "Practice 2" ? "FP2" :
                  displayApiSession.sessionName === "Practice 3" ? "FP3" :
                  displayApiSession.sessionName === "Qualifying" ? "QUAL" :
                  displayApiSession.sessionName === "Sprint Qualifying" ? "SQ" :
                  displayApiSession.sessionName === "Sprint" ? "SPRINT" :
                  displayApiSession.sessionName === "Race" ? "RACE" : "FP1"
                }
              </Badge>
              {displayApiSession.status === "live" && (
                <span className="text-xs text-red-500 font-medium animate-pulse">LIVE</span>
              )}
            </span>
          ) : displayEvent && displaySession ? (
            // Show calendar session
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">{displayEvent.shortName}</span>
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1 py-0", displaySession.badge.className)}
              >
                {displaySession.badge.label}
              </Badge>
              {displaySession.isNow && (
                <span className="text-xs text-green-400 font-medium">NOW</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">Select session...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        {/* Debug Mode - Show ONLY 2025 OpenF1 sessions */}
        {debugEnabled ? (
          sessions.length > 0 ? (
            <HistoricalSessionsPanel
              sessions={sessions}
              currentSessionKey={currentSessionKey}
              onSessionSelect={handleApiSessionSelect}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Loading 2025 sessions...
            </div>
          )
        ) : (
          /* Normal Mode - Show calendar-based events */
          <div className="flex h-80">
            {/* Left Panel - Events */}
            <div className="w-1/2 border-r border-border overflow-y-auto">
              <div className="p-2 border-b border-border bg-secondary/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Select Event
                </span>
              </div>
              <div className="py-1">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event.id)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-secondary/50 transition-colors",
                      selectedEventId === event.id && "bg-secondary"
                    )}
                  >
                    {event.type === "testing" ? (
                      <Wrench className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                    ) : (
                      <Flag className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    )}
                    <span className="flex-1 truncate">{event.shortName}</span>
                    {event.isSprint && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 bg-orange-500/10 text-orange-400 border-orange-500/30">
                        SPRINT
                      </Badge>
                    )}
                    {event.type === "testing" && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                        TEST
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Panel - Sessions */}
            <div className="w-1/2 overflow-y-auto">
              <div className="p-2 border-b border-border bg-secondary/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {selectedEvent?.name || "Select Session"}
                </span>
              </div>
              {selectedEvent && (
                <div className="py-1">
                  {selectedEvent.sessions.map((session) => (
                    <button
                      key={session.key}
                      onClick={() => handleSessionSelect(session.key)}
                      disabled={session.isPast}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-secondary/50 transition-colors",
                        selectedCalendarKey === session.key && "bg-primary/10 border-l-2 border-l-primary",
                        session.isPast && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", session.badge.className)}>
                        {session.badge.label}
                      </Badge>
                      <span className="flex-1 truncate">{session.shortName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatShortTime(session.time)}
                      </span>
                      {session.isNow && (
                        <span className="text-[9px] text-green-400 font-medium">NOW</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// Historical Sessions Panel for Debug Mode
// =============================================================================

interface HistoricalSessionsPanelProps {
  sessions: Session[];
  currentSessionKey: number | null | undefined;
  onSessionSelect: (sessionKey: number) => void;
}

function HistoricalSessionsPanel({
  sessions,
  currentSessionKey,
  onSessionSelect,
}: HistoricalSessionsPanelProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);

  // Group sessions by meeting
  const sessionsByMeeting = useMemo(() => {
    const grouped = new Map<string, Session[]>();

    for (const session of sessions) {
      const meetingName = session.meetingName || "Unknown";
      if (!grouped.has(meetingName)) {
        grouped.set(meetingName, []);
      }
      grouped.get(meetingName)!.push(session);
    }

    // Sort sessions within each meeting by date
    for (const [, meetingSessions] of grouped) {
      meetingSessions.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    }

    // Sort meetings by their first session date
    const sortedEntries = Array.from(grouped.entries()).sort(([, a], [, b]) => {
      return new Date(a[0].startTime).getTime() - new Date(b[0].startTime).getTime();
    });

    return new Map(sortedEntries);
  }, [sessions]);

  // Get meeting list
  const meetings = Array.from(sessionsByMeeting.keys());

  // Auto-select first meeting if none selected
  useEffect(() => {
    if (!selectedMeeting && meetings.length > 0) {
      setSelectedMeeting(meetings[0]);
    }
  }, [meetings, selectedMeeting]);

  // Get sessions for selected meeting
  const selectedMeetingSessions = selectedMeeting
    ? sessionsByMeeting.get(selectedMeeting) || []
    : [];

  const getSessionBadge = (sessionName: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      "Practice 1": { label: "FP1", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      "Practice 2": { label: "FP2", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      "Practice 3": { label: "FP3", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      "Qualifying": { label: "QUAL", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
      "Sprint Qualifying": { label: "SQ", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
      "Sprint Shootout": { label: "SQ", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
      "Sprint": { label: "SPRINT", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
      "Race": { label: "RACE", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    };
    return badges[sessionName] || { label: sessionName.slice(0, 4).toUpperCase(), className: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  };

  return (
    <div>
      <div className="p-2 bg-yellow-500/10 border-b border-yellow-500/30">
        <span className="text-xs font-medium text-yellow-500 uppercase tracking-wide">
          2025 F1 Season - {meetings.length} Events, {sessions.length} Sessions
        </span>
      </div>
      <div className="flex h-80">
        {/* Left - Meetings List */}
        <div className="w-1/2 border-r border-border overflow-y-auto">
          <div className="py-1">
            {meetings.map((meeting) => {
              const meetingSessions = sessionsByMeeting.get(meeting) || [];
              const hasRace = meetingSessions.some(s => s.sessionName === "Race");
              const hasSprint = meetingSessions.some(s => s.sessionName === "Sprint");

              return (
                <button
                  key={meeting}
                  onClick={() => setSelectedMeeting(meeting)}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-yellow-500/10 transition-colors",
                    selectedMeeting === meeting && "bg-yellow-500/20 border-l-2 border-l-yellow-500"
                  )}
                >
                  <Flag className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                  <span className="flex-1 truncate">{meeting.replace(" Grand Prix", " GP")}</span>
                  {hasSprint && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 bg-orange-500/10 text-orange-400 border-orange-500/30">
                      SPRINT
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right - Sessions for selected meeting */}
        <div className="w-1/2 overflow-y-auto">
          <div className="p-2 bg-secondary/30 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground truncate block">
              {selectedMeeting?.replace(" Grand Prix", " GP") || "Select Meeting"}
            </span>
          </div>
          <div className="py-1">
            {selectedMeetingSessions.map((session) => {
              const badge = getSessionBadge(session.sessionName);
              const isSelected = currentSessionKey === session.sessionKey;

              return (
                <button
                  key={session.sessionKey}
                  onClick={() => onSessionSelect(session.sessionKey)}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-yellow-500/10 transition-colors",
                    isSelected && "bg-yellow-500/20 border-l-2 border-l-yellow-500"
                  )}
                >
                  <Badge variant="outline" className={cn("text-[9px] px-1 py-0", badge.className)}>
                    {badge.label}
                  </Badge>
                  <span className="flex-1 truncate">{session.sessionName}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(session.startTime).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
