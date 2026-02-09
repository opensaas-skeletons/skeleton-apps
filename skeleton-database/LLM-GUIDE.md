# LLM Guide

This guide helps LLMs navigate and modify the skeleton-database codebase.

## File Map

### shared/

| File | Purpose |
|------|---------|
| `shared/index.ts` | Package entry point, re-exports all types and constants |
| `shared/types/database.ts` | All TypeScript types: entities, inputs, queries, responses, interop, CSV |
| `shared/constants.ts` | Field type definitions, color palettes, default configs, pagination limits |
| `shared/package.json` | Package config for `@skeleton-database/shared` |
| `shared/tsconfig.json` | TypeScript compiler options |

### server/src/

| File | Purpose |
|------|---------|
| `server/src/index.ts` | Express app setup, middleware, route mounting |
| `server/src/db/connection.ts` | PostgreSQL pool creation and export |
| `server/src/db/migrations/001_initial.ts` | Creates all five tables (bases, tables, fields, rows, views) with seed data |
| `server/src/services/baseService.ts` | CRUD operations for bases |
| `server/src/services/tableService.ts` | CRUD for tables, auto-creates default fields and grid view |
| `server/src/services/fieldService.ts` | CRUD for fields, position management |
| `server/src/services/rowService.ts` | CRUD for rows, JSONB filtering/sorting/search, pagination |
| `server/src/services/viewService.ts` | CRUD for views |
| `server/src/services/interopService.ts` | Export bases to interop JSON, import from interop JSON, CSV import/export |
| `server/src/routes/baseRoutes.ts` | REST endpoints for `/api/bases` |
| `server/src/routes/tableRoutes.ts` | REST endpoints for `/api/tables` |
| `server/src/routes/fieldRoutes.ts` | REST endpoints for `/api/fields` |
| `server/src/routes/rowRoutes.ts` | REST endpoints for `/api/rows` with query params for filtering |
| `server/src/routes/viewRoutes.ts` | REST endpoints for `/api/views` |
| `server/src/routes/interopRoutes.ts` | Export/import endpoints at `/api/interop` |
| `server/src/middleware/errorHandler.ts` | Global error handling middleware |

### client/src/

| File | Purpose |
|------|---------|
| `client/src/main.tsx` | React app entry, QueryClientProvider setup |
| `client/src/App.tsx` | Top-level layout, routing, base/table selection state |
| `client/src/api/client.ts` | Typed fetch wrapper for all API endpoints |
| `client/src/hooks/useBases.ts` | React Query hooks for base CRUD |
| `client/src/hooks/useTables.ts` | React Query hooks for table CRUD |
| `client/src/hooks/useFields.ts` | React Query hooks for field CRUD |
| `client/src/hooks/useRows.ts` | React Query hooks for row CRUD with pagination and filtering |
| `client/src/hooks/useViews.ts` | React Query hooks for view CRUD |
| `client/src/components/BaseList.tsx` | Sidebar listing all bases with create/edit/delete |
| `client/src/components/TableView.tsx` | Main content area, tab bar for tables, view switcher |
| `client/src/components/GridView.tsx` | Spreadsheet grid with inline editing, keyboard nav |
| `client/src/components/FormView.tsx` | Form-based data entry view |
| `client/src/components/FieldEditor.tsx` | Modal/popover for creating and configuring fields |
| `client/src/components/CellRenderer.tsx` | Renders cell content based on field type |
| `client/src/components/FilterBar.tsx` | UI for adding/removing filters and sorts |

## Recipes

### How to Add a New Field Type

1. **Add the type to `shared/types/database.ts`**: Add the new value to the `FieldType` union type.

2. **Add constants in `shared/constants.ts`**: Add entries to `FIELD_TYPES`, `FIELD_TYPE_LABELS`, and `FIELD_TYPE_COLORS`.

3. **Extend `FieldConfig` if needed**: If the new type has configuration options (like select has `options`), add the new properties to the `FieldConfig` interface in `shared/types/database.ts`.

4. **Add cell rendering in `client/src/components/CellRenderer.tsx`**: Add a case to the switch statement that renders the cell value for the new type. Handle both display mode and edit mode.

5. **Add filtering support in `server/src/services/rowService.ts`**: Update the filter query builder to handle the new type's comparison operators (e.g., how to filter/sort JSONB values of this type).

6. **Add form input in `client/src/components/FormView.tsx`**: Add a case for the new field type in the form input renderer.

7. **Update field editor in `client/src/components/FieldEditor.tsx`**: If the type has config options, add the config UI to the field editor.

8. **Handle CSV import/export in `server/src/services/interopService.ts`**: Define how the new type serializes to/from CSV string values.

### How to Add a New View Type

1. **Add the type to `shared/types/database.ts`**: Add the new value to the `ViewType` union type (e.g., `"kanban"`, `"calendar"`, `"gallery"`).

2. **Extend `ViewConfig` if needed**: Add any view-specific configuration fields (e.g., `group_field_id` for kanban).

3. **Create the view component**: Create a new file in `client/src/components/` (e.g., `KanbanView.tsx`). The component receives the table, fields, rows, and view config as props.

4. **Register in `client/src/components/TableView.tsx`**: Add the new view type to the view switcher and render the correct component based on `view.view_type`.

5. **Add server-side support**: If the view type requires different data fetching (e.g., grouping), add a new query method in `server/src/services/rowService.ts` and a route in `server/src/routes/rowRoutes.ts`.

### How to Add Formula Support

Formulas are defined as a field type but need an evaluation engine:

1. **Define formula syntax**: Decide on supported operations. A minimal set: `FIELD("Title")`, basic arithmetic (`+`, `-`, `*`, `/`), string concatenation, `IF(condition, then, else)`, `SUM()`, `COUNT()`.

2. **Create a formula parser**: Add `server/src/services/formulaEngine.ts`. Parse the formula string into an AST, then evaluate it against a row's data and the table's field definitions.

3. **Evaluate on read**: In `rowService.ts`, after fetching rows, compute formula field values by running each formula against the row data. Formula values are not stored in the database -- they are computed at query time.

4. **Client display**: Formula cells in `CellRenderer.tsx` should be read-only and show the computed result. The field editor should provide a text input for the formula string.

5. **Handle dependencies**: If formula A references formula B, evaluate in dependency order. Detect circular references and return an error value.

### How to Add Kanban View

1. **Add `"kanban"` to `ViewType`** in `shared/types/database.ts`.

2. **Extend `ViewConfig`** with `group_field_id: string` -- the select/status field to group by.

3. **Create `client/src/components/KanbanView.tsx`**:
   - Fetch all rows for the table
   - Group rows by the value of the `group_field_id` field
   - Render columns for each select option
   - Support drag-and-drop between columns (update the row's data for that field)
   - Render cards showing the primary field (first text field) and optionally other fields

4. **Add drag-and-drop**: Use a library like `@dnd-kit/core` or implement native drag events. On drop, call `updateRow` to change the select field value.

5. **Register in `TableView.tsx`**: Add kanban to the view type selector and render `KanbanView` when selected.

### How to Add Real-Time Updates

1. **Add WebSocket server**: Install `ws` or use `socket.io`. Create `server/src/ws.ts` that upgrades HTTP connections and manages client subscriptions.

2. **Subscribe by table**: Clients subscribe to a table ID. When any row, field, or view in that table changes, broadcast the change to all subscribers.

3. **Emit on mutations**: In each service (rowService, fieldService, etc.), after a successful write operation, emit an event through the WebSocket server with the change type and payload.

4. **Client integration**: Create a `useWebSocket` hook in the client. On receiving a message, invalidate the relevant React Query cache keys to trigger a refetch.

5. **Conflict resolution**: For concurrent cell edits, use last-write-wins semantics. The server always returns the latest value, and the client's optimistic update is replaced by the server response.

6. **Message format**:
   ```json
   {
     "type": "row_updated",
     "table_id": "...",
     "row_id": "...",
     "data": { "field_id": "new_value" }
   }
   ```
