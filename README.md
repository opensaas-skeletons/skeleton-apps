# Skeleton Apps

A collection of full-stack SaaS starter applications. Each app is a complete, working product that you can fork, customize, and build your own SaaS on top of — rather than starting from scratch.

All apps share the same architecture and tech stack, so patterns you learn in one transfer directly to the others.

## The Apps

| App | What It Is | Think Of It As |
|-----|-----------|----------------|
| [skeleton-tasks](./skeleton-tasks/) | Kanban board with drag-and-drop, priorities, labels, and assignments | A starting point for Trello/Linear |
| [skeleton-automation](./skeleton-automation/) | Workflow engine with triggers, conditions, scheduled jobs, and webhook actions | A starting point for Zapier/n8n |
| [skeleton-database](./skeleton-database/) | Spreadsheet/database with 13 field types, grid/form views, and CSV import | A starting point for Airtable/NocoDB |
| [skeleton-wiki](./skeleton-wiki/) | Wiki/knowledge base with Markdown pages, tree hierarchy, search, and version history | A starting point for Notion/Confluence |

## What You Get

Each app comes with:

- A working full-stack CRUD application you can use immediately
- React + Tailwind frontend with a polished UI
- Express REST API with service-layer architecture
- PostgreSQL database with migrations and seed data
- Docker Compose setup for one-command startup
- Auth middleware scaffolding (ready to plug in your auth provider)
- JSON export/import for data portability
- Detailed docs including an AI-assisted development guide (`LLM-GUIDE.md`)

The apps are designed to be read and modified. The codebases are intentionally straightforward — no deep abstraction layers, no framework magic.

## Quick Start

Each app runs independently. Pick one and:

```bash
cd skeleton-tasks  # or skeleton-automation, skeleton-database, skeleton-wiki

# Start with Docker (recommended)
docker compose up --build

# Or run locally
npm install
npm run migrate
npm run seed
npm run dev
```

| App | Database Port | API Port | UI Port |
|-----|--------------|----------|---------|
| skeleton-tasks | 5432 | 3001 | 5173 |
| skeleton-automation | 5433 | 3002 | 5174 |
| skeleton-database | 5434 | 3003 | 5175 |
| skeleton-wiki | 5435 | 3004 | 5176 |

## Tech Stack

All three apps use:

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL 16
- **DevOps:** Docker Compose, npm workspaces

Each app is structured as an npm workspace monorepo:

```
app/
├── shared/   # Types and constants (shared between server and client)
├── server/   # Express API
└── client/   # React frontend
```

## How the Apps Relate to Each Other

The apps are **independent**. They don't require each other to run and don't communicate out of the box. You can use just one, or all three.

### Data Portability (Export/Import)

All three apps implement a shared JSON export format with a common envelope:

```json
{
  "version": "1.0",
  "exported_at": "2026-01-15T10:30:00.000Z",
  "source": "skeleton-tasks",
  "boards": [...]
}
```

Each app has Export and Import buttons in its header. This is for backup, data migration, and moving data between instances — not live synchronization.

### Cross-App Automation (Manual Setup)

skeleton-automation can call the other apps' APIs via its HTTP/webhook actions. For example, you could create a workflow that:

- Creates a task in skeleton-tasks every Monday morning (scheduled trigger + HTTP action)
- Inserts a row in skeleton-database when a webhook is received

This requires manually configuring the target URLs and entity IDs in the workflow editor. There's no built-in connection UI or service discovery — the `CROSS-SKELETON.md` docs in each app provide recipes for setting this up.

### What's Not Built Yet

- The apps don't send events when data changes (no outbound webhooks from skeleton-tasks or skeleton-database)
- There's no UI for connecting apps to each other
- There's no real-time sync between apps

These are things you'd build as part of customizing the apps for your use case.

## Documentation

Each app includes its own detailed docs:

| File | What It Covers |
|------|---------------|
| `README.md` | Quick start, features, project structure |
| `ARCHITECTURE.md` | System design, database schema, request flows |
| `LLM-GUIDE.md` | Guide for AI-assisted development with step-by-step recipes |
| `INTEROP-STANDARD.md` | JSON export/import format specification |

## License

MIT
