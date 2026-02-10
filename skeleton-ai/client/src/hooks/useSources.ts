import { useState, useCallback, useEffect, useRef } from "react";
import type { Source, CreateSourceInput, UpdateSourceInput } from "@shared/types/ai";
import * as api from "../api/client";

export function useSources() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const pollTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listSources();
      setSources(data);
    } catch (err) {
      console.error("Failed to fetch sources:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      pollTimers.current.forEach((timer) => clearInterval(timer));
    };
  }, [refresh]);

  const create = useCallback(async (input: CreateSourceInput) => {
    const source = await api.createSource(input);
    setSources((prev) => [...prev, source]);
    return source;
  }, []);

  const update = useCallback(async (id: string, input: UpdateSourceInput) => {
    const updated = await api.updateSource(id, input);
    setSources((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.deleteSource(id);
    setSources((prev) => prev.filter((s) => s.id !== id));
    const timer = pollTimers.current.get(id);
    if (timer) {
      clearInterval(timer);
      pollTimers.current.delete(id);
    }
  }, []);

  const triggerIngest = useCallback(async (id: string) => {
    await api.ingestSource(id);
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "ingesting" as const } : s))
    );

    const existing = pollTimers.current.get(id);
    if (existing) clearInterval(existing);

    const timer = setInterval(async () => {
      try {
        const status = await api.getSourceStatus(id);
        setSources((prev) => prev.map((s) => (s.id === id ? status : s)));
        if (status.status !== "ingesting") {
          clearInterval(timer);
          pollTimers.current.delete(id);
        }
      } catch {
        clearInterval(timer);
        pollTimers.current.delete(id);
      }
    }, 2000);

    pollTimers.current.set(id, timer);
  }, []);

  return {
    sources,
    loading,
    create,
    update,
    remove,
    triggerIngest,
    refresh,
  };
}
