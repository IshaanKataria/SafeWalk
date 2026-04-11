"use client";

import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { HeatmapPoint } from "@/types";

interface HeatmapLayerProps {
  points: HeatmapPoint[];
}

// Subtle gradient with gentle fade-in at the edges. The early low-alpha
// stops are what make individual points blend into smooth zones instead of
// stamping visible circles on the map.
const GRADIENT = [
  "rgba(34, 197, 94, 0)",
  "rgba(34, 197, 94, 0.15)",
  "rgba(34, 197, 94, 0.35)",
  "rgba(132, 204, 22, 0.55)",
  "rgba(234, 179, 8, 0.75)",
  "rgba(249, 115, 22, 0.9)",
  "rgba(239, 68, 68, 1)",
];

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();
  const visualization = useMapsLibrary("visualization");
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  useEffect(() => {
    if (!map || !visualization) return;

    const data = points.map((p) => ({
      location: new google.maps.LatLng(p.lat, p.lng),
      // Invert score so dangerous areas weigh heavily.
      weight: Math.max(0, 100 - p.score),
    }));

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }

    heatmapRef.current = new visualization.HeatmapLayer({
      data,
      map,
      radius: 130,
      opacity: 0.4,
      dissipating: true,
      gradient: GRADIENT,
      maxIntensity: 80,
    });

    return () => {
      heatmapRef.current?.setMap(null);
      heatmapRef.current = null;
    };
  }, [map, visualization, points]);

  return null;
}
