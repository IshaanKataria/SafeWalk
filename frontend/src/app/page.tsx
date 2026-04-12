"use client";

import { useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import MapView from "@/components/MapView";
import RouteForm from "@/components/RouteForm";
import RoutePanel from "@/components/RoutePanel";
import SafetyLegend from "@/components/SafetyLegend";
import ReportButton from "@/components/ReportButton";
import ReportModal from "@/components/ReportModal";
import Spinner from "@/components/Spinner";
import { useRoutes } from "@/hooks/useRoutes";
import { useReports } from "@/hooks/useReports";
import { useHeatmap } from "@/hooks/useHeatmap";
import { LatLng, ReportCategory } from "@/types";

// Google Maps JS is only loaded for the Places Autocomplete in the form.
// Rendering (base map, routes, heatmap, markers) is handled by Mapbox GL.
const MAPS_LIBRARIES: "places"[] = ["places"];

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-950 text-zinc-400">
        <p>Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in frontend/.env.local to load the app.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={MAPS_LIBRARIES}>
      <HomeInner />
    </APIProvider>
  );
}

function HomeInner() {
  const { routes, loading, error, search } = useRoutes();
  const { reports, create: createReport } = useReports();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reportMode, setReportMode] = useState(false);
  const [pendingReport, setPendingReport] = useState<LatLng | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [lastSearch, setLastSearch] = useState<{
    origin: string;
    destination: string;
    time: number;
  } | null>(null);

  // Heatmap follows the most recently searched time, defaults to 21:00.
  const heatmapTime = lastSearch?.time ?? 21;
  const { points: heatmapPoints, loading: heatmapLoading } = useHeatmap(
    heatmapEnabled,
    heatmapTime,
  );

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

          <div className="space-y-2">
            <ReportButton
              active={reportMode}
              onToggle={() => setReportMode((m) => !m)}
            />

            <button
              onClick={() => setHeatmapEnabled((v) => !v)}
              className={`w-full py-2.5 font-medium rounded-lg transition-colors border flex items-center justify-center gap-2 ${
                heatmapEnabled
                  ? "bg-orange-500/20 border-orange-500/60 text-orange-300"
                  : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {heatmapLoading && <Spinner size={14} />}
              {heatmapLoading
                ? "Loading heatmap"
                : heatmapEnabled
                  ? "Hide safety heatmap"
                  : "Show safety heatmap"}
            </button>
          </div>

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
          heatmapPoints={heatmapPoints}
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
