"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatSessionTime } from "@/lib/calendarUtils";
import type { MotorsportEvent, SeriesInfo } from "@/data";

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
  France: "🇫🇷",
  Portugal: "🇵🇹",
  Sweden: "🇸🇪",
  Kenya: "🇰🇪",
  Finland: "🇫🇮",
  Thailand: "🇹🇭",
  Germany: "🇩🇪",
  Croatia: "🇭🇷",
};

interface EventCardProps {
  event: MotorsportEvent;
  seriesInfo?: SeriesInfo;
  timezone: string;
}

export function EventCard({ event, timezone }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const flag = COUNTRY_FLAGS[event.country] || "🏁";

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <CardContent className="p-3 flex items-center gap-3">
          {/* Expand Icon */}
          <div className="text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>

          {/* Flag */}
          <span className="text-xl">{flag}</span>

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{event.name}</span>
              {event.isFeatured && (
                <Badge variant="outline" className="text-xs">
                  Featured
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.circuit}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {event.status === "provisional" && (
            <Badge variant="secondary" className="text-xs">
              TBC
            </Badge>
          )}
        </CardContent>
      </button>

      {/* Expanded Sessions */}
      {isExpanded && (
        <div className="border-t border-border bg-secondary/20 p-3">
          <div className="flex flex-col gap-2">
            {event.sessions.map((session, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      session.type === "race" &&
                        "bg-green-500/20 text-green-400 border-green-500/30",
                      session.type === "qualifying" &&
                        "bg-purple-500/20 text-purple-400 border-purple-500/30",
                      session.type === "sprint" &&
                        "bg-orange-500/20 text-orange-400 border-orange-500/30",
                      session.type === "practice" &&
                        "bg-blue-500/20 text-blue-400 border-blue-500/30",
                      session.type === "stage" &&
                        "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                      session.type === "shakedown" &&
                        "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    )}
                  >
                    {session.shortName || session.name}
                  </Badge>
                  <span>{session.name}</span>
                  {session.duration && (
                    <span className="text-muted-foreground">
                      ({session.duration})
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatSessionTime(session.dateTime, timezone)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
