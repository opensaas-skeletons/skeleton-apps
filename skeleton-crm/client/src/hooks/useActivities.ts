import { useState, useEffect, useCallback } from "react";
import type { Activity, CreateActivityInput, UpdateActivityInput } from "@shared/types/crm";
import * as api from "../api/client";

export function useActivities(filters?: Record<string, string>) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = filters ? JSON.stringify(filters) : "";

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listActivities(filters);
      setActivities(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (input: CreateActivityInput) => {
    await api.createActivity(input);
    await refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, input: UpdateActivityInput) => {
    await api.updateActivity(id, input);
    await refresh();
  }, [refresh]);

  const toggleComplete = useCallback(async (activity: Activity) => {
    await api.updateActivity(activity.id, { completed: !activity.completed });
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await api.deleteActivity(id);
    await refresh();
  }, [refresh]);

  return { activities, loading, error, refresh, create, update, toggleComplete, remove };
}
