import { createTimeline, stagger } from "animejs";
import type { SceneHandle } from "./scene";

/**
 * Explore-mode entrance: swing the model in, draw the tube via setDrawRange,
 * then fade walls, DRS bands, start marker, chips and HUD.
 * Returns the timeline (cancel on unmount).
 */
export function playIntro(
  handle: SceneHandle,
  chipEls: HTMLElement[],
  hudEls: NodeListOf<Element> | Element[]
) {
  const totalIndices = handle.tubeGeo.index?.count ?? 0;
  const wallIndices = handle.wallGeo.index?.count ?? 0;
  handle.tubeGeo.setDrawRange(0, 0);
  handle.wallGeo.setDrawRange(0, 0);
  const draw = { p: 0 };

  const tl = createTimeline()
    .add(handle.group.rotation, { y: [-2.4, -0.55], duration: 1100, ease: "out(3)" })
    .add(handle.group.scale, { x: [0.72, 1], y: [0.72, 1], z: [0.72, 1], duration: 1100, ease: "out(3)" }, "<<")
    .add(handle.tubeMat, { opacity: [0, 1], duration: 300, ease: "linear" }, "-=900")
    .add(draw, {
      p: 1,
      duration: 1900,
      ease: "inOut(2)",
      onUpdate: () => {
        handle.tubeGeo.setDrawRange(0, Math.floor(draw.p * totalIndices));
        handle.wallGeo.setDrawRange(0, Math.floor(draw.p * wallIndices));
      },
    }, "<")
    .add(handle.wallMat, { opacity: [0, 0.16], duration: 800, ease: "linear" }, "-=1600")
    .add(handle.marker.material, { opacity: [0, 1], duration: 300 }, "-=500");

  for (const m of handle.drsMeshes) {
    tl.add(m.material, { opacity: [0, 0.85], duration: 400, ease: "linear" }, "-=300");
  }
  if (chipEls.length) {
    tl.add(chipEls, {
      opacity: [0, 1],
      scale: [0.4, 1],
      duration: 400,
      ease: "out(3)",
      delay: stagger(24),
    }, "-=500");
  }
  if (hudEls.length) {
    tl.add(hudEls, { opacity: [0, 1], duration: 400, ease: "linear" }, "-=350");
  }
  return tl;
}

/** Live-mode entrance: everything visible fast, no theatrics. */
export function showImmediate(handle: SceneHandle, chipEls: HTMLElement[], hudEls: NodeListOf<Element> | Element[]) {
  const tl = createTimeline()
    .add(handle.tubeMat, { opacity: [0, 1], duration: 350, ease: "linear" })
    .add(handle.wallMat, { opacity: [0, 0.12], duration: 350, ease: "linear" }, "<<")
    .add(handle.marker.material, { opacity: [0, 1], duration: 250 }, "<<");
  for (const m of handle.drsMeshes) {
    tl.add(m.material, { opacity: [0, 0.85], duration: 250, ease: "linear" }, "<<");
  }
  if (chipEls.length) tl.add(chipEls, { opacity: [0, 0.9], duration: 300 }, "<<");
  if (hudEls.length) tl.add(hudEls, { opacity: [0, 1], duration: 300 }, "<<");
  return tl;
}
