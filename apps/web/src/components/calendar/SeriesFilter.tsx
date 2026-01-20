"use client";

import { useCalendarStore } from "@/stores/calendarStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SeriesInfo } from "@/data";

interface SeriesFilterProps {
  series: SeriesInfo[];
}

export function SeriesFilter({ series }: SeriesFilterProps) {
  const { enabledSeries, toggleSeries, enableAllSeries, disableAllSeries } =
    useCalendarStore();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Filter by Series
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={enableAllSeries}>
            All
          </Button>
          <Button variant="ghost" size="sm" onClick={disableAllSeries}>
            None
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {series.map((s) => {
          const isEnabled = enabledSeries.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggleSeries(s.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                isEnabled
                  ? "border-transparent text-white"
                  : "border-border text-muted-foreground bg-transparent hover:bg-secondary/50"
              )}
              style={{
                backgroundColor: isEnabled ? s.color : undefined,
              }}
            >
              {s.shortName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
