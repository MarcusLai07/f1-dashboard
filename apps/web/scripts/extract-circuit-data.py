#!/usr/bin/env python3
"""
Extract circuit corner and sector data from FastF1 for use in the F1 Dashboard.

This script fetches circuit information from FastF1 and outputs turn positions
as percentages along the track, suitable for use in circuitFeatures.ts

Usage:
    pip install fastf1
    python extract-circuit-data.py

Output:
    JSON data with turn positions and sector boundaries for each circuit
"""

import fastf1
import json
import sys
from pathlib import Path

# Enable FastF1 cache
cache_dir = Path(__file__).parent / ".fastf1_cache"
cache_dir.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(cache_dir))

# 2024 calendar circuits (use 2024 data as it's the most recent complete season)
CIRCUITS = [
    {"year": 2024, "round": 1, "name": "bahrain", "display": "Bahrain"},
    {"year": 2024, "round": 2, "name": "jeddah", "display": "Saudi Arabia"},
    {"year": 2024, "round": 3, "name": "melbourne", "display": "Australia"},
    {"year": 2024, "round": 4, "name": "suzuka", "display": "Japan"},
    {"year": 2024, "round": 5, "name": "shanghai", "display": "China"},
    {"year": 2024, "round": 6, "name": "miami", "display": "Miami"},
    {"year": 2024, "round": 7, "name": "imola", "display": "Emilia Romagna"},
    {"year": 2024, "round": 8, "name": "monaco", "display": "Monaco"},
    {"year": 2024, "round": 9, "name": "montreal", "display": "Canada"},
    {"year": 2024, "round": 10, "name": "barcelona", "display": "Spain"},
    {"year": 2024, "round": 11, "name": "spielberg", "display": "Austria"},
    {"year": 2024, "round": 12, "name": "silverstone", "display": "Great Britain"},
    {"year": 2024, "round": 13, "name": "hungaroring", "display": "Hungary"},
    {"year": 2024, "round": 14, "name": "spa", "display": "Belgium"},
    {"year": 2024, "round": 15, "name": "zandvoort", "display": "Netherlands"},
    {"year": 2024, "round": 16, "name": "monza", "display": "Italy"},
    {"year": 2024, "round": 17, "name": "baku", "display": "Azerbaijan"},
    {"year": 2024, "round": 18, "name": "marina-bay", "display": "Singapore"},
    {"year": 2024, "round": 19, "name": "austin", "display": "USA"},
    {"year": 2024, "round": 20, "name": "mexico-city", "display": "Mexico"},
    {"year": 2024, "round": 21, "name": "interlagos", "display": "Brazil"},
    {"year": 2024, "round": 22, "name": "las-vegas", "display": "Las Vegas"},
    {"year": 2024, "round": 23, "name": "lusail", "display": "Qatar"},
    {"year": 2024, "round": 24, "name": "yas-marina", "display": "Abu Dhabi"},
]


def extract_circuit_data(year: int, round_num: int, circuit_name: str):
    """Extract corner and sector data for a circuit."""
    try:
        # Load session (use Race for most complete data)
        session = fastf1.get_session(year, round_num, "R")
        session.load(telemetry=True, weather=False, messages=False)

        circuit_info = session.get_circuit_info()

        # Get track length from a lap
        track_length = None
        try:
            fastest_lap = session.laps.pick_fastest()
            if fastest_lap is not None:
                tel = fastest_lap.get_telemetry()
                if 'Distance' in tel.columns and len(tel) > 0:
                    track_length = tel['Distance'].max()
        except Exception as e:
            print(f"  Warning: Could not get track length: {e}", file=sys.stderr)

        # Extract corners data
        corners = []
        if circuit_info.corners is not None and len(circuit_info.corners) > 0:
            corners_df = circuit_info.corners
            for _, row in corners_df.iterrows():
                corner = {
                    "number": int(row.get("Number", 0)),
                    "letter": str(row.get("Letter", "")) if row.get("Letter") else None,
                    "x": float(row.get("X", 0)),
                    "y": float(row.get("Y", 0)),
                    "angle": float(row.get("Angle", 0)) if row.get("Angle") else None,
                    "distance": float(row.get("Distance", 0)) if row.get("Distance") else None,
                }
                # Calculate position as percentage if we have distance and track length
                if corner["distance"] is not None and track_length:
                    corner["position"] = round((corner["distance"] / track_length) * 100, 1)
                corners.append(corner)

        # Extract marshal sectors (these often correspond to timing sectors)
        marshal_sectors = []
        if circuit_info.marshal_sectors is not None and len(circuit_info.marshal_sectors) > 0:
            sectors_df = circuit_info.marshal_sectors
            for _, row in sectors_df.iterrows():
                sector = {
                    "number": int(row.get("Number", 0)),
                    "x": float(row.get("X", 0)),
                    "y": float(row.get("Y", 0)),
                    "distance": float(row.get("Distance", 0)) if row.get("Distance") else None,
                }
                if sector["distance"] is not None and track_length:
                    sector["position"] = round((sector["distance"] / track_length) * 100, 1)
                marshal_sectors.append(sector)

        # Get rotation for map alignment
        rotation = circuit_info.rotation if hasattr(circuit_info, 'rotation') else None

        return {
            "name": circuit_name,
            "trackLength": round(track_length, 1) if track_length else None,
            "rotation": rotation,
            "corners": corners,
            "marshalSectors": marshal_sectors,
        }

    except Exception as e:
        print(f"  Error extracting {circuit_name}: {e}", file=sys.stderr)
        return None


def main():
    """Extract data for all circuits and output as JSON."""
    print("Extracting circuit data from FastF1...", file=sys.stderr)
    print("This may take a while as it downloads telemetry data.\n", file=sys.stderr)

    all_circuits = {}

    for circuit in CIRCUITS:
        print(f"Processing {circuit['display']} ({circuit['name']})...", file=sys.stderr)
        data = extract_circuit_data(circuit["year"], circuit["round"], circuit["name"])
        if data:
            all_circuits[circuit["name"]] = data
            # Print summary
            corners_count = len(data.get("corners", []))
            sectors_count = len(data.get("marshalSectors", []))
            print(f"  Found {corners_count} corners, {sectors_count} marshal sectors", file=sys.stderr)

    # Output JSON
    output = {
        "source": "FastF1",
        "season": 2024,
        "extractedAt": __import__("datetime").datetime.now().isoformat(),
        "circuits": all_circuits,
    }

    print(json.dumps(output, indent=2))
    print(f"\nExtracted data for {len(all_circuits)} circuits.", file=sys.stderr)


if __name__ == "__main__":
    main()
