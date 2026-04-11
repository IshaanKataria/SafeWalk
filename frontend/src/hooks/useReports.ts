"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchReports, submitReport } from "@/lib/api";
import { CommunityReport, CommunityReportCreate } from "@/types";

export function useReports() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReports();
      setReports(data);
    } catch {
      // Swallow — reports are non-critical and failing silently is fine.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function create(report: CommunityReportCreate) {
    await submitReport(report);
    await refresh();
  }

  return { reports, loading, refresh, create };
}
