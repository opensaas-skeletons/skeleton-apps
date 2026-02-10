import { useState, useCallback, useEffect, useRef } from "react";
import type { SyncRepo, SyncHistory, SyncSchedule, CreateSyncRepoInput, UpdateSyncRepoInput } from "@shared/types/ai";
import * as syncApi from "../api/sync";

export function useSync() {
  const [repos, setRepos] = useState<SyncRepo[]>([]);
  const [history, setHistory] = useState<SyncHistory[]>([]);
  const [schedule, setSchedule] = useState<SyncSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshRepos = useCallback(async () => {
    try {
      const data = await syncApi.listSyncRepos();
      setRepos(data);
    } catch (err) {
      console.error("Failed to fetch sync repos:", err);
    }
  }, []);

  const refreshHistory = useCallback(async (repoId?: string) => {
    try {
      const data = await syncApi.listSyncHistory(repoId);
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch sync history:", err);
    }
  }, []);

  const refreshSchedule = useCallback(async () => {
    try {
      const data = await syncApi.getSyncSchedule();
      setSchedule(data);
    } catch (err) {
      console.error("Failed to fetch sync schedule:", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([refreshRepos(), refreshHistory(), refreshSchedule()]);
    setLoading(false);
  }, [refreshRepos, refreshHistory, refreshSchedule]);

  useEffect(() => {
    refresh();
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [refresh]);

  const createRepo = useCallback(async (input: CreateSyncRepoInput) => {
    const repo = await syncApi.createSyncRepo(input);
    setRepos((prev) => [repo, ...prev]);
    return repo;
  }, []);

  const updateRepo = useCallback(async (id: string, input: UpdateSyncRepoInput) => {
    const updated = await syncApi.updateSyncRepo(id, input);
    setRepos((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, []);

  const removeRepo = useCallback(async (id: string) => {
    await syncApi.deleteSyncRepo(id);
    setRepos((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const triggerSync = useCallback(async (repoId: string) => {
    await syncApi.triggerSync(repoId);
    setRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, status: "syncing" as const } : r))
    );

    // Poll for status updates
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      try {
        const data = await syncApi.listSyncRepos();
        setRepos(data);
        const syncing = data.some((r) => r.status === "syncing");
        if (!syncing) {
          clearInterval(pollTimer.current!);
          pollTimer.current = null;
          refreshHistory();
        }
      } catch {
        clearInterval(pollTimer.current!);
        pollTimer.current = null;
      }
    }, 3000);
  }, [refreshHistory]);

  const triggerSyncAll = useCallback(async () => {
    await syncApi.triggerSyncAll();
    setRepos((prev) =>
      prev.map((r) => (r.auto_sync ? { ...r, status: "syncing" as const } : r))
    );

    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      try {
        const data = await syncApi.listSyncRepos();
        setRepos(data);
        const syncing = data.some((r) => r.status === "syncing");
        if (!syncing) {
          clearInterval(pollTimer.current!);
          pollTimer.current = null;
          refreshHistory();
        }
      } catch {
        clearInterval(pollTimer.current!);
        pollTimer.current = null;
      }
    }, 3000);
  }, [refreshHistory]);

  const updateSchedule = useCallback(async (updates: Partial<SyncSchedule>) => {
    const updated = await syncApi.updateSyncSchedule(updates);
    setSchedule(updated);
    return updated;
  }, []);

  return {
    repos,
    history,
    schedule,
    loading,
    createRepo,
    updateRepo,
    removeRepo,
    triggerSync,
    triggerSyncAll,
    updateSchedule,
    refreshRepos,
    refreshHistory,
    refreshSchedule,
    refresh,
  };
}
