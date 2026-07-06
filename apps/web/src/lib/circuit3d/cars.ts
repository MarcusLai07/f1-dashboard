import * as THREE from "three";
import { createAnimatable, utils } from "animejs";
import type { SceneHandle } from "./scene";
import type { LabelProjector } from "./labels";
import { CAR_LERP_MS } from "./constants";

/** Normalized-space render state for one car (already GPS-mapped or estimated). */
export interface CarRenderInput {
  code: string;
  color: string; // team color, hex
  /** three group-space coords (x, z); y comes from the elevation sampler */
  x: number;
  z: number;
  inPit: boolean;
  selected: boolean;
}

/** Setter methods createAnimatable generates for the animated properties */
type PositionLerp = { x: (v: number) => void; z: (v: number) => void };

interface CarEntry {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  lerp: PositionLerp;
  chip: HTMLElement;
  anchor: THREE.Vector3;
  color: string;
  elevHint: { index: number };
}

export interface CarLayer {
  /** Full desired state; diffs internally (adds/updates/removes cars) */
  sync: (cars: CarRenderInput[]) => void;
  dispose: () => void;
}

const CAR_RADIUS = 0.022;
const CHIP_LIFT = 0.075;

export function createCarLayer(
  handle: SceneHandle,
  projector: LabelProjector,
  chipContainer: HTMLElement
): CarLayer {
  const sphereGeo = new THREE.SphereGeometry(CAR_RADIUS, 16, 16);
  const cars = new Map<string, CarEntry>();

  const unsubFrame = handle.onFrame(() => {
    // Keep car height glued to the track as it lerps + keep chip anchored
    for (const car of cars.values()) {
      car.mesh.position.y =
        handle.elevationAt(car.mesh.position.x, car.mesh.position.z, car.elevHint) + 0.012;
      car.anchor.set(car.mesh.position.x, car.mesh.position.y + CHIP_LIFT, car.mesh.position.z);
    }
  });

  const addCar = (input: CarRenderInput): CarEntry => {
    const mat = new THREE.MeshBasicMaterial({ color: input.color });
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.set(input.x, 0, input.z);
    handle.group.add(mesh);

    const chip = document.createElement("span");
    chip.className =
      "absolute left-0 top-0 rounded px-1 py-px text-[9px] font-bold tracking-wide pointer-events-none border bg-black/75";
    chip.textContent = input.code;
    chip.style.color = input.color;
    chip.style.borderColor = input.color + "66";
    chipContainer.appendChild(chip);

    const anchor = new THREE.Vector3(input.x, CHIP_LIFT, input.z);
    projector.add(chip, anchor);

    // Smooth ~3.7Hz updates into continuous motion
    const lerp = createAnimatable(mesh.position, {
      x: CAR_LERP_MS,
      z: CAR_LERP_MS,
      ease: "linear",
    }) as unknown as PositionLerp;
    return { mesh, mat, lerp, chip, anchor, color: input.color, elevHint: { index: -1 } };
  };

  return {
    sync: (inputs) => {
      const seen = new Set<string>();
      for (const input of inputs) {
        seen.add(input.code);
        let car = cars.get(input.code);
        if (!car) {
          car = addCar(input);
          cars.set(input.code, car);
        }
        car.lerp.x(input.x);
        car.lerp.z(input.z);
        if (car.color !== input.color) {
          car.color = input.color;
          car.mat.color.set(input.color);
          car.chip.style.color = input.color;
          car.chip.style.borderColor = input.color + "66";
        }
        const opacity = input.inPit ? 0.35 : 1;
        car.mat.transparent = true;
        car.mat.opacity = opacity;
        car.chip.style.opacity = input.inPit ? "0.4" : "1";
        const scale = input.selected ? 1.6 : 1;
        car.mesh.scale.setScalar(scale);
        car.chip.style.fontWeight = input.selected ? "900" : "700";
        car.chip.style.zIndex = input.selected ? "10" : "1";
      }
      for (const [code, car] of cars) {
        if (!seen.has(code)) {
          utils.remove(car.mesh.position);
          projector.remove(car.chip);
          car.chip.remove();
          handle.group.remove(car.mesh);
          car.mat.dispose();
          cars.delete(code);
        }
      }
    },
    dispose: () => {
      unsubFrame();
      for (const car of cars.values()) {
        utils.remove(car.mesh.position);
        projector.remove(car.chip);
        car.chip.remove();
        handle.group.remove(car.mesh);
        car.mat.dispose();
      }
      cars.clear();
      sphereGeo.dispose();
    },
  };
}
