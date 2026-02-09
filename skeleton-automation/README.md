# Skeleton Automation

A self-hosted workflow automation engine — the open-source alternative to Zapier, Make, and n8n. Part of the **Skeleton** open SaaS ecosystem.

## What It Does

Users define workflows as **TRIGGER → CONDITION → ACTION** chains:

- "When a task moves to Done in skeleton-tasks → send an email notification"
- "When a new contact is added in skeleton-crm → create a task in skeleton-tasks"
- "Every Monday at 9am → create a weekly report task"

## Quick Start

### Docker (Recommended)

```bash
docker-compose up --build
```

Then open **http://YOUR_SERVER_IP:5174** in your browser.

> **Remote Access:** This app is configured for remote access. The Vite dev server binds to `0.0.0.0` and CORS allows all origins in development. Replace `YOUR_SERVER_IP` with your server's IP address or hostname.

### Local Development

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5174
- API: http://localhost:3002
- Database: PostgreSQL on port 5433

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `skeleton_automation` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `PORT` | `3002` | API server port |
| `CORS_ORIGIN` | `*` | Allowed CORS origins (`*` for dev) |
| `REDIS_URL` | `redis://localhost:6379` | Redis URL for job queue |
| `SEED_ON_START` | `true` | Seed demo data on startup |

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 16
- **Scheduler:** node-cron for cron-based triggers
- **Deployment:** Docker + Docker Compose

## Project Structure

```
skeleton-automation/
├── shared/          # Shared types & constants (npm workspace)
├── server/          # Express API server
│   └── src/
│       ├── db/          # Database connection, migrations, seed
│       ├── routes/      # API route handlers
│       ├── services/    # Business logic
│       └── middleware/   # Auth placeholder
├── client/          # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # React hooks
│       ├── api/         # API client
│       └── styles/      # Tailwind globals
└── docs/            # Documentation
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/workflows` | List all workflows |
| `POST` | `/api/workflows` | Create a workflow |
| `GET` | `/api/workflows/:id` | Get workflow + recent runs |
| `PUT` | `/api/workflows/:id` | Update a workflow |
| `DELETE` | `/api/workflows/:id` | Delete a workflow |
| `POST` | `/api/workflows/:id/trigger` | Manually trigger a workflow |
| `GET` | `/api/workflows/:id/runs` | List runs for a workflow |
| `GET` | `/api/runs/:id` | Get run details |
| `POST` | `/api/hooks/:path` | Webhook receiver |
| `GET` | `/api/export` | Export all workflows |
| `POST` | `/api/import` | Import workflows |
| `GET` | `/api/health` | Health check |

## Built-in Trigger Types

- **Webhook** — receives HTTP POST at a generated URL
- **Schedule** — cron-based scheduling (every hour, daily, weekly, custom)
- **Event** — listens for events from other skeleton apps (via webhook subscription)

## Built-in Action Types

- **HTTP Request** — make a request to any URL
- **Email** — send an email notification (via SMTP config)
- **Webhook** — POST to a URL with custom payload
- **Transform** — transform data between steps using a JS expression
- **Delay** — wait N seconds before continuing

## Seed Data

Three demo workflows are included:

1. **Daily Standup Reminder** — Schedule trigger (9am weekdays) → HTTP action
2. **New Task Alert** — Webhook trigger → Email action (with conditions)
3. **Weekly Cleanup** — Schedule trigger (Fridays 5pm) → HTTP action (disabled)

## Cross-Skeleton Connection

See [docs/CROSS-SKELETON.md](docs/CROSS-SKELETON.md) for how to connect skeleton-automation to skeleton-tasks and other skeleton apps.

## License

MIT
