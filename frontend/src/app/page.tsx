"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import RouteForm from "@/components/RouteForm";
import RoutePanel from "@/components/RoutePanel";
import SafetyLegend from "@/components/SafetyLegend";
import { useRoutes } from "@/hooks/useRoutes";

export default function Home() {
  const { routes, loading, error, search } = useRoutes();
  const [selectedIndex, setSelectedIndex] = useState(0);

  function handleSearch(origin: string, destination: string, timeOfDay: number) {
    setSelectedIndex(0);
    search(origin, destination, timeOfDay);
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
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

      {/* Map */}
      <main className="flex-1">
        <MapView
          routes={routes}
          selectedIndex={selectedIndex}
          onSelectRoute={setSelectedIndex}
        />
      </main>
    </div>
  );
}
