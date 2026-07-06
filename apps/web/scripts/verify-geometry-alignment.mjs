#!/usr/bin/env node
/**
 * Empirical check that the baked GPS transforms in src/data/circuits/geometry/
 * align real OpenF1 location data onto the 3D track geometry.
 *
 * For each circuit: finds the 2024 Race session via the public OpenF1 API,
 * pulls a few minutes of one driver's location stream, maps it through the
 * circuit's transform (same math as src/lib/circuit3d/gpsTransform.ts), and
 * reports p50/p95 distance from the mapped points to the track polyline,
 * in meters. Values within ~tube-radius (≈ 8 m at typical scale) mean cars
 * will render on the tarmac.
 *
 * Usage: node scripts/verify-geometry-alignment.mjs [id ...]
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GEO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/data/circuits/geometry");
const API = "https://api.openf1.org/v1";

// OpenF1 circuit_short_name -> geometry id
const SHORT_NAMES = {
  "Melbourne": "albert-park", "Sakhir": "bahrain", "Jeddah": "jeddah",
  "Suzuka": "suzuka", "Shanghai": "shanghai", "Miami": "miami",
  "Imola": "imola", "Monte Carlo": "monaco", "Montreal": "montreal",
  "Catalunya": "barcelona", "Spielberg": "red-bull-ring", "Silverstone": "silverstone",
  "Hungaroring": "hungaroring", "Spa-Francorchamps": "spa", "Zandvoort": "zandvoort",
  "Monza": "monza", "Baku": "baku", "Singapore": "marina-bay",
  "Austin": "cota", "Mexico City": "mexico-city", "Interlagos": "interlagos",
  "Las Vegas": "las-vegas", "Lusail": "lusail", "Yas Marina Circuit": "yas-marina",
};

const DEFAULT_IDS = ["spa", "monza", "monaco", "baku", "suzuka", "interlagos", "bahrain", "silverstone"];

async function api(pathAndQuery) {
  const res = await fetch(`${API}${pathAndQuery}`);
  if (!res.ok) throw new Error(`OpenF1 ${res.status}: ${pathAndQuery}`);
  return res.json();
}

function makeMapper(t) {
  const a = (t.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(a), sin = Math.sin(a);
  const scale = t.scale * (t.scaleAdjust || 1);
  const [ox, oy] = t.offset ?? [0, 0];
  return (x, y, unit) => {
    const xm = x * unit, ym = y * unit;
    const xr = xm * cos - ym * sin;
    const yr = xm * sin + ym * cos;
    return [(xr - t.center[0]) / scale + ox, (yr - t.center[1]) / scale + oy];
  };
}

function detectUnit(locs, rawBounds) {
  const xs = locs.map((l) => l.x), ys = locs.map((l) => l.y);
  const extent = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const ref = Math.max(rawBounds[1] - rawBounds[0], rawBounds[3] - rawBounds[2]);
  return [0.1, 1, 10].reduce((best, c) =>
    Math.abs(extent * c - ref) < Math.abs(extent * best - ref) ? c : best
  );
}

function distToPolyline(px, py, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-12;
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx, qy = ay + t * dy;
    const d = Math.hypot(px - qx, py - qy);
    if (d < best) best = d;
  }
  return best;
}

function percentile(sorted, p) {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

async function main() {
  const only = process.argv.slice(2);
  const ids = only.length ? only : DEFAULT_IDS;

  console.log("Fetching 2024 race sessions from OpenF1...");
  const sessions = await api("/sessions?year=2024&session_name=Race");
  const byId = new Map();
  for (const s of sessions) {
    const id = SHORT_NAMES[s.circuit_short_name];
    if (id && !byId.has(id)) byId.set(id, s);
  }

  const available = (await readdir(GEO_DIR)).filter((f) => f.endsWith(".json"));
  let pass = 0, fail = 0;

  for (const id of ids) {
    if (!available.includes(`${id}.json`)) {
      console.log(`${id}: no geometry file, skipped`);
      continue;
    }
    const session = byId.get(id);
    if (!session) {
      console.log(`${id}: no 2024 race session found, skipped`);
      continue;
    }
    try {
      const geo = JSON.parse(await readFile(path.join(GEO_DIR, `${id}.json`), "utf8"));
      // 3-minute window starting 30 min into the race, one driver
      const t0 = new Date(new Date(session.date_start).getTime() + 65 * 60_000);
      const t1 = new Date(t0.getTime() + 3 * 60_000);
      const q = `/location?session_key=${session.session_key}&driver_number=1` +
        `&date>${t0.toISOString()}&date<${t1.toISOString()}`;
      let locs = await api(q);
      if (locs.length < 50) {
        // driver 1 may be out; try 44, 16, 55
        for (const n of [44, 16, 55]) {
          locs = await api(q.replace("driver_number=1", `driver_number=${n}`));
          if (locs.length >= 50) break;
        }
      }
      if (locs.length < 50) {
        console.log(`${id}: not enough location samples (${locs.length}), skipped`);
        continue;
      }
      const unit = detectUnit(locs, geo.transform.rawBounds);
      const mapper = makeMapper(geo.transform);
      const poly = geo.pts.map(([x, y]) => [x, y]);
      const metersPerUnit = geo.transform.scale * (geo.transform.scaleAdjust || 1);
      // Drop origin glitches and static samples (pit stops / red flags park
      // cars in the pit lane, which is legitimately off the racing line)
      const moving = locs.filter((l, i) => {
        if (l.x === 0 && l.y === 0) return false;
        if (i === 0) return true;
        return Math.hypot(l.x - locs[i - 1].x, l.y - locs[i - 1].y) > 5;
      });
      if (moving.length < 50) {
        console.log(`${id}: car static in window (red flag/pit?), skipped`);
        continue;
      }
      const dists = moving
        .map((l) => {
          const [xn, yn] = mapper(l.x, l.y, unit);
          return distToPolyline(xn, yn, poly) * metersPerUnit;
        })
        .sort((a, b) => a - b);
      const p50 = percentile(dists, 0.5).toFixed(1);
      const p95 = percentile(dists, 0.95).toFixed(1);
      const ok = percentile(dists, 0.95) < 15;
      if (ok) pass++; else fail++;
      console.log(
        `${id}: ${ok ? "PASS" : "FAIL"}  p50 ${p50} m, p95 ${p95} m ` +
        `(${dists.length} samples, unit x${unit}, session ${session.session_key})`
      );
    } catch (e) {
      fail++;
      console.log(`${id}: ERROR - ${e.message}`);
    }
  }
  console.log(`\n${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
