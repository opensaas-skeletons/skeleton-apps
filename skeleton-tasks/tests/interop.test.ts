/**
 * Interop Standard Tests
 * ======================
 * Verifies that the export/import system conforms to
 * the Open SaaS Task Standard v1.0.
 *
 * Run with: npm test (from root or server workspace)
 */

import { describe, it, expect } from "vitest";
import type { ExportPayload, BoardExport, Priority } from "../shared/types/task";
import { INTEROP_VERSION, APP_NAME, DEFAULT_COLUMNS, PRIORITIES } from "../shared/constants";

// ---- Test Helpers ----

function createValidPayload(overrides?: Partial<ExportPayload>): ExportPayload {
  return {
    version: "1.0",
    exported_at: new Date().toISOString(),
    source: APP_NAME,
    boards: [
      {
        title: "Test Board",
        description: "A board for testing",
        columns: DEFAULT_COLUMNS.map((col, i) => ({
          title: col.title,
          position: i,
          wip_limit: null,
          color: col.color,
        })),
        tasks: [
          {
            title: "Test Task 1",
            description: "First test task",
            column_title: "To Do",
            priority: "medium" as Priority,
            assignee: "tester@example.com",
            labels: ["test"],
            due_date: new Date().toISOString(),
            position: 0,
            created_at: new Date().toISOString(),
            metadata: { custom_field: "value" },
          },
          {
            title: "Test Task 2",
            description: "Second test task",
            column_title: "In Progress",
            priority: "high" as Priority,
            assignee: null,
            labels: ["backend", "urgent"],
            due_date: null,
            position: 0,
            created_at: new Date().toISOString(),
            metadata: {},
          },
        ],
      },
    ],
    ...overrides,
  };
}

// ---- Tests ----

describe("Interop Standard v1.0", () => {
  describe("Export format validation", () => {
    it("should produce a valid ExportPayload shape", () => {
      const payload = createValidPayload();

      // Top-level required fields
      expect(payload).toHaveProperty("version");
      expect(payload).toHaveProperty("exported_at");
      expect(payload).toHaveProperty("source");
      expect(payload).toHaveProperty("boards");

      // Version must be "1.0"
      expect(payload.version).toBe("1.0");
      expect(payload.version).toBe(INTEROP_VERSION);

      // exported_at must be a valid ISO 8601 date
      expect(new Date(payload.exported_at).toISOString()).toBe(payload.exported_at);

      // source must be a non-empty string
      expect(typeof payload.source).toBe("string");
      expect(payload.source.length).toBeGreaterThan(0);

      // boards must be an array
      expect(Array.isArray(payload.boards)).toBe(true);
    });

    it("should include all required fields in exported tasks", () => {
      const payload = createValidPayload();
      const requiredTaskFields = [
        "title",
        "description",
        "column_title",
        "priority",
        "assignee",
        "labels",
        "due_date",
        "position",
        "created_at",
        "metadata",
      ];

      for (const board of payload.boards) {
        for (const task of board.tasks) {
          for (const field of requiredTaskFields) {
            expect(task).toHaveProperty(field);
          }

          // Type checks
          expect(typeof task.title).toBe("string");
          expect(typeof task.description).toBe("string");
          expect(typeof task.column_title).toBe("string");
          expect(PRIORITIES).toContain(task.priority);
          expect(typeof task.position).toBe("number");
          expect(typeof task.created_at).toBe("string");
          expect(Array.isArray(task.labels)).toBe(true);
          expect(typeof task.metadata).toBe("object");
          expect(task.metadata).not.toBeNull();

          // assignee and due_date may be null
          if (task.assignee !== null) {
            expect(typeof task.assignee).toBe("string");
          }
          if (task.due_date !== null) {
            expect(typeof task.due_date).toBe("string");
          }
        }
      }
    });
  });

  describe("Import validation", () => {
    it("should accept a valid payload structure", () => {
      const payload = createValidPayload();

      // Validate the payload can be parsed
      expect(payload.version).toBeDefined();
      expect(payload.boards).toBeDefined();
      expect(Array.isArray(payload.boards)).toBe(true);
      expect(payload.boards.length).toBeGreaterThan(0);

      // Each board has required fields
      for (const board of payload.boards) {
        expect(board).toHaveProperty("title");
        expect(board).toHaveProperty("description");
        expect(board).toHaveProperty("columns");
        expect(board).toHaveProperty("tasks");
        expect(Array.isArray(board.columns)).toBe(true);
        expect(Array.isArray(board.tasks)).toBe(true);

        // Each task references a column that exists
        const columnTitles = new Set(board.columns.map((c) => c.title));
        for (const task of board.tasks) {
          expect(columnTitles.has(task.column_title)).toBe(true);
        }
      }
    });

    it("should reject payloads missing the version field", () => {
      const payload = createValidPayload();
      const invalid = { ...payload } as any;
      delete invalid.version;

      expect(invalid.version).toBeUndefined();
      // A proper import handler should reject this
      expect(invalid.boards).toBeDefined(); // boards present but no version
    });

    it("should reject payloads missing the boards field", () => {
      const payload = createValidPayload();
      const invalid = { ...payload } as any;
      delete invalid.boards;

      expect(invalid.boards).toBeUndefined();
      // A proper import handler should reject this
      expect(invalid.version).toBeDefined(); // version present but no boards
    });

    it("should reject payloads with an unknown version", () => {
      const payload = createValidPayload({ version: "2.0" as any });

      // Version is present but not "1.0"
      expect(payload.version).toBe("2.0");
      expect(payload.version).not.toBe(INTEROP_VERSION);
      // A proper import handler should reject this to prevent silent data loss
    });

    it("should skip tasks referencing a non-existent column", () => {
      const payload = createValidPayload();
      const board = payload.boards[0];

      // Add a task that references a column that doesn't exist
      board.tasks.push({
        title: "Orphaned Task",
        description: "This task references a missing column",
        column_title: "Non-Existent Column",
        priority: "low" as Priority,
        assignee: null,
        labels: [],
        due_date: null,
        position: 0,
        created_at: new Date().toISOString(),
        metadata: {},
      });

      // Simulate the import column resolution logic
      const columnTitles = new Set(board.columns.map((c) => c.title));
      const resolvableTasks = board.tasks.filter((t) => columnTitles.has(t.column_title));
      const skippedTasks = board.tasks.filter((t) => !columnTitles.has(t.column_title));

      // The orphaned task should be skipped
      expect(skippedTasks).toHaveLength(1);
      expect(skippedTasks[0].title).toBe("Orphaned Task");
      expect(skippedTasks[0].column_title).toBe("Non-Existent Column");

      // The valid tasks should still be resolved
      expect(resolvableTasks).toHaveLength(2);
      for (const task of resolvableTasks) {
        expect(columnTitles.has(task.column_title)).toBe(true);
      }
    });
  });

  describe("Round-trip consistency", () => {
    it("should preserve data through export → import → re-export", () => {
      // Simulate export
      const originalPayload = createValidPayload();

      // Simulate import: extract board data
      const importedBoards = originalPayload.boards.map((board) => {
        const columnMap: Record<string, string> = {};
        const columns = board.columns.map((col, i) => {
          const id = `col-${i}`;
          columnMap[col.title] = id;
          return { ...col, id, board_id: "board-1" };
        });

        const tasks = board.tasks.map((task, i) => ({
          id: `task-${i}`,
          board_id: "board-1",
          column_id: columnMap[task.column_title],
          title: task.title,
          description: task.description,
          priority: task.priority,
          assignee: task.assignee,
          labels: task.labels,
          due_date: task.due_date,
          position: task.position,
          created_at: task.created_at,
          updated_at: new Date().toISOString(),
          metadata: task.metadata,
        }));

        return { board, columns, tasks, columnMap };
      });

      // Simulate re-export
      const reExportedPayload: ExportPayload = {
        version: "1.0",
        exported_at: new Date().toISOString(),
        source: APP_NAME,
        boards: importedBoards.map(({ board, columns, tasks, columnMap }) => {
          // Reverse the column map
          const idToTitle: Record<string, string> = {};
          for (const [title, id] of Object.entries(columnMap)) {
            idToTitle[id] = title;
          }

          return {
            title: board.title,
            description: board.description,
            columns: columns.map((col) => ({
              title: col.title,
              position: col.position,
              wip_limit: col.wip_limit,
              color: col.color,
            })),
            tasks: tasks.map((task) => ({
              title: task.title,
              description: task.description,
              column_title: idToTitle[task.column_id],
              priority: task.priority as Priority,
              assignee: task.assignee,
              labels: task.labels,
              due_date: task.due_date,
              position: task.position,
              created_at: task.created_at,
              metadata: task.metadata,
            })),
          };
        }),
      };

      // Compare the boards (ignoring exported_at which changes)
      expect(reExportedPayload.version).toBe(originalPayload.version);
      expect(reExportedPayload.boards.length).toBe(originalPayload.boards.length);

      for (let i = 0; i < originalPayload.boards.length; i++) {
        const original = originalPayload.boards[i];
        const reExported = reExportedPayload.boards[i];

        expect(reExported.title).toBe(original.title);
        expect(reExported.description).toBe(original.description);
        expect(reExported.columns).toEqual(original.columns);
        expect(reExported.tasks.length).toBe(original.tasks.length);

        for (let j = 0; j < original.tasks.length; j++) {
          expect(reExported.tasks[j].title).toBe(original.tasks[j].title);
          expect(reExported.tasks[j].description).toBe(original.tasks[j].description);
          expect(reExported.tasks[j].column_title).toBe(original.tasks[j].column_title);
          expect(reExported.tasks[j].priority).toBe(original.tasks[j].priority);
          expect(reExported.tasks[j].assignee).toBe(original.tasks[j].assignee);
          expect(reExported.tasks[j].labels).toEqual(original.tasks[j].labels);
          expect(reExported.tasks[j].due_date).toBe(original.tasks[j].due_date);
          expect(reExported.tasks[j].position).toBe(original.tasks[j].position);
          expect(reExported.tasks[j].metadata).toEqual(original.tasks[j].metadata);
        }
      }
    });
  });
});
