# LLM Builder Guide

This guide is written FOR AI assistants and LLM-powered development tools. It explains the project structure, what's safe to modify, architecture patterns, and provides step-by-step recipes for common customizations.

---

## Section 1: Project Overview

**Skeleton AI** is a RAG-powered AI assistant designed to be forked and customized. It's part of the Open SaaS Skeletons series — production-ready starter projects that implement a common interoperability standard.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Express.js + TypeScript + tsx (dev runner) |
| Database | PostgreSQL 16 + pgvector |
| LLM | Ollama (local) / Anthropic / OpenAI |
| DevOps | Docker + Docker Compose + npm workspaces |

### How the Pieces Connect

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
                                   │   Ollama     │
                                   │   port 11434 │
                                   └──────────────┘
                                      LLM Engine
```

Data flows: **Client → API → Ollama/Database → API → Client**

The client makes REST API calls. The API server orchestrates between the database (pgvector for retrieval) and the LLM provider (Ollama/Anthropic/OpenAI for generation). Chat responses stream back via Server-Sent Events.

---

## Section 2: File Map

Every source file with its purpose and modification status:

### Shared Package (`shared/`)

| File | Description | Status |
|------|-------------|--------|
| `shared/index.ts` | Barrel exports for the package | SAFE TO MODIFY |
| `shared/constants.ts` | Model defaults, chunk sizes, file filters | SAFE TO MODIFY |
| `shared/types/ai.ts` | Core TypeScript interfaces | MODIFY WITH CARE |

**Note on `shared/types/ai.ts`:** You CAN add new interfaces and extend existing ones. You CANNOT rename, remove, or change the types of the core interop fields (`AiExportPayload`, `SourceExport`, `ConversationExport`, `MessageExport`) — these are the interop contract.

### Server (`server/src/`)

| File | Description | Status |
|------|-------------|--------|
| `server/src/index.ts` | Express app setup, middleware, route mounting | SAFE TO MODIFY |
| `server/src/errors.ts` | Custom error classes (AppError, NotFoundError, etc.) | SAFE TO MODIFY |
| `server/src/routes/sources.ts` | Source CRUD and ingestion trigger | SAFE TO MODIFY |
| `server/src/routes/documents.ts` | Document and chunk listing | SAFE TO MODIFY |
| `server/src/routes/conversations.ts` | Conversation CRUD | SAFE TO MODIFY |
| `server/src/routes/chat.ts` | Chat message endpoint (streaming) | SAFE TO MODIFY |
| `server/src/routes/search.ts` | Vector similarity search | SAFE TO MODIFY |
| `server/src/routes/settings.ts` | Settings CRUD | SAFE TO MODIFY |
| `server/src/routes/models.ts` | Provider and model listing | SAFE TO MODIFY |
| `server/src/routes/interop.ts` | Export/import endpoints | DO NOT MODIFY |
| `server/src/services/source.service.ts` | Source business logic | SAFE TO MODIFY |
| `server/src/services/conversation.service.ts` | Conversation business logic | SAFE TO MODIFY |
| `server/src/services/settings.service.ts` | Settings business logic | SAFE TO MODIFY |
| `server/src/services/retrieval.service.ts` | Vector search and context building | SAFE TO MODIFY |
| `server/src/services/ingestion/crawler.ts` | File system crawler | SAFE TO MODIFY |
| `server/src/services/ingestion/chunker.ts` | Text chunking (Markdown, code, default) | SAFE TO MODIFY |
| `server/src/services/ingestion/pipeline.ts` | Ingestion orchestrator | SAFE TO MODIFY |
| `server/src/services/llm/types.ts` | LLM provider interface | MODIFY WITH CARE |
| `server/src/services/llm/ollama.ts` | Ollama provider implementation | SAFE TO MODIFY |
| `server/src/services/llm/anthropic.ts` | Anthropic provider implementation | SAFE TO MODIFY |
| `server/src/services/llm/openai.ts` | OpenAI provider implementation | SAFE TO MODIFY |
| `server/src/services/llm/factory.ts` | Provider factory | SAFE TO MODIFY |
| `server/src/middleware/auth.ts` | Auth placeholder (implement here) | SAFE TO MODIFY |
| `server/src/db/connection.ts` | PostgreSQL connection pool | MODIFY WITH CARE |
| `server/src/db/migrate.ts` | Migration runner | MODIFY WITH CARE |
| `server/src/db/seed.ts` | Sample data and bundled docs seeding | SAFE TO MODIFY |
| `server/src/db/migrations/001_initial.ts` | Initial schema with pgvector | MODIFY WITH CARE |
| `server/src/db/migrations/002_sync_tables.ts` | Sync repos and history tables | MODIFY WITH CARE |
| `server/src/routes/sync.ts` | Sync API endpoints (repos, history, schedule) | SAFE TO MODIFY |
| `server/src/services/sync/sync.service.ts` | Sync orchestration (clone, pull, re-ingest) | SAFE TO MODIFY |
| `server/src/services/sync/git.service.ts` | Git operations wrapper (simple-git) | SAFE TO MODIFY |
| `server/src/services/sync/scheduler.service.ts` | Cron-based sync scheduler (node-cron) | SAFE TO MODIFY |

### Client (`client/src/`)

| File | Description | Status |
|------|-------------|--------|
| `client/src/main.tsx` | React entry point | SAFE TO MODIFY |
| `client/src/App.tsx` | Root component with routing | SAFE TO MODIFY |
| `client/src/api/client.ts` | API client wrapper functions | SAFE TO MODIFY |
| `client/src/contexts/ChatContext.tsx` | Chat state context provider | SAFE TO MODIFY |
| `client/src/hooks/useChat.ts` | Chat hook with streaming | SAFE TO MODIFY |
| `client/src/hooks/useSources.ts` | Sources data hook | SAFE TO MODIFY |
| `client/src/hooks/useSettings.ts` | Settings data hook | SAFE TO MODIFY |
| `client/src/components/Layout/Sidebar.tsx` | Navigation sidebar | SAFE TO MODIFY |
| `client/src/components/Layout/Header.tsx` | Top header bar | SAFE TO MODIFY |
| `client/src/components/Chat/ChatView.tsx` | Main chat interface | SAFE TO MODIFY |
| `client/src/components/Chat/MessageList.tsx` | Message display with markdown | SAFE TO MODIFY |
| `client/src/components/Chat/MessageInput.tsx` | Chat input with source selection | SAFE TO MODIFY |
| `client/src/components/Chat/MessageBubble.tsx` | Individual message rendering | SAFE TO MODIFY |
| `client/src/components/Chat/SourceCitations.tsx` | Citation display [1][2][3] | SAFE TO MODIFY |
| `client/src/components/Sources/SourceList.tsx` | Source management page | SAFE TO MODIFY |
| `client/src/components/Sources/SourceCard.tsx` | Individual source display | SAFE TO MODIFY |
| `client/src/components/Sources/AddSourceModal.tsx` | Create source dialog | SAFE TO MODIFY |
| `client/src/components/Settings/SettingsView.tsx` | Settings page | SAFE TO MODIFY |
| `client/src/components/Sync/SyncPage.tsx` | Sync management page (3 tabs) | SAFE TO MODIFY |
| `client/src/components/Sync/RepoList.tsx` | Repository list with status | SAFE TO MODIFY |
| `client/src/components/Sync/RepoForm.tsx` | Add/edit repository modal | SAFE TO MODIFY |
| `client/src/components/Sync/SyncHistory.tsx` | Sync event timeline | SAFE TO MODIFY |
| `client/src/components/Sync/ScheduleConfig.tsx` | Cron schedule configuration | SAFE TO MODIFY |
| `client/src/components/Sync/SyncStatusBar.tsx` | Sync status indicator | SAFE TO MODIFY |
| `client/src/hooks/useSync.ts` | Sync data hook | SAFE TO MODIFY |
| `client/src/api/sync.ts` | Sync API client | SAFE TO MODIFY |
| `client/src/components/Shared/MarkdownRenderer.tsx` | Markdown with syntax highlighting | SAFE TO MODIFY |
| `client/src/components/Shared/LoadingSpinner.tsx` | Loading indicator | SAFE TO MODIFY |
| `client/src/styles/globals.css` | Global styles and Tailwind imports | SAFE TO MODIFY |

### Configuration Files

| File | Description | Status |
|------|-------------|--------|
| `docker-compose.yml` | Docker orchestration with Ollama | SAFE TO MODIFY |
| `client/vite.config.ts` | Vite configuration | SAFE TO MODIFY |
| `client/tailwind.config.js` | Tailwind theme customization | SAFE TO MODIFY |
| `server/tsconfig.json` | Server TypeScript config | MODIFY WITH CARE |
| `client/tsconfig.json` | Client TypeScript config | MODIFY WITH CARE |

---

## Section 3: Architecture Patterns

### Route → Service → Database Pattern

All API endpoints follow this pattern:

```
HTTP Request
    ↓
Route Handler (routes/*.ts)
    - Validates request data
    - Extracts parameters
    - Calls service function
    - Formats response
    ↓
Service Function (services/*.ts)
    - Contains business logic
    - Calls database queries
    - Throws errors for invalid operations
    ↓
Database Query (db/connection.ts)
    - Executes SQL
    - Returns rows
```

**Example flow for creating a source:**

```typescript
// Route: POST /api/sources
router.post("/", async (req, res, next) => {
  try {
    const source = await sourceService.createSource(req.body);
    res.status(201).json({ success: true, data: source });
  } catch (err) {
    next(err);
  }
});

// Service: createSource
export async function createSource(input: CreateSourceInput): Promise<Source> {
  return queryOne(
    `INSERT INTO sources (title, description, source_type, config, status)
     VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
    [input.title, input.description || "", input.source_type, JSON.stringify(input.config)]
  );
}
```

### RAG Pipeline Flow

```
1. User sends message
    ↓
2. Embed user query → 384-dim vector
    ↓
3. pgvector similarity search → top_k chunks
    ↓
4. Build prompt:
   System: "You are a helpful assistant. Use these sources..."
   [1] file.ts: chunk content...
   [2] file.md: chunk content...
   User: original question
    ↓
5. Stream LLM response → SSE tokens
    ↓
6. Save message with source citations
```

### Streaming Pattern (Server-Sent Events)

```typescript
// Server: Set up SSE
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

// Stream tokens
for await (const token of provider.chat(messages, options)) {
  res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);
}

// Send sources and done
res.write(`data: ${JSON.stringify({ type: "sources", sources: results })}\n\n`);
res.write(`data: ${JSON.stringify({ type: "done", model })}\n\n`);
res.end();
```

```typescript
// Client: Consume SSE
const response = await fetch(url, { method: "POST", body, headers });
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  // Parse SSE data lines and update UI
}
```

### Provider Abstraction

```typescript
// All providers implement this interface
interface LLMProvider {
  chat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<string>;
  embed(texts: string[]): Promise<number[][]>;
  listModels(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
}

// Factory selects provider based on settings
function getProvider(providerName: string): LLMProvider {
  switch (providerName) {
    case "ollama": return new OllamaProvider();
    case "anthropic": return new AnthropicProvider();
    case "openai": return new OpenAIProvider();
    default: return new OllamaProvider();
  }
}
```

---

## Section 4: Customization Recipes

### Recipe 1: Adding a New LLM Provider

**Goal:** Add support for a new LLM provider (e.g., Google Gemini).

**Files to create/modify:**
- `server/src/services/llm/gemini.ts` (new)
- `server/src/services/llm/factory.ts` (add case)
- `shared/constants.ts` (add to PROVIDER_NAMES)

**Step 1: Create provider implementation**
```typescript
// server/src/services/llm/gemini.ts
import { LLMProvider } from "./types";
import { ChatMessage, ChatOptions } from "@skeleton-ai/shared";

export class GeminiProvider implements LLMProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  async *chat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${options.model}:streamGenerateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          }))
        })
      }
    );
    // Parse streaming response and yield tokens
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Use Ollama for embeddings (local, free)
    throw new Error("Use Ollama for embeddings");
  }

  async listModels(): Promise<string[]> {
    return ["gemini-pro", "gemini-pro-vision"];
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
```

**Step 2: Register in factory**
```typescript
// In factory.ts:
case "gemini": return new GeminiProvider();
```

**Step 3: Add provider name**
```typescript
// In shared/constants.ts:
export const PROVIDER_NAMES = {
  ollama: "Ollama (Local)",
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Google Gemini",
} as const;
```

---

### Recipe 2: Adding Conversation Memory/Context Window

**Goal:** Include previous conversation messages as context for the LLM.

**Files to modify:**
- `server/src/routes/chat.ts`
- `server/src/services/conversation.service.ts`

**Step 1: Fetch conversation history**
```typescript
// In conversation.service.ts:
export async function getRecentMessages(
  conversationId: string,
  limit: number = 10
): Promise<Message[]> {
  return query(
    `SELECT * FROM messages WHERE conversation_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [conversationId, limit]
  );
}
```

**Step 2: Include in chat prompt**
```typescript
// In the chat route, before calling the LLM:
const history = await conversationService.getRecentMessages(conversationId, 10);
const messages = [
  { role: "system", content: systemPrompt },
  ...history.reverse().map(m => ({ role: m.role, content: m.content })),
  { role: "user", content: userMessage }
];
```

---

### Recipe 3: Adding Web Search Capability

**Goal:** Allow the assistant to search the web for information.

**Files to create/modify:**
- `server/src/services/web-search.service.ts` (new)
- `server/src/routes/chat.ts` (integrate)

**Step 1: Create web search service**
```typescript
// server/src/services/web-search.service.ts
export async function searchWeb(query: string): Promise<SearchResult[]> {
  // Use a search API (SerpAPI, Brave Search, etc.)
  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
    { headers: { "X-Subscription-Token": process.env.BRAVE_API_KEY! } }
  );
  const data = await response.json();
  return data.web.results.map(r => ({
    title: r.title,
    url: r.url,
    snippet: r.description
  }));
}
```

**Step 2: Detect when web search is needed**
```typescript
// In chat route: Check if user explicitly asks or if no relevant local sources found
if (retrievalResults.length === 0 || userMessage.includes("/web")) {
  const webResults = await searchWeb(userMessage);
  // Add web results to context alongside local sources
}
```

---

### Recipe 4: Adding Image Understanding

**Goal:** Allow users to upload images for multimodal analysis.

**Files to create/modify:**
- `server/src/routes/chat.ts` (handle image uploads)
- `client/src/components/Chat/MessageInput.tsx` (add image upload)
- `server/src/services/llm/ollama.ts` (pass images to model)

**Step 1: Add image upload endpoint**
```typescript
// Use multer for file uploads
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

router.post("/:id/messages", upload.single("image"), async (req, res) => {
  const image = req.file ? req.file.buffer.toString("base64") : undefined;
  // Pass image to LLM provider
});
```

**Step 2: Update Ollama provider for multimodal**
```typescript
// In ollama.ts chat method:
if (options.images) {
  body.images = options.images; // base64 encoded
  body.model = "llava"; // Use multimodal model
}
```

---

### Recipe 5: Adding User Feedback/Ratings

**Goal:** Thumbs up/down on assistant messages.

**Files to create/modify:**
- `server/src/db/migrations/002_add_feedback.ts` (new)
- `server/src/routes/conversations.ts` (add endpoint)
- `client/src/components/Chat/MessageBubble.tsx` (add buttons)

**Step 1: Add feedback column to messages**
```sql
ALTER TABLE messages ADD COLUMN feedback VARCHAR(10);
-- Values: 'positive', 'negative', NULL
```

**Step 2: Add feedback endpoint**
```typescript
router.put("/messages/:id/feedback", async (req, res, next) => {
  try {
    const { feedback } = req.body; // "positive" or "negative"
    await query("UPDATE messages SET feedback = $1 WHERE id = $2", [feedback, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});
```

**Step 3: Add UI buttons**
```tsx
// In MessageBubble.tsx for assistant messages:
<div className="flex gap-1 mt-1">
  <button onClick={() => onFeedback(message.id, "positive")}>
    {message.feedback === "positive" ? "Filled Thumb Up" : "Outline Thumb Up"}
  </button>
  <button onClick={() => onFeedback(message.id, "negative")}>
    {message.feedback === "negative" ? "Filled Thumb Down" : "Outline Thumb Down"}
  </button>
</div>
```

---

### Recipe 6: Adding URL/PDF Ingestion

**Goal:** Ingest content from web URLs and PDF files.

**Files to create/modify:**
- `server/src/services/ingestion/url-crawler.ts` (new)
- `server/src/services/ingestion/pdf-parser.ts` (new)
- `server/src/services/ingestion/pipeline.ts` (add handlers)

**Step 1: Install dependencies**
```bash
cd server
npm install pdf-parse cheerio
npm install -D @types/cheerio
```

**Step 2: Create URL crawler**
```typescript
// server/src/services/ingestion/url-crawler.ts
import * as cheerio from "cheerio";

export async function crawlUrl(url: string): Promise<CrawledFile[]> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract main content, strip nav/footer/scripts
  $("script, style, nav, footer, header").remove();
  const content = $("main, article, .content, body").first().text().trim();

  return [{ path: url, content, fileType: ".html" }];
}
```

**Step 3: Create PDF parser**
```typescript
// server/src/services/ingestion/pdf-parser.ts
import pdfParse from "pdf-parse";
import fs from "fs";

export async function parsePdf(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}
```

**Step 4: Update pipeline**
```typescript
// In pipeline.ts, add source_type handling:
if (source.source_type === "url") {
  files = await crawlUrl(source.config.url);
} else {
  files = await crawlDirectory(source.config.path);
}
```

---

### Recipe 7: Adding Agent Capabilities

**Goal:** Give the assistant tool-use abilities (file reading, code execution).

**Files to create/modify:**
- `server/src/services/tools/` (new directory)
- `server/src/services/tools/registry.ts` (new)
- `server/src/services/tools/file-reader.ts` (new)
- `server/src/routes/chat.ts` (integrate tool loop)

**Step 1: Define tool interface**
```typescript
// server/src/services/tools/registry.ts
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute(params: any): Promise<string>;
}

const tools: Tool[] = [];

export function registerTool(tool: Tool) {
  tools.push(tool);
}

export function getTools() {
  return tools;
}
```

**Step 2: Create a tool**
```typescript
// server/src/services/tools/file-reader.ts
import { registerTool } from "./registry";
import fs from "fs/promises";

registerTool({
  name: "read_file",
  description: "Read the contents of a file",
  parameters: { path: { type: "string", description: "File path" } },
  execute: async ({ path }) => {
    return await fs.readFile(path, "utf-8");
  }
});
```

**Step 3: Add tool loop to chat**
```typescript
// In chat route: After LLM response, check for tool calls
// Re-send with tool results until LLM produces a final response
while (response.tool_calls) {
  const results = await Promise.all(
    response.tool_calls.map(tc => executeool(tc.name, tc.params))
  );
  messages.push({ role: "tool", content: JSON.stringify(results) });
  response = await provider.chat(messages, options);
}
```

---

### Recipe 8: Adding Role-Based Access

**Goal:** Different users see different sources and conversations.

**Files to create/modify:**
- `server/src/db/migrations/002_add_users.ts` (new)
- `server/src/middleware/auth.ts` (implement)
- `server/src/routes/*.ts` (add user filtering)

**Step 1: Add user_id columns**
```sql
ALTER TABLE sources ADD COLUMN user_id UUID REFERENCES users(id);
ALTER TABLE conversations ADD COLUMN user_id UUID REFERENCES users(id);
```

**Step 2: Filter queries by user**
```typescript
// In source.service.ts:
export async function listSources(userId: string): Promise<Source[]> {
  return query("SELECT * FROM sources WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
}
```

**Step 3: Extract user from auth middleware**
```typescript
// In auth.ts:
const decoded = verifyToken(token);
req.userId = decoded.userId;
// Pass to service: sourceService.listSources(req.userId)
```

---

## Section 5: Rules

1. **Always use TypeScript strict mode** — No implicit any, strict null checks enabled.

2. **Add header comments to new files** — Explain what the file does and whether it's safe to modify:
   ```typescript
   /**
    * Gemini LLM Provider
    * ====================
    * Google Gemini API integration.
    *
    * SAFE TO MODIFY
    */
   ```

3. **Never modify core interop types** — The `AiExportPayload`, `SourceExport`, `ConversationExport`, and `MessageExport` interfaces in `shared/types/ai.ts` are the interop contract.

4. **Never modify `server/src/routes/interop.ts`** — This implements the standard. Breaking it breaks compatibility with other skeleton apps.

5. **Follow the route → service → db pattern** — Routes handle HTTP, services handle business logic, database queries are isolated.

6. **Keep the codebase small** — If a feature requires more than ~5 new files, reconsider the approach.

7. **Test the export/import round-trip** — After any data model changes:
   ```bash
   curl http://localhost:3006/api/export > backup.json
   # Make changes
   curl -X POST http://localhost:3006/api/import -H "Content-Type: application/json" -d @backup.json
   # Verify data integrity
   ```

8. **Use the error classes** — Throw `NotFoundError`, `ValidationError`, `ConflictError` from services. The global error handler will format them correctly.

9. **Embeddings always use Ollama** — Even when chat uses Anthropic or OpenAI, embeddings use the local Ollama instance for consistency and cost savings.

10. **Use UUID primary keys** — All tables use `uuid_generate_v4()`. Don't use auto-incrementing integers.
