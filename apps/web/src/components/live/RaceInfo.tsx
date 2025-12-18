"use client";

import { cn } from "@/lib/utils";
import type { Weather, TrackStatus, RaceControlMessage } from "@/types/f1";

interface RaceInfoProps {
  lapCount?: { current: number; total: number };
  sessionTime?: string;
  weather: Weather | null;
  trackStatus: TrackStatus;
  recentMessages?: RaceControlMessage[];
}

export function RaceInfo({
  lapCount,
  sessionTime,
  weather,
  trackStatus,
  recentMessages = [],
}: RaceInfoProps) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {/* Session Info */}
      <div className="p-3 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Session
        </h3>

        {lapCount && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Lap</span>
            <span className="font-mono font-bold">
              {lapCount.current}
              <span className="text-muted-foreground">/{lapCount.total}</span>
            </span>
          </div>
        )}

        {sessionTime && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Time</span>
            <span className="font-mono font-bold">{sessionTime}</span>
          </div>
        )}
      </div>

      {/* Track Status */}
      <div className="p-3 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Track Status
        </h3>

        <TrackStatusIndicator status={trackStatus} />
      </div>

      {/* Weather */}
      <div className="p-3 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Weather
        </h3>

        {weather ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <WeatherItem label="Air" value={`${weather.airTemp}°C`} />
            <WeatherItem label="Track" value={`${weather.trackTemp}°C`} />
            <WeatherItem label="Humidity" value={`${weather.humidity}%`} />
            <WeatherItem label="Wind" value={`${weather.windSpeed} m/s`} />
            {weather.rainfall && (
              <div className="col-span-2 text-blue-400 font-medium">
                Rain Detected
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No weather data</p>
        )}
      </div>

      {/* Recent Messages */}
      <div className="p-3 space-y-3 flex-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Race Control
        </h3>

        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {recentMessages.length > 0 ? (
            recentMessages.slice(0, 5).map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "text-xs p-2 rounded bg-secondary/50",
                  msg.category === "FLAG" && msg.flag === "YELLOW" && "bg-yellow-500/20",
                  msg.category === "FLAG" && msg.flag === "RED" && "bg-red-500/20",
                  msg.category === "SAFETY_CAR" && "bg-orange-500/20"
                )}
              >
                <p className="text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
                <p>{msg.message}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No messages</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface TrackStatusIndicatorProps {
  status: TrackStatus;
}

function TrackStatusIndicator({ status }: TrackStatusIndicatorProps) {
  const statusConfig = {
    AllClear: { color: "bg-green-500", text: "GREEN", pulse: false },
    Yellow: { color: "bg-yellow-500", text: "YELLOW FLAG", pulse: true },
    SCDeployed: { color: "bg-orange-500", text: "SAFETY CAR", pulse: true },
    VSCDeployed: { color: "bg-orange-400", text: "VSC", pulse: true },
    Red: { color: "bg-red-500", text: "RED FLAG", pulse: true },
  };

  const config = statusConfig[status.status];

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-3 h-3 rounded-full",
          config.color,
          config.pulse && "animate-pulse"
        )}
      />
      <span className="font-bold text-sm">{config.text}</span>
    </div>
  );
}

interface WeatherItemProps {
  label: string;
  value: string;
}

function WeatherItem({ label, value }: WeatherItemProps) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
