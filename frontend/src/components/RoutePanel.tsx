"use client";

import { ScoredRoute } from "@/types";
import { scoreToBg, scoreToText, scoreToLabel } from "@/lib/colors";

interface RoutePanelProps {
  routes: ScoredRoute[];
  selectedIndex: number;
  onSelectRoute: (index: number) => void;
}

export default function RoutePanel({ routes, selectedIndex, onSelectRoute }: RoutePanelProps) {
  if (routes.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
        Routes ({routes.length})
      </h3>

      {routes.map((route, idx) => {
        const isSelected = idx === selectedIndex;

        return (
          <button
            key={idx}
            onClick={() => onSelectRoute(idx)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              isSelected
                ? `${scoreToBg(route.overall_score)} border-2`
                : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {idx === 0 && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                    Safest
                  </span>
                )}
                <span className="text-sm text-zinc-300">{route.summary || `Route ${idx + 1}`}</span>
              </div>
              <span className={`text-2xl font-bold ${scoreToText(route.overall_score)}`}>
                {route.overall_score}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>{route.distance_km} km</span>
              <span>{route.duration_min} min</span>
              <span>{scoreToLabel(route.overall_score)}</span>
            </div>

            <div className="flex gap-0.5 mt-2 h-1.5 rounded-full overflow-hidden">
              {route.segments.map((seg, segIdx) => (
                <div
                  key={segIdx}
                  className="flex-1 rounded-full"
                  style={{ backgroundColor: `${seg.color === "green" ? "#22c55e" : seg.color === "yellow" ? "#eab308" : "#ef4444"}` }}
                />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
