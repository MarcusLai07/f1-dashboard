#!/usr/bin/env python3
"""Generate 3D circuit geometry files from FastF1 telemetry.

For each circuit in src/data/circuits/_manifest.json, loads the 2024 session
from the local FastF1 cache (.fastf1_cache), takes the fastest lap's X/Y/Z
position telemetry, and writes src/data/circuits/geometry/{id}.json with:

  pts        240 uniformly-spaced points [x, y, z]; x/y normalized to [-1, 1]
             (aspect preserved, y up, rotated to official map orientation),
             z in meters above the track's lowest point (smoothed)
  len        lap length, km
  elev       total elevation change, m
  sectors    [S1, S2] boundary positions as lap fractions, interpolated from
             the fastest lap's official sector times
  corners    [[label, frac], ...] from FastF1 circuit_info (validation/fallback)
  transform  the exact normalization applied, so live OpenF1 location data can
             be mapped into the same space with one affine transform:
             rotationDeg, center [m, rotated frame], scale [m per unit],
             rawBounds [m, pre-rotation bbox: minX, maxX, minY, maxY],
             offset [normalized units, manual escape hatch], scaleAdjust
  source     provenance string

A validation pass compares generated corner/sector fractions against the
hand-calibrated values in src/data/circuits/{id}.json and warns on |delta| > 0.015.

Usage:  python3 -m venv .venv && .venv/bin/pip install fastf1
        .venv/bin/python scripts/extract-circuit-geometry.py [id ...]
"""

import json
import math
import sys
from pathlib import Path

import numpy as np
import fastf1
import pandas as pd

SCRIPTS = Path(__file__).parent
WEB = SCRIPTS.parent
CACHE = SCRIPTS / ".fastf1_cache"
DATA = WEB / "src/data/circuits"
OUT_DIR = DATA / "geometry"
N = 240
YEAR = 2024

fastf1.Cache.enable_cache(str(CACHE))

# circuit id -> 2024 round number
ROUNDS = {
    "bahrain": 1, "jeddah": 2, "albert-park": 3, "suzuka": 4, "shanghai": 5,
    "miami": 6, "imola": 7, "monaco": 8, "montreal": 9, "barcelona": 10,
    "red-bull-ring": 11, "silverstone": 12, "hungaroring": 13, "spa": 14,
    "zandvoort": 15, "monza": 16, "baku": 17, "marina-bay": 18, "cota": 19,
    "mexico-city": 20, "interlagos": 21, "las-vegas": 22, "lusail": 23,
    "yas-marina": 24,
}


def extract(rnd: int):
    last_err = None
    for kind in ("R", "Q"):
        try:
            session = fastf1.get_session(YEAR, rnd, kind)
            session.load(telemetry=True, laps=True, weather=False, messages=False)
            lap = session.laps.pick_fastest()
            tel = lap.get_telemetry()
            if len(tel) < 50:
                raise ValueError("telemetry too short")
            return tel, lap, session.get_circuit_info(), kind
        except Exception as e:  # noqa: BLE001
            last_err = e
    raise RuntimeError(f"round {rnd}: {last_err}")


def process(tel, rotation_deg: float):
    x = tel["X"].to_numpy(dtype=float) / 10.0  # decimeters -> meters
    y = tel["Y"].to_numpy(dtype=float) / 10.0
    z = tel["Z"].to_numpy(dtype=float) / 10.0
    dist = tel["Distance"].to_numpy(dtype=float)

    keep = np.concatenate([[True], np.diff(dist) > 0])
    x, y, z, dist = x[keep], y[keep], z[keep], dist[keep]

    raw_bounds = [float(x.min()), float(x.max()), float(y.min()), float(y.max())]

    u = np.linspace(dist[0], dist[-1], N)
    x, y, z = np.interp(u, dist, x), np.interp(u, dist, y), np.interp(u, dist, z)

    a = math.radians(rotation_deg)
    xr = x * math.cos(a) - y * math.sin(a)
    yr = x * math.sin(a) + y * math.cos(a)

    cx = (xr.min() + xr.max()) / 2
    cy = (yr.min() + yr.max()) / 2
    scale = max(xr.max() - xr.min(), yr.max() - yr.min()) / 2
    xn, yn = (xr - cx) / scale, (yr - cy) / scale

    kernel = np.ones(7) / 7
    zs = np.convolve(np.concatenate([z[-3:], z, z[:3]]), kernel, mode="same")[3:-3]
    zs -= zs.min()

    lap_m = float(u[-1] - u[0])
    transform = {
        "rotationDeg": float(rotation_deg),
        "center": [round(float(cx), 2), round(float(cy), 2)],
        "scale": round(float(scale), 2),
        "rawBounds": [round(b, 1) for b in raw_bounds],
        "offset": [0, 0],
        "scaleAdjust": 1.0,
    }
    return xn, yn, zs, lap_m, transform


def corner_fracs(circuit_info, lap_len_m: float):
    out = []
    for _, row in circuit_info.corners.iterrows():
        try:
            num = int(row["Number"])
        except (TypeError, ValueError):
            continue
        d = row.get("Distance")
        if d is None or (isinstance(d, float) and math.isnan(d)):
            continue
        out.append([f"{num}{row.get('Letter') or ''}", round((float(d) / lap_len_m) % 1.0, 4)])
    return out


def sector_fracs(tel, lap):
    s1, s2 = lap["Sector1Time"], lap["Sector2Time"]
    if pd.isna(s1) or pd.isna(s2):
        return None
    t_rel = (tel["Time"] - tel["Time"].iloc[0]).dt.total_seconds().to_numpy()
    d = tel["Distance"].to_numpy(dtype=float)
    lap_len = d[-1] - d[0]
    b1 = (np.interp(s1.total_seconds(), t_rel, d) - d[0]) / lap_len
    b2 = (np.interp(s1.total_seconds() + s2.total_seconds(), t_rel, d) - d[0]) / lap_len
    if not (0.05 < b1 < b2 < 0.98):
        return None
    return [round(float(b1), 4), round(float(b2), 4)]


def validate(cid: str, corners, sectors):
    """Compare against hand-calibrated circuit JSON; warn on drift."""
    ref_path = DATA / f"{cid}.json"
    if not ref_path.exists():
        return
    ref = json.loads(ref_path.read_text())
    ref_corners = {str(c.get("number")): c["position"] / 100 for c in ref.get("corners", []) if "position" in c}
    for label, frac in corners:
        num = "".join(ch for ch in label if ch.isdigit())
        if num in ref_corners and abs(ref_corners[num] - frac) > 0.015:
            print(f"  WARN {cid} T{label}: geometry {frac:.3f} vs calibrated {ref_corners[num]:.3f}")
    ref_sectors = ref.get("sectors") or []
    if sectors and len(ref_sectors) >= 2:
        for i, b in enumerate(sectors):
            refb = ref_sectors[i].get("endPercent")
            if refb is not None and abs(refb / 100 - b) > 0.015:
                print(f"  WARN {cid} S{i+1} boundary: geometry {b:.3f} vs calibrated {refb/100:.3f}")


def main():
    OUT_DIR.mkdir(exist_ok=True)
    manifest = json.loads((DATA / "_manifest.json").read_text())
    only = set(sys.argv[1:])
    ok = 0
    for cid in manifest["ids"]:
        if only and cid not in only:
            continue
        rnd = ROUNDS.get(cid)
        if rnd is None:
            print(f"{cid}: no {YEAR} round mapping, skipped")
            continue
        try:
            tel, lap, circuit_info, kind = extract(rnd)
            xn, yn, zs, lap_m, transform = process(tel, circuit_info.rotation)
            corners = corner_fracs(circuit_info, lap_m)
            sectors = sector_fracs(tel, lap)
            out = {
                "id": cid,
                "pts": [[round(float(a), 3), round(float(b), 3), round(float(c), 1)]
                        for a, b, c in zip(xn, yn, zs)],
                "len": round(lap_m / 1000, 3),
                "elev": round(float(zs.max()), 1),
                "sectors": sectors,
                "corners": corners,
                "transform": transform,
                "source": f"FastF1 {YEAR} R{rnd} {kind} fastest lap",
            }
            (OUT_DIR / f"{cid}.json").write_text(json.dumps(out, separators=(",", ":")))
            print(f"{cid}: ok (elev {out['elev']} m, {len(corners)} corners, sectors {sectors})")
            validate(cid, corners, sectors)
            ok += 1
        except Exception as e:  # noqa: BLE001
            print(f"{cid}: FAILED - {e}")
    print(f"wrote {ok} geometry files to {OUT_DIR}")


if __name__ == "__main__":
    main()
