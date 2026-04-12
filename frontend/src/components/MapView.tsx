"use client";

import { useMemo, useState } from "react";
import { Map, Source, Layer } from "react-map-gl/mapbox";
import type { MapMouseEvent, LineLayerSpecification } from "react-map-gl/mapbox";
import type { FeatureCollection } from "geojson";
import { CommunityReport, HeatmapPoint, LatLng, ScoredRoute } from "@/types";
import { scoreToHex } from "@/lib/colors";
import ReportMarkers from "./ReportMarkers";
import HeatmapLayer from "./HeatmapLayer";

const BARNET = { lat: 51.58, lng: -0.205 };
const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11";

interface MapViewProps {
  routes: ScoredRoute[];
  selectedIndex: number;
  onSelectRoute: (index: number) => void;
  reports: CommunityReport[];
  reportMode: boolean;
  onMapClick: (location: LatLng) => void;
  heatmapPoints: HeatmapPoint[] | null;
}

export default function MapView({
  routes,
  selectedIndex,
  onSelectRoute,
  reports,
  reportMode,
  onMapClick,
  heatmapPoints,
}: MapViewProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Build one GeoJSON FeatureCollection from every segment in every route.
  // Each feature carries colour + selected state + route index as properties
  // so a single line layer can data-drive paint per feature.
  const routesGeoJSON = useMemo<FeatureCollection>(() => {
    const features = routes.flatMap((route, routeIdx) =>
      route.segments.map((seg, segIdx) => ({
        type: "Feature" as const,
        id: routeIdx * 10000 + segIdx,
        properties: {
          color: scoreToHex(seg.safety_score),
          selected: routeIdx === selectedIndex ? 1 : 0,
          routeIdx,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: seg.path.map((p) => [p.lng, p.lat]),
        },
      })),
    );
    return { type: "FeatureCollection", features };
  }, [routes, selectedIndex]);

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-900 text-zinc-400">
        <p>Set NEXT_PUBLIC_MAPBOX_TOKEN in frontend/.env.local to load the map.</p>
      </div>
    );
  }

  function handleClick(event: MapMouseEvent) {
    // Clicking the map (not a marker) dismisses any open report popup.
    setSelectedReportId(null);

    // In report mode, any map click creates a report at that location.
    if (reportMode) {
      onMapClick({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      return;
    }

    // Route click detection: query the rendered features under the cursor.
    const feature = event.features?.find((f) => f.layer?.id === "routes-line");
    if (feature && typeof feature.properties?.routeIdx === "number") {
      onSelectRoute(feature.properties.routeIdx);
    }
  }

  const lineLayer: LineLayerSpecification = {
    id: "routes-line",
    type: "line",
    source: "routes-source",
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": ["get", "color"],
      "line-width": [
        "case",
        ["==", ["get", "selected"], 1],
        6,
        3,
      ],
      "line-opacity": [
        "case",
        ["==", ["get", "selected"], 1],
        0.95,
        0.35,
      ],
    },
  };

  return (
    <Map
      mapboxAccessToken={token}
      mapStyle={MAPBOX_STYLE}
      initialViewState={{
        longitude: BARNET.lng,
        latitude: BARNET.lat,
        zoom: 13,
      }}
      style={{ width: "100%", height: "100%" }}
      cursor={reportMode ? "crosshair" : "auto"}
      onClick={handleClick}
      interactiveLayerIds={["routes-line"]}
    >
      <Source id="routes-source" type="geojson" data={routesGeoJSON}>
        <Layer {...lineLayer} />
      </Source>

      {heatmapPoints && <HeatmapLayer points={heatmapPoints} />}

      <ReportMarkers
        reports={reports}
        selectedId={selectedReportId}
        onSelect={setSelectedReportId}
      />
    </Map>
  );
}
