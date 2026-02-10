# Adding Features

This guide explains how to add new functionality following the existing patterns.

## Adding a New API Endpoint

### 1. Create the Route

```typescript
// server/src/routes/myfeature.ts
import { Router } from "express";
import * as myService from "../services/myfeature.service";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await myService.listItems();
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const item = await myService.createItem(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

export default router;
```

### 2. Create the Service

```typescript
// server/src/services/myfeature.service.ts
import { query, queryOne } from "../db/connection";

export async function listItems() {
  return query("SELECT * FROM my_table ORDER BY created_at DESC");
}

export async function createItem(input: { name: string }) {
  return queryOne(
    "INSERT INTO my_table (name) VALUES ($1) RETURNING *",
    [input.name]
  );
}
```

### 3. Mount the Route

```typescript
// In server/src/index.ts
import myFeatureRoutes from "./routes/myfeature";
app.use("/api/myfeature", myFeatureRoutes);
```

### 4. Add API Client Functions

```typescript
// In client/src/api/client.ts
export async function listItems(): Promise<MyItem[]> {
  const res = await request<ApiResponse<MyItem[]>>("/api/myfeature");
  return res.data;
}

export async function createItem(input: CreateItemInput): Promise<MyItem> {
  const res = await request<ApiResponse<MyItem>>("/api/myfeature", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}
```

## Adding a New Component

### 1. Create the Component

```tsx
// client/src/components/MyFeature/MyFeatureView.tsx
import { useState, useEffect } from "react";
import { listItems } from "../../api/client";

export function MyFeatureView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listItems()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Feature</h1>
      {items.map(item => (
        <div key={item.id} className="p-4 border rounded mb-2">
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

### 2. Add to App Router

```tsx
// In client/src/App.tsx
import { MyFeatureView } from "./components/MyFeature/MyFeatureView";

// Add to your routing:
{currentView === "myfeature" && <MyFeatureView />}
```

### 3. Add Navigation

```tsx
// In client/src/components/Layout/Sidebar.tsx
<button onClick={() => setView("myfeature")}>My Feature</button>
```

## Adding a Database Table

### 1. Create Migration

```typescript
// server/src/db/migrations/002_add_mytable.ts
export const up = `
  CREATE TABLE IF NOT EXISTS my_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_my_table_name ON my_table(name);
`;
```

### 2. Update migrate.ts

```typescript
// In server/src/db/migrate.ts
import { up as migration002 } from "./migrations/002_add_mytable";

// Add to migration runner:
await pool.query(migration002);
```

### 3. Add Types

```typescript
// In shared/types/ai.ts (or a new type file)
export interface MyItem {
  id: string;
  name: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

## Adding a New LLM Provider

See [LLM-GUIDE.md](../LLM-GUIDE.md) Recipe 1 for detailed instructions.

Summary:
1. Implement the `LLMProvider` interface in `server/src/services/llm/`
2. Register in the factory (`server/src/services/llm/factory.ts`)
3. Add provider name to `shared/constants.ts`
4. Add any API key environment variables to `.env.example`

## Adding a New Ingestion Source Type

### 1. Create Crawler

```typescript
// server/src/services/ingestion/my-crawler.ts
import { CrawledFile } from "@skeleton-ai/shared";

export async function crawlMySource(config: Record<string, any>): Promise<CrawledFile[]> {
  // Fetch content from your source
  // Return array of { path, content, fileType }
}
```

### 2. Register in Pipeline

```typescript
// In server/src/services/ingestion/pipeline.ts
import { crawlMySource } from "./my-crawler";

// In the ingest function:
switch (source.source_type) {
  case "directory":
    files = await crawlDirectory(source.config.path);
    break;
  case "my_type":
    files = await crawlMySource(source.config);
    break;
}
```

### 3. Update Types

```typescript
// In shared/types/ai.ts, update the Source interface:
source_type: "directory" | "url" | "my_type";
```
