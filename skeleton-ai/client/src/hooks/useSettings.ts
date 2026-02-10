import { useState, useCallback, useEffect } from "react";
import type { Settings, ProviderInfo } from "@shared/types/ai";
import * as api from "../api/client";

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsData, providersData] = await Promise.all([
        api.getSettings(),
        api.getProviders(),
      ]);
      setSettings(settingsData);
      setProviders(providersData);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback(async (updates: Partial<Settings>) => {
    const updated = await api.updateSettings(updates);
    setSettings(updated);
    return updated;
  }, []);

  return {
    settings,
    providers,
    loading,
    update,
    refresh,
  };
}
