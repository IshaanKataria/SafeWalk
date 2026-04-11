"use client";

import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { CommunityReport, ReportCategory } from "@/types";

interface ReportMarkersProps {
  reports: CommunityReport[];
}

const CATEGORY_COLORS: Record<ReportCategory, { bg: string; border: string; glyph: string }> = {
  lighting: { bg: "#f59e0b", border: "#78350f", glyph: "L" },
  crime:    { bg: "#ef4444", border: "#7f1d1d", glyph: "C" },
  harassment: { bg: "#a855f7", border: "#581c87", glyph: "H" },
  other:    { bg: "#64748b", border: "#1e293b", glyph: "?" },
};

export default function ReportMarkers({ reports }: ReportMarkersProps) {
  return (
    <>
      {reports.map((report) => {
        const colors = CATEGORY_COLORS[report.category];
        return (
          <AdvancedMarker
            key={report.id}
            position={{ lat: report.lat, lng: report.lng }}
            title={report.description ?? report.category}
          >
            <Pin
              background={colors.bg}
              borderColor={colors.border}
              glyphColor="#ffffff"
              glyph={colors.glyph}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
}
