#!/usr/bin/env python3
"""
Extract circuit features (turns, sectors) from FastF1 telemetry data.

This script extracts:
- Turn positions as percentages along the track
- Sector boundary positions (where S1, S2, S3 start/end)
- Turn characteristics (estimated from telemetry)

Usage:
    python extract-circuit-features.py [circuit_name]
    python extract-circuit-features.py --all

Example:
    python extract-circuit-features.py melbourne
    python extract-circuit-features.py bahrain suzuka
    python extract-circuit-features.py --all
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
    "bahrain": {"year": 2024, "round": 1, "name": "Bahrain", "key": "bahrain"},
    "jeddah": {"year": 2024, "round": 2, "name": "Saudi Arabia", "key": "jeddah"},
    "melbourne": {"year": 2024, "round": 3, "name": "Australia", "key": "albert park"},
    "suzuka": {"year": 2024, "round": 4, "name": "Japan", "key": "suzuka"},
    "shanghai": {"year": 2024, "round": 5, "name": "China", "key": "shanghai"},
    "miami": {"year": 2024, "round": 6, "name": "Miami", "key": "miami"},
    "imola": {"year": 2024, "round": 7, "name": "Emilia Romagna", "key": "imola"},
    "monaco": {"year": 2024, "round": 8, "name": "Monaco", "key": "monaco"},
    "montreal": {"year": 2024, "round": 9, "name": "Canada", "key": "montreal"},
    "barcelona": {"year": 2024, "round": 10, "name": "Spain", "key": "barcelona"},
    "spielberg": {"year": 2024, "round": 11, "name": "Austria", "key": "red bull ring"},
    "silverstone": {"year": 2024, "round": 12, "name": "Great Britain", "key": "silverstone"},
    "hungaroring": {"year": 2024, "round": 13, "name": "Hungary", "key": "hungaroring"},
    "spa": {"year": 2024, "round": 14, "name": "Belgium", "key": "spa"},
    "zandvoort": {"year": 2024, "round": 15, "name": "Netherlands", "key": "zandvoort"},
    "monza": {"year": 2024, "round": 16, "name": "Italy", "key": "monza"},
    "baku": {"year": 2024, "round": 17, "name": "Azerbaijan", "key": "baku"},
    "singapore": {"year": 2024, "round": 18, "name": "Singapore", "key": "singapore"},
    "austin": {"year": 2024, "round": 19, "name": "USA", "key": "americas"},
    "mexico": {"year": 2024, "round": 20, "name": "Mexico", "key": "mexico"},
    "interlagos": {"year": 2024, "round": 21, "name": "Brazil", "key": "interlagos"},
    "las-vegas": {"year": 2024, "round": 22, "name": "Las Vegas", "key": "las vegas"},
    "lusail": {"year": 2024, "round": 23, "name": "Qatar", "key": "lusail"},
    "yas-marina": {"year": 2024, "round": 24, "name": "Abu Dhabi", "key": "yas marina"},
}


def classify_turn(speed, min_speed):
    """Classify turn type based on minimum speed."""
    if speed < 70:
        return "hairpin"
    elif speed < 100:
        return "slow"
    elif speed < 150:
        return "medium"
    else:
        return "fast"


def estimate_gear(speed):
    """Estimate gear based on speed (rough approximation)."""
    if speed < 60:
        return 1
    elif speed < 100:
        return 2
    elif speed < 130:
        return 3
    elif speed < 170:
        return 4
    elif speed < 210:
        return 5
    elif speed < 260:
        return 6
    elif speed < 300:
        return 7
    else:
        return 8


def extract_sector_boundaries(session, lap):
    """
    Extract sector boundary positions from timing data.
    Returns sector end positions as percentages of track length.
    """
    try:
        tel = lap.get_telemetry()
        if tel is None or len(tel) == 0:
            return None

        track_length = tel['Distance'].max()

        # Try to get sector times from lap data
        sector1_time = lap.get('Sector1Time') or lap.get('Sector1SessionTime')
        sector2_time = lap.get('Sector2Time') or lap.get('Sector2SessionTime')

        # Get lap start time
        lap_start = tel['SessionTime'].iloc[0] if 'SessionTime' in tel.columns else None

        if sector1_time is not None and lap_start is not None:
            # Find the distance at which sector 1 ends
            try:
                # Sector times are cumulative from lap start
                s1_end_time = lap_start + sector1_time

                # Find closest telemetry point
                time_diff = abs(tel['SessionTime'] - s1_end_time)
                s1_end_idx = time_diff.idxmin()
                s1_end_distance = tel.loc[s1_end_idx, 'Distance']
                s1_end_percent = round((s1_end_distance / track_length) * 100, 1)

                if sector2_time is not None:
                    s2_end_time = lap_start + sector1_time + sector2_time
                    time_diff = abs(tel['SessionTime'] - s2_end_time)
                    s2_end_idx = time_diff.idxmin()
                    s2_end_distance = tel.loc[s2_end_idx, 'Distance']
                    s2_end_percent = round((s2_end_distance / track_length) * 100, 1)

                    return {
                        "sector1_end": s1_end_percent,
                        "sector2_end": s2_end_percent,
                    }
            except Exception as e:
                print(f"    Warning: Could not extract sector boundaries from timing: {e}")

        return None

    except Exception as e:
        print(f"    Warning: Sector boundary extraction failed: {e}")
        return None


def extract_turn_speeds(lap, corners, track_length):
    """Extract minimum speeds at each corner from telemetry."""
    try:
        tel = lap.get_telemetry()
        if tel is None or len(tel) == 0:
            return {}

        turn_speeds = {}

        for corner in corners:
            corner_num = int(corner['Number'])
            corner_distance = corner.get('Distance')

            if corner_distance is None:
                continue

            # Find telemetry around this corner (±100m window)
            mask = (tel['Distance'] >= corner_distance - 100) & (tel['Distance'] <= corner_distance + 100)
            corner_tel = tel[mask]

            if len(corner_tel) > 0:
                min_speed = corner_tel['Speed'].min()
                turn_speeds[corner_num] = round(min_speed)

        return turn_speeds

    except Exception as e:
        print(f"    Warning: Could not extract turn speeds: {e}")
        return {}


def extract_circuit_features(circuit_id, config):
    """Extract circuit features from FastF1."""
    print(f"\nProcessing {config['name']} ({circuit_id})...", flush=True)

    try:
        # Load qualifying session
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

        # Get telemetry
        tel = lap.get_telemetry()
        if tel is None or len(tel) == 0:
            print(f"  Error: No telemetry data")
            return None

        track_length = tel['Distance'].max()
        print(f"  Track length: {track_length:.0f}m")

        # Get circuit info
        circuit_info = session.get_circuit_info()

        # Extract corners
        turns = []
        if circuit_info.corners is not None and len(circuit_info.corners) > 0:
            # Get turn speeds from telemetry
            turn_speeds = extract_turn_speeds(lap, circuit_info.corners.to_dict('records'), track_length)

            for _, corner in circuit_info.corners.iterrows():
                corner_num = int(corner['Number'])
                distance = corner.get('Distance')

                if distance is None:
                    continue

                position = round((distance / track_length) * 100, 1)
                speed = turn_speeds.get(corner_num, 120)  # Default speed if not found

                turn_type = classify_turn(speed, speed)
                gear = estimate_gear(speed)

                turn_data = {
                    "number": corner_num,
                    "type": turn_type,
                    "gear": gear,
                    "speed": speed,
                    "position": position,
                }

                # Add corner name if available
                letter = corner.get('Letter')
                if letter and str(letter) != 'nan':
                    turn_data["letter"] = str(letter)

                turns.append(turn_data)

            print(f"  Found {len(turns)} turns")
        else:
            print(f"  Warning: No corner data available")

        # Extract sector boundaries
        sectors = extract_sector_boundaries(session, lap)
        if sectors:
            print(f"  Sector 1 ends at: {sectors['sector1_end']}%")
            print(f"  Sector 2 ends at: {sectors['sector2_end']}%")
        else:
            # Use default equal sectors if we couldn't extract
            print(f"  Warning: Using default sector boundaries (33/66)")
            sectors = {
                "sector1_end": 33,
                "sector2_end": 66,
            }

        return {
            "circuitId": circuit_id,
            "key": config["key"],
            "name": config["name"],
            "trackLength": round(track_length),
            "turns": turns,
            "sectors": sectors,
        }

    except Exception as e:
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()
        return None


def generate_typescript_output(results):
    """Generate TypeScript code for circuitFeatures.ts updates."""
    print("\n" + "=" * 70)
    print("TYPESCRIPT OUTPUT FOR circuitFeatures.ts")
    print("=" * 70)

    for circuit_id, data in results.items():
        key = data["key"]
        print(f'\n  // {data["name"]} - Turn positions from FastF1 telemetry')
        print(f'  // Update the "{key}" entry with these values:')
        print(f'  turns: [')

        for turn in data["turns"]:
            parts = [
                f'number: {turn["number"]}',
                f'type: "{turn["type"]}"',
                f'gear: {turn["gear"]}',
                f'speed: {turn["speed"]}',
                f'position: {turn["position"]}',
            ]
            if "letter" in turn:
                parts.insert(1, f'name: "{turn["letter"]}"')
            print(f'    {{ {", ".join(parts)} }},')

        print(f'  ],')

        sectors = data["sectors"]
        print(f'  sectors: [')
        print(f'    {{ number: 1, startPercent: 0, endPercent: {sectors["sector1_end"]}, color: "#ef4444" }},')
        print(f'    {{ number: 2, startPercent: {sectors["sector1_end"]}, endPercent: {sectors["sector2_end"]}, color: "#3b82f6" }},')
        print(f'    {{ number: 3, startPercent: {sectors["sector2_end"]}, endPercent: 100, color: "#eab308" }},')
        print(f'  ],')
        print()


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
        data = extract_circuit_features(circuit_id, config)
        if data:
            results[circuit_id] = data

    # Output JSON
    print("\n" + "=" * 70)
    print("CIRCUIT FEATURES DATA (JSON)")
    print("=" * 70)
    print(json.dumps(results, indent=2))

    # Output TypeScript format
    generate_typescript_output(results)

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Successfully processed: {len(results)}/{len(circuits_to_process)} circuits")

    for circuit_id, data in results.items():
        s = data["sectors"]
        print(f"  {circuit_id}: {len(data['turns'])} turns, sectors at {s['sector1_end']}%/{s['sector2_end']}%")


if __name__ == "__main__":
    main()
