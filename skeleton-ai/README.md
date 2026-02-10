# Skeleton AI

A RAG-powered AI assistant built as part of the **Open SaaS Skeletons** series. Designed to be forked, customized, and extended by developers (and LLMs) into production-ready SaaS applications.

## Quick Start (Docker)

```bash
docker-compose up --build
```

- App: http://localhost:5178
- API: http://localhost:3006
- Database: PostgreSQL on port 5437
- Ollama: http://localhost:11434

That's it. The database is created, migrated, and seeded automatically. Ollama models are pulled on first startup.

## Manual Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ with pgvector extension
- Ollama (for local LLM inference)
- npm 9+

### Steps

```bash
# 1. Install dependencies (from project root)
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Create the database
createdb skeleton_ai

# 4. Run migrations
npm run migrate

# 5. Install and start Ollama, then pull models
ollama pull llama3.2
ollama pull all-minilm

# 6. Start development servers
npm run dev
```

The client runs on http://localhost:5178 and proxies API requests to http://localhost:3006.

## Features

- **Local LLM via Ollama** — No API keys needed out of the box
- **RAG with pgvector** — Retrieval-augmented generation using PostgreSQL vector similarity search
- **Multi-provider support** — Ollama (local), Anthropic, and OpenAI
- **Streaming chat** — Real-time token streaming via Server-Sent Events
- **Source management & ingestion** — Add directory sources, auto-crawl and chunk files
- **Markdown rendering with code highlighting** — Rich message display with syntax highlighting
- **Citation tracking** — Source references with [1][2][3] notation linked to retrieved chunks
- **GitHub repo sync** — Auto-clone and sync GitHub repos with scheduled re-ingestion
- **Export/import interop** — AI Assistant Interop Standard v1.0

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Express.js + TypeScript + tsx (dev runner) |
| Database | PostgreSQL 16 + pgvector |
| LLM | Ollama (local) / Anthropic / OpenAI |
| DevOps | Docker + Docker Compose + npm workspaces |

## Project Structure

```
skeleton-ai/
├── shared/                  # Shared types and constants (npm workspace)
│   ├── types/ai.ts          # Core TypeScript interfaces
│   ├── constants.ts         # Shared constants
│   └── index.ts             # Barrel exports
├── server/                  # Express API server
│   ├── src/
│   │   ├── db/              # Database connection, migrations, seed
│   │   ├── routes/          # REST API endpoints
│   │   ├── services/        # Business logic layer
│   │   │   ├── llm/         # LLM provider abstraction
│   │   │   ├── ingestion/   # File crawling, chunking, embedding
│   │   │   └── sync/        # GitHub repo sync and scheduling
│   │   ├── middleware/       # Auth (placeholder) and other middleware
│   │   ├── errors.ts        # Custom error classes
│   │   └── index.ts         # Express app setup
│   ├── Dockerfile
│   └── package.json
├── client/                  # React frontend
│   ├── src/
│   │   ├── api/client.ts    # API client wrapper
│   │   ├── components/      # React components
│   │   │   ├── Chat/        # Chat interface, message display
│   │   │   ├── Sources/     # Source management UI
│   │   │   ├── Settings/    # Provider and retrieval settings
│   │   │   ├── Sync/        # GitHub sync management
│   │   │   ├── Layout/      # Sidebar, header
│   │   │   └── Shared/      # Reusable UI components
│   │   ├── contexts/        # React context providers
│   │   ├── hooks/           # Custom hooks
│   │   ├── styles/          # Global CSS
│   │   ├── App.tsx          # Root component
│   │   └── main.tsx         # Entry point
│   ├── Dockerfile
│   └── package.json
├── data/
│   └── bundled-docs/        # Sample documentation for demo
├── docs/                    # Additional documentation
├── docker-compose.yml       # Full-stack orchestration
├── package.json             # Monorepo root (npm workspaces)
└── .env.example             # Environment variable template
```

## API Endpoints

### Sources

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sources` | List all sources |
| POST | `/api/sources` | Create a new source |
| GET | `/api/sources/:id` | Get source details |
| PUT | `/api/sources/:id` | Update a source |
| DELETE | `/api/sources/:id` | Delete a source |
| POST | `/api/sources/:id/ingest` | Trigger ingestion |

### Documents

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sources/:id/documents` | List documents for a source |
| GET | `/api/documents/:id/chunks` | List chunks for a document |

### Conversations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/conversations` | List all conversations |
| POST | `/api/conversations` | Create a new conversation |
| GET | `/api/conversations/:id` | Get conversation with messages |
| PUT | `/api/conversations/:id` | Update conversation title |
| DELETE | `/api/conversations/:id` | Delete a conversation |

### Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/conversations/:id/messages` | Send message (streaming SSE) |

### Search

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/search` | Vector similarity search |

### Settings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/settings` | Get current settings |
| PUT | `/api/settings` | Update settings |

### Models

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/models` | List available providers and models |

### Sync

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sync/repos` | List sync repositories |
| POST | `/api/sync/repos` | Add a repository |
| GET | `/api/sync/repos/:id` | Get repository details |
| PUT | `/api/sync/repos/:id` | Update a repository |
| DELETE | `/api/sync/repos/:id` | Delete a repository |
| POST | `/api/sync/repos/:id/sync` | Trigger sync |
| POST | `/api/sync/sync-all` | Sync all repositories |
| GET | `/api/sync/repos/:id/branches` | List branches |
| GET | `/api/sync/history` | List sync history |
| GET | `/api/sync/schedule` | Get sync schedule |
| PUT | `/api/sync/schedule` | Update sync schedule |
| GET | `/api/sync/status` | Get sync status |

### Interop

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/export` | Export all data |
| POST | `/api/import` | Import data |

## How to Customize

This skeleton is designed to be extended. Common customizations:

1. **Add web URL ingestion** — Crawl web pages and index their content
2. **Add PDF/DOCX parsing** — Extend the ingestion pipeline for binary formats
3. **Implement conversation branching** — Fork conversations at any point
4. **Add user authentication** — Implement the placeholder in `server/src/middleware/auth.ts`
5. **Add image understanding** — Use multimodal models for image analysis
6. **Build agent capabilities** — Tool use, function calling, multi-step reasoning
7. **Add semantic caching** — Cache similar queries to reduce LLM calls
8. **Implement hybrid search** — Combine BM25 full-text with vector similarity
9. **Add user feedback/ratings** — Thumbs up/down on responses for quality tracking
10. **Multi-tenant support** — Isolate data per user or organization

See [docs/customization-guide.md](docs/customization-guide.md) for detailed recipes.

## Interop Standard

Skeleton AI implements the **AI Assistant Interop Standard v1.0**, enabling data portability between any skeleton-based AI assistant. Export your sources and conversations as JSON and import them into any compatible application.

See [INTEROP-STANDARD.md](INTEROP-STANDARD.md) for the full specification.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — System design and request flows
- [LLM-GUIDE.md](LLM-GUIDE.md) — Guide for AI-assisted development
- [INTEROP-STANDARD.md](INTEROP-STANDARD.md) — Data portability specification
- [CHANGELOG.md](CHANGELOG.md) — Version history
- [docs/customization-guide.md](docs/customization-guide.md) — Theme, retrieval params, and UI customization
- [docs/deployment-guide.md](docs/deployment-guide.md) — Production deployment
- [docs/adding-features.md](docs/adding-features.md) — Adding endpoints, components, and tables

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT — see [LICENSE](LICENSE) for details.
