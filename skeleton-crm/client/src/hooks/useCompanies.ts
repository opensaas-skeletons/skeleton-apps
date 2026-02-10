import { useState, useEffect, useCallback } from "react";
import type { Company, CreateCompanyInput, UpdateCompanyInput } from "@shared/types/crm";
import * as api from "../api/client";

export function useCompanies(filters?: Record<string, string>) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = filters ? JSON.stringify(filters) : "";

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listCompanies(filters);
      setCompanies(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (input: CreateCompanyInput) => {
    await api.createCompany(input);
    await refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, input: UpdateCompanyInput) => {
    await api.updateCompany(id, input);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await api.deleteCompany(id);
    await refresh();
  }, [refresh]);

  return { companies, loading, error, refresh, create, update, remove };
}
