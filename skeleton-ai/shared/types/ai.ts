// Core entities

export interface Source {
  id: string;
  title: string;
  description: string;
  source_type: "directory" | "url";
  config: Record<string, any>;
  status: "pending" | "ingesting" | "ready" | "error";
  document_count: number;
  chunk_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  source_id: string;
  file_path: string;
  file_type: string;
  content_hash: string;
  chunk_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, any>;
  embedding?: number[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  model?: string;
  provider?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: RetrievalResult[];
  model?: string;
  tokens_used?: number;
  created_at: string;
}

export interface Settings {
  provider: string;
  chat_model: string;
  embedding_model: string;
  top_k: number;
  similarity_threshold: number;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  [key: string]: any;
}

// Chat types

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  tokens_used?: number;
}

export interface StreamChunk {
  type: "token" | "sources" | "done" | "error";
  content?: string;
  sources?: RetrievalResult[];
  model?: string;
  error?: string;
}

export interface ProviderInfo {
  name: string;
  id: string;
  available: boolean;
  models?: string[];
  error?: string;
}

// Ingestion types

export interface IngestionResult {
  source_id: string;
  documents_processed: number;
  documents_added: number;
  documents_updated: number;
  documents_removed: number;
  chunks_created: number;
  errors: string[];
}

export interface CrawledFile {
  path: string;
  content: string;
  fileType: string;
}

export interface ChunkData {
  content: string;
  metadata: Record<string, any>;
  chunkIndex: number;
}

// Search / retrieval types

export interface SearchOptions {
  query: string;
  source_ids?: string[];
  top_k?: number;
  similarity_threshold?: number;
}

export interface RetrievalResult {
  chunk_id: string;
  document_id: string;
  file_path: string;
  source_title: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

// Interop types

export interface AiExportPayload {
  version: string;
  app: string;
  exported_at: string;
  sources: SourceExport[];
  conversations: ConversationExport[];
}

export interface SourceExport {
  title: string;
  description: string;
  source_type: string;
  config: Record<string, any>;
  document_count: number;
  chunk_count: number;
}

export interface ConversationExport {
  title: string;
  model?: string;
  provider?: string;
  messages: MessageExport[];
  created_at: string;
}

export interface MessageExport {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: RetrievalResult[];
  model?: string;
  created_at: string;
}

// API response

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
}

// Create/Update inputs

export interface CreateSourceInput {
  title: string;
  description?: string;
  source_type: "directory" | "url";
  config: Record<string, any>;
}

export interface UpdateSourceInput {
  title?: string;
  description?: string;
  config?: Record<string, any>;
}

export interface CreateConversationInput {
  title?: string;
}

export interface SendMessageInput {
  content: string;
  source_ids?: string[];
}

// Sync types

export interface SyncRepo {
  id: string;
  title: string;
  repo_url: string;
  branch: string;
  github_token?: string;
  auto_sync: boolean;
  sync_interval_hours: number;
  status: "pending" | "syncing" | "synced" | "error";
  source_id?: string;
  last_commit_hash?: string;
  last_synced_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface SyncHistory {
  id: string;
  repo_id: string;
  status: "running" | "success" | "error";
  commit_hash?: string;
  files_changed: number;
  files_added: number;
  files_modified: number;
  files_removed: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface SyncSchedule {
  enabled: boolean;
  cron_expression: string;
  last_run_at: string | null;
  next_run_at: string | null;
}

export interface CreateSyncRepoInput {
  title: string;
  repo_url: string;
  branch?: string;
  github_token?: string;
  auto_sync?: boolean;
  sync_interval_hours?: number;
}

export interface UpdateSyncRepoInput {
  title?: string;
  branch?: string;
  github_token?: string;
  auto_sync?: boolean;
  sync_interval_hours?: number;
}
