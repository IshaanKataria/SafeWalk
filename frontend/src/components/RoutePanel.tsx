"use client";

import { useMemo } from "react";
import { ScoredRoute } from "@/types";
import { scoreToText, scoreToLabel, scoreToHex } from "@/lib/colors";
import { buildWalkingNavUrl } from "@/lib/gmaps";

interface RoutePanelProps {
  routes: ScoredRoute[];
  selectedIndex: number;
  onSelectRoute: (index: number) => void;
}

type BadgeKind = "recommended" | "safest" | "fastest" | null;

const BADGE_STYLES: Record<Exclude<BadgeKind, null>, string> = {
  recommended: "bg-[var(--color-sw-green-dim)] text-[var(--color-sw-green)] border-[var(--color-sw-green)]/20",
  safest:      "bg-[var(--color-sw-green-dim)] text-[var(--color-sw-green)] border-[var(--color-sw-green)]/20",
  fastest:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
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
    <div className="animate-fade-in">
      <h3 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-3">
        {routes.length} route{routes.length === 1 ? "" : "s"}
      </h3>

      <div className="flex md:block gap-3 md:gap-0 md:space-y-3 overflow-x-auto md:overflow-x-visible -mx-5 px-5 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none pb-1 hide-scrollbar">
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
            className={`flex-shrink-0 w-72 md:w-auto snap-center block text-left p-4 rounded-2xl border transition-all cursor-pointer
                        focus:outline-none focus:ring-2 focus:ring-[var(--color-sw-green)]/30
                        ${
                          isSelected
                            ? "bg-[var(--color-sw-surface-2)] border-[var(--color-sw-green)]/25 shadow-[0_0_20px_-4px_var(--color-sw-green-glow)]"
                            : "bg-[var(--color-sw-surface-2)]/60 border-[var(--color-sw-border)] hover:border-[var(--color-sw-border-strong)] hover:bg-[var(--color-sw-surface-2)]"
                        }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                {badge && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide mb-1.5 border ${BADGE_STYLES[badge]}`}
                  >
                    {BADGE_LABELS[badge]}
                  </span>
                )}
                <p className="text-[14px] text-zinc-200 font-medium truncate">
                  {route.summary || `Route ${idx + 1}`}
                </p>
                <div className="flex items-center gap-2 text-[12px] text-zinc-500 mt-1">
                  <span>{route.distance_km} km</span>
                  <span className="text-zinc-700">·</span>
                  <span>{route.duration_min} min</span>
                </div>
              </div>

              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                  isSelected ? "border-[var(--color-sw-green)]/30 bg-[var(--color-sw-green-dim)]" : "border-[var(--color-sw-border)] bg-[var(--color-sw-surface-3)]"
                }`}>
                  <span className={`text-2xl font-bold leading-none ${scoreToText(route.overall_score)}`}>
                    {route.overall_score}
                  </span>
                </div>
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider mt-1">
                  {scoreToLabel(route.overall_score)}
                </span>
              </div>
            </div>

            <div className="flex gap-[2px] h-1.5 rounded-full overflow-hidden bg-black/30 mb-3">
              {route.segments.map((seg, segIdx) => (
                <div
                  key={segIdx}
                  className="flex-1 rounded-full"
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
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--color-sw-green)] hover:text-green-400
                             bg-[var(--color-sw-green-dim)] hover:bg-[var(--color-sw-green-dim)]/80
                             px-3 py-1 rounded-full transition-colors font-medium"
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
    </div>
  );
}
