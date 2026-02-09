import { useState, useEffect, useCallback } from "react";
import type {
  Workflow,
  WorkflowRun,
  CreateWorkflowInput,
  UpdateWorkflowInput,
} from "@shared/types/workflow";
import * as api from "../api/client";

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listWorkflows();
      setWorkflows(data);
    } catch (err: any) {
      setError(err.message || "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const addWorkflow = useCallback(
    async (input: CreateWorkflowInput) => {
      try {
        await api.createWorkflow(input);
        await fetchWorkflows();
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [fetchWorkflows]
  );

  const editWorkflow = useCallback(
    async (id: string, input: UpdateWorkflowInput) => {
      try {
        await api.updateWorkflow(id, input);
        await fetchWorkflows();
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [fetchWorkflows]
  );

  const removeWorkflow = useCallback(
    async (id: string) => {
      try {
        await api.deleteWorkflow(id);
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const trigger = useCallback(
    async (id: string) => {
      try {
        await api.triggerWorkflow(id);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const toggleEnabled = useCallback(
    async (id: string, enabled: boolean) => {
      try {
        await api.updateWorkflow(id, { enabled });
        setWorkflows((prev) =>
          prev.map((w) => (w.id === id ? { ...w, enabled } : w))
        );
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  return {
    workflows,
    loading,
    error,
    refresh: fetchWorkflows,
    addWorkflow,
    editWorkflow,
    removeWorkflow,
    trigger,
    toggleEnabled,
  };
}

export function useWorkflowDetail(id: string | null) {
  const [workflow, setWorkflow] = useState<
    (Workflow & { recent_runs: WorkflowRun[] }) | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWorkflow(id);
      setWorkflow(data);
    } catch (err: any) {
      setError(err.message || "Failed to load workflow");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { workflow, loading, error, refresh: fetchDetail };
}
