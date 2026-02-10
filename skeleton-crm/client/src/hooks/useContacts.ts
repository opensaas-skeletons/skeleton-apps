import { useState, useEffect, useCallback } from "react";
import type { Contact, CreateContactInput, UpdateContactInput } from "@shared/types/crm";
import * as api from "../api/client";

export function useContacts(filters?: Record<string, string>) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = filters ? JSON.stringify(filters) : "";

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listContacts(filters);
      setContacts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (input: CreateContactInput) => {
    await api.createContact(input);
    await refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, input: UpdateContactInput) => {
    await api.updateContact(id, input);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await api.deleteContact(id);
    await refresh();
  }, [refresh]);

  const importCSV = useCallback(async (file: File) => {
    const result = await api.importContacts(file);
    await refresh();
    return result;
  }, [refresh]);

  return { contacts, loading, error, refresh, create, update, remove, importCSV };
}
