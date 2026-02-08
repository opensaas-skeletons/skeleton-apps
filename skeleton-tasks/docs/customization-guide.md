# Customization Guide

## Changing the Color Theme

Edit `client/tailwind.config.js` to modify the color palette:

```js
// The skeleton uses two color scales:
// - "brand" for primary accent colors (buttons, highlights)
// - "surface" for backgrounds, borders, and text
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          // ... change these to your brand colors
          600: '#2563eb',
          700: '#1d4ed8',
        },
        surface: {
          50: '#f9fafb',
          100: '#f3f4f6',
          // ... change these for a different neutral tone
        },
      },
    },
  },
};
```

For a dark mode, add a `dark:` variant to Tailwind classes in the components, or use a CSS custom property approach.

## Adding or Changing Default Columns

Edit `shared/constants.ts`:

```ts
export const DEFAULT_COLUMNS = [
  { title: "Backlog", color: "#6B7280" },
  { title: "To Do", color: "#3B82F6" },
  { title: "In Progress", color: "#F59E0B" },
  { title: "Review", color: "#8B5CF6" },
  { title: "Done", color: "#10B981" },
];
```

Change titles, add/remove columns, or update colors. These are used when creating new boards and during the initial seed.

**Note:** Existing boards in the database won't be affected. This only changes the defaults for new boards.

## Adding New Task Fields via Metadata

The `metadata` field on tasks is a JSONB column that can store any JSON data. This is the easiest way to extend tasks without a database migration.

### Example: Adding a "Story Points" Field

1. **Save the data** — When creating/updating a task, include it in metadata:
   ```ts
   // In your API call or TaskModal save handler
   const taskInput = {
     title: "My task",
     metadata: { story_points: 5 },
   };
   ```

2. **Display it** — In `TaskCard.tsx`, read from `task.metadata`:
   ```tsx
   {task.metadata?.story_points && (
     <span className="text-[11px] text-surface-400">
       {task.metadata.story_points} pts
     </span>
   )}
   ```

3. **Add input** — In `TaskModal.tsx`, add a number input that reads/writes `metadata.story_points`.

### Metadata vs. Schema Fields

Use metadata when:
- The field is optional and not needed for queries
- You want to avoid a database migration
- The field is specific to your customization

Use a schema field (migration) when:
- You need to query/filter/sort by the field in SQL
- The field is required for all tasks
- You need database-level constraints

## Customizing the UI Layout

### Changing the Header

Edit `client/src/components/Header.tsx` to modify the top navigation bar. Add logo, navigation links, user menu, etc.

### Changing Column Width

The column width is controlled in `client/src/components/Column.tsx`. Look for the `min-w-` and `w-` Tailwind classes.

### Changing Card Appearance

Edit `client/src/components/TaskCard.tsx`. The card layout uses:
- Priority color bar on the left edge
- Title at the top
- Description preview
- Labels as small badges
- Footer with due date, assignee, and priority badge

### Adding a Sidebar

1. Create `client/src/components/Sidebar.tsx`
2. In `App.tsx`, wrap the main content in a flex container:
   ```tsx
   <div className="h-screen flex">
     <Sidebar boards={boards} selectedId={selectedBoardId} onSelect={setSelectedBoardId} />
     <div className="flex-1 flex flex-col">
       {/* existing Header + Board content */}
     </div>
   </div>
   ```
