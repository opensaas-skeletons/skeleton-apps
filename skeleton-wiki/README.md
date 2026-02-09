# Skeleton Wiki

**Open SaaS Skeleton** — A wiki / knowledge base application built with React, Express, PostgreSQL, and TypeScript.

Part of the [Open SaaS Skeletons](https://github.com/opensaas-skeletons) collection.

## Features

- **Pages** — Create and edit Markdown pages with a live editor
- **Hierarchy** — Organize pages in a tree structure with parent/child relationships
- **Wiki Links** — Link between pages using `[[Page Title]]` syntax with automatic backlink tracking
- **Search** — Full-text search powered by PostgreSQL GIN indexes with highlighted snippets
- **Version History** — Every edit creates a version; view and compare past versions
- **Workspaces** — Separate knowledge bases with isolated pages and settings
- **Pinning & Ordering** — Pin important pages to the top, reorder via drag
- **Import/Export** — Interop-standard JSON format for ecosystem compatibility

## Quick Start

```bash
# Clone and start with Docker
docker compose up --build

# Access the app
# UI:  http://localhost:5176
# API: http://localhost:3004
# DB:  localhost:5435
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL 16 |
| Build | Vite 5 |

## Project Structure

```
skeleton-wiki/
├── shared/          # Shared types and constants
├── server/          # Express API server
│   └── src/
│       ├── db/      # Database connection, migrations, seed
│       ├── services/ # Business logic
│       ├── routes/  # API endpoints
│       └── middleware/ # Auth
├── client/          # React SPA
│   └── src/
│       ├── api/     # API client
│       ├── hooks/   # React hooks
│       └── components/ # UI components
└── docs/            # Documentation
```

## Ports

| Service | Port |
|---------|------|
| Database | 5435 |
| API Server | 3004 |
| UI Client | 5176 |

## License

MIT
