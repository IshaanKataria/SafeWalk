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

const MAPS_LIBRARIES: ("visualization" | "places")[] = ["visualization", "places"];

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
    <div className="h-full relative md:flex">
      {/* Map: full-screen behind everything on mobile, normal flex child on desktop */}
      <main className="absolute inset-0 md:relative md:flex-1 md:order-2">
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/40 text-red-200 px-4 py-2 rounded-lg text-sm pointer-events-none z-10">
            Tap the map to flag an unsafe area
          </div>
        )}
      </main>

      {/* Sidebar: bottom sheet on mobile (45% height), left rail on desktop */}
      <aside
        className="absolute bottom-0 left-0 right-0 h-[45%] md:relative md:h-full md:w-96 md:flex-shrink-0 md:order-1
                   bg-zinc-900/95 backdrop-blur-md md:backdrop-blur-none md:bg-zinc-900
                   border-t border-zinc-800 md:border-t-0 md:border-r
                   flex flex-col z-20
                   rounded-t-2xl md:rounded-none shadow-2xl md:shadow-none"
      >
        {/* Drag handle visual cue (mobile only) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        <div className="px-4 md:px-5 pt-2 md:pt-5 pb-3 md:pb-5 md:border-b md:border-zinc-800">
          <h1 className="text-base md:text-xl font-bold">SafeWalk</h1>
          <p className="hidden md:block text-sm text-zinc-400 mt-1">
            Score any route for safety, any time of day.
          </p>
        </div>

        <div className="px-4 md:px-5 pb-4 md:pb-5 flex-1 overflow-y-auto space-y-4 md:space-y-6">
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

        <div className="hidden md:block p-5 border-t border-zinc-800">
          <SafetyLegend />
        </div>
      </aside>

      <ReportModal
        location={pendingReport}
        onClose={() => setPendingReport(null)}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
}
