import type {
  Source,
  Document,
  Conversation,
  Message,
  Settings,
  ProviderInfo,
  RetrievalResult,
  ApiResponse,
  CreateSourceInput,
  UpdateSourceInput,
  CreateConversationInput,
  SendMessageInput,
  StreamChunk,
  AiExportPayload,
} from "@shared/types/ai";

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Sources
export async function listSources(): Promise<Source[]> {
  const res = await request<ApiResponse<Source[]>>("/sources");
  return res.data;
}

export async function getSource(id: string): Promise<Source> {
  const res = await request<ApiResponse<Source>>(`/sources/${id}`);
  return res.data;
}

export async function createSource(input: CreateSourceInput): Promise<Source> {
  const res = await request<ApiResponse<Source>>("/sources", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateSource(id: string, input: UpdateSourceInput): Promise<Source> {
  const res = await request<ApiResponse<Source>>(`/sources/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteSource(id: string): Promise<void> {
  await request(`/sources/${id}`, { method: "DELETE" });
}

export async function ingestSource(id: string): Promise<void> {
  await request(`/sources/${id}/ingest`, { method: "POST" });
}

export async function getSourceStatus(id: string): Promise<Source> {
  const res = await request<ApiResponse<Source>>(`/sources/${id}`);
  return res.data;
}

// Documents
export async function listDocuments(sourceId: string): Promise<Document[]> {
  const res = await request<ApiResponse<Document[]>>(`/sources/${sourceId}/documents`);
  return res.data;
}

export async function getDocument(id: string): Promise<Document> {
  const res = await request<ApiResponse<Document>>(`/documents/${id}`);
  return res.data;
}

export async function getDocumentContent(id: string): Promise<string> {
  const res = await request<ApiResponse<{ content: string }>>(`/documents/${id}/content`);
  return res.data.content;
}

// Conversations
export async function listConversations(): Promise<Conversation[]> {
  const res = await request<ApiResponse<Conversation[]>>("/conversations");
  return res.data;
}

export async function createConversation(input?: CreateConversationInput): Promise<Conversation> {
  const res = await request<ApiResponse<Conversation>>("/conversations", {
    method: "POST",
    body: JSON.stringify(input || {}),
  });
  return res.data;
}

export async function getConversation(id: string): Promise<Conversation & { messages: Message[] }> {
  const res = await request<ApiResponse<Conversation & { messages: Message[] }>>(`/conversations/${id}`);
  return res.data;
}

export async function updateConversation(id: string, title: string): Promise<Conversation> {
  const res = await request<ApiResponse<Conversation>>(`/conversations/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title }),
  });
  return res.data;
}

export async function deleteConversation(id: string): Promise<void> {
  await request(`/conversations/${id}`, { method: "DELETE" });
}

// Chat
export async function sendMessage(conversationId: string, input: SendMessageInput): Promise<Message> {
  const res = await request<ApiResponse<Message>>(`/chat/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function* streamMessage(
  conversationId: string,
  input: SendMessageInput,
  signal?: AbortSignal
): AsyncGenerator<StreamChunk> {
  const res = await fetch(`${BASE_URL}/chat/${conversationId}/messages/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!res.ok) throw new Error("Stream request failed");
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const chunk: StreamChunk = JSON.parse(line.slice(6));
          yield chunk;
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
}

// Search
export async function search(
  query: string,
  sourceIds?: string[],
  topK?: number
): Promise<RetrievalResult[]> {
  const res = await request<ApiResponse<RetrievalResult[]>>("/search", {
    method: "POST",
    body: JSON.stringify({ query, source_ids: sourceIds, top_k: topK }),
  });
  return res.data;
}

// Settings
export async function getSettings(): Promise<Settings> {
  const res = await request<ApiResponse<Settings>>("/settings");
  return res.data;
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const res = await request<ApiResponse<Settings>>("/settings", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return res.data;
}

export async function getProviders(): Promise<ProviderInfo[]> {
  const res = await request<ApiResponse<ProviderInfo[]>>("/settings/providers");
  return res.data;
}

// Models
export async function listModels(): Promise<{ provider: string; models: string[] }[]> {
  const res = await request<ApiResponse<{ provider: string; models: string[] }[]>>("/settings/models");
  return res.data;
}

export async function pullModel(modelName: string): Promise<void> {
  await request("/settings/models/pull", {
    method: "POST",
    body: JSON.stringify({ model: modelName }),
  });
}

// Interop
export async function exportData(): Promise<AiExportPayload> {
  const res = await request<ApiResponse<AiExportPayload>>("/interop/export");
  return res.data;
}

export async function importData(payload: AiExportPayload): Promise<void> {
  await request("/interop/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
