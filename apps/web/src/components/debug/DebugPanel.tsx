"use client";

import { useState, useCallback } from "react";
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
import { Bug, X, Eye, Timer, Flag, Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { useDebugStore, DEBUG_PRESETS, SESSION_PRESETS } from "@/stores/debugStore";
import { F1Loader } from "@/components/ui/f1-loader";
import { getPollingIntervals, deriveSessionType } from "@/hooks/useSessionPolling";
import { useLiveStore } from "@/stores/liveStore";

// Connection test result type
interface ConnectionTestResult {
  endpoint: string;
  status: "pending" | "success" | "error";
  latency?: number;
  error?: string;
  dataCount?: number;
}

// Session type badge colors
const SESSION_TYPE_COLORS: Record<string, string> = {
  practice: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  testing: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
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
  const [connectionTests, setConnectionTests] = useState<ConnectionTestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [showPollingInfo, setShowPollingInfo] = useState(false);

  const { currentSession, isConnected } = useLiveStore();

  // Get current polling intervals
  const sessionName = currentSession?.sessionName || "";
  const sessionType = sessionName ? deriveSessionType(sessionName) : "practice";
  const isLive = currentSession?.status === "live";
  const pollingIntervals = getPollingIntervals(sessionType, isLive);

  // Test all API connections
  const runConnectionTests = useCallback(async () => {
    setIsTesting(true);
    const endpoints = [
      { name: "Sessions", url: "/api/live/sessions" },
      { name: "Timing", url: "/api/live/timing?session_key=latest" },
      { name: "Position", url: "/api/live/position?session_key=latest" },
      { name: "Race Control", url: "/api/live/race-control?session_key=latest" },
      { name: "Weather", url: "/api/live/weather?session_key=latest" },
      { name: "Drivers", url: "/api/live/drivers?session_key=latest" },
    ];

    // Initialize all as pending
    setConnectionTests(endpoints.map(e => ({ endpoint: e.name, status: "pending" })));

    // Test each endpoint
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      const startTime = performance.now();

      try {
        const response = await fetch(endpoint.url);
        const latency = Math.round(performance.now() - startTime);
        const data = await response.json();

        setConnectionTests(prev => {
          const updated = [...prev];
          updated[i] = {
            endpoint: endpoint.name,
            status: response.ok ? "success" : "error",
            latency,
            error: response.ok ? undefined : data.error || `HTTP ${response.status}`,
            dataCount: response.ok ? (Array.isArray(data) ? data.length : (data.timing?.length || data.positions?.length || data.messages?.length || 1)) : undefined,
          };
          return updated;
        });
      } catch (error) {
        const latency = Math.round(performance.now() - startTime);
        setConnectionTests(prev => {
          const updated = [...prev];
          updated[i] = {
            endpoint: endpoint.name,
            status: "error",
            latency,
            error: error instanceof Error ? error.message : "Network error",
          };
          return updated;
        });
      }

      // Small delay between tests to avoid rate limiting
      if (i < endpoints.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setIsTesting(false);
  }, []);

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
            {enabled && currentSessionPreset && simulatedDate && (
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
                {/* Only show date if it's a valid date (not epoch) */}
                {new Date(simulatedDate).getFullYear() > 1971 && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(simulatedDate).toLocaleString()}
                  </p>
                )}
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

        {/* Connection Test */}
        {effectiveMode === "live" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                API Connection
              </label>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={runConnectionTests}
                disabled={isTesting}
              >
                {isTesting ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Test
              </Button>
            </div>
            {connectionTests.length > 0 && (
              <div className="bg-secondary/30 rounded-lg p-2 space-y-1">
                {connectionTests.map((test) => (
                  <div key={test.endpoint} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{test.endpoint}</span>
                    <div className="flex items-center gap-1.5">
                      {test.status === "pending" && (
                        <Clock className="h-3 w-3 text-yellow-500 animate-pulse" />
                      )}
                      {test.status === "success" && (
                        <>
                          <span className="text-muted-foreground">{test.latency}ms</span>
                          {test.dataCount !== undefined && (
                            <span className="text-muted-foreground">({test.dataCount})</span>
                          )}
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        </>
                      )}
                      {test.status === "error" && (
                        <>
                          <span className="text-red-400 text-[10px] truncate max-w-[80px]" title={test.error}>
                            {test.error}
                          </span>
                          <XCircle className="h-3 w-3 text-red-500" />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Polling Intervals Info */}
        {effectiveMode === "live" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Polling Intervals
              </label>
              <Button
                variant={showPollingInfo ? "secondary" : "outline"}
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={() => setShowPollingInfo(!showPollingInfo)}
              >
                <Eye className="h-3 w-3" />
                {showPollingInfo ? "Hide" : "Show"}
              </Button>
            </div>
            {showPollingInfo && (
              <div className="bg-secondary/30 rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Mode:</span>
                  <Badge variant="outline" className={isLive ? "text-green-400 border-green-500/30" : "text-yellow-400 border-yellow-500/30"}>
                    {isLive ? "LIVE" : "NOT LIVE"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Session:</span>
                  <Badge variant="outline" className={SESSION_TYPE_COLORS[sessionType] || "text-gray-400"}>
                    {sessionType.toUpperCase()}
                  </Badge>
                </div>
                <div className="border-t border-border/50 my-1.5" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Timing</span>
                  <span className="font-mono">{(pollingIntervals.timing / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Position</span>
                  <span className="font-mono">{(pollingIntervals.position / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Telemetry</span>
                  <span className="font-mono">{(pollingIntervals.telemetry / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Race Control</span>
                  <span className="font-mono">{(pollingIntervals.raceControl / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Weather</span>
                  <span className="font-mono">{(pollingIntervals.weather / 1000).toFixed(1)}s</span>
                </div>
              </div>
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
