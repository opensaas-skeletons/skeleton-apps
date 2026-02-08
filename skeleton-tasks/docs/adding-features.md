# Adding Features

This guide covers the patterns for extending the skeleton with new functionality.

## How to Add a New API Endpoint

### 1. Create the Service

Services contain business logic and database queries. Create a new file in `server/src/services/`:

```ts
// server/src/services/example.service.ts
import { query, queryOne, getPool } from "../db/connection";

export async function listItems(boardId: string) {
  return query("SELECT * FROM items WHERE board_id = $1 ORDER BY created_at DESC", [boardId]);
}

export async function createItem(boardId: string, input: { title: string }) {
  return queryOne(
    "INSERT INTO items (board_id, title) VALUES ($1, $2) RETURNING *",
    [boardId, input.title]
  );
}
```

### 2. Create the Route

Routes handle HTTP concerns: parsing request data, calling services, formatting responses. Create a new file in `server/src/routes/`:

```ts
// server/src/routes/example.ts
import { Router, Request, Response, NextFunction } from "express";
import * as exampleService from "../services/example.service";
import { ValidationError, NotFoundError } from "../errors";

const router = Router();

router.get("/boards/:boardId/items", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await exampleService.listItems(req.params.boardId);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

router.post("/boards/:boardId/items", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title } = req.body;
    if (!title) throw new ValidationError("Title is required");

    const item = await exampleService.createItem(req.params.boardId, { title });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

export default router;
```

### 3. Mount the Route

Add it to `server/src/index.ts`:

```ts
import exampleRoutes from "./routes/example";
app.use("/api", exampleRoutes);
```

### Pattern Summary

```
Request → Route (validate, parse) → Service (business logic, DB) → Response
                                         ↓
                                    Error → next(err) → Global Error Handler
```

## How to Add a New React Component

### 1. Create the Component

```tsx
// client/src/components/MyFeature.tsx
import React from "react";

interface MyFeatureProps {
  data: string[];
  onAction: (item: string) => void;
}

export function MyFeature({ data, onAction }: MyFeatureProps) {
  return (
    <div className="p-4">
      {data.map((item) => (
        <button
          key={item}
          onClick={() => onAction(item)}
          className="px-3 py-1.5 text-sm rounded-lg bg-surface-100 hover:bg-surface-200 transition-colors"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
```

### 2. Add API Functions (if needed)

Add fetch functions to `client/src/api/client.ts`:

```ts
export async function listItems(boardId: string): Promise<Item[]> {
  const res = await request<ApiResponse<Item[]>>(`/boards/${boardId}/items`);
  return res.data;
}
```

### 3. Wire It Up

Import and render the component in the appropriate parent (usually `Board.tsx` or `App.tsx`).

### Styling Conventions

- Use Tailwind CSS utility classes
- Follow the existing color scale: `surface-*` for neutrals, `brand-*` for accents
- Use `text-xs` or `text-sm` for most text (the UI is compact)
- Use `rounded-lg` for containers, `rounded` for small elements
- Transitions: `transition-colors` for hover states

## How to Add a New Database Table

### 1. Create the Migration

Create a new file in `server/src/db/migrations/`:

```ts
// server/src/db/migrations/002_add_items.ts
import pool from "../connection";

const SQL = `
  CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_items_board ON items(board_id);
`;

async function migrate() {
  console.log("Running migration 002...");
  try {
    await pool.query(SQL);
    console.log("Migration 002 complete!");
  } catch (err) {
    console.error("Migration 002 failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
```

### 2. Add a Script

In `server/package.json`, you can either:
- Add the new migration to the existing migrate script chain
- Run it manually: `npx tsx src/db/migrations/002_add_items.ts`

### 3. Follow the Pattern

- Use `UUID` primary keys with `uuid_generate_v4()`
- Add `ON DELETE CASCADE` for foreign keys to boards/columns
- Add indexes for frequently queried columns
- Use `TIMESTAMPTZ` for timestamps
- Use `JSONB` for flexible/extensible fields

## How to Extend the Shared Types

### Adding New Interfaces

Add to `shared/types/task.ts`:

```ts
// Add below the existing interfaces
export interface Item {
  id: string;
  board_id: string;
  title: string;
  created_at: string;
}

export interface CreateItemInput {
  title: string;
}
```

### Extending Existing Types (Safe)

You can add new interfaces that extend existing ones:

```ts
export interface TaskWithComments extends Task {
  comments: Comment[];
}
```

### Rules for Type Changes

- **Safe:** Adding new interfaces, adding optional fields to input types
- **Unsafe:** Removing fields, renaming fields, changing field types
- **Never change** the core `Task`, `Board`, `Column`, or `ExportPayload` fields — these are part of the interop standard
