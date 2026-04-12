"use client";

import { Marker, Popup } from "react-map-gl/mapbox";
import { CommunityReport, ReportCategory } from "@/types";

interface ReportMarkersProps {
  reports: CommunityReport[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

// Must match scoring_engine.py constants.
const REPORT_RADIUS_METRES = 300;
const REPORT_PENALTY_PER_REPORT = 6;
const MAX_REPORT_PENALTY = 25;

const CATEGORY_STYLE: Record<
  ReportCategory,
  { bg: string; border: string; glyph: string; label: string }
> = {
  lighting:   { bg: "#f59e0b", border: "#78350f", glyph: "L", label: "Poor lighting" },
  crime:      { bg: "#ef4444", border: "#7f1d1d", glyph: "C", label: "Crime incident" },
  harassment: { bg: "#a855f7", border: "#581c87", glyph: "H", label: "Harassment" },
  other:      { bg: "#64748b", border: "#1e293b", glyph: "?", label: "Other" },
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportMarkers({ reports, selectedId, onSelect }: ReportMarkersProps) {
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  return (
    <>
      {reports.map((report) => {
        const style = CATEGORY_STYLE[report.category];
        return (
          <Marker
            key={report.id}
            longitude={report.lng}
            latitude={report.lat}
            anchor="bottom"
            onClick={(e) => {
              // Stop the map click handler from firing and clearing the popup.
              e.originalEvent.stopPropagation();
              onSelect(report.id);
            }}
          >
            <div
              title={style.label}
              className="flex items-center justify-center w-8 h-8 rounded-full border-2 cursor-pointer shadow-lg hover:scale-110 transition-transform"
              style={{ backgroundColor: style.bg, borderColor: style.border }}
            >
              <span className="text-white font-bold text-sm select-none">{style.glyph}</span>
            </div>
          </Marker>
        );
      })}

      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          anchor="bottom"
          offset={36}
          onClose={() => onSelect(null)}
          closeButton={false}
          closeOnClick={false}
          className="safewalk-popup"
          maxWidth="280px"
        >
          <div className="min-w-[240px] max-w-[280px] text-zinc-100 relative pr-5">
            <button
              type="button"
              onClick={() => onSelect(null)}
              aria-label="Close"
              className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-white text-lg leading-none"
            >
              ×
            </button>

            <div className="flex items-center justify-between mb-2 pr-2">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${CATEGORY_STYLE[selected.category].bg}33`,
                  color: CATEGORY_STYLE[selected.category].bg,
                }}
              >
                {CATEGORY_STYLE[selected.category].label}
              </span>
              <span className="text-[11px] text-zinc-500">{formatDate(selected.created_at)}</span>
            </div>

            {selected.description && (
              <p className="text-sm text-zinc-200 mb-2">{selected.description}</p>
            )}

            <div className="border-t border-zinc-800 pt-2 mt-2">
              <p className="text-[11px] text-zinc-400 leading-tight">
                Reduces nearby route scores within <b>{REPORT_RADIUS_METRES}m</b> by{" "}
                <b>{REPORT_PENALTY_PER_REPORT}</b> points per report (up to{" "}
                <b>{MAX_REPORT_PENALTY}</b> max).
              </p>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}
