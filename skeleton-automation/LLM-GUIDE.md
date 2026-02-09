# LLM Guide — Skeleton Automation

This guide helps AI assistants understand and extend skeleton-automation. Read this before making changes.

## Quick Context

- **What:** Self-hosted workflow automation engine (Zapier/Make alternative)
- **Stack:** React 18 + Vite + Tailwind (client), Express + TypeScript (server), PostgreSQL 16
- **Pattern:** Monorepo with npm workspaces (shared, server, client)
- **Port:** API on 3002, UI on 5174 (different from skeleton-tasks: 3001/5173)

## File Map

| File | Purpose | Modify? |
|------|---------|---------|
| `shared/types/workflow.ts` | All TypeScript interfaces | Yes, to add new types |
| `shared/constants.ts` | Labels, colors, enums | Yes, to add new constants |
| `server/src/index.ts` | Express app entry point | Rarely |
| `server/src/services/workflow.service.ts` | DB queries for workflows/runs | Yes, for new queries |
| `server/src/services/executor.service.ts` | Workflow execution engine | Yes, for execution logic |
| `server/src/services/scheduler.service.ts` | Cron job management | Rarely |
| `server/src/services/action.service.ts` | Action executors + interpolation | Yes, for new action types |
| `server/src/routes/workflows.ts` | Workflow CRUD + trigger endpoints | Yes, for new endpoints |
| `server/src/routes/runs.ts` | Run listing endpoints | Rarely |
| `server/src/routes/hooks.ts` | Webhook receiver | Rarely |
| `server/src/routes/interop.ts` | Export/import | **DO NOT MODIFY** |
| `server/src/db/migrations/001_initial.ts` | Database schema | Add new migrations only |
| `client/src/components/App.tsx` | Root component, view routing | Yes, for new views |
| `client/src/components/WorkflowEditor.tsx` | Step-by-step workflow form | Yes, for editor changes |
| `client/src/components/TriggerConfig.tsx` | Trigger type forms | Yes, for new trigger types |
| `client/src/components/ActionConfig.tsx` | Action type forms | Yes, for new action types |
| `client/src/hooks/useWorkflows.ts` | Workflow state management | Yes, for new operations |
| `client/src/api/client.ts` | API client functions | Yes, for new endpoints |

## Common Recipes

### Add a New Action Type

**Example:** Adding a "Slack" action type.

1. **shared/types/workflow.ts** — Add the interface:
```typescript
export interface SlackActionConfig {
  type: "slack";
  config: {
    webhook_url: string;
    message: string;
    channel?: string;
  };
}

// Add to ActionConfig union:
export type ActionConfig = ... | SlackActionConfig;
```

2. **shared/constants.ts** — Add label and color:
```typescript
export const ACTION_LABELS: Record<string, string> = {
  ...existing,
  slack: "Slack Message",
};

export const ACTION_COLORS: Record<string, string> = {
  ...existing,
  slack: "#4A154B",
};
```

3. **server/src/services/action.service.ts** — Add executor:
```typescript
case "slack":
  output = await executeSlackAction(action.config, input);
  break;

async function executeSlackAction(config, input) {
  const message = interpolate(config.message, input);
  const res = await fetch(config.webhook_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message, channel: config.channel }),
  });
  if (!res.ok) throw new Error(`Slack API error: ${res.status}`);
  return { sent: true };
}
```

4. **client/src/components/ActionConfig.tsx** — Add form and default:
```typescript
// Add to DEFAULT_ACTIONS:
slack: { type: "slack", config: { webhook_url: "", message: "", channel: "" } },

// Add form in the action render:
{action.type === "slack" && <SlackActionFields config={action.config} onChange={...} />}
```

### Add a New Trigger Type

Similar pattern: add to shared types → constants → server handler → client form.

### Connect to skeleton-tasks

1. In skeleton-automation, create a workflow with a webhook trigger at `/hooks/task-updated`
2. In skeleton-tasks, add a post-save hook that POSTs to `http://skeleton-automation:3002/api/hooks/task-updated` with the task data
3. The automation workflow receives the task data as trigger input and can run any actions

### Add Webhook Signing

For production webhook security:

```typescript
// In hooks.ts route handler:
const signature = req.headers["x-webhook-signature"];
const expected = crypto
  .createHmac("sha256", workflow.metadata.webhook_secret)
  .update(JSON.stringify(req.body))
  .digest("hex");
if (signature !== expected) {
  return res.status(401).json({ error: "Invalid signature" });
}
```

### Add Rate Limiting

```typescript
// In server/src/index.ts:
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
app.use("/api/hooks", limiter);
```

## API Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... }
}
```

Errors:
```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

## Database Query Patterns

- Use `query<T>()` for multiple rows, `queryOne<T>()` for single row
- Use `getPool()` and manual client for transactions
- Always `JSON.stringify()` when inserting JSONB fields
- Row mapper functions convert DB column names (snake_case) to API format

## Template Variables

Actions support `{{variable}}` interpolation from trigger data:

```
trigger_data = { title: "Fix bug", priority: "urgent", user: { name: "Alice" } }

"{{title}}"        → "Fix bug"
"{{user.name}}"    → "Alice"
"{{missing}}"      → ""
```

## Testing Workflows

1. Use the manual trigger button in the UI
2. Or `POST /api/workflows/:id/trigger` with test payload
3. Or `POST /api/hooks/:path` to test webhook triggers
4. Check run history for results and errors
