"use client";

import { useEffect, useMemo, useRef } from "react";
import { animate, stagger } from "animejs";
import { ArrowUp } from "lucide-react";
import { useLiveStore } from "@/stores/liveStore";
import type { Overtake } from "@/types/f1";

const MAX_ROWS = 12;

interface DriverBadge {
  code: string;
  color: string;
}

/**
 * Live overtakes feed (OpenF1 /overtakes). Driver numbers resolve to codes and
 * team colors through the timing tower data already in the store.
 */
export function OvertakesFeed() {
  const overtakes = useLiveStore((s) => s.overtakes);
  const timing = useLiveStore((s) => s.timing);
  const listRef = useRef<HTMLDivElement>(null);
  const animatedKeys = useRef<Set<string>>(new Set());

  const driverByNumber = useMemo(() => {
    const map = new Map<number, DriverBadge>();
    for (const d of timing) {
      map.set(d.driverNumber, {
        code: d.driverCode,
        color: d.teamColor || "#808080",
      });
    }
    return map;
  }, [timing]);

  const rows = overtakes.slice(0, MAX_ROWS);

  // Slide new rows in as they arrive (first paint staggers the initial batch)
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const fresh = [...list.children].filter((el) => {
      const key = (el as HTMLElement).dataset.key!;
      if (animatedKeys.current.has(key)) return false;
      animatedKeys.current.add(key);
      return true;
    });
    if (fresh.length > 0) {
      animate(fresh, {
        opacity: [0, 1],
        translateX: [-14, 0],
        duration: 350,
        ease: "outQuad",
        delay: stagger(45),
      });
    }
  }, [rows]);

  if (rows.length === 0) return null;

  const badge = (num: number) =>
    driverByNumber.get(num) ?? { code: `#${num}`, color: "#808080" };

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Overtakes
      </h3>
      <div ref={listRef} className="space-y-1.5">
        {rows.map((o: Overtake) => {
          const key = `${o.timestamp}|${o.overtakingDriverNumber}|${o.overtakenDriverNumber}`;
          const winner = badge(o.overtakingDriverNumber);
          const loser = badge(o.overtakenDriverNumber);
          return (
            <div
              key={key}
              data-key={key}
              className="flex items-center gap-2 text-xs tabular-nums opacity-0"
            >
              <span className="w-8 shrink-0 rounded bg-secondary/60 px-1 py-px text-center font-bold text-foreground">
                P{o.position}
              </span>
              <span className="font-bold" style={{ color: winner.color }}>
                {winner.code}
              </span>
              <ArrowUp className="h-3 w-3 shrink-0 text-f1-green" />
              <span className="font-semibold opacity-70" style={{ color: loser.color }}>
                {loser.code}
              </span>
              <span className="ml-auto text-muted-foreground">
                {new Date(o.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
