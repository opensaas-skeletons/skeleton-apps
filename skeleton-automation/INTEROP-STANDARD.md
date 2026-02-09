# Interop Standard — Skeleton Automation

## Overview

Skeleton Automation uses a JSON-based export/import format for data portability. This standard ensures workflows can be moved between instances, backed up, and shared.

## Export Format

```json
{
  "version": "1.0",
  "exported_at": "2025-01-15T10:30:00.000Z",
  "source": "skeleton-automation",
  "workflows": [
    {
      "title": "Daily Standup Reminder",
      "description": "Posts a standup reminder every weekday at 9am.",
      "enabled": true,
      "trigger": {
        "type": "schedule",
        "config": {
          "cron": "0 9 * * 1-5",
          "timezone": "UTC"
        }
      },
      "conditions": [],
      "actions": [
        {
          "type": "http",
          "config": {
            "method": "POST",
            "url": "https://hooks.example.com/standup",
            "headers": { "Content-Type": "application/json" },
            "body": { "text": "Time for standup!" }
          }
        }
      ],
      "metadata": {
        "category": "team"
      }
    }
  ]
}
```

## TypeScript Interface

```typescript
interface AutomationExportPayload {
  version: "1.0";
  exported_at: string;        // ISO 8601 timestamp
  source: string;             // App identifier
  workflows: WorkflowExport[];
}

interface WorkflowExport {
  title: string;
  description: string;
  enabled: boolean;
  trigger: TriggerConfig;
  conditions: Condition[];
  actions: ActionConfig[];
  metadata: Record<string, unknown>;
}
```

## Key Design Decisions

1. **No IDs in export** — Workflows are identified by title, not UUID. IDs are assigned on import.
2. **Self-contained** — Each workflow export contains all its configuration. No external references.
3. **Metadata preserved** — The metadata field carries through export/import for extensibility.
4. **Import as disabled** — Imported workflows are disabled by default for safety. Users must explicitly enable them.

## Endpoints

### Export

```
GET /api/export
```

Returns the full export payload with all workflows.

### Import

```
POST /api/import
Content-Type: application/json

{
  "version": "1.0",
  "exported_at": "...",
  "source": "...",
  "workflows": [...]
}
```

Returns:
```json
{
  "success": true,
  "data": {
    "imported_workflows": 3,
    "total_in_payload": 3
  }
}
```

## Cross-Skeleton Compatibility

The interop standard is designed for the skeleton ecosystem. Each skeleton app has its own export format:

| App | Export Key | Format |
|-----|-----------|--------|
| skeleton-tasks | `boards` | Boards with columns and tasks |
| skeleton-automation | `workflows` | Workflow definitions |
| skeleton-crm | `contacts` | Contact records (future) |

All skeleton apps share the same envelope: `{ version, exported_at, source, [data] }`.
