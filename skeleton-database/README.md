# skeleton-database

Open-source spreadsheet/database tool -- Airtable/NocoDB alternative.

Build structured databases with typed fields, grid views with inline editing, form views for data entry, and a standard interop format for ecosystem compatibility.

## Features

- **Bases & Tables** -- Organize data into bases containing multiple tables, each with its own schema
- **13 Typed Fields** -- Text, Long Text, Number, Checkbox, Select, Multi Select, Date, Email, URL, Phone, Rating, Formula, Relation
- **Grid View** -- Spreadsheet-style view with inline cell editing and keyboard navigation (Tab, Enter, Arrow keys, Escape)
- **Form View** -- Structured data entry forms generated from table fields
- **JSONB Filtering, Sorting & Search** -- Server-side query engine operating on PostgreSQL JSONB columns
- **CSV Import/Export** -- Bulk import data from CSV files and export tables to CSV
- **Interop Standard v1.0** -- JSON-based export/import format for cross-skeleton ecosystem compatibility
- **Server-Side Pagination** -- 50 rows per page by default, configurable up to 500

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Client   | React 18 + Vite + Tailwind CSS   |
| Server   | Express + PostgreSQL              |
| Shared   | TypeScript monorepo (npm workspaces) |

## Quick Start

```bash
git clone https://github.com/open-saas-skeletons/skeleton-database.git
cd skeleton-database
docker compose up
```

The app will be available at:

| Service  | URL                        |
|----------|----------------------------|
| Client   | http://localhost:5175      |
| Server   | http://localhost:3003      |
| Database | postgresql://localhost:5434 |

## Project Structure

```
skeleton-database/
├── shared/                  # Shared TypeScript package
│   ├── types/
│   │   └── database.ts      # All entity, input, query, and response types
│   ├── constants.ts         # Field types, colors, defaults, pagination
│   ├── index.ts             # Package entry point
│   ├── package.json
│   └── tsconfig.json
├── server/
│   └── src/
│       ├── db/
│       │   ├── connection.ts    # PostgreSQL pool
│       │   └── migrations/
│       │       └── 001_initial.ts
│       ├── services/            # Business logic
│       │   ├── baseService.ts
│       │   ├── tableService.ts
│       │   ├── fieldService.ts
│       │   ├── rowService.ts
│       │   ├── viewService.ts
│       │   └── interopService.ts
│       ├── routes/              # Express route handlers
│       │   ├── baseRoutes.ts
│       │   ├── tableRoutes.ts
│       │   ├── fieldRoutes.ts
│       │   ├── rowRoutes.ts
│       │   ├── viewRoutes.ts
│       │   └── interopRoutes.ts
│       ├── middleware/
│       │   └── errorHandler.ts
│       └── index.ts
├── client/
│   └── src/
│       ├── api/                 # API client functions
│       ├── hooks/               # React query hooks
│       ├── components/          # UI components
│       │   ├── BaseList.tsx
│       │   ├── TableView.tsx
│       │   ├── GridView.tsx
│       │   ├── FormView.tsx
│       │   ├── FieldEditor.tsx
│       │   ├── CellRenderer.tsx
│       │   └── FilterBar.tsx
│       ├── App.tsx
│       └── main.tsx
├── docs/
│   └── CROSS-SKELETON.md
├── docker-compose.yml
├── package.json
├── ARCHITECTURE.md
├── LLM-GUIDE.md
├── INTEROP-STANDARD.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## Development

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)

### Setup

```bash
# Install dependencies
npm install

# Start the database
docker compose up db -d

# Run migrations
npm run migrate -w server

# Start development servers
npm run dev -w server &
npm run dev -w client
```

### Build

```bash
npm run build
```

This builds all three packages (shared, server, client) via npm workspaces.

### Environment Variables

Create a `.env` file in the server directory:

```
DATABASE_URL=postgresql://skeleton:skeleton@localhost:5434/skeleton_database
PORT=3003
```

## Interop

skeleton-database implements the Database Interop Standard v1.0 for ecosystem compatibility. Export any base as a portable JSON payload and import it into other skeleton apps or compatible tools.

See [INTEROP-STANDARD.md](./INTEROP-STANDARD.md) for the full specification.

### Export

```
GET /api/interop/export/:baseId
```

### Import

```
POST /api/interop/import
Content-Type: application/json

{ ...DatabaseExportPayload }
```

## Related Projects

- [skeleton-tasks](https://github.com/open-saas-skeletons/skeleton-tasks) -- Task management app
- [skeleton-automation](https://github.com/open-saas-skeletons/skeleton-automation) -- Workflow automation platform

See [docs/CROSS-SKELETON.md](./docs/CROSS-SKELETON.md) for integration details.

## License

[MIT](./LICENSE)
