"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSessions } from "@/lib/api";
import type { Session } from "@/types/f1";

interface SessionSelectorProps {
  onSessionChange: (sessionKey: number | null) => void;
  currentSessionKey?: number | null;
}

export function SessionSelector({
  onSessionChange,
  currentSessionKey,
}: SessionSelectorProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const { recent, current } = await getSessions();
        setSessions(recent);

        // Auto-select current/latest session if none selected
        if (!currentSessionKey && (current || recent.length > 0)) {
          const sessionToSelect = current || recent[0];
          onSessionChange(sessionToSelect.sessionKey);
        }
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, [currentSessionKey, onSessionChange]);

  if (loading) {
    return (
      <div className="h-9 w-64 bg-secondary animate-pulse rounded-md" />
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No recent sessions available
      </div>
    );
  }

  return (
    <Select
      value={currentSessionKey?.toString()}
      onValueChange={(value) => onSessionChange(parseInt(value))}
    >
      <SelectTrigger className="w-64 bg-secondary border-border">
        <SelectValue placeholder="Select session" />
      </SelectTrigger>
      <SelectContent>
        {sessions.map((session) => (
          <SelectItem
            key={session.sessionKey}
            value={session.sessionKey.toString()}
          >
            <div className="flex items-center gap-2">
              <span>{session.meetingName}</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-muted-foreground">{session.sessionName}</span>
              {session.status === "live" && (
                <span className="ml-1 text-xs text-red-500 font-medium">LIVE</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
