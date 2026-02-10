import { useState, useEffect, useCallback } from "react";
import type { DashboardSummary, PipelineFunnelEntry, ActivitySummary, RecentDeal, WinRateEntry } from "@shared/types/crm";
import * as api from "../api/client";

export function useDashboard(pipelineId?: string) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [funnel, setFunnel] = useState<PipelineFunnelEntry[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary[]>([]);
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
  const [winRate, setWinRate] = useState<WinRateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, a, r, w] = await Promise.all([
        api.getDashboardSummary(),
        api.getActivitySummary(),
        api.getRecentDeals(),
        api.getWinRate(),
      ]);
      setSummary(s);
      setActivitySummary(a);
      setRecentDeals(r);
      setWinRate(w);

      if (pipelineId) {
        const f = await api.getPipelineFunnel(pipelineId);
        setFunnel(f);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => { refresh(); }, [refresh]);

  const refreshFunnel = useCallback(async (pid: string) => {
    try {
      const f = await api.getPipelineFunnel(pid);
      setFunnel(f);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  return { summary, funnel, activitySummary, recentDeals, winRate, loading, error, refresh, refreshFunnel };
}
