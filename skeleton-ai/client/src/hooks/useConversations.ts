import { useState, useCallback, useEffect } from "react";
import type { Conversation } from "@shared/types/ai";
import * as api from "../api/client";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listConversations();
      setConversations(data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (title?: string) => {
    const conversation = await api.createConversation({ title });
    setConversations((prev) => [conversation, ...prev]);
    setSelectedId(conversation.id);
    return conversation;
  }, []);

  const rename = useCallback(async (id: string, title: string) => {
    const updated = await api.updateConversation(id, title);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c))
    );
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [selectedId]
  );

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  return {
    conversations,
    selectedId,
    loading,
    create,
    rename,
    remove,
    select,
    refresh,
  };
}
