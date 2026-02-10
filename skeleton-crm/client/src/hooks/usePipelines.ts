import { useState, useEffect, useCallback } from "react";
import type { Pipeline, CreatePipelineInput, UpdatePipelineInput } from "@shared/types/crm";
import * as api from "../api/client";

export function usePipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listPipelines();
      setPipelines(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (input: CreatePipelineInput) => {
    await api.createPipeline(input);
    await refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, input: UpdatePipelineInput) => {
    await api.updatePipeline(id, input);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await api.deletePipeline(id);
    await refresh();
  }, [refresh]);

  return { pipelines, loading, error, refresh, create, update, remove };
}
