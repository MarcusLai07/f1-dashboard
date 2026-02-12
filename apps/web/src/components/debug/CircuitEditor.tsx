"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, useMapEvents, useMap } from "react-leaflet";
import L, { LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Copy, Trash2, Plus, RotateCcw, Eye, EyeOff, Edit3,
  Flag, MapPin, Layers, Route, CornerDownRight, ChevronDown, ChevronRight,
  Minus, ZoomIn, Undo2, Download, Move, RotateCw, Maximize2
} from "lucide-react";

// Circuit data with GeoJSON coordinates
const CIRCUITS: Record<string, CircuitConfig> = {
  zandvoort: {
    id: "zandvoort",
    name: "Circuit Zandvoort",
    shortName: "Zandvoort",
    location: "Zandvoort",
    country: "Netherlands",
    center: [52.388, 4.546] as [number, number],
    zoom: 15,
    geojson: [[4.540491,52.388408],[4.542096,52.390776],[4.542706,52.391645],[4.542844,52.391741],[4.543031,52.391795],[4.543235,52.391811],[4.543424,52.391787],[4.543602,52.391713],[4.543726,52.39162],[4.543792,52.391504],[4.543797,52.391375],[4.54362,52.391124],[4.543111,52.390368],[4.542947,52.390016],[4.542881,52.389649],[4.542916,52.389305],[4.542863,52.389165],[4.542738,52.389071],[4.542488,52.388947],[4.542219,52.388882],[4.541476,52.388705],[4.541285,52.388617],[4.541233,52.388487],[4.541226,52.38837],[4.541303,52.388251],[4.541447,52.388166],[4.541627,52.388121],[4.541903,52.388125],[4.543264,52.38839],[4.543896,52.388462],[4.544441,52.388473],[4.544923,52.388451],[4.545379,52.388404],[4.545704,52.388343],[4.546236,52.388274],[4.546727,52.388248],[4.547075,52.388292],[4.547494,52.388359],[4.547998,52.388514],[4.54859,52.38875],[4.548991,52.388866],[4.549348,52.388929],[4.549819,52.388961],[4.55019,52.388956],[4.551737,52.388898],[4.552094,52.388848],[4.552425,52.388747],[4.55266,52.388624],[4.552811,52.388493],[4.552958,52.388343],[4.553036,52.38817],[4.553061,52.387987],[4.553033,52.387808],[4.552947,52.387626],[4.552761,52.387428],[4.55205,52.386836],[4.551788,52.386573],[4.551194,52.38579],[4.550909,52.385729],[4.550557,52.385704],[4.55022,52.385714],[4.549823,52.385755],[4.549411,52.385841],[4.54897,52.38597],[4.548533,52.38616],[4.548263,52.386343],[4.548214,52.386455],[4.548257,52.386573],[4.548425,52.386721],[4.548665,52.386815],[4.549018,52.386894],[4.549621,52.386952],[4.550202,52.387041],[4.550732,52.387165],[4.551025,52.387291],[4.551136,52.387442],[4.551151,52.387607],[4.551056,52.387771],[4.550811,52.38792],[4.550591,52.387967],[4.549448,52.388052],[4.548297,52.38805],[4.547074,52.38796],[4.54604,52.387801],[4.5454,52.387678],[4.544694,52.387518],[4.544019,52.387343],[4.543469,52.387144],[4.543267,52.387091],[4.543123,52.387108],[4.542988,52.387222],[4.542844,52.387388],[4.542646,52.387463],[4.542392,52.387469],[4.542144,52.387398],[4.542012,52.387289],[4.541951,52.387172],[4.542012,52.386934],[4.542566,52.38496],[4.542578,52.384828],[4.542517,52.384693],[4.542419,52.384579],[4.542324,52.384506],[4.542089,52.384409],[4.541838,52.384374],[4.540774,52.384363],[4.540557,52.38437],[4.540241,52.3844],[4.539914,52.384465],[4.539645,52.38454],[4.539287,52.384712],[4.539054,52.384902],[4.538895,52.385065],[4.538779,52.385285],[4.538742,52.385478],[4.538775,52.385793],[4.538873,52.386017],[4.540408,52.38829],[4.540491,52.388408]],
    bounds: { minLng: 4.538742, maxLng: 4.553061, minLat: 52.384363, maxLat: 52.391811 },
    startFinish: [4.540491, 52.388408],
  },
};

interface CircuitConfig {
  id: string;
  name: string;
  shortName: string;
  location: string;
  country: string;
  center: [number, number];
  zoom: number;
  geojson: [number, number][];
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number };
  startFinish?: [number, number];
}

interface Point {
  lat: number;
  lng: number;
}

interface Corner {
  number: number;
  name?: string;
  position: number; // percentage along track
  lat: number;
  lng: number;
}

interface Sector {
  number: number;
  startPercent: number;
  endPercent: number;
  color: string;
}

type EditMode = "track" | "pitlane" | "startfinish" | "corners" | "sectors" | "calibrate" | null;

interface Transform {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

interface LoadedCircuitData {
  svg: {
    viewBox: string;
    path: string;
    pitLanePath?: string;
  };
  geojson?: {
    bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number };
    startFinish?: [number, number];
  };
  corners?: Array<{
    number: number;
    name?: string;
    position: number;
    type?: string;
    gear?: number;
    speed?: number;
  }>;
  sectors?: Array<{
    number: number;
    startPercent: number;
    endPercent: number;
    color: string;
  }>;
}

// Map click handler component
function MapClickHandler({
  onMapClick,
  editMode
}: {
  onMapClick: (latlng: LatLng) => void;
  editMode: EditMode;
}) {
  useMapEvents({
    click: (e) => {
      if (editMode) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

// Map view updater component
function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

// Draggable marker component with map access
function DraggablePoint({
  position,
  index,
  color,
  editMode,
  activeMode,
  onDrag,
  onDelete,
  showLabel = false,
  label,
}: {
  position: Point;
  index: number;
  color: string;
  editMode: EditMode;
  activeMode: EditMode;
  onDrag: (index: number, latlng: LatLng) => void;
  onDelete: (index: number) => void;
  showLabel?: boolean;
  label?: string;
}) {
  const map = useMap();
  const isDragging = useRef(false);

  useEffect(() => {
    if (editMode !== activeMode) return;

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (isDragging.current) {
        onDrag(index, e.latlng);
      }
    };

    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        map.dragging.enable();
      }
    };

    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);

    return () => {
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
    };
  }, [map, editMode, activeMode, index, onDrag]);

  const eventHandlers = {
    mousedown: () => {
      if (editMode === activeMode) {
        isDragging.current = true;
        map.dragging.disable();
      }
    },
    contextmenu: (e: L.LeafletMouseEvent) => {
      e.originalEvent.preventDefault();
      if (editMode === activeMode) {
        onDelete(index);
      }
    },
  };

  const isActive = editMode === activeMode;
  const displayLabel = label || (index + 1).toString();

  return (
    <>
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={isActive ? 10 : 6}
        pathOptions={{
          fillColor: color,
          color: isActive ? '#fff' : color,
          weight: isActive ? 2 : 1,
          fillOpacity: 1,
        }}
        eventHandlers={eventHandlers}
      />
      {showLabel && isActive && (
        <Marker
          position={[position.lat, position.lng]}
          icon={L.divIcon({
            className: 'point-label',
            html: `<div style="
              background: ${color};
              color: white;
              font-size: 10px;
              font-weight: bold;
              padding: 1px 4px;
              border-radius: 3px;
              white-space: nowrap;
              transform: translate(-50%, -150%);
              border: 1px solid white;
            ">${displayLabel}</div>`,
            iconSize: [0, 0],
          })}
          interactive={false}
        />
      )}
    </>
  );
}

// Collapsible section component
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-3 bg-secondary/50 hover:bg-secondary/70 transition-colors"
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </button>
      {isOpen && <div className="p-3 space-y-2">{children}</div>}
    </div>
  );
}

export default function CircuitEditor() {
  const [selectedCircuit, setSelectedCircuit] = useState<string>("zandvoort");

  // Track data
  const [trackPoints, setTrackPoints] = useState<Point[]>([]);
  const [pitLanePoints, setPitLanePoints] = useState<Point[]>([]);
  const [startFinish, setStartFinish] = useState<Point | null>(null);
  const [corners, setCorners] = useState<Corner[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([
    { number: 1, startPercent: 0, endPercent: 35.1, color: "#ef4444" },
    { number: 2, startPercent: 35.1, endPercent: 69, color: "#3b82f6" },
    { number: 3, startPercent: 69, endPercent: 100, color: "#eab308" },
  ]);

  // Visibility toggles
  const [showMap, setShowMap] = useState(true);
  const [showGeojson, setShowGeojson] = useState(true);
  const [showTrack, setShowTrack] = useState(true);
  const [showPitLane, setShowPitLane] = useState(true);
  const [showCorners, setShowCorners] = useState(true);
  const [showStartFinish, setShowStartFinish] = useState(true);

  // Edit mode
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [viewBox, setViewBox] = useState("0 0 500 260");
  const [status, setStatus] = useState("Select a circuit and click Load");
  const [copied, setCopied] = useState(false);
  const [nextCornerNumber, setNextCornerNumber] = useState(1);

  // History for undo
  const [trackHistory, setTrackHistory] = useState<Point[][]>([]);
  const [pitLaneHistory, setPitLaneHistory] = useState<Point[][]>([]);

  // Calibration transform state
  const [transform, setTransform] = useState<Transform>({ offsetX: 0, offsetY: 0, scale: 1, rotation: 0 });
  const [originalPoints, setOriginalPoints] = useState<Point[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [loadedCircuitData, setLoadedCircuitData] = useState<LoadedCircuitData | null>(null);

  const currentCircuit = CIRCUITS[selectedCircuit];
  const mapRef = useRef<L.Map | null>(null);

  // Save to history before changes
  const saveTrackHistory = useCallback(() => {
    setTrackHistory(prev => [...prev.slice(-20), [...trackPoints]]);
  }, [trackPoints]);

  const savePitLaneHistory = useCallback(() => {
    setPitLaneHistory(prev => [...prev.slice(-20), [...pitLanePoints]]);
  }, [pitLanePoints]);

  // Undo functions
  const undoTrack = useCallback(() => {
    if (trackHistory.length > 0) {
      const previous = trackHistory[trackHistory.length - 1];
      setTrackPoints(previous);
      setTrackHistory(prev => prev.slice(0, -1));
      setStatus("Undid track change");
    }
  }, [trackHistory]);

  const undoPitLane = useCallback(() => {
    if (pitLaneHistory.length > 0) {
      const previous = pitLaneHistory[pitLaneHistory.length - 1];
      setPitLanePoints(previous);
      setPitLaneHistory(prev => prev.slice(0, -1));
      setStatus("Undid pit lane change");
    }
  }, [pitLaneHistory]);

  // Parse SVG path to lat/lng points using GeoJSON bounds
  const parseSvgPathToPoints = useCallback((
    svgPath: string,
    viewBox: string,
    bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number }
  ): Point[] => {
    const points: Point[] = [];
    const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
    const padding = 10;
    const width = vbWidth - 2 * padding;
    const height = vbHeight - 2 * padding;
    const lngRange = bounds.maxLng - bounds.minLng;
    const latRange = bounds.maxLat - bounds.minLat;

    // Extract coordinates from SVG path (M x y L x y L x y ... Z)
    const regex = /[ML]\s*([\d.-]+)\s+([\d.-]+)/g;
    let match;
    while ((match = regex.exec(svgPath)) !== null) {
      const svgX = parseFloat(match[1]);
      const svgY = parseFloat(match[2]);

      // Reverse the SVG to lat/lng conversion
      const lng = ((svgX - padding) / width) * lngRange + bounds.minLng;
      const lat = bounds.maxLat - ((svgY - padding) / height) * latRange;

      points.push({ lat, lng });
    }
    return points;
  }, []);

  // Load circuit data from API
  const loadCircuitFromApi = useCallback(async () => {
    const circuit = CIRCUITS[selectedCircuit];
    if (!circuit) return;

    setStatus("Loading circuit data from API...");
    try {
      const res = await fetch(`/api/circuit?name=${encodeURIComponent(circuit.shortName)}`);
      if (!res.ok) {
        setStatus("Failed to load circuit from API. Using GeoJSON instead.");
        loadCircuit();
        return;
      }

      const data = await res.json();
      setLoadedCircuitData(data);

      // Load track path from SVG
      if (data.svgPath && data.viewBox && data.geojson?.bounds) {
        const loadedTrackPoints = parseSvgPathToPoints(data.svgPath, data.viewBox, data.geojson.bounds);
        setTrackPoints(loadedTrackPoints);
        setOriginalPoints(loadedTrackPoints);
        setViewBox(data.viewBox);
      } else if (circuit.geojson.length > 0) {
        // Fallback to GeoJSON
        const points = circuit.geojson.map(([lng, lat]) => ({ lat, lng }));
        setTrackPoints(points);
        setOriginalPoints(points);
      }

      // Load pit lane if available
      if (data.pitLanePath && data.viewBox && data.geojson?.bounds) {
        const loadedPitPoints = parseSvgPathToPoints(data.pitLanePath, data.viewBox, data.geojson.bounds);
        setPitLanePoints(loadedPitPoints);
      } else {
        setPitLanePoints([]);
      }

      // Load start/finish
      if (data.geojson?.startFinish) {
        setStartFinish({ lat: data.geojson.startFinish[1], lng: data.geojson.startFinish[0] });
      } else if (circuit.startFinish) {
        setStartFinish({ lat: circuit.startFinish[1], lng: circuit.startFinish[0] });
      }

      // Load sectors
      if (data.sectors && data.sectors.length > 0) {
        setSectors(data.sectors.map((s: any) => ({
          number: s.number,
          startPercent: s.startPercent,
          endPercent: s.endPercent,
          color: s.color,
        })));
      }

      // Load corners with lat/lng positions
      if (data.corners && data.corners.length > 0 && data.geojson?.bounds) {
        const loadedTrackPoints = parseSvgPathToPoints(data.svgPath, data.viewBox, data.geojson.bounds);
        const loadedCorners = data.corners.map((c: any) => {
          // Calculate lat/lng from position percentage
          const pointIndex = Math.floor((c.position / 100) * loadedTrackPoints.length);
          const point = loadedTrackPoints[Math.min(pointIndex, loadedTrackPoints.length - 1)];
          return {
            number: c.number,
            name: c.name,
            position: c.position,
            lat: point.lat,
            lng: point.lng,
          };
        });
        setCorners(loadedCorners);
        setNextCornerNumber(Math.max(...data.corners.map((c: any) => c.number)) + 1);
      }

      setStatus(`Loaded ${circuit.name} from API with ${data.corners?.length || 0} corners`);
    } catch (error) {
      console.error("Failed to load circuit from API:", error);
      setStatus("Error loading from API. Using GeoJSON instead.");
      loadCircuit();
    }
  }, [selectedCircuit, parseSvgPathToPoints]);

  // Apply transform to points for calibration
  const applyTransformToPoints = useCallback((points: Point[], t: Transform): Point[] => {
    if (!currentCircuit) return points;

    // Calculate center of points for rotation
    const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const centerLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;

    return points.map(p => {
      // Apply scale around center
      let lat = centerLat + (p.lat - centerLat) * t.scale;
      let lng = centerLng + (p.lng - centerLng) * t.scale;

      // Apply rotation around center (convert degrees to radians)
      const rad = (t.rotation * Math.PI) / 180;
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);
      const dLat = lat - centerLat;
      const dLng = lng - centerLng;
      lat = centerLat + dLat * cosR - dLng * sinR;
      lng = centerLng + dLat * sinR + dLng * cosR;

      // Apply offset (convert to approximate degrees - rough approximation)
      lat += t.offsetY * 0.00001;
      lng += t.offsetX * 0.00001;

      return { lat, lng };
    });
  }, [currentCircuit]);

  // Start calibration mode
  const startCalibration = useCallback(() => {
    if (trackPoints.length === 0) {
      setStatus("Load a circuit first before calibrating");
      return;
    }
    setOriginalPoints([...trackPoints]);
    setTransform({ offsetX: 0, offsetY: 0, scale: 1, rotation: 0 });
    setIsCalibrating(true);
    setEditMode("calibrate");
    setStatus("Calibration mode: Use controls to transform track");
  }, [trackPoints]);

  // Apply calibration and exit
  const applyCalibration = useCallback(() => {
    const transformedPoints = applyTransformToPoints(originalPoints, transform);
    saveTrackHistory();
    setTrackPoints(transformedPoints);
    setIsCalibrating(false);
    setEditMode(null);
    setTransform({ offsetX: 0, offsetY: 0, scale: 1, rotation: 0 });
    setStatus("Calibration applied. You can now fine-tune individual points.");
  }, [originalPoints, transform, applyTransformToPoints, saveTrackHistory]);

  // Cancel calibration
  const cancelCalibration = useCallback(() => {
    setIsCalibrating(false);
    setEditMode(null);
    setTransform({ offsetX: 0, offsetY: 0, scale: 1, rotation: 0 });
    setStatus("Calibration cancelled");
  }, []);

  // Clear all points
  const clearTrackPoints = useCallback(() => {
    saveTrackHistory();
    setTrackPoints([]);
    setStatus("Cleared all track points");
  }, [saveTrackHistory]);

  const clearPitLanePoints = useCallback(() => {
    savePitLaneHistory();
    setPitLanePoints([]);
    setStatus("Cleared all pit lane points");
  }, [savePitLaneHistory]);

  // Remove last point
  const removeLastTrackPoint = useCallback(() => {
    if (trackPoints.length > 0) {
      saveTrackHistory();
      setTrackPoints(prev => prev.slice(0, -1));
      setStatus(`Removed last track point. ${trackPoints.length - 1} remaining`);
    }
  }, [trackPoints, saveTrackHistory]);

  const removeLastPitLanePoint = useCallback(() => {
    if (pitLanePoints.length > 0) {
      savePitLaneHistory();
      setPitLanePoints(prev => prev.slice(0, -1));
      setStatus(`Removed last pit lane point. ${pitLanePoints.length - 1} remaining`);
    }
  }, [pitLanePoints, savePitLaneHistory]);

  // Calculate bounds from track points
  const calculateBounds = useCallback((points: Point[]) => {
    if (points.length === 0) return currentCircuit?.bounds;

    const lngs = points.map(p => p.lng);
    const lats = points.map(p => p.lat);
    return {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };
  }, [currentCircuit]);

  // Load circuit data
  const loadCircuit = useCallback(() => {
    const circuit = CIRCUITS[selectedCircuit];
    if (circuit && circuit.geojson.length > 0) {
      const points = circuit.geojson.map(([lng, lat]) => ({ lat, lng }));
      setTrackPoints(points);
      setPitLanePoints([]);
      if (circuit.startFinish) {
        setStartFinish({ lat: circuit.startFinish[1], lng: circuit.startFinish[0] });
      }
      setCorners([]);
      setNextCornerNumber(1);
      setStatus(`Loaded ${circuit.name} with ${points.length} points`);
    } else {
      setTrackPoints([]);
      setStatus(`${circuit?.name || 'Circuit'} has no GeoJSON data yet`);
    }
  }, [selectedCircuit]);

  // Generate SVG path from points
  const generateSvgPath = useCallback((points: Point[], closePath: boolean = true) => {
    if (points.length === 0) return "";

    const bounds = calculateBounds(trackPoints.length > 0 ? trackPoints : points);
    if (!bounds) return "";

    const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
    const padding = 10;
    const width = vbWidth - 2 * padding;
    const height = vbHeight - 2 * padding;
    const lngRange = bounds.maxLng - bounds.minLng;
    const latRange = bounds.maxLat - bounds.minLat;

    const svgPoints = points.map(({ lat, lng }) => {
      const x = ((lng - bounds.minLng) / lngRange) * width + padding;
      const y = ((bounds.maxLat - lat) / latRange) * height + padding;
      return [x.toFixed(2), y.toFixed(2)];
    });

    const pathParts = svgPoints.map((p, i) => (i === 0 ? 'M ' : 'L ') + p[0] + ' ' + p[1]);
    if (closePath) pathParts.push('Z');
    return pathParts.join(' ');
  }, [viewBox, calculateBounds, trackPoints]);

  // Generate full JSON output
  const generateJsonOutput = useCallback(() => {
    const bounds = calculateBounds(trackPoints);
    if (!bounds || trackPoints.length === 0) return "";

    // Sort corners by number before output
    const sortedCorners = [...corners].sort((a, b) => a.number - b.number);

    const output = {
      svg: {
        viewBox,
        path: generateSvgPath(trackPoints, true),
        pitLanePath: pitLanePoints.length > 0 ? generateSvgPath(pitLanePoints, false) : undefined,
      },
      geojson: {
        bounds,
        startFinish: startFinish ? [startFinish.lng, startFinish.lat] : undefined,
      },
      corners: sortedCorners.map(c => {
        const result: Record<string, any> = {
          number: c.number,
        };
        if (c.name) result.name = c.name;
        result.position = c.position;
        return result;
      }),
      sectors: sectors.map(s => ({
        number: s.number,
        startPercent: s.startPercent,
        endPercent: s.endPercent,
        color: s.color,
      })),
    };

    return JSON.stringify(output, null, 2);
  }, [trackPoints, pitLanePoints, startFinish, corners, sectors, viewBox, generateSvgPath, calculateBounds]);

  // Handle map click based on edit mode
  const handleMapClick = useCallback((latlng: LatLng) => {
    const point = { lat: latlng.lat, lng: latlng.lng };

    switch (editMode) {
      case "track":
        saveTrackHistory();
        setTrackPoints(prev => [...prev, point]);
        setStatus(`Added track point ${trackPoints.length + 1}`);
        break;
      case "pitlane":
        savePitLaneHistory();
        setPitLanePoints(prev => [...prev, point]);
        setStatus(`Added pit lane point ${pitLanePoints.length + 1}`);
        break;
      case "startfinish":
        setStartFinish(point);
        setStatus("Start/Finish line set");
        setEditMode(null);
        break;
      case "corners":
        // Calculate position percentage based on nearest track point
        const nearestIndex = findNearestPointIndex(point, trackPoints);
        const position = (nearestIndex / trackPoints.length) * 100;
        const newCorner: Corner = {
          number: nextCornerNumber,
          position: Math.round(position * 10) / 10,
          lat: point.lat,
          lng: point.lng,
        };
        setCorners(prev => [...prev, newCorner]);
        setNextCornerNumber(prev => prev + 1);
        setStatus(`Added Turn ${newCorner.number} at ${newCorner.position}%`);
        break;
    }
  }, [editMode, trackPoints, pitLanePoints, nextCornerNumber, saveTrackHistory, savePitLaneHistory]);

  // Find nearest point index
  const findNearestPointIndex = (point: Point, points: Point[]): number => {
    let minDist = Infinity;
    let nearestIndex = 0;
    points.forEach((p, i) => {
      const dist = Math.sqrt(Math.pow(p.lat - point.lat, 2) + Math.pow(p.lng - point.lng, 2));
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    });
    return nearestIndex;
  };

  // Handle point drag
  const handleTrackPointDrag = useCallback((index: number, latlng: LatLng) => {
    setTrackPoints(prev => {
      const newPoints = [...prev];
      newPoints[index] = { lat: latlng.lat, lng: latlng.lng };
      return newPoints;
    });
  }, []);

  const handlePitLanePointDrag = useCallback((index: number, latlng: LatLng) => {
    setPitLanePoints(prev => {
      const newPoints = [...prev];
      newPoints[index] = { lat: latlng.lat, lng: latlng.lng };
      return newPoints;
    });
  }, []);

  const handleCornerDrag = useCallback((index: number, latlng: LatLng) => {
    setCorners(prev => {
      const newCorners = [...prev];
      const nearestIdx = findNearestPointIndex({ lat: latlng.lat, lng: latlng.lng }, trackPoints);
      const position = (nearestIdx / trackPoints.length) * 100;
      newCorners[index] = {
        ...newCorners[index],
        lat: latlng.lat,
        lng: latlng.lng,
        position: Math.round(position * 10) / 10,
      };
      return newCorners;
    });
  }, [trackPoints]);

  // Handle point delete
  const handleTrackPointDelete = useCallback((index: number) => {
    setTrackPoints(prev => prev.filter((_, i) => i !== index));
    setStatus(`Deleted track point ${index}`);
  }, []);

  const handlePitLanePointDelete = useCallback((index: number) => {
    setPitLanePoints(prev => prev.filter((_, i) => i !== index));
    setStatus(`Deleted pit lane point ${index}`);
  }, []);

  const handleCornerDelete = useCallback((index: number) => {
    setCorners(prev => prev.filter((_, i) => i !== index));
    setStatus(`Deleted corner`);
  }, []);

  // Copy JSON to clipboard
  const copyJson = useCallback(() => {
    const json = generateJsonOutput();
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setStatus("JSON copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [generateJsonOutput]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Undo
      if (modKey && e.key === 'z') {
        e.preventDefault();
        if (editMode === "track") undoTrack();
        else if (editMode === "pitlane") undoPitLane();
        return;
      }

      // Mode switching (without modifier)
      if (!modKey && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setEditMode(editMode === "track" ? null : "track");
            break;
          case '2':
            e.preventDefault();
            setEditMode(editMode === "pitlane" ? null : "pitlane");
            break;
          case '3':
            e.preventDefault();
            setEditMode(editMode === "startfinish" ? null : "startfinish");
            break;
          case '4':
            e.preventDefault();
            setEditMode(editMode === "corners" ? null : "corners");
            break;
          case '5':
            e.preventDefault();
            if (!isCalibrating) startCalibration();
            break;
          case 'Escape':
            e.preventDefault();
            if (isCalibrating) cancelCalibration();
            else setEditMode(null);
            break;
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            if (editMode === "track") removeLastTrackPoint();
            else if (editMode === "pitlane") removeLastPitLanePoint();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode, isCalibrating, undoTrack, undoPitLane, removeLastTrackPoint, removeLastPitLanePoint, startCalibration, cancelCalibration]);

  // Convert to LatLng arrays for Polyline
  const geojsonLatLngs = currentCircuit?.geojson.map(([lng, lat]) => [lat, lng] as [number, number]) || [];

  // In calibration mode, show transformed preview
  const displayTrackPoints = isCalibrating ? applyTransformToPoints(originalPoints, transform) : trackPoints;
  const trackLatLngs = displayTrackPoints.map(p => [p.lat, p.lng] as [number, number]);
  const pitLaneLatLngs = pitLanePoints.map(p => [p.lat, p.lng] as [number, number]);

  // Split track into sector segments
  const getSectorSegments = useCallback(() => {
    if (trackLatLngs.length === 0) return [];

    return sectors.map(sector => {
      const startIdx = Math.floor((sector.startPercent / 100) * trackLatLngs.length);
      const endIdx = Math.ceil((sector.endPercent / 100) * trackLatLngs.length);
      return {
        points: trackLatLngs.slice(startIdx, endIdx + 1),
        color: sector.color,
        number: sector.number,
      };
    });
  }, [trackLatLngs, sectors]);

  const sectorSegments = getSectorSegments();

  const jsonOutput = generateJsonOutput();

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-3 border-b border-border bg-card flex flex-wrap items-center gap-2">
        <select
          value={selectedCircuit}
          onChange={(e) => setSelectedCircuit(e.target.value)}
          className="px-3 py-1.5 rounded-md bg-secondary border border-border text-sm"
        >
          {Object.entries(CIRCUITS).map(([id, circuit]) => (
            <option key={id} value={id}>{circuit.name}</option>
          ))}
        </select>

        <button
          onClick={loadCircuit}
          className="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-sm font-medium"
          title="Load GeoJSON coordinates"
        >
          GeoJSON
        </button>

        <button
          onClick={loadCircuitFromApi}
          className="px-3 py-1.5 rounded-md bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium flex items-center gap-1"
          title="Load existing circuit data from API"
        >
          <Download className="h-3.5 w-3.5" />
          Load JSON
        </button>

        <div className="h-6 w-px bg-border" />

        {/* Visibility Toggles */}
        <button
          onClick={() => setShowMap(!showMap)}
          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
            showMap ? 'bg-blue-500/20 text-blue-400' : 'bg-secondary text-muted-foreground'
          }`}
          title="Toggle satellite map"
        >
          <Layers className="h-3.5 w-3.5" />
          Map
        </button>

        <button
          onClick={() => setShowGeojson(!showGeojson)}
          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
            showGeojson ? 'bg-green-500/20 text-green-400' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {showGeojson ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          GeoJSON
        </button>

        <button
          onClick={() => setShowTrack(!showTrack)}
          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
            showTrack ? 'bg-red-500/20 text-red-400' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {showTrack ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          Track
        </button>

        <button
          onClick={() => setShowPitLane(!showPitLane)}
          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
            showPitLane ? 'bg-yellow-500/20 text-yellow-400' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {showPitLane ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          Pit
        </button>

        <button
          onClick={() => setShowCorners(!showCorners)}
          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
            showCorners ? 'bg-purple-500/20 text-purple-400' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {showCorners ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          Turns
        </button>

        <button
          onClick={() => setShowStartFinish(!showStartFinish)}
          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
            showStartFinish ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {showStartFinish ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          S/F
        </button>

        <div className="h-6 w-px bg-border" />

        {/* Edit Mode Buttons */}
        <button
          onClick={() => setEditMode(editMode === "track" ? null : "track")}
          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
            editMode === "track" ? 'bg-red-500 text-white' : 'bg-secondary'
          }`}
        >
          <Route className="h-3.5 w-3.5" />
          Edit Track
        </button>

        <button
          onClick={() => setEditMode(editMode === "pitlane" ? null : "pitlane")}
          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
            editMode === "pitlane" ? 'bg-yellow-500 text-black' : 'bg-secondary'
          }`}
        >
          <CornerDownRight className="h-3.5 w-3.5" />
          Edit Pit Lane
        </button>

        <button
          onClick={() => setEditMode(editMode === "startfinish" ? null : "startfinish")}
          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
            editMode === "startfinish" ? 'bg-white text-black' : 'bg-secondary'
          }`}
        >
          <Flag className="h-3.5 w-3.5" />
          Set S/F
        </button>

        <button
          onClick={() => setEditMode(editMode === "corners" ? null : "corners")}
          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
            editMode === "corners" ? 'bg-purple-500 text-white' : 'bg-secondary'
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          Add Turns
        </button>

        <button
          onClick={startCalibration}
          disabled={trackPoints.length === 0}
          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
            editMode === "calibrate" ? 'bg-cyan-500 text-white' : 'bg-secondary'
          } disabled:opacity-50`}
          title="Calibrate track to match satellite (5)"
        >
          <Move className="h-3.5 w-3.5" />
          Calibrate
        </button>

        <div className="h-6 w-px bg-border" />

        {/* Point Management - Track */}
        {editMode === "track" && (
          <>
            <button
              onClick={removeLastTrackPoint}
              className="px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 bg-secondary hover:bg-secondary/80"
              title="Remove last track point"
            >
              <Minus className="h-3.5 w-3.5" />
              Last
            </button>
            <button
              onClick={undoTrack}
              disabled={trackHistory.length === 0}
              className="px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 bg-secondary hover:bg-secondary/80 disabled:opacity-50"
              title="Undo track change"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
            <button
              onClick={clearTrackPoints}
              className="px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 bg-destructive/20 text-destructive hover:bg-destructive/30"
              title="Clear all track points"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </>
        )}

        {/* Point Management - Pit Lane */}
        {editMode === "pitlane" && (
          <>
            <button
              onClick={removeLastPitLanePoint}
              className="px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 bg-secondary hover:bg-secondary/80"
              title="Remove last pit lane point"
            >
              <Minus className="h-3.5 w-3.5" />
              Last
            </button>
            <button
              onClick={undoPitLane}
              disabled={pitLaneHistory.length === 0}
              className="px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 bg-secondary hover:bg-secondary/80 disabled:opacity-50"
              title="Undo pit lane change"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
            <button
              onClick={clearPitLanePoints}
              className="px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 bg-destructive/20 text-destructive hover:bg-destructive/30"
              title="Clear all pit lane points"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </>
        )}

        {/* Calibration Controls */}
        {editMode === "calibrate" && isCalibrating && (
          <>
            <div className="flex items-center gap-1 text-xs">
              <Move className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">X:</span>
              <input
                type="number"
                value={transform.offsetX}
                onChange={(e) => setTransform(t => ({ ...t, offsetX: parseFloat(e.target.value) || 0 }))}
                className="w-16 px-2 py-1 rounded bg-secondary border border-border text-xs"
                step="10"
              />
              <span className="text-muted-foreground">Y:</span>
              <input
                type="number"
                value={transform.offsetY}
                onChange={(e) => setTransform(t => ({ ...t, offsetY: parseFloat(e.target.value) || 0 }))}
                className="w-16 px-2 py-1 rounded bg-secondary border border-border text-xs"
                step="10"
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="number"
                value={transform.scale}
                onChange={(e) => setTransform(t => ({ ...t, scale: parseFloat(e.target.value) || 1 }))}
                className="w-16 px-2 py-1 rounded bg-secondary border border-border text-xs"
                step="0.01"
                min="0.1"
                max="3"
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              <RotateCw className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="number"
                value={transform.rotation}
                onChange={(e) => setTransform(t => ({ ...t, rotation: parseFloat(e.target.value) || 0 }))}
                className="w-16 px-2 py-1 rounded bg-secondary border border-border text-xs"
                step="0.5"
              />
              <span className="text-muted-foreground">°</span>
            </div>
            <button
              onClick={applyCalibration}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-green-500 text-white hover:bg-green-600"
            >
              Apply
            </button>
            <button
              onClick={cancelCalibration}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80"
            >
              Cancel
            </button>
          </>
        )}

        <div className="flex-1" />

        <button
          onClick={copyJson}
          className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${
            copied ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'
          }`}
        >
          <Copy className="h-4 w-4" />
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={currentCircuit?.center || [52.388, 4.546]}
            zoom={currentCircuit?.zoom || 15}
            className="h-full w-full"
            style={{ background: '#1a1a2e' }}
            maxZoom={22}
            minZoom={10}
          >
            {showMap && (
              <TileLayer
                attribution='Tiles &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={22}
                maxNativeZoom={19}
              />
            )}
            <MapViewUpdater center={currentCircuit?.center || [52.388, 4.546]} zoom={currentCircuit?.zoom || 15} />
            <MapClickHandler onMapClick={handleMapClick} editMode={editMode} />

            {/* GeoJSON reference line */}
            {showGeojson && geojsonLatLngs.length > 0 && (
              <Polyline
                positions={geojsonLatLngs}
                pathOptions={{ color: '#00ff00', weight: 4, opacity: 0.6 }}
              />
            )}

            {/* Track path with sector colors */}
            {showTrack && trackLatLngs.length > 0 && (
              <>
                {/* Show sector-colored segments when not editing track */}
                {editMode !== "track" && sectorSegments.map((segment, idx) => (
                  <React.Fragment key={`sector-${idx}`}>
                    <Polyline
                      positions={segment.points}
                      pathOptions={{
                        color: segment.color,
                        weight: 5,
                        opacity: 0.9,
                      }}
                    />
                    {/* Sector start marker */}
                    {segment.points.length > 0 && (
                      <Marker
                        position={segment.points[0]}
                        icon={L.divIcon({
                          className: 'sector-label',
                          html: `<div style="
                            background: ${segment.color};
                            color: white;
                            font-size: 9px;
                            font-weight: bold;
                            padding: 2px 6px;
                            border-radius: 10px;
                            white-space: nowrap;
                            transform: translate(-50%, -200%);
                            border: 2px solid white;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                          ">S${segment.number}</div>`,
                          iconSize: [0, 0],
                        })}
                        interactive={false}
                      />
                    )}
                  </React.Fragment>
                ))}
                {/* Show dashed line when editing track */}
                {editMode === "track" && (
                  <Polyline
                    positions={trackLatLngs}
                    pathOptions={{
                      color: '#ff6b6b',
                      weight: 3,
                      opacity: 0.9,
                      dashArray: '5, 10'
                    }}
                  />
                )}
              </>
            )}

            {/* Pit lane path */}
            {showPitLane && pitLaneLatLngs.length > 0 && (
              <Polyline
                positions={pitLaneLatLngs}
                pathOptions={{
                  color: '#ffd700',
                  weight: 3,
                  opacity: 0.9,
                  dashArray: editMode === "pitlane" ? '5, 10' : undefined
                }}
              />
            )}

            {/* Track edit points */}
            {editMode === "track" && trackPoints.map((point, index) => (
              <DraggablePoint
                key={`track-${index}`}
                position={point}
                index={index}
                color={index === 0 ? '#ffd700' : '#ff6b6b'}
                editMode={editMode}
                activeMode="track"
                onDrag={handleTrackPointDrag}
                onDelete={handleTrackPointDelete}
                showLabel={true}
              />
            ))}

            {/* Pit lane edit points */}
            {editMode === "pitlane" && pitLanePoints.map((point, index) => (
              <DraggablePoint
                key={`pit-${index}`}
                position={point}
                index={index}
                color={index === 0 ? '#ffa500' : '#ffd700'}
                editMode={editMode}
                activeMode="pitlane"
                onDrag={handlePitLanePointDrag}
                onDelete={handlePitLanePointDelete}
                showLabel={true}
              />
            ))}

            {/* Start/Finish marker */}
            {showStartFinish && startFinish && (
              <CircleMarker
                center={[startFinish.lat, startFinish.lng]}
                radius={10}
                pathOptions={{
                  fillColor: '#ffffff',
                  color: '#000000',
                  weight: 3,
                  fillOpacity: 1,
                }}
              />
            )}

            {/* Corner markers - always show labels */}
            {showCorners && corners.map((corner, index) => (
              <React.Fragment key={`corner-${index}`}>
                {editMode === "corners" ? (
                  <DraggablePoint
                    position={{ lat: corner.lat, lng: corner.lng }}
                    index={index}
                    color="#a855f7"
                    editMode={editMode}
                    activeMode="corners"
                    onDrag={handleCornerDrag}
                    onDelete={handleCornerDelete}
                    showLabel={true}
                    label={`T${corner.number}`}
                  />
                ) : (
                  <>
                    <CircleMarker
                      center={[corner.lat, corner.lng]}
                      radius={6}
                      pathOptions={{
                        fillColor: '#a855f7',
                        color: '#a855f7',
                        weight: 1,
                        fillOpacity: 1,
                      }}
                    />
                    <Marker
                      position={[corner.lat, corner.lng]}
                      icon={L.divIcon({
                        className: 'corner-label',
                        html: `<div style="
                          background: #a855f7;
                          color: white;
                          font-size: 10px;
                          font-weight: bold;
                          padding: 2px 5px;
                          border-radius: 3px;
                          white-space: nowrap;
                          transform: translate(-50%, -150%);
                          border: 1px solid rgba(255,255,255,0.5);
                        ">${corner.name ? `T${corner.number} ${corner.name}` : `T${corner.number}`}</div>`,
                        iconSize: [0, 0],
                      })}
                      interactive={false}
                    />
                  </>
                )}
              </React.Fragment>
            ))}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur rounded-lg p-3 space-y-2 text-xs">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500 rounded" />
                <span>GeoJSON</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-yellow-400 rounded" />
                <span>Pit Lane</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Turns</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white border-2 border-black" />
                <span>S/F</span>
              </div>
            </div>
            <div className="flex gap-3 border-t border-border pt-2">
              <span className="text-muted-foreground">Sectors:</span>
              {sectors.map(s => (
                <div key={s.number} className="flex items-center gap-1">
                  <div className="w-4 h-2 rounded" style={{ backgroundColor: s.color }} />
                  <span>S{s.number}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Edit mode indicator */}
          {editMode && (
            <div className="absolute top-4 left-4 bg-card/95 backdrop-blur border border-border px-4 py-3 rounded-lg text-sm space-y-1">
              <div className="font-semibold text-primary">
                {editMode === "track" ? "Editing Track Path" :
                 editMode === "pitlane" ? "Editing Pit Lane" :
                 editMode === "startfinish" ? "Setting Start/Finish" :
                 editMode === "calibrate" ? "Calibrating Track" :
                 "Adding Corners"}
              </div>
              <div className="text-xs text-muted-foreground">
                {editMode === "track" || editMode === "pitlane" ? (
                  <>
                    <div>Click map to add point</div>
                    <div>Drag points to move</div>
                    <div>Right-click to delete</div>
                    <div className="mt-1 text-muted-foreground/70">Del: remove last | Ctrl+Z: undo</div>
                  </>
                ) : editMode === "startfinish" ? (
                  <div>Click on the track to place</div>
                ) : editMode === "calibrate" ? (
                  <>
                    <div>Adjust X/Y offset to move track</div>
                    <div>Adjust scale to resize</div>
                    <div>Adjust rotation to rotate</div>
                    <div className="mt-1 text-muted-foreground/70">Esc: cancel</div>
                  </>
                ) : (
                  <>
                    <div>Click to add turn marker</div>
                    <div>Drag to reposition</div>
                    <div>Right-click to delete</div>
                  </>
                )}
              </div>
              {/* Keyboard shortcuts hint */}
              <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground/60">
                <span className="font-mono">1-5</span>: modes &nbsp;
                <span className="font-mono">Esc</span>: exit
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-96 border-l border-border bg-card overflow-y-auto p-4 space-y-3">
          {/* Status */}
          <div className="p-3 rounded-lg bg-secondary text-sm">
            {status}
          </div>

          {/* Instructions */}
          <Card className="p-3">
            <h3 className="font-medium mb-2 text-sm">Quick Guide</h3>
            <div className="text-xs text-muted-foreground space-y-2">
              <div>
                <div className="font-medium text-foreground mb-1">Loading</div>
                <ul className="space-y-0.5">
                  <li><span className="text-primary">Load JSON</span> - Load existing circuit data</li>
                  <li><span className="text-primary">Calibrate</span> - Align track to satellite</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-foreground mb-1">Keyboard Shortcuts</div>
                <ul className="space-y-0.5 font-mono">
                  <li><span className="bg-secondary px-1 rounded">1</span> Edit Track</li>
                  <li><span className="bg-secondary px-1 rounded">2</span> Edit Pit Lane</li>
                  <li><span className="bg-secondary px-1 rounded">3</span> Set Start/Finish</li>
                  <li><span className="bg-secondary px-1 rounded">4</span> Add Corners</li>
                  <li><span className="bg-secondary px-1 rounded">5</span> Calibrate</li>
                  <li><span className="bg-secondary px-1 rounded">Del</span> Remove last point</li>
                  <li><span className="bg-secondary px-1 rounded">Ctrl+Z</span> Undo</li>
                  <li><span className="bg-secondary px-1 rounded">Esc</span> Exit mode</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* ViewBox */}
          <div>
            <label className="text-sm font-medium mb-1 block">ViewBox</label>
            <input
              type="text"
              value={viewBox}
              onChange={(e) => setViewBox(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md bg-secondary border border-border text-sm font-mono"
            />
          </div>

          {/* Sectors Editor */}
          <CollapsibleSection title="Sectors" icon={<div className="flex gap-0.5"><div className="w-2 h-2 bg-red-500" /><div className="w-2 h-2 bg-blue-500" /><div className="w-2 h-2 bg-yellow-500" /></div>}>
            {sectors.map((sector, index) => (
              <div key={sector.number} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: sector.color }} />
                <span className="w-8">S{sector.number}</span>
                <input
                  type="number"
                  value={sector.startPercent}
                  onChange={(e) => {
                    const newSectors = [...sectors];
                    newSectors[index].startPercent = parseFloat(e.target.value) || 0;
                    setSectors(newSectors);
                  }}
                  className="w-16 px-2 py-1 rounded bg-secondary border border-border"
                  step="0.1"
                />
                <span>-</span>
                <input
                  type="number"
                  value={sector.endPercent}
                  onChange={(e) => {
                    const newSectors = [...sectors];
                    newSectors[index].endPercent = parseFloat(e.target.value) || 0;
                    setSectors(newSectors);
                  }}
                  className="w-16 px-2 py-1 rounded bg-secondary border border-border"
                  step="0.1"
                />
                <span>%</span>
              </div>
            ))}
          </CollapsibleSection>

          {/* Corners List */}
          <CollapsibleSection title={`Corners (${corners.length})`} icon={<MapPin className="h-4 w-4 text-purple-500" />}>
            {corners.length === 0 ? (
              <p className="text-xs text-muted-foreground">No corners added. Click &quot;Add Turns&quot; then click on the map.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {corners.sort((a, b) => a.number - b.number).map((corner, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs p-2 bg-secondary rounded">
                    <span className="text-purple-400 font-medium w-8">T{corner.number}</span>
                    <input
                      type="text"
                      value={corner.name || ""}
                      onChange={(e) => {
                        const newCorners = [...corners];
                        const idx = newCorners.findIndex(c => c.number === corner.number);
                        newCorners[idx].name = e.target.value;
                        setCorners(newCorners);
                      }}
                      placeholder="Name"
                      className="flex-1 px-2 py-1 rounded bg-background border border-border"
                    />
                    <span className="text-muted-foreground w-12">{corner.position}%</span>
                    <button
                      onClick={() => handleCornerDelete(corners.findIndex(c => c.number === corner.number))}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-secondary rounded flex justify-between">
              <span>Track Points</span>
              <Badge variant="secondary">{trackPoints.length}</Badge>
            </div>
            <div className="p-2 bg-secondary rounded flex justify-between">
              <span>Pit Points</span>
              <Badge variant="secondary">{pitLanePoints.length}</Badge>
            </div>
          </div>

          {/* JSON Output */}
          <CollapsibleSection title="JSON Output" icon={<Copy className="h-4 w-4" />} defaultOpen={true}>
            <div className="p-3 rounded-lg bg-secondary text-xs font-mono max-h-96 overflow-y-auto whitespace-pre-wrap break-all">
              {jsonOutput || "Load a circuit to see output..."}
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}
