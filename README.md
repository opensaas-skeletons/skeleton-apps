# Skeleton Apps

A monorepo containing three independent full-stack SaaS starter apps built with a shared architecture. Each app is self-contained, production-ready, and designed for AI-assisted development.

| App | Description | Ports |
|-----|-------------|-------|
| [skeleton-tasks](./skeleton-tasks/) | Kanban board task tracker with drag-and-drop, priorities, and labels | DB: 5432, API: 3001, UI: 5173 |
| [skeleton-automation](./skeleton-automation/) | Workflow automation engine with triggers, conditions, and actions | DB: 5433, API: 3002, UI: 5174 |
| [skeleton-database](./skeleton-database/) | Spreadsheet/database tool with typed fields, views, and CSV import | DB: 5434, API: 3003, UI: 5175 |

## Tech Stack

All three apps share the same core stack:

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL 16
- **DevOps:** Docker Compose, npm workspaces

Each app is structured as an npm workspace monorepo with three packages:

```
app/
├── shared/   # Types and constants
├── server/   # Express API
└── client/   # React frontend
```

## Quick Start

Each app runs independently. Pick one and:

```bash
cd skeleton-tasks  # or skeleton-automation, skeleton-database

# Start with Docker (recommended)
docker compose up --build

# Or run locally
npm install
npm run migrate
npm run seed
npm run dev
```

## Interoperability

All three apps implement the **Open SaaS Interop Standard** — a JSON export/import format that enables data portability between apps. Each app exposes Export and Import buttons in its header.

## Documentation

Each app includes its own detailed documentation:

- `README.md` — Quick start and project overview
- `ARCHITECTURE.md` — System design, database schema, request flows
- `LLM-GUIDE.md` — Guide for AI-assisted development with recipes
- `INTEROP-STANDARD.md` — Export/import format specification

## License

MIT
