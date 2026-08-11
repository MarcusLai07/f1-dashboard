#!/usr/bin/env python3
"""
Generate accurate circuit SVG paths from FastF1 telemetry data.

This script extracts track coordinates from actual lap telemetry,
ensuring the path starts from the start/finish line and has accurate
corner positions.

Usage:
    python generate-circuit-svg.py [circuit_name]

Example:
    python generate-circuit-svg.py melbourne
    python generate-circuit-svg.py --all
"""

import fastf1
import numpy as np
import json
import sys
from pathlib import Path

# Enable FastF1 cache
cache_dir = Path(__file__).parent / ".fastf1_cache"
cache_dir.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(cache_dir))

# Circuit configurations for 2024 season
CIRCUITS = {
    "bahrain": {"year": 2024, "round": 1, "name": "Bahrain"},
    "jeddah": {"year": 2024, "round": 2, "name": "Saudi Arabia"},
    "melbourne": {"year": 2024, "round": 3, "name": "Australia"},
    "suzuka": {"year": 2024, "round": 4, "name": "Japan"},
    "shanghai": {"year": 2024, "round": 5, "name": "China"},
    "miami": {"year": 2024, "round": 6, "name": "Miami"},
    "imola": {"year": 2024, "round": 7, "name": "Emilia Romagna"},
    "monaco": {"year": 2024, "round": 8, "name": "Monaco"},
    "montreal": {"year": 2024, "round": 9, "name": "Canada"},
    "barcelona": {"year": 2024, "round": 10, "name": "Spain"},
    "spielberg": {"year": 2024, "round": 11, "name": "Austria"},
    "silverstone": {"year": 2024, "round": 12, "name": "Great Britain"},
    "hungaroring": {"year": 2024, "round": 13, "name": "Hungary"},
    "spa": {"year": 2024, "round": 14, "name": "Belgium"},
    "zandvoort": {"year": 2024, "round": 15, "name": "Netherlands"},
    "monza": {"year": 2024, "round": 16, "name": "Italy"},
    "baku": {"year": 2024, "round": 17, "name": "Azerbaijan"},
    "marina-bay": {"year": 2024, "round": 18, "name": "Singapore"},
    "austin": {"year": 2024, "round": 19, "name": "USA"},
    "mexico-city": {"year": 2024, "round": 20, "name": "Mexico"},
    "interlagos": {"year": 2024, "round": 21, "name": "Brazil"},
    "las-vegas": {"year": 2024, "round": 22, "name": "Las Vegas"},
    "lusail": {"year": 2024, "round": 23, "name": "Qatar"},
    "yas-marina": {"year": 2024, "round": 24, "name": "Abu Dhabi"},
}


def rotate(xy, angle):
    """Rotate coordinates by angle (in radians)."""
    rot_mat = np.array([
        [np.cos(angle), np.sin(angle)],
        [-np.sin(angle), np.cos(angle)]
    ])
    return np.matmul(xy, rot_mat)


def normalize_to_viewbox(points, viewbox_size=500, padding=40):
    """Normalize coordinates to fit within a viewbox with padding."""
    min_x, min_y = points.min(axis=0)
    max_x, max_y = points.max(axis=0)

    range_x = max_x - min_x
    range_y = max_y - min_y

    # Maintain aspect ratio
    max_range = max(range_x, range_y)
    if max_range == 0:
        max_range = 1

    # Scale to fit within viewbox with padding
    available_size = viewbox_size - 2 * padding
    scale = available_size / max_range

    # Center the track
    offset_x = padding + (available_size - range_x * scale) / 2
    offset_y = padding + (available_size - range_y * scale) / 2

    normalized = np.zeros_like(points)
    normalized[:, 0] = (points[:, 0] - min_x) * scale + offset_x
    normalized[:, 1] = (points[:, 1] - min_y) * scale + offset_y

    return normalized, scale, (min_x, min_y), (offset_x, offset_y)


def points_to_svg_path(points, simplify_tolerance=0.5):
    """Convert points to an SVG path string, with optional simplification."""
    if len(points) == 0:
        return ""

    # Simplify path by removing points that are very close together
    if simplify_tolerance > 0:
        simplified = [points[0]]
        for i in range(1, len(points)):
            dist = np.linalg.norm(points[i] - simplified[-1])
            if dist > simplify_tolerance:
                simplified.append(points[i])
        points = np.array(simplified)

    # Create SVG path
    path_parts = [f"M {points[0][0]:.2f} {points[0][1]:.2f}"]
    for point in points[1:]:
        path_parts.append(f"L {point[0]:.2f} {point[1]:.2f}")
    path_parts.append("Z")  # Close the path

    return " ".join(path_parts)


def extract_circuit_data(circuit_id, config):
    """Extract circuit data from FastF1."""
    print(f"Loading {config['name']} ({circuit_id})...", flush=True)

    try:
        # Load qualifying session (usually has good fast laps)
        session = fastf1.get_session(config["year"], config["round"], "Q")
        session.load(laps=True, telemetry=True, weather=False, messages=False)

        # Get fastest lap
        lap = session.laps.pick_fastest()
        if lap is None:
            print(f"  No fastest lap found, trying race session...")
            session = fastf1.get_session(config["year"], config["round"], "R")
            session.load(laps=True, telemetry=True, weather=False, messages=False)
            lap = session.laps.pick_fastest()

        if lap is None:
            print(f"  Error: No valid lap found")
            return None

        # Get position data (X, Y coordinates)
        pos = lap.get_pos_data()
        if pos is None or len(pos) == 0:
            print(f"  Error: No position data")
            return None

        # Get telemetry for distance info
        tel = lap.get_telemetry()
        track_length = tel['Distance'].max() if 'Distance' in tel.columns else None

        # Get circuit info
        circuit_info = session.get_circuit_info()
        rotation_deg = circuit_info.rotation if hasattr(circuit_info, 'rotation') else 0
        rotation_rad = rotation_deg / 180 * np.pi

        # Extract and rotate track coordinates
        track = pos.loc[:, ('X', 'Y')].to_numpy()
        rotated_track = rotate(track, rotation_rad)

        # Flip Y axis for SVG coordinate system (SVG Y increases downward)
        rotated_track[:, 1] = -rotated_track[:, 1]

        # Normalize to viewbox
        normalized_track, scale, offset_min, offset_padding = normalize_to_viewbox(rotated_track)

        # Generate SVG path
        svg_path = points_to_svg_path(normalized_track, simplify_tolerance=1.0)

        # Extract corner data with positions
        corners = []
        if circuit_info.corners is not None and len(circuit_info.corners) > 0:
            for _, corner in circuit_info.corners.iterrows():
                distance = corner.get('Distance')
                position = round((distance / track_length) * 100, 1) if distance and track_length else None

                # Transform corner coordinates to match SVG
                corner_xy = np.array([[corner['X'], corner['Y']]])
                rotated_corner = rotate(corner_xy, rotation_rad)
                rotated_corner[0, 1] = -rotated_corner[0, 1]

                # Normalize corner position
                norm_x = (rotated_corner[0, 0] - offset_min[0]) * scale + offset_padding[0]
                norm_y = (rotated_corner[0, 1] - (-offset_min[1])) * scale + offset_padding[1]

                corners.append({
                    "number": int(corner['Number']),
                    "letter": corner.get('Letter') if corner.get('Letter') else None,
                    "position": position,
                    "svgX": round(norm_x, 1),
                    "svgY": round(norm_y, 1),
                    "angle": corner.get('Angle'),
                })

        print(f"  Generated path with {len(normalized_track)} points, {len(corners)} corners")

        return {
            "circuitId": circuit_id,
            "name": config["name"],
            "trackLength": round(track_length, 1) if track_length else None,
            "rotation": rotation_deg,
            "viewBox": "0 0 500 500",
            "svgPath": svg_path,
            "corners": corners,
            "pointCount": len(normalized_track),
        }

    except Exception as e:
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Main entry point."""
    args = sys.argv[1:]

    if not args or args[0] == "--help":
        print(__doc__)
        print("\nAvailable circuits:")
        for cid in sorted(CIRCUITS.keys()):
            print(f"  {cid}")
        return

    if args[0] == "--all":
        circuits_to_process = list(CIRCUITS.keys())
    else:
        circuits_to_process = [arg.lower() for arg in args if arg in CIRCUITS]
        if not circuits_to_process:
            print(f"Unknown circuit(s): {args}")
            print("Use --help to see available circuits")
            return

    results = {}
    for circuit_id in circuits_to_process:
        config = CIRCUITS[circuit_id]
        data = extract_circuit_data(circuit_id, config)
        if data:
            results[circuit_id] = data

    # Output JSON
    print("\n" + "=" * 60)
    print("CIRCUIT DATA (JSON)")
    print("=" * 60)
    print(json.dumps(results, indent=2))

    # Also output TypeScript format for easy copy-paste
    if len(results) == 1:
        circuit_id, data = list(results.items())[0]
        print("\n" + "=" * 60)
        print("SVG PATH (for circuitPaths.ts)")
        print("=" * 60)
        print(f'"{circuit_id}": `{data["svgPath"]}`,')

        print("\n" + "=" * 60)
        print("CORNERS WITH POSITIONS (for circuitFeatures.ts)")
        print("=" * 60)
        print("turns: [")
        for corner in data["corners"]:
            pos = corner["position"]
            num = corner["number"]
            print(f'  {{ number: {num}, position: {pos} }},')
        print("],")


if __name__ == "__main__":
    main()
