"use client";

import { useState } from "react";
import { Map, Polyline, MapMouseEvent } from "@vis.gl/react-google-maps";
import { CommunityReport, HeatmapPoint, LatLng, ScoredRoute } from "@/types";
import { scoreToHex } from "@/lib/colors";
import ReportMarkers from "./ReportMarkers";
import HeatmapLayer from "./HeatmapLayer";

const BARNET = { lat: 51.58, lng: -0.205 };

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
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  function handleClick(event: MapMouseEvent) {
    // Clicking anywhere on the map (not on a marker) dismisses any open popup.
    setSelectedReportId(null);

    if (!reportMode || !event.detail.latLng) return;
    onMapClick({
      lat: event.detail.latLng.lat,
      lng: event.detail.latLng.lng,
    });
  }

  return (
    <Map
      defaultCenter={BARNET}
      defaultZoom={14}
      mapId="safewalk-map"
      gestureHandling="greedy"
      disableDefaultUI={false}
      className={`w-full h-full ${reportMode ? "cursor-crosshair" : ""}`}
      colorScheme="DARK"
      onClick={handleClick}
    >
      {routes.map((route, routeIdx) => {
        const isSelected = routeIdx === selectedIndex;
        const dimmed = !isSelected && routes.length > 0;

        return route.segments.map((seg, segIdx) => (
          <Polyline
            key={`${routeIdx}-${segIdx}`}
            path={seg.path}
            strokeColor={scoreToHex(seg.safety_score)}
            strokeOpacity={dimmed ? 0.25 : 0.9}
            strokeWeight={isSelected ? 6 : 3}
            onClick={() => onSelectRoute(routeIdx)}
          />
        ));
      })}

      {heatmapPoints && <HeatmapLayer points={heatmapPoints} />}

      <ReportMarkers
        reports={reports}
        selectedId={selectedReportId}
        onSelect={setSelectedReportId}
      />
    </Map>
  );
}
