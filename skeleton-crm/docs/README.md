# Skeleton CRM

**Open SaaS Skeleton** — A full-featured CRM (Customer Relationship Management) application built with React, Express, PostgreSQL, and TypeScript.

Part of the [Open SaaS Skeletons](https://github.com/nicholasgriffintn/open-saas-skeletons) collection.

## Features

- **Contacts** — Manage contacts with search, sort, CSV import, and company associations
- **Companies** — Track companies with industry, size, and linked contacts/deals
- **Deal Pipelines** — Kanban board with drag-and-drop, multiple pipelines, stage probabilities
- **Activities** — Log calls, emails, meetings, notes, and tasks tied to contacts/deals
- **Dashboard** — Analytics with pipeline funnel, win rates, activity breakdown
- **Import/Export** — Interop-standard JSON format for ecosystem compatibility

## Quick Start

```bash
# Clone and start with Docker
docker compose up --build

# Access the app
# UI:  http://localhost:5177
# API: http://localhost:3005
# DB:  localhost:5436
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL 16 |
| Build | Vite 5 |
| DnD | @dnd-kit |
| Charts | Recharts |

## Project Structure

```
skeleton-crm/
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

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET/POST | /api/contacts | List/create contacts |
| GET/PUT/DELETE | /api/contacts/:id | Get/update/delete contact |
| POST | /api/contacts/import | CSV import |
| GET/POST | /api/companies | List/create companies |
| GET/PUT/DELETE | /api/companies/:id | Get/update/delete company |
| GET/POST | /api/pipelines | List/create pipelines |
| GET/PUT/DELETE | /api/pipelines/:id | Get/update/delete pipeline |
| GET/POST | /api/deals | List/create deals |
| GET/PUT/DELETE | /api/deals/:id | Get/update/delete deal |
| PUT | /api/deals/:id/move | Move deal (DnD) |
| GET/POST | /api/activities | List/create activities |
| GET/PUT/DELETE | /api/activities/:id | Get/update/delete activity |
| GET | /api/dashboard/* | Dashboard analytics |
| GET/POST | /api/export, /api/import | Interop |

## Ports

| Service | Port |
|---------|------|
| Database | 5436 |
| API Server | 3005 |
| UI Client | 5177 |

## License

MIT
