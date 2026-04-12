"use client";

import { useRef, useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import MapView from "@/components/MapView";
import RouteForm from "@/components/RouteForm";
import RoutePanel from "@/components/RoutePanel";
import SafetyLegend from "@/components/SafetyLegend";
import ReportButton from "@/components/ReportButton";
import ReportModal from "@/components/ReportModal";
import Spinner from "@/components/Spinner";
import HeatmapLegend from "@/components/HeatmapLegend";
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

type SheetState = "collapsed" | "default" | "expanded";

const SHEET_HEIGHT_CLASSES: Record<SheetState, string> = {
  collapsed: "h-14",
  default: "h-[45%]",
  expanded: "h-[90%]",
};

const SHEET_ORDER: SheetState[] = ["collapsed", "default", "expanded"];

function nextStateForDelta(current: SheetState, delta: number): SheetState {
  if (Math.abs(delta) < 30) return current; // ignore micro-swipes
  const idx = SHEET_ORDER.indexOf(current);
  // Negative delta = swipe up = expand
  if (delta < 0) return SHEET_ORDER[Math.min(idx + 1, SHEET_ORDER.length - 1)];
  return SHEET_ORDER[Math.max(idx - 1, 0)];
}

function HomeInner() {
  const { routes, loading, error, search } = useRoutes();
  const { reports, create: createReport } = useReports();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reportMode, setReportMode] = useState(false);
  const [pendingReport, setPendingReport] = useState<LatLng | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [sheetState, setSheetState] = useState<SheetState>("default");
  const touchStartY = useRef<number | null>(null);
  const [lastSearch, setLastSearch] = useState<{
    origin: string;
    destination: string;
    time: number;
  } | null>(null);

  function handleSheetTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleSheetTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const delta = endY - touchStartY.current;
    setSheetState((prev) => nextStateForDelta(prev, delta));
    touchStartY.current = null;
  }

  function cycleSheetOnTap() {
    // Tap on handle also cycles through states for non-touch / fallback
    setSheetState((prev) => {
      const idx = SHEET_ORDER.indexOf(prev);
      return SHEET_ORDER[(idx + 1) % SHEET_ORDER.length];
    });
  }

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

      {/* Sidebar: bottom sheet on mobile, left rail on desktop */}
      <aside
        data-sheet-state={sheetState}
        className={`absolute bottom-0 left-0 right-0 ${SHEET_HEIGHT_CLASSES[sheetState]} md:relative md:!h-full md:w-[400px] md:flex-shrink-0 md:order-1
                   bg-[var(--color-sw-surface-1)]/95 backdrop-blur-xl md:backdrop-blur-none md:bg-[var(--color-sw-surface-1)]
                   border-t border-[var(--color-sw-border)] md:border-t-0 md:border-r
                   flex flex-col z-20
                   rounded-t-3xl md:rounded-none
                   shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.7)] md:shadow-none
                   transition-[height] duration-300 ease-out`}
      >
        {/* Drag handle (mobile only) */}
        <div
          data-sheet-handle
          onTouchStart={handleSheetTouchStart}
          onTouchEnd={handleSheetTouchEnd}
          onClick={cycleSheetOnTap}
          className="md:hidden flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
          role="button"
          aria-label="Drag to resize panel"
        >
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        <div
          data-sheet-header
          onTouchStart={handleSheetTouchStart}
          onTouchEnd={handleSheetTouchEnd}
          className="px-5 md:px-6 pt-1 md:pt-6 pb-3 md:pb-5 md:border-b md:border-[var(--color-sw-border)] select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-sw-green)] shadow-[0_0_8px_var(--color-sw-green-glow)]" />
            <h1 className="text-base md:text-lg font-semibold tracking-tight">SafeWalk</h1>
          </div>
          <p className="hidden md:block text-[13px] text-zinc-500 mt-1.5">
            Score any walking route for safety.
          </p>
        </div>

        <div className="px-5 md:px-6 pb-4 md:pb-6 flex-1 overflow-y-auto space-y-4 md:space-y-5">
          <RouteForm onSubmit={handleSearch} loading={loading} />

          {error && (
            <p className="text-[13px] text-red-400 bg-red-500/8 border border-red-500/15 p-3 rounded-2xl">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setReportMode((m) => !m)}
              className={`py-2.5 text-[13px] font-medium rounded-2xl transition-all border flex items-center justify-center gap-1.5 ${
                reportMode
                  ? "bg-red-500/12 border-red-500/30 text-red-300"
                  : "bg-[var(--color-sw-surface-3)] border-[var(--color-sw-border)] text-zinc-400 hover:border-[var(--color-sw-border-strong)] hover:text-zinc-300"
              }`}
            >
              {reportMode ? "Cancel" : "Report"}
            </button>

            <button
              onClick={() => setHeatmapEnabled((v) => !v)}
              className={`py-2.5 text-[13px] font-medium rounded-2xl transition-all border flex items-center justify-center gap-1.5 ${
                heatmapEnabled
                  ? "bg-[var(--color-sw-green-dim)] border-[var(--color-sw-green)]/30 text-[var(--color-sw-green)]"
                  : "bg-[var(--color-sw-surface-3)] border-[var(--color-sw-border)] text-zinc-400 hover:border-[var(--color-sw-border-strong)] hover:text-zinc-300"
              }`}
            >
              {heatmapLoading && <Spinner size={12} />}
              {heatmapEnabled ? "Hide heatmap" : "Heatmap"}
            </button>
          </div>

          <RoutePanel
            routes={routes}
            selectedIndex={selectedIndex}
            onSelectRoute={setSelectedIndex}
          />
        </div>

        <div className="hidden md:block px-6 py-4 border-t border-[var(--color-sw-border)] space-y-3">
          <SafetyLegend />
          <HeatmapLegend visible={heatmapEnabled} />
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
