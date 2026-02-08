# LLM Builder Guide

This guide is for AI assistants and LLM-powered development tools working on this codebase. It explains what's safe to change, what to avoid, and provides step-by-step recipes for common customizations.

## Architecture Overview

- **shared/** — TypeScript types and constants used by both server and client
- **server/** — Express.js REST API with PostgreSQL
- **client/** — React 18 + Vite + Tailwind CSS with drag-and-drop (dnd-kit)
- **tests/** — Vitest integration tests

The app is a Kanban board with boards, columns, and tasks. Data flows: Client → API → PostgreSQL.

## Safe to Modify

These files are designed to be customized:

| Area | Files | What you can do |
|------|-------|-----------------|
| UI Components | `client/src/components/*.tsx` | Change layout, add fields, restyle |
| Styles | `client/tailwind.config.js`, `client/src/styles/globals.css` | Change theme, colors, fonts |
| API Routes | `server/src/routes/boards.ts`, `server/src/routes/tasks.ts` | Add endpoints, change validation |
| Services | `server/src/services/*.ts` | Add business logic |
| Seed Data | `server/src/db/seed.ts` | Change sample data |
| Constants | `shared/constants.ts` | Change default columns, priorities, colors |
| Auth | `server/src/middleware/auth.ts` | Implement authentication |

## Do NOT Modify

These files implement the interop standard and must stay unchanged:

| File | Reason |
|------|--------|
| `server/src/routes/interop.ts` | Implements the export/import standard |
| `shared/types/task.ts` (core fields) | Defines the interop type contract |

You CAN add new fields to the `metadata` object on tasks. You CAN add new interfaces to the types file. You CANNOT rename, remove, or change the types of existing fields.

## Customization Recipes

### 1. Adding Time Tracking

**Goal:** Track estimated and actual hours on tasks.

```
1. Use the metadata field (no schema changes needed):
   metadata: { estimated_hours: 4, actual_hours: 2.5 }

2. Add UI in client/src/components/TaskCard.tsx:
   - Show hours below the labels section
   - Add a small clock icon from lucide-react

3. Add inputs in client/src/components/TaskModal.tsx:
   - Two number inputs for estimated and actual hours
   - Save to task.metadata.estimated_hours and task.metadata.actual_hours

4. No server changes needed — metadata is already persisted as JSONB.
```

### 2. Adding Comments/Activity Log

**Goal:** Allow users to comment on tasks.

```
1. Create migration: server/src/db/migrations/002_add_comments.ts
   CREATE TABLE comments (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
     author VARCHAR(255) NOT NULL,
     content TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

2. Create service: server/src/services/comment.service.ts
   - listComments(taskId) — SELECT * FROM comments WHERE task_id = $1
   - createComment(taskId, { author, content })
   - deleteComment(id)

3. Create route: server/src/routes/comments.ts
   - GET /api/tasks/:taskId/comments
   - POST /api/tasks/:taskId/comments
   - DELETE /api/comments/:id

4. Mount route in server/src/index.ts:
   import commentRoutes from "./routes/comments";
   app.use("/api", commentRoutes);

5. Create component: client/src/components/CommentSection.tsx
   - List of comments with author, content, timestamp
   - Text input + submit button at bottom

6. Add to TaskModal.tsx — render CommentSection below the form fields.
```

### 3. Adding Subtasks

**Goal:** Tasks can have child tasks (checklist items).

```
Option A: Use metadata (simple, no migration):
   metadata: { subtasks: [{ title: "Step 1", done: false }, ...] }

Option B: New table (full relational):
   1. Migration: CREATE TABLE subtasks (similar to tasks, with parent_task_id FK)
   2. Service: server/src/services/subtask.service.ts
   3. Route: GET/POST/PUT/DELETE under /api/tasks/:taskId/subtasks
   4. UI: Checklist component in TaskCard or TaskModal
```

### 4. Implementing JWT Authentication

**Goal:** Replace the auth placeholder with working JWT auth.

```
1. Install: npm install jsonwebtoken bcrypt (in server/)
   Install: npm install -D @types/jsonwebtoken @types/bcrypt

2. Create migration: 002_add_users.ts
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     name VARCHAR(255) NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

3. Create: server/src/routes/auth.ts
   - POST /api/auth/register — hash password, create user, return JWT
   - POST /api/auth/login — verify password, return JWT
   - GET /api/auth/me — return current user info

4. Update: server/src/middleware/auth.ts
   - Extract token from Authorization header
   - Verify with jwt.verify()
   - Attach decoded user to req.user

5. Apply middleware to routes:
   router.get("/", authMiddleware, handler);

6. Client: Store token in localStorage, attach to API requests.
```

### 5. Adding a List/Table View

**Goal:** Alternative to the Kanban board view.

```
1. Create: client/src/components/ListView.tsx
   - Table with columns: Title, Status, Priority, Assignee, Due Date
   - Sortable column headers
   - Click row to open TaskModal

2. Modify: client/src/components/Board.tsx
   - Add a view toggle button (grid/list icons)
   - const [view, setView] = useState<"board" | "list">("board")
   - Render <ListView> or the existing DndContext based on view state
   - Pass the same props (board data, handlers) to ListView
```

### 6. Adding Email Notifications

**Goal:** Send emails when tasks are assigned or due dates approach.

```
1. Install: npm install nodemailer (in server/)
   Install: npm install -D @types/nodemailer

2. Create: server/src/services/email.service.ts
   - Configure SMTP transport from env vars
   - sendTaskAssigned(task, assigneeEmail)
   - sendDueDateReminder(task, assigneeEmail)

3. Add env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

4. Trigger from task.service.ts:
   - In createTask/updateTask: if assignee changed, send notification
   - For due dates: add a cron job (node-cron) that checks daily
```

### 7. Adding File Attachments

**Goal:** Upload files to tasks.

```
1. Install: npm install multer (in server/)
   Install: npm install -D @types/multer

2. Create middleware: server/src/middleware/upload.ts
   - Configure multer with disk or memory storage
   - Set file size limits and allowed types

3. Create route: POST /api/tasks/:taskId/attachments
   - Use multer middleware
   - Store file metadata in task.metadata.attachments array

4. Create route: GET /api/attachments/:filename
   - Serve uploaded files from the uploads directory

5. UI: Add file upload button in TaskModal, file list in TaskCard.
```

### 8. Connecting to an External API (Webhooks)

**Goal:** Send webhook notifications on task events.

```
1. Add env var: WEBHOOK_URL

2. Create: server/src/services/webhook.service.ts
   - sendWebhook(event: string, data: object)
   - Uses fetch() to POST to WEBHOOK_URL

3. Call from services after task operations:
   - task.service.ts → createTask: sendWebhook("task.created", task)
   - task.service.ts → moveTask: sendWebhook("task.moved", task)
   - task.service.ts → deleteTask: sendWebhook("task.deleted", { id })
```

### 9. Adding WebSocket Real-Time Updates

**Goal:** Multiple users see changes in real time.

```
1. Install: npm install socket.io (in server/)
   Install: npm install socket.io-client (in client/)

2. Server (index.ts):
   - Replace app.listen with http.createServer(app) + new Server(httpServer)
   - See the TODO block already in index.ts for the setup pattern

3. Server (services):
   - After each mutation, emit events:
     io.to(`board:${boardId}`).emit("task:created", task)

4. Client:
   - Create hooks/useSocket.ts
   - Connect on board load, join board room
   - Listen for events, update local state accordingly
```

### 10. Adding Keyboard Shortcuts

**Goal:** Navigate and operate the board with keyboard shortcuts.

```
1. See the TODO block in client/src/components/Board.tsx for planned shortcuts

2. Add useEffect with keydown listener in Board.tsx:
   useEffect(() => {
     const handler = (e: KeyboardEvent) => {
       if (e.target instanceof HTMLInputElement) return; // skip in inputs
       switch (e.key) {
         case "n": handleOpenCreate(board.columns[0]?.id); break;
         case "/": document.querySelector<HTMLInputElement>("[data-search]")?.focus(); break;
         case "Escape": setModalState({ open: false }); break;
       }
     };
     window.addEventListener("keydown", handler);
     return () => window.removeEventListener("keydown", handler);
   }, [board]);

3. Add data-search attribute to the FilterBar search input.
```
