# Cross-Skeleton Connection Guide

This document shows how to connect skeleton-automation to other skeleton apps, proving that the ecosystem concept works.

## Connecting skeleton-automation to skeleton-tasks

### Scenario: "When a task moves to Done, send a notification"

#### Step 1: Create a webhook workflow in skeleton-automation

1. Open skeleton-automation at `http://YOUR_SERVER_IP:5174`
2. Click **New Workflow**
3. Configure:
   - **Title:** "Task Completed Notification"
   - **Trigger:** Webhook, path `/hooks/task-completed`
   - **Conditions:** (optional) field `column_title` equals `Done`
   - **Action:** HTTP Request or Email with the notification content
4. Enable and save the workflow

#### Step 2: Configure skeleton-tasks to POST to the webhook

In skeleton-tasks, you need to add a webhook call when tasks move between columns. This can be done by modifying the task service:

**In `skeleton-tasks/server/src/services/task.service.ts`**, add after a successful task move:

```typescript
// After the task move transaction commits:
const webhookUrl = process.env.AUTOMATION_WEBHOOK_URL;
if (webhookUrl) {
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "task.moved",
      task_id: id,
      title: result.title,
      from_column: oldColumnTitle,
      to_column: newColumnTitle,
      assignee: result.assignee,
      timestamp: new Date().toISOString(),
    }),
  }).catch((err) => {
    console.error("Webhook notification failed:", err.message);
  });
}
```

**In `skeleton-tasks/.env`**, add:
```
AUTOMATION_WEBHOOK_URL=http://skeleton-automation:3002/api/hooks/task-completed
```

If running both in Docker on the same network, use the service name. If on different machines, use the server IP.

### Scenario: "Every Monday, create a weekly planning task"

#### Step 1: Create a scheduled workflow in skeleton-automation

1. **Title:** "Weekly Planning Task"
2. **Trigger:** Schedule, cron `0 9 * * 1` (Monday 9am)
3. **Action:** HTTP Request
   - Method: POST
   - URL: `http://skeleton-tasks:3001/api/boards/BOARD_ID/tasks`
   - Body:
   ```json
   {
     "title": "Weekly Planning - {{date}}",
     "description": "Review priorities and plan the week ahead.",
     "priority": "medium",
     "column_id": "COLUMN_ID"
   }
   ```

Replace `BOARD_ID` and `COLUMN_ID` with actual IDs from your skeleton-tasks instance.

### Scenario: "New webhook trigger creates a task"

#### skeleton-automation workflow:

1. **Trigger:** Webhook at `/hooks/new-request`
2. **Action 1:** Transform — extract and format the data
   ```javascript
   return {
     title: "Handle request: " + input.payload.subject,
     description: input.payload.body || "No description",
     priority: input.payload.urgent ? "high" : "medium"
   }
   ```
3. **Action 2:** HTTP Request — POST to skeleton-tasks to create the task

## Docker Network Setup

When running both skeleton-tasks and skeleton-automation in Docker, they can communicate using Docker networking:

### Option A: Shared Docker Network

```bash
# Create a shared network
docker network create skeleton-network

# In skeleton-tasks/docker-compose.yml, add:
networks:
  default:
    external:
      name: skeleton-network

# In skeleton-automation/docker-compose.yml, add:
networks:
  default:
    external:
      name: skeleton-network
```

Now skeleton-automation can reach skeleton-tasks at `http://skeleton-tasks-server-1:3001`.

### Option B: Host Networking

Use the host machine's IP address in webhook URLs:

```
http://YOUR_SERVER_IP:3001/api/boards/BOARD_ID/tasks
```

## Event Format Convention

When skeleton apps send events to each other, use this format:

```json
{
  "event": "resource.action",
  "source": "skeleton-tasks",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "data": {
    // Resource-specific fields
  }
}
```

### Standard Events

| App | Event | Description |
|-----|-------|-------------|
| skeleton-tasks | `task.created` | New task created |
| skeleton-tasks | `task.moved` | Task moved between columns |
| skeleton-tasks | `task.updated` | Task details changed |
| skeleton-tasks | `task.deleted` | Task deleted |
| skeleton-automation | `workflow.completed` | Workflow run finished |
| skeleton-automation | `workflow.failed` | Workflow run failed |
