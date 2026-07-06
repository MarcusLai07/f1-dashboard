import * as THREE from "three";
import type { SceneHandle } from "./scene";

export interface LabelProjector {
  add: (el: HTMLElement, anchor: THREE.Vector3) => void;
  remove: (el: HTMLElement) => void;
  dispose: () => void;
}

/**
 * Projects group-space anchor points into screen space every frame and
 * positions absolutely-placed HTML elements over the canvas. Shared by
 * corner chips and driver chips.
 */
export function createLabelProjector(handle: SceneHandle): LabelProjector {
  const entries = new Map<HTMLElement, THREE.Vector3>();
  const wv = new THREE.Vector3();

  const unsub = handle.onFrame(() => {
    if (!entries.size) return;
    handle.group.updateMatrixWorld();
    for (const [el, anchor] of entries) {
      wv.copy(anchor).applyMatrix4(handle.group.matrixWorld).project(handle.camera);
      const sx = (wv.x * 0.5 + 0.5) * handle.width;
      const sy = (-wv.y * 0.5 + 0.5) * handle.height;
      el.style.transform = `translate(-50%, -50%) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
      el.style.visibility = wv.z < 1 ? "visible" : "hidden";
    }
  });

  return {
    add: (el, anchor) => entries.set(el, anchor),
    remove: (el) => entries.delete(el),
    dispose: () => {
      unsub();
      entries.clear();
    },
  };
}
