# Architecture

## System Overview

```
┌──────────────┐     HTTP/JSON     ┌──────────────┐     SQL      ┌──────────────┐
│              │ <───────────────> │              │ <──────────> │  PostgreSQL   │
│  React App   │    REST API       │  Express API │   pg driver  │  + pgvector   │
│  (Vite)      │    port 5178      │  Server      │   port 5437  │              │
│              │    proxy → 3006   │  port 3006   │              │              │
└──────────────┘                   └──────┬───────┘              └──────────────┘
     Client                               │                        Database
                                          │ HTTP
                                          ▼
                                   ┌──────────────┐
                                   │              │
                                   │   Ollama     │
                                   │   port 11434 │
                                   │              │
                                   └──────────────┘
                                      LLM Engine
```

Data flows:
- **Chat**: Client → API → Ollama (LLM) → API → Client (streamed via SSE)
- **Ingestion**: Client → API → File System → Chunker → Ollama (Embeddings) → pgvector
- **Search**: Client → API → Ollama (Embed query) → pgvector (similarity search) → API → Client

## Database Schema

### sources
Tracks data sources that can be ingested (directories, URLs).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| title | VARCHAR(255) | Display name |
| description | TEXT | Optional description |
| source_type | VARCHAR(50) | "directory" or "url" |
| config | JSONB | Source-specific configuration (path, etc.) |
| status | VARCHAR(50) | pending, ingesting, ready, error |
| document_count | INTEGER | Number of documents |
| chunk_count | INTEGER | Number of chunks |
| error_message | TEXT | Last error message |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### documents
Individual files or pages within a source.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| source_id | UUID (FK) | Parent source |
| file_path | TEXT | Path relative to source root |
| file_type | VARCHAR(50) | File extension (.md, .ts, etc.) |
| content_hash | VARCHAR(64) | SHA-256 of content (for change detection) |
| chunk_count | INTEGER | Number of chunks |
| metadata | JSONB | File metadata (size, lines, etc.) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### chunks
Text chunks with vector embeddings for similarity search.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| document_id | UUID (FK) | Parent document |
| content | TEXT | Chunk text content |
| chunk_index | INTEGER | Position within document |
| metadata | JSONB | Chunk metadata (line range, heading, etc.) |
| embedding | vector(384) | pgvector embedding |
| created_at | TIMESTAMPTZ | Creation timestamp |

Index: `ivfflat (embedding vector_cosine_ops)` for fast similarity search.

### conversations
Chat conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| title | VARCHAR(255) | Conversation title |
| model | VARCHAR(255) | Model used |
| provider | VARCHAR(255) | Provider used |
| message_count | INTEGER | Number of messages |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### messages
Individual messages within conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| conversation_id | UUID (FK) | Parent conversation |
| role | VARCHAR(50) | user, assistant, or system |
| content | TEXT | Message content |
| sources | JSONB | Retrieved source chunks |
| model | VARCHAR(255) | Model that generated this |
| tokens_used | INTEGER | Token count |
| created_at | TIMESTAMPTZ | Creation timestamp |

### settings
Application configuration (single row).

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Always 1 |
| provider | VARCHAR(255) | Active LLM provider |
| chat_model | VARCHAR(255) | Chat model name |
| embedding_model | VARCHAR(255) | Embedding model name |
| top_k | INTEGER | Number of chunks to retrieve |
| similarity_threshold | FLOAT | Minimum similarity score |
| temperature | FLOAT | LLM temperature |
| max_tokens | INTEGER | Max response tokens |
| system_prompt | TEXT | System prompt template |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Request Flows

### Ingestion Pipeline

```
POST /api/sources/:id/ingest
    │
    ▼
1. Update source status → "ingesting"
    │
    ▼
2. Crawl files from source path
   - Walk directory recursively
   - Filter by SUPPORTED_FILE_EXTENSIONS
   - Skip IGNORED_PATHS and IGNORED_FILES
   - Skip files > MAX_FILE_SIZE_BYTES
    │
    ▼
3. For each file:
   a. Compute content hash (SHA-256)
   b. Check if document exists with same hash (skip if unchanged)
   c. Chunk the content:
      - Markdown files: split on headings, then paragraphs
      - Code files: split on function/class boundaries
      - Default: split on paragraph boundaries
      - Target chunk size: DEFAULT_CHUNK_SIZE tokens
      - Overlap: CHUNK_OVERLAP tokens
    │
    ▼
4. Generate embeddings in batches
   - Send chunks to Ollama embedding endpoint
   - Batch size: EMBEDDING_BATCH_SIZE
   - Model: all-minilm (384 dimensions)
    │
    ▼
5. Store in database
   - Upsert documents (update if hash changed)
   - Insert chunks with embeddings
   - Remove documents no longer in source
    │
    ▼
6. Update source status → "ready"
   Update document_count, chunk_count
```

### Chat with Retrieval

```
POST /api/conversations/:id/messages
Body: { content: "How does the task service work?", source_ids: [...] }
    │
    ▼
1. Save user message to database
    │
    ▼
2. Embed the query
   - Send user message to Ollama embedding endpoint
   - Returns 384-dimension vector
    │
    ▼
3. Vector similarity search
   - Query pgvector: ORDER BY embedding <=> query_vector
   - Filter by source_ids if provided
   - Limit to top_k results
   - Filter by similarity_threshold
    │
    ▼
4. Build context prompt
   - System prompt + retrieved chunks as context
   - Format: "Use the following sources to answer...\n[1] file.ts: content..."
   - Include conversation history (last N messages)
    │
    ▼
5. Call LLM (streaming)
   - Send to Ollama/Anthropic/OpenAI
   - Stream tokens back via SSE
    │
    ▼
6. Save assistant message to database
   - Store content, sources, model, tokens_used
    │
    ▼
7. Return final SSE events
   - type: "sources" with retrieval results
   - type: "done" with model info
```

### Streaming Response

```
POST /api/conversations/:id/messages
    │
    ▼
Set headers: Content-Type: text/event-stream
    │
    ▼
For each token from LLM:
    data: {"type":"token","content":"Hello"}
    │
    ▼
After all tokens:
    data: {"type":"sources","sources":[...]}
    data: {"type":"done","model":"llama3.2"}
```

### Provider Switching

```
PUT /api/settings
Body: { provider: "anthropic", chat_model: "claude-sonnet-4-5-20250929" }
    │
    ▼
1. Validate provider is available
   - Check API key exists (for cloud providers)
   - Test connectivity
    │
    ▼
2. Update settings in database
    │
    ▼
3. Next chat request uses new provider
   - Provider factory creates appropriate client
   - Same interface: chat(messages, options) → stream
```

## LLM Provider Abstraction

The system uses a provider interface pattern to support multiple LLM backends:

```typescript
interface LLMProvider {
  chat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<string>;
  embed(texts: string[]): Promise<number[][]>;
  listModels(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
}
```

Implementations:
- **OllamaProvider** — Local inference via Ollama HTTP API
- **AnthropicProvider** — Anthropic Messages API (requires ANTHROPIC_API_KEY)
- **OpenAIProvider** — OpenAI Chat Completions API (requires OPENAI_API_KEY)

The provider factory selects the active provider based on the `settings.provider` value. Embedding always uses Ollama regardless of the chat provider, since Ollama runs locally and provides fast, free embeddings.
