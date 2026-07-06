"use client";

import dynamic from "next/dynamic";

/**
 * The unified circuit map (three.js + anime.js). Client-only: WebGL cannot
 * render on the server, so the whole module graph loads behind next/dynamic.
 */
export const CircuitMap = dynamic(
  () => import("./CircuitMap").then((m) => m.CircuitMap),
  {
    ssr: false,
    loading: () => null,
  }
);

export type { CircuitMapProps, CircuitMapVariant } from "./CircuitMap";
