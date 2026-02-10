# LLM Builder Guide

This guide is written FOR AI assistants and LLM-powered development tools. It explains the project structure, what's safe to modify, architecture patterns, and provides step-by-step recipes for common customizations.

---

## Section 1: Project Overview

**Skeleton Tasks** is a full-stack Kanban task tracker designed to be forked and customized. It's part of the Open SaaS Skeletons series — production-ready starter projects that implement a common interoperability standard.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + @dnd-kit |
| Backend | Express.js + TypeScript + tsx (dev runner) |
| Database | PostgreSQL 16 with uuid-ossp extension |
| DevOps | Docker + Docker Compose + npm workspaces |

### How the Pieces Connect

```
┌──────────────┐     HTTP/JSON     ┌──────────────┐     SQL      ┌──────────────┐
│              │ ◄───────────────► │              │ ◄──────────► │              │
│  React App   │    REST API       │  Express API │   pg driver  │  PostgreSQL  │
│  (Vite)      │    port 5173      │  Server      │   port 5432  │  Database    │
│              │    proxy → 3001   │  port 3001   │              │              │
└──────────────┘                   └──────────────┘              └──────────────┘
     Client                             Server                      Database
```

Data flows: **Client → API → PostgreSQL**

The client makes REST API calls. The API server validates requests, calls service functions, and queries the database. Responses flow back through the same path.

---

## Section 2: File Map

Every source file with its purpose and modification status:

### Shared Package (`shared/`)

| File | Description | Status |
|------|-------------|--------|
| `shared/index.ts` | Barrel exports for the package | SAFE TO MODIFY |
| `shared/constants.ts` | Default columns, priorities, colors | SAFE TO MODIFY |
| `shared/types/task.ts` | Core TypeScript interfaces | MODIFY WITH CARE |

**Note on `shared/types/task.ts`:** You CAN add new interfaces and extend existing ones. You CANNOT rename, remove, or change the types of the core fields (`Task`, `Board`, `Column`, `ExportPayload`) — these are the interop contract.

### Server (`server/src/`)

| File | Description | Status |
|------|-------------|--------|
| `server/src/index.ts` | Express app setup, middleware, route mounting | SAFE TO MODIFY |
| `server/src/errors.ts` | Custom error classes (AppError, NotFoundError, etc.) | SAFE TO MODIFY |
| `server/src/routes/boards.ts` | Board CRUD endpoints | SAFE TO MODIFY |
| `server/src/routes/tasks.ts` | Task CRUD and move endpoints | SAFE TO MODIFY |
| `server/src/routes/interop.ts` | Export/import endpoints | DO NOT MODIFY |
| `server/src/services/board.service.ts` | Board business logic | SAFE TO MODIFY |
| `server/src/services/task.service.ts` | Task business logic | SAFE TO MODIFY |
| `server/src/middleware/auth.ts` | Auth placeholder (implement here) | SAFE TO MODIFY |
| `server/src/db/connection.ts` | PostgreSQL connection pool | MODIFY WITH CARE |
| `server/src/db/migrate.ts` | Migration runner | MODIFY WITH CARE |
| `server/src/db/seed.ts` | Sample data seeding | SAFE TO MODIFY |
| `server/src/db/migrations/001_initial.ts` | Initial schema | MODIFY WITH CARE |

### Client (`client/src/`)

| File | Description | Status |
|------|-------------|--------|
| `client/src/main.tsx` | React entry point | SAFE TO MODIFY |
| `client/src/App.tsx` | Root component, board selection | SAFE TO MODIFY |
| `client/src/api/client.ts` | API client wrapper functions | SAFE TO MODIFY |
| `client/src/hooks/useBoard.ts` | Board state management hook | SAFE TO MODIFY |
| `client/src/components/Board.tsx` | Main Kanban board with drag-and-drop | SAFE TO MODIFY |
| `client/src/components/Column.tsx` | Single column with task list | SAFE TO MODIFY |
| `client/src/components/TaskCard.tsx` | Task card display | SAFE TO MODIFY |
| `client/src/components/TaskModal.tsx` | Task editing modal | SAFE TO MODIFY |
| `client/src/components/Header.tsx` | Top navigation bar | SAFE TO MODIFY |
| `client/src/components/FilterBar.tsx` | Filter/search controls | SAFE TO MODIFY |
| `client/src/styles/globals.css` | Global styles and Tailwind imports | SAFE TO MODIFY |

### Configuration Files

| File | Description | Status |
|------|-------------|--------|
| `docker-compose.yml` | Docker orchestration | SAFE TO MODIFY |
| `client/vite.config.ts` | Vite configuration | SAFE TO MODIFY |
| `client/tailwind.config.js` | Tailwind theme customization | SAFE TO MODIFY |
| `server/tsconfig.json` | Server TypeScript config | MODIFY WITH CARE |
| `client/tsconfig.json` | Client TypeScript config | MODIFY WITH CARE |

---

## Section 3: Architecture Patterns

### Route → Service → Database Pattern

All API endpoints follow this pattern:

```
HTTP Request
    ↓
Route Handler (routes/*.ts)
    - Validates request data
    - Extracts parameters
    - Calls service function
    - Formats response
    ↓
Service Function (services/*.ts)
    - Contains business logic
    - Calls database queries
    - Throws errors for invalid operations
    ↓
Database Query (db/connection.ts)
    - Executes SQL
    - Returns rows
```

**Example flow for creating a task:**

```typescript
// Route: POST /api/boards/:boardId/tasks
router.post("/boards/:boardId/tasks", async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.params.boardId, req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// Service: createTask
export async function createTask(boardId: string, input: CreateTaskInput): Promise<Task> {
  // Get max position in column
  const maxResult = await queryOne("SELECT MAX(position) FROM tasks WHERE column_id = $1", [input.column_id]);
  const position = (maxResult?.max ?? -1) + 1;

  // Insert task
  return queryOne("INSERT INTO tasks (...) VALUES (...) RETURNING *", [...]);
}
```

### Frontend State Flow

```
useBoard Hook
    ↓ (manages board state)
API Client (client.ts)
    ↓ (fetch calls)
Express Server
    ↓ (routes → services)
PostgreSQL
    ↓ (returns data)
React Components (re-render)
```

The `useBoard` hook is the single source of truth for board state. It provides:
- `board` — The current board with columns and tasks
- `loading` / `error` — Loading and error states
- `createTask`, `updateTask`, `moveTask`, `deleteTask` — Mutation functions
- `refetch` — Manual refresh

### Drag-and-Drop Flow (Optimistic Updates)

```
1. User drags task card
    ↓
2. DndContext onDragEnd fires
    ↓
3. OPTIMISTIC UPDATE: Immediately update local state
   - Remove task from old column
   - Insert at new position in new column
   - UI re-renders instantly (snappy feel)
    ↓
4. PATCH /api/tasks/:id/move sent to server
    ↓
5. Server executes transaction:
   - Close position gap in old column
   - Open position gap in new column
   - Update task's column_id and position
   - COMMIT
    ↓
6. ON SUCCESS: Server returns updated task (state already correct)
   ON ERROR: Rollback optimistic update, refetch board
```

### Interop System (Export/Import)

**Key design decision:** Tasks reference columns by `column_title` (string), not `column_id` (UUID). This makes exports portable between different databases.

**Export flow:**
```
GET /api/export
    ↓
Load all boards with columns and tasks
    ↓
For each task:
  - Replace column_id with column_title
  - Strip internal IDs from output
    ↓
Return ExportPayload JSON
```

**Import flow:**
```
POST /api/import with ExportPayload
    ↓
Validate version field
    ↓
For each board:
  - Create board + columns (get new IDs)
  - Build column_title → column_id map
  - For each task:
    - Resolve column_title to column_id
    - Insert task with new IDs
    ↓
Return count of imported boards
```

---

## Section 4: Customization Recipes

### Recipe 1: Adding Comments/Activity Log

**Goal:** Allow users to comment on tasks.

**Files to create/modify:**
- `server/src/db/migrations/002_add_comments.ts` (new)
- `server/src/services/comment.service.ts` (new)
- `server/src/routes/comments.ts` (new)
- `server/src/index.ts` (mount route)
- `client/src/components/CommentSection.tsx` (new)
- `client/src/components/TaskModal.tsx` (add CommentSection)
- `client/src/api/client.ts` (add API functions)

**Step 1: Create migration**
```typescript
// server/src/db/migrations/002_add_comments.ts
import pool from "../connection";

const SQL = `
  CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
`;

async function migrate() {
  await pool.query(SQL);
  console.log("Migration 002 complete!");
  await pool.end();
}
migrate();
```

**Step 2: Create service**
```typescript
// server/src/services/comment.service.ts
import { query, queryOne } from "../db/connection";

export interface Comment {
  id: string;
  task_id: string;
  author: string;
  content: string;
  created_at: string;
}

export async function listComments(taskId: string): Promise<Comment[]> {
  return query("SELECT * FROM comments WHERE task_id = $1 ORDER BY created_at ASC", [taskId]);
}

export async function createComment(taskId: string, author: string, content: string): Promise<Comment> {
  return queryOne(
    "INSERT INTO comments (task_id, author, content) VALUES ($1, $2, $3) RETURNING *",
    [taskId, author, content]
  )!;
}

export async function deleteComment(id: string): Promise<boolean> {
  const result = await query("DELETE FROM comments WHERE id = $1 RETURNING id", [id]);
  return result.length > 0;
}
```

**Step 3: Create route**
```typescript
// server/src/routes/comments.ts
import { Router } from "express";
import * as commentService from "../services/comment.service";

const router = Router();

router.get("/tasks/:taskId/comments", async (req, res, next) => {
  try {
    const comments = await commentService.listComments(req.params.taskId);
    res.json({ success: true, data: comments });
  } catch (err) { next(err); }
});

router.post("/tasks/:taskId/comments", async (req, res, next) => {
  try {
    const { author, content } = req.body;
    const comment = await commentService.createComment(req.params.taskId, author, content);
    res.status(201).json({ success: true, data: comment });
  } catch (err) { next(err); }
});

router.delete("/comments/:id", async (req, res, next) => {
  try {
    await commentService.deleteComment(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
```

**Step 4: Mount route in index.ts**
```typescript
import commentRoutes from "./routes/comments";
app.use("/api", commentRoutes);
```

**Step 5: Create React component**
```tsx
// client/src/components/CommentSection.tsx
import { useState, useEffect } from "react";
import { listComments, createComment } from "../api/client";

export function CommentSection({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    listComments(taskId).then(setComments);
  }, [taskId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    const comment = await createComment(taskId, "current-user", newComment);
    setComments([...comments, comment]);
    setNewComment("");
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-medium mb-2">Comments</h4>
      {comments.map(c => (
        <div key={c.id} className="mb-2 p-2 bg-surface-50 rounded">
          <span className="font-medium">{c.author}</span>
          <p>{c.content}</p>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 border rounded"
        />
        <button onClick={handleSubmit} className="px-4 py-2 bg-brand-600 text-white rounded">
          Post
        </button>
      </div>
    </div>
  );
}
```

**Step 6: Add to TaskModal**
```tsx
// In TaskModal.tsx, add after the form fields:
import { CommentSection } from "./CommentSection";
// ...
{task && <CommentSection taskId={task.id} />}
```

---

### Recipe 2: Implementing JWT Authentication

**Goal:** Replace the auth placeholder with working JWT auth.

**Files to create/modify:**
- `server/src/db/migrations/002_add_users.ts` (new)
- `server/src/services/auth.service.ts` (new)
- `server/src/routes/auth.ts` (new)
- `server/src/middleware/auth.ts` (replace placeholder)
- `server/src/index.ts` (mount route, apply middleware)
- `client/src/api/client.ts` (add auth header)
- `client/src/components/LoginPage.tsx` (new)

**Step 1: Install dependencies**
```bash
cd server
npm install jsonwebtoken bcrypt
npm install -D @types/jsonwebtoken @types/bcrypt
```

**Step 2: Create users migration**
```typescript
// server/src/db/migrations/002_add_users.ts
const SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;
```

**Step 3: Create auth service**
```typescript
// server/src/services/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { queryOne } from "../db/connection";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-prod";

export async function register(email: string, password: string, name: string) {
  const hash = await bcrypt.hash(password, 10);
  const user = await queryOne(
    "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name",
    [email, hash, name]
  );
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return { user, token };
}

export async function login(email: string, password: string) {
  const user = await queryOne("SELECT * FROM users WHERE email = $1", [email]);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error("Invalid credentials");
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return { user: { id: user.id, email: user.email, name: user.name }, token };
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}
```

**Step 4: Update auth middleware**
```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/auth.service";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }
  try {
    const decoded = verifyToken(header.slice(7));
    (req as any).userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
}
```

**Step 5: Create auth routes**
```typescript
// server/src/routes/auth.ts
import { Router } from "express";
import * as authService from "../services/auth.service";

const router = Router();

router.post("/auth/register", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
```

**Step 6: Update API client**
```typescript
// In client/src/api/client.ts, update the request function:
function getToken() {
  return localStorage.getItem("auth_token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    ...options,
  });
  // ... rest of function
}
```

---

### Recipe 3: Adding Time Tracking

**Goal:** Track estimated and actual hours on tasks.

**Files to modify:**
- `client/src/components/TaskCard.tsx`
- `client/src/components/TaskModal.tsx`

This uses the metadata field — no migration needed.

**Step 1: Add display in TaskCard**
```tsx
// In TaskCard.tsx, add after labels:
{(task.metadata?.estimated_hours || task.metadata?.actual_hours) && (
  <div className="flex items-center gap-1 text-xs text-surface-500">
    <Clock className="w-3 h-3" />
    {task.metadata.actual_hours ?? 0}h / {task.metadata.estimated_hours ?? 0}h
  </div>
)}
```

**Step 2: Add inputs in TaskModal**
```tsx
// In TaskModal.tsx form:
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium">Estimated Hours</label>
    <input
      type="number"
      value={formData.metadata?.estimated_hours ?? ""}
      onChange={e => setFormData({
        ...formData,
        metadata: { ...formData.metadata, estimated_hours: Number(e.target.value) }
      })}
      className="w-full px-3 py-2 border rounded"
    />
  </div>
  <div>
    <label className="block text-sm font-medium">Actual Hours</label>
    <input
      type="number"
      value={formData.metadata?.actual_hours ?? ""}
      onChange={e => setFormData({
        ...formData,
        metadata: { ...formData.metadata, actual_hours: Number(e.target.value) }
      })}
      className="w-full px-3 py-2 border rounded"
    />
  </div>
</div>
```

---

### Recipe 4: Adding a List/Table View

**Goal:** Alternative table view alongside the Kanban board.

**Files to create/modify:**
- `client/src/components/ListView.tsx` (new)
- `client/src/components/Board.tsx` (add view toggle)

**Step 1: Create ListView component**
```tsx
// client/src/components/ListView.tsx
import { BoardWithDetails, Task } from "@skeleton-tasks/shared";

interface ListViewProps {
  board: BoardWithDetails;
  onTaskClick: (task: Task) => void;
}

export function ListView({ board, onTaskClick }: ListViewProps) {
  const allTasks = board.columns.flatMap(col =>
    col.tasks.map(task => ({ ...task, columnTitle: col.title }))
  );

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">Title</th>
          <th className="text-left p-2">Status</th>
          <th className="text-left p-2">Priority</th>
          <th className="text-left p-2">Assignee</th>
          <th className="text-left p-2">Due Date</th>
        </tr>
      </thead>
      <tbody>
        {allTasks.map(task => (
          <tr
            key={task.id}
            onClick={() => onTaskClick(task)}
            className="border-b hover:bg-surface-50 cursor-pointer"
          >
            <td className="p-2">{task.title}</td>
            <td className="p-2">{task.columnTitle}</td>
            <td className="p-2">{task.priority}</td>
            <td className="p-2">{task.assignee ?? "—"}</td>
            <td className="p-2">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Step 2: Add toggle in Board.tsx**
```tsx
// In Board.tsx:
const [view, setView] = useState<"board" | "list">("board");

// In the header area:
<div className="flex gap-2">
  <button onClick={() => setView("board")} className={view === "board" ? "font-bold" : ""}>
    Board
  </button>
  <button onClick={() => setView("list")} className={view === "list" ? "font-bold" : ""}>
    List
  </button>
</div>

// In the render:
{view === "board" ? (
  <DndContext ...>
    {/* existing board UI */}
  </DndContext>
) : (
  <ListView board={board} onTaskClick={task => openModal(task)} />
)}
```

---

### Recipe 5: Adding Subtasks/Checklists

**Goal:** Tasks can have checklist items.

**Using metadata (no migration):**

**Step 1: Define the shape**
```typescript
// In your component or a types file:
interface Subtask {
  id: string;
  title: string;
  done: boolean;
}
// Stored in task.metadata.subtasks: Subtask[]
```

**Step 2: Add ChecklistEditor to TaskModal**
```tsx
function ChecklistEditor({ subtasks, onChange }) {
  const addItem = () => {
    onChange([...subtasks, { id: crypto.randomUUID(), title: "", done: false }]);
  };

  const toggleItem = (id: string) => {
    onChange(subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };

  return (
    <div>
      <h4>Checklist</h4>
      {subtasks.map(item => (
        <div key={item.id} className="flex items-center gap-2">
          <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} />
          <input
            value={item.title}
            onChange={e => onChange(subtasks.map(s =>
              s.id === item.id ? { ...s, title: e.target.value } : s
            ))}
          />
        </div>
      ))}
      <button onClick={addItem}>+ Add item</button>
    </div>
  );
}
```

**Step 3: Show progress in TaskCard**
```tsx
{task.metadata?.subtasks?.length > 0 && (
  <div className="text-xs text-surface-500">
    {task.metadata.subtasks.filter(s => s.done).length}/{task.metadata.subtasks.length} completed
  </div>
)}
```

---

### Recipe 6: Adding File Attachments

**Goal:** Upload files to tasks.

**Step 1: Install multer**
```bash
cd server
npm install multer
npm install -D @types/multer
```

**Step 2: Create upload middleware**
```typescript
// server/src/middleware/upload.ts
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

**Step 3: Create upload route**
```typescript
// In routes/tasks.ts or a new routes/attachments.ts:
import { upload } from "../middleware/upload";

router.post("/tasks/:taskId/attachments", upload.single("file"), async (req, res) => {
  const file = req.file;
  // Store file info in task.metadata.attachments array
  // Return file metadata
});

router.get("/attachments/:filename", (req, res) => {
  res.sendFile(path.resolve(`./uploads/${req.params.filename}`));
});
```

---

### Recipe 7: Adding Webhooks

**Goal:** Send webhook notifications on task events.

**Step 1: Create webhook service**
```typescript
// server/src/services/webhook.service.ts
const WEBHOOK_URL = process.env.WEBHOOK_URL;

export async function sendWebhook(event: string, data: object) {
  if (!WEBHOOK_URL) return;

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
    });
  } catch (err) {
    console.error("Webhook failed:", err);
  }
}
```

**Step 2: Call from services**
```typescript
// In task.service.ts:
import { sendWebhook } from "./webhook.service";

export async function createTask(...) {
  const task = await queryOne(...);
  sendWebhook("task.created", task); // Fire and forget
  return task;
}
```

---

### Recipe 8: Adding Email Notifications

**Goal:** Send emails when tasks are assigned or due.

**Step 1: Install nodemailer**
```bash
cd server
npm install nodemailer
npm install -D @types/nodemailer
```

**Step 2: Create email service**
```typescript
// server/src/services/email.service.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendTaskAssigned(task: Task, assigneeEmail: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: assigneeEmail,
    subject: `You've been assigned: ${task.title}`,
    text: `Task: ${task.title}\n\n${task.description}`
  });
}
```

**Step 3: Trigger on assignment**
```typescript
// In task.service.ts updateTask:
if (input.assignee && input.assignee !== existingTask.assignee) {
  sendTaskAssigned(updatedTask, input.assignee);
}
```

---

## Section 5: Rules

1. **Always use TypeScript strict mode** — No implicit any, strict null checks enabled.

2. **Add header comments to new files** — Explain what the file does and whether it's safe to modify:
   ```typescript
   /**
    * Comment Service
    * ===============
    * Business logic for task comments.
    *
    * SAFE TO MODIFY
    */
   ```

3. **Never modify core interop types** — The `Task`, `Board`, `Column`, and `ExportPayload` interfaces in `shared/types/task.ts` are the interop contract. Use the `metadata` field for custom data.

4. **Never modify `server/src/routes/interop.ts`** — This implements the standard. Breaking it breaks compatibility with other skeleton apps.

5. **Follow the route → service → db pattern** — Routes handle HTTP, services handle business logic, database queries are isolated.

6. **Keep the codebase small** — If a feature requires more than ~5 new files, reconsider the approach. Can you use metadata instead of a new table? Can you extend an existing component instead of creating a new one?

7. **Test the export/import round-trip** — After any data model changes:
   ```bash
   curl http://localhost:3001/api/export > backup.json
   # Make changes
   curl -X POST http://localhost:3001/api/import -H "Content-Type: application/json" -d @backup.json
   # Verify data integrity
   ```

8. **Use the error classes** — Throw `NotFoundError`, `ValidationError`, `ConflictError` from services. The global error handler will format them correctly.

9. **Preserve metadata through operations** — When updating tasks, don't overwrite the entire metadata object. Merge new fields with existing ones.

10. **Use UUID primary keys** — All tables use `uuid_generate_v4()`. Don't use auto-incrementing integers.
