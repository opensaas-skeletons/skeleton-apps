# Open SaaS Task Standard v1.0

## Overview

The Open SaaS Task Standard defines a JSON format for exchanging task/project data between skeleton-based applications. Any application that implements this standard can export its data and import it into another compatible application.

## ExportPayload Format

```json
{
  "version": "1.0",
  "exported_at": "2024-01-15T10:30:00.000Z",
  "source": "skeleton-tasks",
  "boards": [
    {
      "title": "My Project",
      "description": "Project description",
      "columns": [
        {
          "title": "To Do",
          "position": 0,
          "wip_limit": null,
          "color": "#3B82F6"
        }
      ],
      "tasks": [
        {
          "title": "Task title",
          "description": "Task description (Markdown supported)",
          "column_title": "To Do",
          "priority": "medium",
          "assignee": "user@example.com",
          "labels": ["backend", "api"],
          "due_date": "2024-02-01T00:00:00.000Z",
          "position": 0,
          "created_at": "2024-01-15T10:30:00.000Z",
          "metadata": {}
        }
      ]
    }
  ]
}
```

## Field Reference

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Must be `"1.0"` for this version of the standard |
| `exported_at` | string | Yes | ISO 8601 timestamp of when the export was created |
| `source` | string | Yes | Identifier for the application that created the export |
| `boards` | array | Yes | Array of `BoardExport` objects |

### BoardExport Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Board name |
| `description` | string | Yes | Board description (may be empty string) |
| `columns` | array | Yes | Array of column definitions |
| `tasks` | array | Yes | Array of task objects (may be empty) |

### Column Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Column name (used as reference key for tasks) |
| `position` | number | Yes | Sort order, 0-based |
| `wip_limit` | number\|null | Yes | Maximum tasks allowed, null = unlimited |
| `color` | string\|null | Yes | Hex color code (e.g., `"#3B82F6"`), null = default |

### Task Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Task name |
| `description` | string | Yes | Task description, Markdown supported (may be empty) |
| `column_title` | string | Yes | References a column by title (not by ID) |
| `priority` | string | Yes | One of: `"low"`, `"medium"`, `"high"`, `"urgent"` |
| `assignee` | string\|null | Yes | User identifier or null if unassigned |
| `labels` | string[] | Yes | Array of freeform tags (may be empty) |
| `due_date` | string\|null | Yes | ISO 8601 timestamp or null |
| `position` | number | Yes | Sort order within the column, 0-based |
| `created_at` | string | Yes | ISO 8601 timestamp |
| `metadata` | object | Yes | Extensible key-value store (may be empty `{}`) |

## Key Design Decisions

### Column References by Title

Tasks reference their column by `column_title` (a string) rather than by an internal ID (UUID). This makes the export portable — column IDs are implementation-specific and differ between applications.

**Import behavior:** When importing, the application builds a `column_title → column_id` map from the newly created columns, then resolves each task's `column_title` to the correct `column_id`.

**Edge case:** If a task references a `column_title` that doesn't exist in the board's columns array, the importing application should skip that task and log a warning.

### Metadata Extensibility

The `metadata` field on tasks is a JSON object that can contain any key-value pairs. This is the primary extension mechanism:

- Applications can store custom fields (e.g., `story_points`, `time_estimate`) in metadata
- Other applications will preserve these fields during import/export but may not display them
- The metadata field must always be present (use `{}` if empty)

**Examples:**
```json
{ "story_points": 5, "sprint": "Sprint 12" }
{ "time_estimate_hours": 4, "client": "Acme Corp" }
{ "github_issue": "#142", "complexity": "high" }
```

### Required vs Optional Fields

All fields listed above are **required** in the export format. Fields that represent "no value" use `null` (for `assignee`, `due_date`, `wip_limit`, `color`) or empty collections (`[]` for labels, `{}` for metadata, `""` for description).

This simplifies import validation — consumers can check for field presence without handling undefined values.

## Version Negotiation

For v1.0, the version field must be exactly `"1.0"`. Future versions of this standard will increment the version number.

**Forward compatibility:** Applications should reject payloads with unrecognized version numbers rather than attempting to parse them. This prevents silent data loss from incompatible format changes.

**Planned for v2.0:**
- Column WIP limit enforcement metadata
- Task dependency/blocking relationships
- User/team member definitions
- Board-level metadata

## Compliance Checklist

An application is compliant with this standard if it can:

- [ ] **Export** all boards, columns, and tasks in the `ExportPayload` format
- [ ] **Include** all required fields with correct types
- [ ] **Reference** columns by title in task exports (not by internal ID)
- [ ] **Import** a valid `ExportPayload` and create boards, columns, and tasks
- [ ] **Resolve** `column_title` references back to internal column IDs during import
- [ ] **Preserve** the `metadata` field through export and import cycles
- [ ] **Validate** the `version` field on import and reject unknown versions
- [ ] **Validate** the `boards` field on import and reject malformed payloads
- [ ] **Handle** missing columns gracefully (skip tasks with unresolvable `column_title`)
- [ ] **Round-trip** data: export → import → re-export produces equivalent data
