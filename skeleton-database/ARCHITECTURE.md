# Architecture

## System Overview

skeleton-database is a three-tier application:

```
React Client (Vite)  <-->  Express Server  <-->  PostgreSQL
     :5175                    :3003                :5434
```

The client is a single-page application that communicates with the server via a REST API. The server manages all business logic and database access. PostgreSQL stores all persistent data, using JSONB columns for flexible row data storage.

## Database Schema

The core data model follows a hierarchy:

```
Base
 └── Table
      ├── Field    (schema definition)
      ├── Row      (data records)
      └── View     (display configuration)
```

### Tables

**bases** -- Top-level containers that group related tables. Each base has a title, description, icon, and color.

**tables** -- Individual data tables within a base. Tables have a position for ordering within the base sidebar.

**fields** -- Column definitions for a table. Each field has a type (one of 13 supported types), a position for column ordering, a JSON config object for type-specific settings (e.g., select options, number precision), and a required flag.

**rows** -- Data records in a table. Each row stores its data in a single JSONB column keyed by field UUID. This avoids the need for dynamic column creation and allows flexible schema changes.

**views** -- Saved display configurations for a table. Each view has a type (grid or form) and a JSON config containing filters, sorts, hidden fields, and column widths.

### Entity Relationship Diagram

```
bases
  id          UUID PRIMARY KEY
  title       TEXT NOT NULL
  description TEXT DEFAULT ''
  icon        TEXT DEFAULT 'database'
  color       TEXT DEFAULT '#3b82f6'
  created_at  TIMESTAMPTZ
  updated_at  TIMESTAMPTZ

tables
  id          UUID PRIMARY KEY
  base_id     UUID REFERENCES bases(id) ON DELETE CASCADE
  title       TEXT NOT NULL
  description TEXT DEFAULT ''
  position    INTEGER NOT NULL
  created_at  TIMESTAMPTZ
  updated_at  TIMESTAMPTZ

fields
  id          UUID PRIMARY KEY
  table_id    UUID REFERENCES tables(id) ON DELETE CASCADE
  title       TEXT NOT NULL
  field_type  TEXT NOT NULL
  position    INTEGER NOT NULL
  config      JSONB DEFAULT '{}'
  required    BOOLEAN DEFAULT false
  created_at  TIMESTAMPTZ

rows
  id          UUID PRIMARY KEY
  table_id    UUID REFERENCES tables(id) ON DELETE CASCADE
  data        JSONB DEFAULT '{}'
  position    INTEGER NOT NULL
  created_at  TIMESTAMPTZ
  updated_at  TIMESTAMPTZ

views
  id          UUID PRIMARY KEY
  table_id    UUID REFERENCES tables(id) ON DELETE CASCADE
  title       TEXT NOT NULL
  view_type   TEXT NOT NULL DEFAULT 'grid'
  config      JSONB DEFAULT '{}'
  position    INTEGER NOT NULL
  created_at  TIMESTAMPTZ
```

## JSONB Data Model

Row data is stored in a single JSONB column rather than creating dynamic columns per field. The keys are field UUIDs and the values are the field data:

```json
{
  "f1a2b3c4-...": "Project Alpha",
  "f5e6d7c8-...": 42,
  "f9a0b1c2-...": true,
  "f3d4e5f6-...": ["option-a", "option-b"],
  "f7g8h9i0-...": "2026-01-15"
}
```

This design provides several advantages:

1. **No ALTER TABLE** -- Adding or removing fields does not require schema migrations
2. **Flexible types** -- Each cell can store any JSON-compatible value
3. **Atomic updates** -- A single row update modifies one JSONB column
4. **PostgreSQL JSONB operators** -- Filtering and sorting use native JSONB operators for performance

### Filtering

Filters operate on JSONB paths using PostgreSQL operators:

```sql
-- Text contains
WHERE data->>$field_id ILIKE '%search%'

-- Number greater than
WHERE (data->>$field_id)::numeric > $value

-- Checkbox equals
WHERE (data->>$field_id)::boolean = true

-- Is empty
WHERE data->>$field_id IS NULL OR data->>$field_id = ''
```

### Sorting

Sorts cast the JSONB value to the appropriate type:

```sql
ORDER BY data->>$field_id ASC          -- text
ORDER BY (data->>$field_id)::numeric   -- number
ORDER BY (data->>$field_id)::boolean   -- checkbox
```

## Request Flow

A typical request flows through these layers:

```
Client Component
  → React Hook (useQuery/useMutation)
    → API Client Function (fetch wrapper)
      → Express Route Handler (validation)
        → Service Layer (business logic)
          → PostgreSQL Query
        ← Service returns result
      ← Route sends JSON response
    ← API client returns typed data
  ← Hook updates component state
```

### Example: Updating a Cell

1. User clicks a cell in GridView and edits the value
2. Component calls `updateRow` mutation with the row ID and updated data
3. API client sends `PATCH /api/rows/:id` with `{ data: { [fieldId]: newValue } }`
4. Route handler validates the request body
5. Row service merges the new data with existing JSONB data using `jsonb_set` or `||` operator
6. Service returns the updated row
7. React Query invalidates the row cache and the grid re-renders

## Key Design Decisions

### Server-Side Pagination

Rows are paginated on the server (default 50 per page, max 500). The client requests pages via query parameters (`?page=1&per_page=50`). This keeps the initial load fast and memory usage predictable regardless of table size.

The server returns total count alongside the page data so the client can render pagination controls.

### No Virtualization

The grid view renders all rows in the current page as standard DOM elements rather than using a virtualization library. With a 50-row page size, the DOM node count stays manageable (roughly 50 rows x 10 visible columns = 500 cells). This simplifies the implementation and avoids the complexity of virtual scroll positioning during inline editing.

### Optimistic Updates

Cell edits use optimistic updates via React Query's `onMutate` callback. When a user changes a cell value:

1. The cache is immediately updated with the new value
2. The mutation request is sent to the server
3. On success, the cache is confirmed
4. On error, the cache is rolled back to the previous value

This provides instant feedback during inline editing without waiting for server round-trips.

### Field UUIDs as Data Keys

Row data uses field UUIDs (not field titles or positions) as keys. This means renaming a field or reordering fields does not require rewriting row data. The interop export format uses field titles as keys for human readability, with conversion happening at export/import time.

### View Configuration as JSONB

View configs (filters, sorts, hidden fields, column widths) are stored as JSONB rather than normalized tables. This keeps view operations simple -- a single read/write per view -- and the config structure can evolve without migrations.
