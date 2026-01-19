"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, BellOff, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { useSeasonStore } from "@/stores/seasonStore";
import { useDebugStore } from "@/stores/debugStore";
import { useNotificationPermission, useSessionNotifications } from "@/hooks/useSeasonData";
import { CALENDAR_2026, PRE_SEASON_2026, type F1Event, type PreSeasonEvent } from "@/lib/calendar2026";
import { generateICS } from "@/lib/calendar2026";
import { MiniF1Car } from "@/components/ui/f1-loader";
import { animate } from "animejs";

// Get current time (real or simulated)
function useCurrentTime(): number {
  const { enabled, simulatedDate } = useDebugStore();
  const [now, setNow] = useState(() => {
    if (enabled && simulatedDate) {
      return new Date(simulatedDate).getTime();
    }
    return Date.now();
  });

  useEffect(() => {
    if (enabled && simulatedDate) {
      setNow(new Date(simulatedDate).getTime());
      return;
    }

    // Update every second for real time
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [enabled, simulatedDate]);

  return now;
}

// Country flags
const COUNTRY_FLAGS: Record<string, string> = {
  Australia: "🇦🇺",
  China: "🇨🇳",
  Japan: "🇯🇵",
  Bahrain: "🇧🇭",
  "Saudi Arabia": "🇸🇦",
  USA: "🇺🇸",
  Canada: "🇨🇦",
  Monaco: "🇲🇨",
  Spain: "🇪🇸",
  Austria: "🇦🇹",
  "Great Britain": "🇬🇧",
  Belgium: "🇧🇪",
  Hungary: "🇭🇺",
  Netherlands: "🇳🇱",
  Italy: "🇮🇹",
  Azerbaijan: "🇦🇿",
  Singapore: "🇸🇬",
  Mexico: "🇲🇽",
  Brazil: "🇧🇷",
  Qatar: "🇶🇦",
  UAE: "🇦🇪",
};

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function getTimeRemaining(targetDate: Date): TimeRemaining {
  const total = targetDate.getTime() - Date.now();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

// Get time of day info from session time
type TimeOfDay = "morning" | "day" | "evening" | "night";

function getTimeOfDay(date: Date, timezone: string): TimeOfDay {
  const hour = parseInt(
    date.toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false })
  );

  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

// Daytime icon component with animation
interface DaytimeIconProps {
  timeOfDay: TimeOfDay;
  className?: string;
}

function DaytimeIcon({ timeOfDay, className = "" }: DaytimeIconProps) {
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!iconRef.current) return;

    const animations: Record<TimeOfDay, object> = {
      morning: {
        translateY: [5, 0],
        rotate: ["-15deg", "0deg"],
        opacity: [0.5, 1],
      },
      day: {
        scale: [0.9, 1],
        rotate: ["0deg", "10deg", "0deg"],
      },
      evening: {
        translateY: [0, 2],
        rotate: ["0deg", "15deg"],
        opacity: [1, 0.8],
      },
      night: {
        scale: [0.8, 1],
        rotate: ["-180deg", "0deg"],
      },
    };

    animate(iconRef.current, {
      ...animations[timeOfDay],
      duration: 1000,
      easing: "easeOutQuad",
    });
  }, [timeOfDay]);

  const colors: Record<TimeOfDay, string> = {
    morning: "text-orange-400",
    day: "text-yellow-400",
    evening: "text-orange-500",
    night: "text-blue-400",
  };

  const icons: Record<TimeOfDay, React.ReactNode> = {
    morning: <Sunrise className="h-5 w-5" />,
    day: <Sun className="h-5 w-5" />,
    evening: <Sunset className="h-5 w-5" />,
    night: <Moon className="h-5 w-5" />,
  };

  return (
    <div ref={iconRef} className={`${colors[timeOfDay]} ${className}`}>
      {icons[timeOfDay]}
    </div>
  );
}

// Animated countdown digit - simplified to avoid animation issues
interface CountdownDigitProps {
  value: number;
  label: string;
}

function CountdownDigit({ value, label }: CountdownDigitProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-mono font-bold tabular-nums transition-all duration-150">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// Progress bar showing time until event
interface CountdownProgressProps {
  total: number;
  maxDays?: number;
}

function CountdownProgress({ total, maxDays = 14 }: CountdownProgressProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const maxMs = maxDays * 24 * 60 * 60 * 1000;
  const percentage = Math.min(100, Math.max(0, ((maxMs - total) / maxMs) * 100));

  // Determine color based on urgency
  const getColor = () => {
    if (percentage >= 95) return { bg: "bg-red-500", glow: "shadow-red-500/50", hex: "#ef4444" };
    if (percentage >= 85) return { bg: "bg-orange-500", glow: "shadow-orange-500/50", hex: "#f97316" };
    if (percentage >= 70) return { bg: "bg-yellow-500", glow: "shadow-yellow-500/50", hex: "#eab308" };
    return { bg: "bg-primary", glow: "shadow-primary/50", hex: "#e53935" };
  };

  const colors = getColor();

  useEffect(() => {
    if (!progressRef.current) return;

    animate(progressRef.current, {
      width: `${percentage}%`,
      duration: 1000,
      easing: "easeOutExpo",
    });
  }, [percentage]);

  return (
    <div className="w-full relative">
      <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className={`h-full rounded-full ${colors.bg} shadow-lg ${colors.glow} transition-colors`}
          style={{ width: 0 }}
        />
      </div>
      {/* F1 car at the end of progress */}
      <div
        className="absolute -top-1 transition-all duration-1000 ease-out"
        style={{ left: `calc(${percentage}% - 12px)` }}
      >
        <MiniF1Car spinning={percentage < 100} />
      </div>
    </div>
  );
}

type NextEventResult =
  | { event: F1Event; sessionType: string; sessionTime: Date; isPreSeason: false }
  | { event: PreSeasonEvent; sessionType: string; sessionTime: Date; isPreSeason: true }
  | null;

function getNextEvent(now: number): NextEventResult {

  // Check pre-season events first (shakedown & testing)
  for (const event of PRE_SEASON_2026) {
    // Only include shakedown and testing events that have session times
    if ((event.type === "shakedown" || event.type === "testing") && event.sessions) {
      // Check morning session
      const morningDate = new Date(event.sessions.morning);
      // Calculate end of testing period (last day afternoon session end)
      const startDate = new Date(event.dates.start);
      const endDate = new Date(event.dates.end);
      const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // For each day of testing
      for (let day = 0; day < daysCount; day++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + day);
        const dateStr = dayDate.toISOString().split("T")[0];

        // Morning session for this day
        const morningTime = new Date(event.sessions.morning);
        morningTime.setDate(morningTime.getDate() + day);
        if (morningTime.getTime() > now) {
          return {
            event,
            sessionType: `Day ${day + 1} - Morning`,
            sessionTime: morningTime,
            isPreSeason: true,
          };
        }

        // Afternoon session for this day
        const afternoonTime = new Date(event.sessions.afternoon);
        afternoonTime.setDate(afternoonTime.getDate() + day);
        if (afternoonTime.getTime() > now) {
          return {
            event,
            sessionType: `Day ${day + 1} - Afternoon`,
            sessionTime: afternoonTime,
            isPreSeason: true,
          };
        }
      }
    }
  }

  // Then check race calendar
  for (const event of CALENDAR_2026) {
    // Check each session in order
    const sessions = [
      { type: "FP1", time: event.sessions.fp1 },
      { type: "FP2", time: event.sessions.fp2 },
      { type: "FP3", time: event.sessions.fp3 },
      { type: "Sprint Qualifying", time: event.sessions.sprintQualifying },
      { type: "Sprint", time: event.sessions.sprint },
      { type: "Qualifying", time: event.sessions.qualifying },
      { type: "Race", time: event.sessions.race },
    ];

    for (const session of sessions) {
      if (!session.time) continue;
      const sessionDate = new Date(session.time);
      if (sessionDate.getTime() > now) {
        return {
          event,
          sessionType: session.type,
          sessionTime: sessionDate,
          isPreSeason: false,
        };
      }
    }
  }

  return null;
}

export function CountdownHero() {
  const { timezone } = useSeasonStore();
  const { enabled: notificationsEnabled, requestPermission } = useNotificationPermission();
  const { notifications, scheduleNotification, cancelNotification } = useSessionNotifications();
  const now = useCurrentTime();

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [nextEvent, setNextEvent] = useState<ReturnType<typeof getNextEvent>>(null);

  // Update next event when simulated time changes
  useEffect(() => {
    const event = getNextEvent(now);
    setNextEvent(event);

    if (!event) {
      setTimeRemaining(null);
      return;
    }

    // Calculate time remaining based on current (possibly simulated) time
    const remaining = getTimeRemaining(event.sessionTime);
    // Adjust for simulated time
    const adjustedRemaining = {
      ...remaining,
      total: event.sessionTime.getTime() - now,
      days: Math.floor((event.sessionTime.getTime() - now) / (1000 * 60 * 60 * 24)),
      hours: Math.floor(((event.sessionTime.getTime() - now) / (1000 * 60 * 60)) % 24),
      minutes: Math.floor(((event.sessionTime.getTime() - now) / (1000 * 60)) % 60),
      seconds: Math.floor(((event.sessionTime.getTime() - now) / 1000) % 60),
    };
    setTimeRemaining(adjustedRemaining);
  }, [now]);

  // Get time of day for the session
  const timeOfDay = useMemo(() => {
    if (!nextEvent) return "day" as TimeOfDay;
    return getTimeOfDay(nextEvent.sessionTime, timezone);
  }, [nextEvent, timezone]);

  const handleNotifyClick = useCallback(async () => {
    if (!nextEvent) return;

    const sessionKey = nextEvent.isPreSeason
      ? `preseason-${nextEvent.event.name}-${nextEvent.sessionType}`
      : `${(nextEvent.event as F1Event).round}-${nextEvent.sessionType}`;
    const isSubscribed = notifications.some((n) => n.sessionKey === sessionKey);

    if (isSubscribed) {
      cancelNotification(sessionKey);
    } else {
      if (!notificationsEnabled) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      scheduleNotification(
        sessionKey,
        `${nextEvent.event.name} - ${nextEvent.sessionType}`,
        nextEvent.sessionTime,
        [30, 5]
      );
    }
  }, [nextEvent, notifications, notificationsEnabled, requestPermission, scheduleNotification, cancelNotification]);

  const handleAddToCalendar = useCallback(() => {
    if (!nextEvent) return;

    if (nextEvent.isPreSeason) {
      // Generate simple ICS for pre-season event
      const event = nextEvent.event;
      const startDate = nextEvent.sessionTime;
      const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // 4 hours

      const formatICSDate = (date: Date) =>
        date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//F1 Dashboard//F1 Calendar 2026//EN",
        "BEGIN:VEVENT",
        `UID:f1-2026-preseason-${event.name.replace(/\s+/g, "-")}-${nextEvent.sessionType}@f1dashboard`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:F1: ${event.name} - ${nextEvent.sessionType}`,
        `LOCATION:${event.circuit || event.location}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");

      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `F1-${event.name.replace(/\s+/g, "-")}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const icsContent = generateICS([nextEvent.event as F1Event]);
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `F1-${nextEvent.event.name.replace(/\s+/g, "-")}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [nextEvent]);

  if (!nextEvent || !timeRemaining) {
    return (
      <Card className="bg-gradient-to-r from-card to-card/80 border-border">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No upcoming events</p>
        </CardContent>
      </Card>
    );
  }

  const { event, sessionType, sessionTime, isPreSeason } = nextEvent;

  // Get country/location and flag
  const country = isPreSeason ? (event as PreSeasonEvent).location : (event as F1Event).country;
  const flag = COUNTRY_FLAGS[country] || "🏁";

  // Determine session key for notification check
  const sessionKey = isPreSeason
    ? `preseason-${event.name}-${sessionType}`
    : `${(event as F1Event).round}-${sessionType}`;
  const isSubscribed = notifications.some((n) => n.sessionKey === sessionKey);

  // Get event type badge
  const eventBadge = isPreSeason
    ? (event as PreSeasonEvent).type.toUpperCase()
    : (event as F1Event).isSprint
      ? "SPRINT"
      : null;

  // Format time in user's timezone (24-hour format)
  const localTime = sessionTime.toLocaleString("en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });

  // Background gradient based on time of day
  const bgGradients: Record<TimeOfDay, string> = {
    morning: "from-orange-950/20 via-card to-yellow-950/10",
    day: "from-card via-card to-primary/5",
    evening: "from-orange-950/30 via-card to-red-950/10",
    night: "from-blue-950/30 via-card to-indigo-950/20",
  };

  return (
    <Card className={`bg-gradient-to-r ${bgGradients[timeOfDay]} border-border overflow-hidden`}>
      <CardContent className="py-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Event Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>NEXT UP</span>
              {eventBadge && (
                <span className={`px-1.5 py-0.5 text-xs rounded ${
                  isPreSeason
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-primary/20 text-primary"
                }`}>
                  {eventBadge}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {flag} {event.name}
            </h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DaytimeIcon timeOfDay={timeOfDay} />
              <span>{sessionType} • {localTime}</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2 text-center items-end">
              <CountdownDigit value={timeRemaining.days} label="DAYS" />
              <span className="text-2xl font-bold text-muted-foreground pb-4">:</span>
              <CountdownDigit value={timeRemaining.hours} label="HRS" />
              <span className="text-2xl font-bold text-muted-foreground pb-4">:</span>
              <CountdownDigit value={timeRemaining.minutes} label="MIN" />
              <span className="text-2xl font-bold text-muted-foreground pb-4">:</span>
              <CountdownDigit value={timeRemaining.seconds} label="SEC" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant={isSubscribed ? "secondary" : "outline"}
              size="sm"
              onClick={handleNotifyClick}
              className="gap-1.5"
            >
              {isSubscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {isSubscribed ? "Subscribed" : "Notify Me"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCalendar}
              className="gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              Add to Cal
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <CountdownProgress total={timeRemaining.total} />
      </CardContent>
    </Card>
  );
}
