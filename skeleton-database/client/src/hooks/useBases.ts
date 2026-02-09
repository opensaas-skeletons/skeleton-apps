import { useState, useEffect, useCallback } from "react";
import type { Base, CreateBaseInput, UpdateBaseInput } from "@shared/types/database";
import * as api from "../api/client";

export function useBases() {
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listBases();
      setBases(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBases();
  }, [fetchBases]);

  const addBase = async (input: CreateBaseInput) => {
    const base = await api.createBase(input);
    setBases((prev) => [...prev, base]);
    return base;
  };

  const editBase = async (id: string, input: UpdateBaseInput) => {
    const base = await api.updateBase(id, input);
    setBases((prev) => prev.map((b) => (b.id === id ? base : b)));
    return base;
  };

  const removeBase = async (id: string) => {
    await api.deleteBase(id);
    setBases((prev) => prev.filter((b) => b.id !== id));
  };

  return { bases, loading, error, fetchBases, addBase, editBase, removeBase };
}
