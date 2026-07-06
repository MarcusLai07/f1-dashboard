"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { animate } from "animejs";
import { cn } from "@/lib/utils";
import { useLiveStore } from "@/stores/liveStore";
import type { CarPosition } from "@/types/f1";
import {
  getCircuit,
  getCircuitByName,
  getCircuitGeometry,
  type CircuitData,
  type CircuitGeometry,
  type Turn,
} from "@/data";
import { createCircuitScene, type SceneHandle } from "@/lib/circuit3d/scene";
import { createOrbitControls, type OrbitControls } from "@/lib/circuit3d/controls";
import { createLabelProjector, type LabelProjector } from "@/lib/circuit3d/labels";
import { playIntro, showImmediate } from "@/lib/circuit3d/intro";
import { SECTOR_COLORS, DRS_COLOR, type ViewPreset } from "@/lib/circuit3d/constants";
import { CircuitMapLive } from "./CircuitMapLive";

export type CircuitMapVariant = "live" | "explore";

export interface CircuitMapProps {
  variant: CircuitMapVariant;
  /** Preferred: manifest id, e.g. "spa" */
  circuitId?: string;
  /** Fallback: fuzzy name (OpenF1 session naming), e.g. "Spa-Francorchamps" */
  trackName?: string;
  className?: string;
  showIntro?: boolean;
  showGhostCar?: boolean;
  followSelected?: boolean;
  /** Synthetic positions (e.g. replay mode) used when no GPS stream exists */
  fallbackPositions?: CarPosition[];
  onCornerClick?: (turn: Turn) => void;
}

interface CornerChip {
  label: string;
  frac: number;
  turn?: Turn;
}

export interface CircuitEngine {
  handle: SceneHandle;
  controls: OrbitControls;
  projector: LabelProjector;
  geometry: CircuitGeometry | null;
  circuit: CircuitData;
}

export function CircuitMap({
  variant,
  circuitId,
  trackName,
  className,
  showIntro,
  showGhostCar,
  followSelected = true,
  fallbackPositions,
  onCornerClick,
}: CircuitMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chipContainerRef = useRef<HTMLDivElement>(null);
  const carContainerRef = useRef<HTMLDivElement>(null);
  const [circuit, setCircuit] = useState<CircuitData | null>(null);
  const [geometry, setGeometry] = useState<CircuitGeometry | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [engine, setEngine] = useState<CircuitEngine | null>(null);
  const [preset, setPreset] = useState<ViewPreset>(variant === "live" ? "top" : "3d");

  const wantIntro = showIntro ?? variant === "explore";
  const wantGhost = showGhostCar ?? variant === "explore";

  // 2026 Overtake Mode is race-control gated ("OVERTAKE ENABLED/DISABLED"),
  // like DRS activation used to be. Messages are stored newest-first.
  const overtakeEnabled = useLiveStore((s) => {
    if (variant !== "live") return null;
    for (const m of s.raceControl) {
      const msg = m.message?.toUpperCase() ?? "";
      if (msg.includes("OVERTAKE ENABLED")) return true;
      if (msg.includes("OVERTAKE DISABLED")) return false;
    }
    return null;
  });

  // Data loading
  useEffect(() => {
    let alive = true;
    setLoaded(false);
    (async () => {
      const c = circuitId
        ? await getCircuit(circuitId)
        : trackName
          ? await getCircuitByName(trackName)
          : null;
      if (!alive) return;
      const g = c ? await getCircuitGeometry(c.id) : null;
      if (!alive) return;
      setCircuit(c);
      setGeometry(g);
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [circuitId, trackName]);

  // Corner chips: positions from telemetry geometry (accurate arc fractions),
  // metadata joined from the hand-curated circuit data by corner number.
  const corners = useMemo<CornerChip[]>(() => {
    if (!circuit) return [];
    if (geometry) {
      return geometry.corners.map(([label, frac]) => {
        const num = parseInt(label, 10);
        return { label, frac, turn: circuit.corners?.find((t) => t.number === num) };
      });
    }
    return (circuit.corners ?? []).map((t) => ({
      label: String(t.number),
      frac: t.position / 100,
      turn: t,
    }));
  }, [circuit, geometry]);

  // Scene lifecycle
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !loaded || !circuit) return;

    const width = host.clientWidth || 640;
    const height = host.clientHeight > 60 ? host.clientHeight : Math.round(width * 0.58);

    // 2026: no DRS — highlight the throttle-derived overtake zones (major
    // flat-out stretches). Legacy circuits without geometry fall back to the
    // hand-curated DRS zones so pre-2026 data still renders sensibly.
    const lapMeters = (geometry?.len ?? circuit.length) * 1000;
    const zoneBands: [number, number][] =
      geometry?.overtakeZones ??
      (circuit.drsZones ?? []).map((z) => {
        const a = z.activation / 100;
        const span = z.length ? z.length / lapMeters : 0.06;
        return [a, a + span];
      });

    const handle = createCircuitScene(host, {
      geometry,
      svgPath: circuit.svg?.path,
      drsBands: zoneBands,
      width,
      height,
    });
    const controls = createOrbitControls(handle, {
      autoSpin: variant === "explore",
      initialPreset: variant === "live" ? "top" : "3d",
    });
    const projector = createLabelProjector(handle);

    // Corner chips
    const chipEls: HTMLElement[] = [];
    const chipContainer = chipContainerRef.current;
    if (chipContainer) {
      for (const el of Array.from(chipContainer.children) as HTMLElement[]) {
        const frac = parseFloat(el.dataset.frac ?? "0");
        const p = handle.curve.getPointAt(((frac % 1) + 1) % 1);
        projector.add(el, new THREE.Vector3(p.x, p.y + 0.07, p.z));
        chipEls.push(el);
      }
    }

    // Ghost car (explore)
    let ghostAnim: ReturnType<typeof animate> | null = null;
    let ghost: THREE.Mesh | null = null;
    if (wantGhost) {
      ghost = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
      );
      handle.group.add(ghost);
      const lap = { t: 0 };
      ghostAnim = animate(lap, {
        t: 1,
        duration: Math.round((geometry?.len ?? circuit.length) * 1350),
        delay: wantIntro ? 1800 : 200,
        ease: "linear",
        loop: true,
        onUpdate: () => {
          const p = handle.curve.getPointAt(lap.t % 1);
          ghost!.position.set(p.x, p.y + 0.012, p.z);
        },
      });
    }

    const hudEls = host.querySelectorAll("[data-circuit-hud]");
    const introTl = wantIntro
      ? playIntro(handle, chipEls, hudEls)
      : showImmediate(handle, chipEls, hudEls);

    setEngine({ handle, controls, projector, geometry, circuit });

    return () => {
      setEngine(null);
      introTl.cancel();
      ghostAnim?.cancel();
      if (ghost) {
        handle.group.remove(ghost);
        ghost.geometry.dispose();
        (ghost.material as THREE.Material).dispose();
      }
      projector.dispose();
      controls.dispose();
      handle.dispose();
    };
  }, [loaded, circuit, geometry, variant, wantGhost, wantIntro]);

  const applyPreset = (p: ViewPreset) => {
    setPreset(p);
    engine?.controls.setPreset(p);
  };

  if (loaded && !circuit) {
    return (
      <div className={cn("flex items-center justify-center text-sm text-muted-foreground py-10", className)}>
        Circuit data unavailable{trackName ? ` for ${trackName}` : ""}
      </div>
    );
  }

  return (
    <div ref={hostRef} className={cn("relative select-none", className)}>
      {/* Corner chips (projected each frame) */}
      <div ref={chipContainerRef} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden={!onCornerClick}>
        {corners.map((c, i) => (
          <span
            key={`${c.label}-${i}`}
            data-frac={c.frac}
            title={c.turn?.name ? `T${c.label} · ${c.turn.name}` : `Turn ${c.label}`}
            onClick={c.turn && onCornerClick ? () => onCornerClick(c.turn!) : undefined}
            className={cn(
              "absolute left-0 top-0 rounded-md border border-border bg-background/85 px-1 py-px text-[9px] font-bold tracking-wide text-foreground opacity-0",
              c.turn && onCornerClick && "pointer-events-auto cursor-pointer hover:bg-accent"
            )}
          >
            {c.label}
          </span>
        ))}
      </div>

      {/* Driver chips container (live) */}
      <div ref={carContainerRef} className="absolute inset-0 overflow-hidden pointer-events-none" />

      {/* HUD */}
      <div data-circuit-hud className="absolute left-3 bottom-2.5 flex gap-3 text-[10px] tracking-widest uppercase text-muted-foreground opacity-0 pointer-events-none">
        {geometry?.sectors && (
          <>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm" style={{ background: SECTOR_COLORS[0] }} />S1</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm" style={{ background: SECTOR_COLORS[1] }} />S2</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm" style={{ background: SECTOR_COLORS[2] }} />S3</span>
          </>
        )}
        {((geometry?.overtakeZones?.length ?? 0) > 0 || (circuit?.drsZones?.length ?? 0) > 0) && (
          <span
            className="flex items-center gap-1"
            title="Overtake zones — major flat-out stretches where passes happen (2026 has no DRS)"
          >
            <i className="h-2 w-2 rounded-sm" style={{ background: DRS_COLOR }} />OT
          </span>
        )}
        {geometry && <span>Δ {geometry.elev} m</span>}
      </div>

      <div data-circuit-hud className="absolute right-2.5 bottom-2.5 flex flex-col gap-1.5 opacity-0">
        <div className="flex gap-1.5">
          {(["top", "3d"] as ViewPreset[]).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={cn(
                "h-7 rounded-md border border-border bg-background/85 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground",
                preset === p && "text-foreground border-f1-red"
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 self-end">
          <button aria-label="Zoom in" onClick={() => engine?.controls.zoomBy(-0.55)} className="h-7 w-7 rounded-md border border-border bg-background/85 text-sm text-foreground hover:bg-accent">+</button>
          <button aria-label="Zoom out" onClick={() => engine?.controls.zoomBy(0.55)} className="h-7 w-7 rounded-md border border-border bg-background/85 text-sm text-foreground hover:bg-accent">−</button>
        </div>
      </div>

      <span data-circuit-hud className="absolute right-3 top-2.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground opacity-0 pointer-events-none">
        drag to rotate · scroll to zoom
      </span>

      {variant === "live" && overtakeEnabled !== null && (
        <span
          className={cn(
            "absolute left-3 top-2.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest pointer-events-none",
            overtakeEnabled
              ? "border-f1-green/60 bg-f1-green/15 text-f1-green animate-pulse"
              : "border-border bg-background/70 text-muted-foreground"
          )}
        >
          Overtake {overtakeEnabled ? "enabled" : "disabled"}
        </span>
      )}

      {variant === "live" && engine && carContainerRef.current && (
        <CircuitMapLive
          engine={engine}
          chipContainer={carContainerRef.current}
          followSelected={followSelected}
          fallbackPositions={fallbackPositions}
        />
      )}
    </div>
  );
}
