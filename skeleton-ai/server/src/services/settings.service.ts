import { query, queryOne } from "../db/connection";
import type { Settings } from "@shared/types/ai";
import {
  DEFAULT_TOP_K,
  DEFAULT_SIMILARITY_THRESHOLD,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_CHAT_MODEL,
  DEFAULT_EMBEDDING_MODEL,
} from "@shared/constants";

const DEFAULT_SETTINGS: Settings = {
  provider: "ollama",
  chat_model: DEFAULT_CHAT_MODEL,
  embedding_model: DEFAULT_EMBEDDING_MODEL,
  top_k: DEFAULT_TOP_K,
  similarity_threshold: DEFAULT_SIMILARITY_THRESHOLD,
  temperature: DEFAULT_TEMPERATURE,
  max_tokens: DEFAULT_MAX_TOKENS,
  system_prompt:
    "You are a helpful AI assistant with access to a knowledge base. Answer questions based on the provided context. Cite sources using [1], [2], etc. If the context doesn't contain enough information, say so honestly.",
};

export async function getSettings(): Promise<Settings> {
  const rows = await query<{ key: string; value: any }>("SELECT key, value FROM settings");
  const settings = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    (settings as any)[row.key] = row.value;
  }

  return settings;
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  for (const [key, value] of Object.entries(updates)) {
    await query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
  }

  return getSettings();
}

export async function getSettingValue(key: string): Promise<any> {
  const row = await queryOne<{ value: any }>("SELECT value FROM settings WHERE key = $1", [key]);
  return row?.value ?? (DEFAULT_SETTINGS as any)[key] ?? null;
}
