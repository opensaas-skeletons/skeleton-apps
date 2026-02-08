# Architecture

## System Overview

```
┌──────────────┐     HTTP/JSON     ┌──────────────┐     SQL      ┌──────────────┐
│              │ ◄───────────────► │              │ ◄──────────► │              │
│  React App   │    REST API       │  Express API │   pg driver  │  PostgreSQL  │
│  (Vite)      │    port 5173      │  Server      │   port 5432  │  Database    │
│              │    proxy → 3001   │  port 3001   │              │              │
└──────────────┘                   └──────────────┘              └──────────────┘
     Client                             Server                      Database
```

### Technology Stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, @dnd-kit      |
| Backend  | Express.js, TypeScript, tsx (dev runner)                 |
| Database | PostgreSQL 16 with uuid-ossp extension                  |
| DevOps   | Docker, Docker Compose, npm workspaces                  |

## Database Schema

```
boards
├── id          UUID (PK)
├── title       VARCHAR(255)
├── description TEXT
├── created_at  TIMESTAMPTZ
└── updated_at  TIMESTAMPTZ

columns
├── id          UUID (PK)
├── board_id    UUID (FK → boards.id, CASCADE)
├── title       VARCHAR(255)
├── position    INTEGER
├── wip_limit   INTEGER (nullable)
├── color       VARCHAR(7) (nullable)
└── created_at  TIMESTAMPTZ

tasks
├── id          UUID (PK)
├── board_id    UUID (FK → boards.id, CASCADE)
├── column_id   UUID (FK → columns.id, CASCADE)
├── title       VARCHAR(500)
├── description TEXT
├── priority    VARCHAR(10) CHECK (low|medium|high|urgent)
├── assignee    VARCHAR(255) (nullable)
├── labels      JSONB (array of strings)
├── due_date    TIMESTAMPTZ (nullable)
├── position    INTEGER
├── metadata    JSONB (extensible key-value store)
├── created_at  TIMESTAMPTZ
└── updated_at  TIMESTAMPTZ
```

**Relationships:** boards → columns (1:N), columns → tasks (1:N), boards → tasks (1:N)

**Cascade deletes:** Deleting a board removes all its columns and tasks. Deleting a column removes its tasks.

## Request Flows

### Load Board

```
Client                    Server                     Database
  │                         │                           │
  │ GET /api/boards/:id     │                           │
  │────────────────────────►│                           │
  │                         │ SELECT * FROM boards      │
  │                         │──────────────────────────►│
  │                         │◄──────────────────────────│
  │                         │ SELECT * FROM columns     │
  │                         │──────────────────────────►│
  │                         │◄──────────────────────────│
  │                         │ SELECT * FROM tasks       │
  │                         │  (for each column)        │
  │                         │──────────────────────────►│
  │                         │◄──────────────────────────│
  │◄────────────────────────│                           │
  │  { board, columns,      │                           │
  │    tasks per column }   │                           │
```

### Create Task

```
Client                    Server                     Database
  │                         │                           │
  │ POST /api/boards/       │                           │
  │   :boardId/tasks        │                           │
  │────────────────────────►│                           │
  │                         │ Validate input            │
  │                         │ Get max position          │
  │                         │──────────────────────────►│
  │                         │◄──────────────────────────│
  │                         │ INSERT INTO tasks         │
  │                         │──────────────────────────►│
  │                         │◄──────────────────────────│
  │◄────────────────────────│                           │
  │  201 { task }           │                           │
  │                         │                           │
  │ GET /api/boards/:id     │ (refresh board)           │
  │────────────────────────►│                           │
```

### Drag-and-Drop Move

This is the most complex flow. The client uses **optimistic updates** for a snappy UX:

```
Client                    Server                     Database
  │                         │                           │
  │ (User drags card)       │                           │
  │ Optimistic update:      │                           │
  │ - Remove from old col   │                           │
  │ - Insert in new col     │                           │
  │ - Re-render immediately │                           │
  │                         │                           │
  │ PATCH /api/tasks/       │                           │
  │   :id/move              │                           │
  │────────────────────────►│                           │
  │                         │ BEGIN transaction         │
  │                         │──────────────────────────►│
  │                         │ Close gap in old column   │
  │                         │──────────────────────────►│
  │                         │ Open gap in new column    │
  │                         │──────────────────────────►│
  │                         │ UPDATE task position      │
  │                         │──────────────────────────►│
  │                         │ COMMIT                    │
  │                         │──────────────────────────►│
  │◄────────────────────────│                           │
  │  200 { task }           │                           │
  │                         │                           │
  │ (On error: rollback     │                           │
  │  optimistic update,     │                           │
  │  re-fetch board)        │                           │
```

## How the Interop System Works

### Export Flow

1. Client calls `GET /api/export`
2. Server loads all boards with their columns and tasks
3. Server transforms internal IDs to portable format:
   - Column references use `column_title` (string) instead of `column_id` (UUID)
   - Board/column/task IDs are stripped from the output
4. Returns `ExportPayload` JSON with version, timestamp, and source

### Import Flow

1. Client sends `POST /api/import` with an `ExportPayload` body
2. Server validates the payload structure (version, boards array)
3. For each board:
   - Creates the board with its columns
   - Builds a `column_title → column_id` map
   - Creates tasks, resolving `column_title` back to `column_id`
4. Returns count of imported boards

## Shared Types Architecture

The `shared/` directory is an npm workspace package (`@skeleton-tasks/shared`) used by both server and client:

- **Server** resolves it via TypeScript path aliases (`@shared/*`) and relative imports
- **Client** resolves it via Vite's `resolve.alias` configuration
- Both `tsconfig.json` files include `shared/` in their compilation scope

This ensures type safety across the full stack without a separate build step.

## Error Handling

The server uses custom error classes (`AppError`, `NotFoundError`, `ValidationError`, `ConflictError`) that are caught by a global error handler middleware. Routes throw these errors and call `next(err)` to delegate to the handler, which returns structured JSON responses with appropriate HTTP status codes.
