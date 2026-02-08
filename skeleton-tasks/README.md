# Skeleton Tasks

A full-stack Kanban task tracker built as part of the **Open SaaS Skeletons** series. Designed to be forked, customized, and extended by developers (and LLMs) into production-ready SaaS applications.

## Quick Start (Docker)

```bash
docker-compose up --build
```

- App: http://localhost:5173
- API: http://localhost:3001
- Database: PostgreSQL on port 5432

That's it. The database is created, migrated, and seeded automatically.

## Manual Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm 9+

### Steps

```bash
# 1. Install dependencies (from project root)
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Create the database
createdb skeleton_tasks

# 4. Run migrations
npm run migrate

# 5. Seed sample data
npm run seed

# 6. Start development servers
npm run dev
```

The client runs on http://localhost:5173 and proxies API requests to http://localhost:3001.

## Project Structure

```
skeleton-tasks/
├── shared/                  # Shared types and constants (npm workspace)
│   ├── types/task.ts        # Core TypeScript interfaces
│   ├── constants.ts         # Shared constants
│   └── index.ts             # Barrel exports
├── server/                  # Express API server
│   ├── src/
│   │   ├── db/              # Database connection, migrations, seed
│   │   ├── routes/          # REST API endpoints
│   │   ├── services/        # Business logic layer
│   │   ├── middleware/       # Auth (placeholder) and other middleware
│   │   ├── errors.ts        # Custom error classes
│   │   └── index.ts         # Express app setup
│   ├── Dockerfile
│   └── package.json
├── client/                  # React frontend
│   ├── src/
│   │   ├── api/client.ts    # API client wrapper
│   │   ├── components/      # React components (Board, Column, TaskCard, etc.)
│   │   ├── hooks/           # Custom hooks (useBoard)
│   │   ├── styles/          # Global CSS
│   │   ├── App.tsx          # Root component
│   │   └── main.tsx         # Entry point
│   ├── Dockerfile
│   └── package.json
├── tests/                   # Integration tests
├── docs/                    # Additional documentation
├── docker-compose.yml       # Full-stack orchestration
├── package.json             # Monorepo root (npm workspaces)
└── .env.example             # Environment variable template
```

## How to Customize

This skeleton is designed to be extended. Common customizations:

1. **Change the columns** — Edit `shared/constants.ts` to modify `DEFAULT_COLUMNS`
2. **Add task fields** — Use the `metadata` field on tasks (no schema changes needed)
3. **Add authentication** — Implement the placeholder in `server/src/middleware/auth.ts`
4. **Change the theme** — Modify `client/tailwind.config.js`
5. **Add new API endpoints** — Follow the pattern in `server/src/routes/`

See [docs/customization-guide.md](docs/customization-guide.md) for detailed recipes.

## Interop Standard

Skeleton Tasks implements the **Open SaaS Task Standard v1.0**, enabling data portability between any skeleton-based task tracker. Export your boards as JSON and import them into any compatible application.

See [INTEROP-STANDARD.md](INTEROP-STANDARD.md) for the full specification.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — System design and request flows
- [LLM-GUIDE.md](LLM-GUIDE.md) — Guide for AI-assisted development
- [INTEROP-STANDARD.md](INTEROP-STANDARD.md) — Data portability specification
- [CHANGELOG.md](CHANGELOG.md) — Version history
- [docs/customization-guide.md](docs/customization-guide.md) — Theme, columns, and UI customization
- [docs/deployment-guide.md](docs/deployment-guide.md) — Production deployment
- [docs/adding-features.md](docs/adding-features.md) — Adding endpoints, components, and tables

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT — see [LICENSE](LICENSE) for details.
