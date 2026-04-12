"use client";

import { useMemo } from "react";
import { Source, Layer } from "react-map-gl/mapbox";
import type { HeatmapLayerSpecification } from "react-map-gl/mapbox";
import type { FeatureCollection } from "geojson";
import { HeatmapPoint } from "@/types";

interface HeatmapLayerProps {
  points: HeatmapPoint[];
}

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const geojson = useMemo<FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: points.map((p, idx) => ({
        type: "Feature" as const,
        id: idx,
        // Danger = inverse of safety. Mapbox weight is driven by this.
        properties: { danger: Math.max(0, 100 - p.score) },
        geometry: {
          type: "Point" as const,
          coordinates: [p.lng, p.lat],
        },
      })),
    }),
    [points],
  );

  const layer: HeatmapLayerSpecification = {
    id: "safety-heatmap",
    type: "heatmap",
    source: "heatmap-source",
    paint: {
      // Map danger (0-100) to weight (0-1)
      "heatmap-weight": [
        "interpolate",
        ["linear"],
        ["get", "danger"],
        0, 0,
        100, 1,
      ],
      // Zoom-aware radius. At zoom 13 (default) 250m ≈ 38px on screen, so
      // the radius must be significantly larger than that for adjacent grid
      // points to merge into smooth zones instead of discrete circles.
      "heatmap-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10, 25,
        13, 90,
        15, 160,
        17, 240,
      ],
      // Smooth transparent → green → yellow → red gradient
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,    "rgba(34, 197, 94, 0)",
        0.15, "rgba(34, 197, 94, 0.4)",
        0.35, "rgba(132, 204, 22, 0.55)",
        0.55, "rgba(234, 179, 8, 0.7)",
        0.75, "rgba(249, 115, 22, 0.85)",
        1,    "rgba(239, 68, 68, 1)",
      ],
      "heatmap-opacity": 0.55,
      "heatmap-intensity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        11, 1,
        16, 1.5,
      ],
    },
  };

  return (
    <Source id="heatmap-source" type="geojson" data={geojson}>
      <Layer {...layer} />
    </Source>
  );
}
