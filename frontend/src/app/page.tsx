"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import RouteForm from "@/components/RouteForm";
import RoutePanel from "@/components/RoutePanel";
import SafetyLegend from "@/components/SafetyLegend";
import ReportButton from "@/components/ReportButton";
import ReportModal from "@/components/ReportModal";
import { useRoutes } from "@/hooks/useRoutes";
import { useReports } from "@/hooks/useReports";
import { LatLng, ReportCategory } from "@/types";

export default function Home() {
  const { routes, loading, error, search } = useRoutes();
  const { reports, create: createReport } = useReports();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reportMode, setReportMode] = useState(false);
  const [pendingReport, setPendingReport] = useState<LatLng | null>(null);
  const [lastSearch, setLastSearch] = useState<{
    origin: string;
    destination: string;
    time: number;
  } | null>(null);

  function handleSearch(origin: string, destination: string, timeOfDay: number) {
    setSelectedIndex(0);
    setLastSearch({ origin, destination, time: timeOfDay });
    search(origin, destination, timeOfDay);
  }

  function handleMapClick(location: LatLng) {
    setPendingReport(location);
    setReportMode(false);
  }

  async function handleSubmitReport(category: ReportCategory, description: string) {
    if (!pendingReport) return;
    await createReport({
      lat: pendingReport.lat,
      lng: pendingReport.lng,
      category,
      description: description || undefined,
    });
    // Re-run the last search so new reports affect the scoring immediately.
    if (lastSearch) {
      search(lastSearch.origin, lastSearch.destination, lastSearch.time);
    }
  }

  return (
    <div className="h-full flex">
      <aside className="w-96 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-5 border-b border-zinc-800">
          <h1 className="text-xl font-bold">SafeWalk</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Score any route for safety, any time of day.
          </p>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          <RouteForm onSubmit={handleSearch} loading={loading} />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">
              {error}
            </p>
          )}

          <ReportButton
            active={reportMode}
            onToggle={() => setReportMode((m) => !m)}
          />

          <RoutePanel
            routes={routes}
            selectedIndex={selectedIndex}
            onSelectRoute={setSelectedIndex}
          />
        </div>

        <div className="p-5 border-t border-zinc-800">
          <SafetyLegend />
        </div>
      </aside>

      <main className="flex-1 relative">
        <MapView
          routes={routes}
          selectedIndex={selectedIndex}
          onSelectRoute={setSelectedIndex}
          reports={reports}
          reportMode={reportMode}
          onMapClick={handleMapClick}
        />

        {reportMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/40 text-red-200 px-4 py-2 rounded-lg text-sm pointer-events-none">
            Click anywhere on the map to flag it as unsafe
          </div>
        )}
      </main>

      <ReportModal
        location={pendingReport}
        onClose={() => setPendingReport(null)}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
}
