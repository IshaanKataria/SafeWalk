"use client";

import { useMemo } from "react";
import { ScoredRoute } from "@/types";
import { scoreToBg, scoreToText, scoreToLabel, scoreToHex } from "@/lib/colors";
import { buildWalkingNavUrl } from "@/lib/gmaps";

interface RoutePanelProps {
  routes: ScoredRoute[];
  selectedIndex: number;
  onSelectRoute: (index: number) => void;
}

type BadgeKind = "recommended" | "safest" | "fastest" | null;

const BADGE_STYLES: Record<Exclude<BadgeKind, null>, string> = {
  recommended: "bg-green-500/20 text-green-300",
  safest:      "bg-green-500/20 text-green-300",
  fastest:     "bg-blue-500/20 text-blue-300",
};

const BADGE_LABELS: Record<Exclude<BadgeKind, null>, string> = {
  recommended: "Recommended",
  safest:      "Safest",
  fastest:     "Fastest",
};


function getRouteEndpoints(route: ScoredRoute) {
  if (route.segments.length === 0) return null;
  const first = route.segments[0];
  const last = route.segments[route.segments.length - 1];
  if (first.path.length === 0 || last.path.length === 0) return null;
  return {
    origin: first.path[0],
    destination: last.path[last.path.length - 1],
  };
}


export default function RoutePanel({ routes, selectedIndex, onSelectRoute }: RoutePanelProps) {
  const { safestIdx, fastestIdx } = useMemo(() => {
    if (routes.length === 0) return { safestIdx: -1, fastestIdx: -1 };

    let safest = 0;
    let fastest = 0;
    for (let i = 1; i < routes.length; i++) {
      if (routes[i].overall_score > routes[safest].overall_score) safest = i;
      if (routes[i].duration_min < routes[fastest].duration_min) fastest = i;
    }
    return { safestIdx: safest, fastestIdx: fastest };
  }, [routes]);

  if (routes.length === 0) return null;

  function getBadge(idx: number): BadgeKind {
    if (idx === safestIdx && idx === fastestIdx) return "recommended";
    if (idx === safestIdx) return "safest";
    if (idx === fastestIdx) return "fastest";
    return null;
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {routes.length} route{routes.length === 1 ? "" : "s"}
      </h3>

      {routes.map((route, idx) => {
        const isSelected = idx === selectedIndex;
        const badge = getBadge(idx);
        const endpoints = getRouteEndpoints(route);
        const navUrl = endpoints ? buildWalkingNavUrl(endpoints.origin, endpoints.destination) : null;

        return (
          <div
            key={idx}
            role="button"
            tabIndex={0}
            onClick={() => onSelectRoute(idx)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectRoute(idx);
              }
            }}
            className={`block w-full text-left p-4 rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              isSelected
                ? `${scoreToBg(route.overall_score)} border-2 shadow-lg`
                : "bg-zinc-800/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                {badge && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide mb-1 ${BADGE_STYLES[badge]}`}
                  >
                    {BADGE_LABELS[badge]}
                  </span>
                )}
                <p className="text-sm text-zinc-200 font-medium truncate">
                  {route.summary || `Route ${idx + 1}`}
                </p>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                  <span>{route.distance_km} km</span>
                  <span>·</span>
                  <span>{route.duration_min} min walk</span>
                </div>
              </div>

              <div className="flex flex-col items-end flex-shrink-0">
                <span className={`text-3xl font-bold leading-none ${scoreToText(route.overall_score)}`}>
                  {route.overall_score}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">
                  {scoreToLabel(route.overall_score)}
                </span>
              </div>
            </div>

            <div className="flex gap-[2px] h-2 rounded-full overflow-hidden bg-zinc-950/50 mb-3">
              {route.segments.map((seg, segIdx) => (
                <div
                  key={segIdx}
                  className="flex-1"
                  style={{ backgroundColor: scoreToHex(seg.safety_score) }}
                />
              ))}
            </div>

            {navUrl && (
              <div className="flex justify-end">
                <a
                  href={navUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-full transition-colors"
                >
                  Navigate
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
