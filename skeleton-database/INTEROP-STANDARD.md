# Database Interop Standard v1.0

This document defines the portable JSON format for exporting and importing database bases across skeleton ecosystem applications and compatible third-party tools.

## Overview

The interop format captures a complete snapshot of one or more bases, including their tables, fields, rows, and views. The format is designed to be human-readable, self-contained, and independent of internal database IDs.

## Export Format

The top-level payload follows the `DatabaseExportPayload` type:

```json
{
  "version": "1.0",
  "exported_at": "2026-02-08T12:00:00.000Z",
  "source": "skeleton-database",
  "bases": [
    {
      "title": "Project Tracker",
      "description": "Track project tasks and milestones",
      "icon": "database",
      "color": "#3b82f6",
      "tables": [
        {
          "title": "Tasks",
          "description": "All project tasks",
          "fields": [
            {
              "title": "Task Name",
              "field_type": "text",
              "config": {},
              "required": true
            },
            {
              "title": "Status",
              "field_type": "select",
              "config": {
                "options": [
                  { "label": "To Do", "color": "#64748b" },
                  { "label": "In Progress", "color": "#3b82f6" },
                  { "label": "Done", "color": "#22c55e" }
                ]
              },
              "required": false
            },
            {
              "title": "Priority",
              "field_type": "number",
              "config": { "precision": 0 },
              "required": false
            }
          ],
          "rows": [
            {
              "data": {
                "Task Name": "Design database schema",
                "Status": "Done",
                "Priority": 1
              }
            },
            {
              "data": {
                "Task Name": "Implement API",
                "Status": "In Progress",
                "Priority": 2
              }
            }
          ],
          "views": [
            {
              "title": "All Tasks",
              "view_type": "grid"
            }
          ]
        }
      ]
    }
  ]
}
```

## Field Definitions

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `version` | `"1.0"` | Interop standard version |
| `exported_at` | `string` | ISO 8601 timestamp of when the export was created |
| `source` | `string` | Identifier of the application that created the export |
| `bases` | `BaseExport[]` | Array of base exports |

### Base Export

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | Base name |
| `description` | `string` | Base description |
| `icon` | `string` | Icon identifier |
| `color` | `string` | Hex color code |
| `tables` | `TableExport[]` | Array of table exports |

### Table Export

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | Table name |
| `description` | `string` | Table description |
| `fields` | `FieldExport[]` | Array of field definitions |
| `rows` | `RowExport[]` | Array of row data |
| `views` | `ViewExport[]` | Array of view definitions |

### Field Export

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | Field name (used as key in row data) |
| `field_type` | `FieldType` | One of the 13 supported field types |
| `config` | `FieldConfig` | Type-specific configuration |
| `required` | `boolean` | Whether the field is required |

### Row Export

| Property | Type | Description |
|----------|------|-------------|
| `data` | `Record<string, unknown>` | Key-value pairs where keys are field **titles** |

### View Export

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | View name |
| `view_type` | `ViewType` | View type identifier |

## Import Rules

### ID Generation

All internal IDs (base, table, field, row, view) are generated fresh on import. The interop format does not include IDs. This means:

- Importing the same payload twice creates two independent copies
- There is no merge or sync behavior -- import is always additive

### Field Ordering

Fields are imported in the order they appear in the `fields` array. The position is assigned sequentially starting from 0.

### Row Data Mapping

Row data keys are field **titles**, not field IDs. During import:

1. The importer creates all fields for a table first
2. A mapping from field title to field UUID is built
3. Each row's data is transformed from title-keyed to UUID-keyed
4. The transformed data is inserted into the rows table

This means field titles must be unique within a table for correct import. If duplicate field titles exist, the last field with that title wins.

### Default View

If a table in the import payload has no views, the importer creates a default grid view with an empty configuration.

### Validation

On import, the following validations are performed:

- `version` must be `"1.0"`
- `bases` must be a non-empty array
- Each base must have a `title` and at least one table
- Each table must have a `title` and at least one field
- Each field must have a valid `field_type`
- Row data keys must match field titles defined in the same table

Invalid rows are skipped with errors collected in the import result. Valid rows are still imported.

## Field Type Mapping

When importing from external sources, map field types as follows:

| External Type | Maps To | Notes |
|---------------|---------|-------|
| `string`, `varchar`, `char` | `text` | |
| `text`, `longtext`, `textarea` | `long_text` | |
| `integer`, `float`, `decimal`, `numeric` | `number` | Set `precision` in config |
| `boolean`, `bool` | `checkbox` | |
| `enum`, `choice` | `select` | Convert values to `options` array |
| `set`, `multiselect` | `multi_select` | |
| `date`, `datetime`, `timestamp` | `date` | Normalize to ISO 8601 |
| `email` | `email` | |
| `url`, `link` | `url` | |
| `phone`, `tel` | `phone` | |
| Unknown types | `text` | Fallback |

## CSV Compatibility

The interop format can be converted to/from CSV:

### CSV Export

- One CSV file per table
- Header row uses field titles
- Each subsequent row contains the field values
- Multi-select values are joined with `, ` (comma-space)
- Checkbox values are `true` or `false`
- Empty cells are empty strings

### CSV Import

- The first row is treated as field titles
- Field types are inferred from the data:
  - Values matching `true`/`false` (case-insensitive) become `checkbox`
  - Values matching numeric patterns become `number`
  - Values matching email patterns become `email`
  - Values matching URL patterns become `url`
  - Values matching date patterns become `date`
  - Everything else becomes `text`
- Type inference examines all rows before deciding the field type

## Versioning

The interop standard uses semantic versioning. The `version` field in the payload indicates which version of the standard the payload conforms to.

- **1.0**: Initial release with support for all 13 field types, grid and form views
- Future versions will maintain backward compatibility where possible
- Importers should reject payloads with an unrecognized major version
- Importers should accept payloads with a recognized major version but unknown minor version, ignoring unknown fields
