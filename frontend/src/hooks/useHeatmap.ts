"use client";

import { useEffect, useState } from "react";
import { fetchHeatmap } from "@/lib/api";
import { HeatmapPoint } from "@/types";

export function useHeatmap(enabled: boolean, timeOfDay: number) {
  const [points, setPoints] = useState<HeatmapPoint[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setPoints(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchHeatmap(timeOfDay)
      .then((data) => {
        if (!cancelled) setPoints(data.points);
      })
      .catch(() => {
        if (!cancelled) setPoints(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, timeOfDay]);

  return { points, loading };
}
