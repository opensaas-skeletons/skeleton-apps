# AI Assistant Interop Standard v1.0

This document specifies the data format for portable AI assistant data. Any application implementing this standard can export and import sources, conversations, and messages.

## Overview

The interop payload contains:
- **Sources** — Data sources with metadata (no actual content/embeddings, as those are regenerated on import)
- **Conversations** — Chat conversations with full message history and source citations

## JSON Schema

```json
{
  "version": "1.0",
  "app": "skeleton-ai",
  "exported_at": "2026-01-01T00:00:00.000Z",
  "sources": [
    {
      "title": "My Project",
      "description": "Project source code",
      "source_type": "directory",
      "config": { "path": "/path/to/project" },
      "document_count": 42,
      "chunk_count": 350
    }
  ],
  "conversations": [
    {
      "title": "Architecture Discussion",
      "model": "llama3.2",
      "provider": "ollama",
      "messages": [
        {
          "role": "user",
          "content": "How does the ingestion pipeline work?",
          "created_at": "2026-01-01T00:00:00.000Z"
        },
        {
          "role": "assistant",
          "content": "The ingestion pipeline works in several steps...",
          "sources": [
            {
              "chunk_id": "abc-123",
              "document_id": "def-456",
              "file_path": "server/src/services/ingestion/pipeline.ts",
              "source_title": "My Project",
              "content": "async function ingestSource...",
              "score": 0.92,
              "metadata": {}
            }
          ],
          "model": "llama3.2",
          "created_at": "2026-01-01T00:01:00.000Z"
        }
      ],
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

## TypeScript Interface

```typescript
interface AiExportPayload {
  version: string;        // "1.0"
  app: string;            // Application identifier
  exported_at: string;    // ISO 8601 timestamp
  sources: SourceExport[];
  conversations: ConversationExport[];
}

interface SourceExport {
  title: string;
  description: string;
  source_type: string;    // "directory" | "url"
  config: Record<string, any>;
  document_count: number;
  chunk_count: number;
}

interface ConversationExport {
  title: string;
  model?: string;
  provider?: string;
  messages: MessageExport[];
  created_at: string;
}

interface MessageExport {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: RetrievalResult[];
  model?: string;
  created_at: string;
}
```

## Export Endpoint

```
GET /api/export
```

Returns the full `AiExportPayload` JSON.

**Behavior:**
- Exports all sources with metadata (title, description, type, config, counts)
- Exports all conversations with their complete message history
- Messages include source citations if they were retrieved during chat
- Does NOT export raw documents, chunks, or embeddings (those are regenerated on import via re-ingestion)

## Import Endpoint

```
POST /api/import
Content-Type: application/json
Body: AiExportPayload
```

**Behavior:**
1. Validates the `version` field
2. For each source:
   - Creates a new source record with status "pending"
   - Does NOT automatically trigger ingestion (sources must be re-ingested manually if the directory is available)
3. For each conversation:
   - Creates a new conversation record
   - Creates all message records in order
   - Preserves source citations as metadata
4. Returns counts of imported sources and conversations

## Design Decisions

### Why not export embeddings?

Embeddings are model-specific. If the importing application uses a different embedding model, the vectors would be incompatible. Re-ingesting from the original source ensures correct embeddings for the target system.

### Why export source citations in messages?

Source citations provide context about what information the assistant used. Even if the chunks don't exist in the new system, the citation metadata (file path, content snippet, score) helps users understand the assistant's reasoning.

### Why is source config included?

The config object (e.g., `{ "path": "/path/to/project" }`) allows the importing application to potentially re-configure and re-ingest the same source, provided the directory is accessible.
