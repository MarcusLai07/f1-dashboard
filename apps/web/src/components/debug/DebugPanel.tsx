"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bug, X, Eye, Timer, Flag } from "lucide-react";
import { useDebugStore, DEBUG_PRESETS, SESSION_PRESETS, type SessionType } from "@/stores/debugStore";
import { F1Loader } from "@/components/ui/f1-loader";

// Session type badge colors
const SESSION_TYPE_COLORS: Record<string, string> = {
  practice: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  qualifying: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  sprint: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  race: "bg-green-500/20 text-green-400 border-green-500/30",
};

interface DebugPanelProps {
  mode?: "season" | "live" | "auto";
}

export function DebugPanel({ mode = "auto" }: DebugPanelProps) {
  const pathname = usePathname();
  const {
    enabled,
    simulatedDate,
    simulatedSessionType,
    showLoader,
    setEnabled,
    setSimulatedDate,
    setSimulatedSession,
    setShowLoader,
  } = useDebugStore();
  const [isOpen, setIsOpen] = useState(false);

  // Determine mode based on current path if auto
  const effectiveMode = mode === "auto"
    ? pathname === "/" ? "live" : "season"
    : mode;

  // Only show toggle button in development
  if (process.env.NODE_ENV !== "development" && !enabled) {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 gap-1.5 bg-background/80 backdrop-blur"
        onClick={() => setIsOpen(true)}
      >
        <Bug className="h-4 w-4" />
        Debug
        {enabled && (
          <span className="ml-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        )}
      </Button>
    );
  }

  // Get current preset info for Live mode
  const currentSessionPreset = SESSION_PRESETS.find((p) => p.value === simulatedDate);

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 bg-background/95 backdrop-blur border-primary/20 shadow-xl">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bug className="h-4 w-4 text-primary" />
          Debug Panel
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {effectiveMode === "live" ? "Live" : "Season"}
          </Badge>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {effectiveMode === "live" ? (
          /* Live Mode - Session Simulation */
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Flag className="h-3 w-3" />
              Simulate Session
            </label>
            <Select
              value={simulatedDate || "real"}
              onValueChange={(value) => {
                if (value === "real") {
                  setSimulatedSession(null, null);
                } else {
                  const preset = SESSION_PRESETS.find((p) => p.value === value);
                  setSimulatedSession(value, preset?.sessionType || null);
                }
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select session..." />
              </SelectTrigger>
              <SelectContent>
                {SESSION_PRESETS.map((preset) => (
                  <SelectItem
                    key={preset.label}
                    value={preset.value || "real"}
                  >
                    <div className="flex items-center gap-2">
                      {preset.sessionType && (
                        <span className={`text-[10px] px-1 rounded ${SESSION_TYPE_COLORS[preset.sessionType]}`}>
                          {preset.sessionType.toUpperCase()}
                        </span>
                      )}
                      {preset.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {enabled && currentSessionPreset && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {currentSessionPreset.sessionType && (
                    <Badge
                      variant="outline"
                      className={SESSION_TYPE_COLORS[currentSessionPreset.sessionType]}
                    >
                      {currentSessionPreset.sessionType.toUpperCase()}
                    </Badge>
                  )}
                  <span className="text-xs text-primary">{currentSessionPreset.event}</span>
                </div>
                {currentSessionPreset.description && (
                  <p className="text-xs text-muted-foreground">{currentSessionPreset.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(simulatedDate!).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Season Mode - Date Simulation */
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Timer className="h-3 w-3" />
              Simulate Date/Time
            </label>
            <Select
              value={simulatedDate || "real"}
              onValueChange={(value) => {
                setSimulatedDate(value === "real" ? null : value);
                setEnabled(value !== "real");
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select time..." />
              </SelectTrigger>
              <SelectContent>
                {DEBUG_PRESETS.map((preset) => (
                  <SelectItem
                    key={preset.label}
                    value={preset.value || "real"}
                  >
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {enabled && simulatedDate && (
              <p className="text-xs text-primary">
                Simulating: {new Date(simulatedDate).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* F1 Loader Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              F1 Loader Preview
            </label>
            <Button
              variant={showLoader ? "secondary" : "outline"}
              size="sm"
              className="h-6 text-xs gap-1"
              onClick={() => setShowLoader(!showLoader)}
            >
              <Eye className="h-3 w-3" />
              {showLoader ? "Hide" : "Show"}
            </Button>
          </div>
          {showLoader && (
            <div className="bg-secondary/30 rounded-lg p-4 flex justify-center">
              <F1Loader size="md" text="Loading..." />
            </div>
          )}
        </div>

        {/* Debug Mode Toggle */}
        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Debug Mode
            </label>
            <Button
              variant={enabled ? "default" : "outline"}
              size="sm"
              className={`h-7 text-xs px-3 ${enabled ? "bg-green-600 hover:bg-green-700" : ""}`}
              onClick={() => setEnabled(!enabled)}
            >
              {enabled ? "ON" : "OFF"}
            </Button>
          </div>
          {enabled && (
            <p className="text-xs text-green-500">
              ✓ 2025 historical sessions available in selector
            </p>
          )}
          {enabled && simulatedSessionType && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Session Type:</span>
              <Badge
                variant="outline"
                className={SESSION_TYPE_COLORS[simulatedSessionType]}
              >
                {simulatedSessionType.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
