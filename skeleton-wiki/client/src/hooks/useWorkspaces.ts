import { useState, useEffect, useCallback } from "react";
import type { Workspace } from "@shared/types/wiki";
import * as api from "../api/client";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.listWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (title: string, icon?: string, color?: string) => {
    const ws = await api.createWorkspace({ title, icon, color });
    setWorkspaces((prev) => [ws, ...prev]);
    return ws;
  }, []);

  const update = useCallback(async (id: string, input: Partial<Workspace>) => {
    const ws = await api.updateWorkspace(id, input);
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? ws : w)));
    return ws;
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.deleteWorkspace(id);
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return { workspaces, loading, refresh, create, update, remove };
}
