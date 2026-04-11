"use client";

import { Map, Polyline, APIProvider } from "@vis.gl/react-google-maps";
import { ScoredRoute } from "@/types";
import { scoreToHex } from "@/lib/colors";

const WANDSWORTH = { lat: 51.45, lng: -0.19 };

interface MapViewProps {
  routes: ScoredRoute[];
  selectedIndex: number;
  onSelectRoute: (index: number) => void;
}

export default function MapView({ routes, selectedIndex, onSelectRoute }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-900 text-zinc-400">
        <p>Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in frontend/.env.local to load the map.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={WANDSWORTH}
        defaultZoom={15}
        mapId="safewalk-map"
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="w-full h-full"
        colorScheme="DARK"
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
      </Map>
    </APIProvider>
  );
}
