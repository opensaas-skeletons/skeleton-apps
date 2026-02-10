import { useState, useEffect, useCallback } from "react";
import type { Deal, CreateDealInput, UpdateDealInput, MoveDealInput } from "@shared/types/crm";
import * as api from "../api/client";

export function useDeals(filters?: Record<string, string>) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = filters ? JSON.stringify(filters) : "";

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listDeals(filters);
      setDeals(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (input: CreateDealInput) => {
    await api.createDeal(input);
    await refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, input: UpdateDealInput) => {
    await api.updateDeal(id, input);
    await refresh();
  }, [refresh]);

  const move = useCallback(async (id: string, input: MoveDealInput) => {
    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stage_id: input.stage_id, position: input.position } : d))
    );
    try {
      await api.moveDeal(id, input);
      await refresh();
    } catch (err: any) {
      // Rollback on error
      await refresh();
      throw err;
    }
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await api.deleteDeal(id);
    await refresh();
  }, [refresh]);

  return { deals, loading, error, refresh, create, update, move, remove };
}
