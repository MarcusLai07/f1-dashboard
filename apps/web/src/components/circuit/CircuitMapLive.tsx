"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useLiveStore } from "@/stores/liveStore";
import type { CarLocation, CarPosition } from "@/types/f1";
import { makeGpsMapper, type GpsMapper } from "@/lib/circuit3d/gpsTransform";
import { createCarLayer, type CarRenderInput } from "@/lib/circuit3d/cars";
import type { CircuitEngine } from "./CircuitMap";

interface CircuitMapLiveProps {
  engine: CircuitEngine;
  chipContainer: HTMLElement;
  followSelected: boolean;
  /** Synthetic positions from timing data (replay / no-GPS sessions) */
  fallbackPositions?: CarPosition[];
}

/**
 * Live car layer. Subscribes to the live store imperatively so the ~3.7Hz
 * location stream never re-renders React — updates flow straight into the
 * three.js car meshes (smoothed by per-car animatables in cars.ts).
 */
export function CircuitMapLive({
  engine,
  chipContainer,
  followSelected,
  fallbackPositions,
}: CircuitMapLiveProps) {
  const followVec = useRef(new THREE.Vector3());
  const fallbackRef = useRef<CarPosition[] | undefined>(fallbackPositions);
  fallbackRef.current = fallbackPositions;
  const applyRef = useRef<(() => void) | null>(null);

  // Fallback positions arrive via props (derived from timing in the page),
  // not the store — re-sync when they change.
  useEffect(() => {
    applyRef.current?.();
  }, [fallbackPositions]);

  useEffect(() => {
    const { handle, controls, projector, geometry } = engine;
    const carLayer = createCarLayer(handle, projector, chipContainer);
    const mapper: GpsMapper | null = geometry ? makeGpsMapper(geometry.transform) : null;

    const lastPos = new Map<string, { x: number; z: number }>();
    let selected: string[] = [];

    const fromLocations = (locations: CarLocation[], selectedDrivers: string[]): CarRenderInput[] =>
      locations.map((loc) => {
        const [xn, yn] = mapper!(loc.x, loc.y);
        const x = xn;
        const z = -yn;
        lastPos.set(loc.driverCode, { x, z });
        return {
          code: loc.driverCode,
          color: loc.teamColor || "#808080",
          x,
          z,
          inPit: false,
          selected: selectedDrivers.includes(loc.driverCode),
        };
      });

    // No-GPS fallback: place cars by sector progress along the curve
    const fromPositions = (positions: CarPosition[], selectedDrivers: string[]): CarRenderInput[] => {
      const [b1, b2] = geometry?.sectors ?? [1 / 3, 2 / 3];
      return positions.map((p) => {
        const prog = p.sectorProgress ?? 0.5;
        const frac =
          p.sector === 1 ? prog * b1 :
          p.sector === 2 ? b1 + (b2 - b1) * prog :
          b2 + (1 - b2) * prog;
        const pt = handle.curve.getPointAt(((frac % 1) + 1) % 1);
        lastPos.set(p.driverCode, { x: pt.x, z: pt.z });
        return {
          code: p.driverCode,
          color: p.teamColor || "#808080",
          x: pt.x,
          z: pt.z,
          inPit: p.status === "PIT",
          selected: selectedDrivers.includes(p.driverCode),
        };
      });
    };

    const applyState = (state: ReturnType<typeof useLiveStore.getState>) => {
      selected = state.selectedDrivers;
      const fallback =
        fallbackRef.current && fallbackRef.current.length > 0
          ? fallbackRef.current
          : state.positions;
      if (mapper && state.locations.length > 0) {
        carLayer.sync(fromLocations(state.locations, selected));
      } else if (fallback.length > 0) {
        carLayer.sync(fromPositions(fallback, selected));
      } else {
        carLayer.sync([]);
      }

      if (followSelected && selected.length > 0) {
        controls.setFollowTarget(() => {
          const p = lastPos.get(selected[0]);
          if (!p) return null;
          return followVec.current.set(p.x, 0, p.z);
        });
      } else {
        controls.setFollowTarget(null);
      }
    };

    applyRef.current = () => applyState(useLiveStore.getState());
    applyState(useLiveStore.getState());

    let prevLocations: CarLocation[] | null = null;
    let prevPositions: CarPosition[] | null = null;
    let prevSelected: string[] | null = null;
    const unsub = useLiveStore.subscribe((state) => {
      if (
        state.locations === prevLocations &&
        state.positions === prevPositions &&
        state.selectedDrivers === prevSelected
      ) {
        return;
      }
      prevLocations = state.locations;
      prevPositions = state.positions;
      prevSelected = state.selectedDrivers;
      applyState(state);
    });

    return () => {
      applyRef.current = null;
      unsub();
      controls.setFollowTarget(null);
      carLayer.dispose();
    };
  }, [engine, chipContainer, followSelected]);

  return null;
}
