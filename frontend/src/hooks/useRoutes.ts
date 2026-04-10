"use client";

import { useState } from "react";
import { fetchRoutes } from "@/lib/api";
import { ScoredRoute } from "@/types";

export function useRoutes() {
  const [routes, setRoutes] = useState<ScoredRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(origin: string, destination: string, timeOfDay: number) {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchRoutes({
        origin,
        destination,
        time_of_day: timeOfDay,
      });
      setRoutes(data.routes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch routes");
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  return { routes, loading, error, search };
}
