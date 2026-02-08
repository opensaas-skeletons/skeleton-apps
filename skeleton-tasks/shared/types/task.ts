/**
 * ============================================
 * OPEN SAAS SKELETON — TASK STANDARD v1.0
 * ============================================
 *
 * These types define the interoperability standard for all
 * skeleton-based task management applications.
 *
 * RULES FOR LLM BUILDERS:
 * ✅ You CAN add fields to the `metadata` object
 * ✅ You CAN extend these types with new interfaces
 * ❌ Do NOT remove or rename the core fields below
 * ❌ Do NOT change the field types
 *
 * If you change core fields, your app won't be able to
 * import/export tasks with other skeleton-based apps.
 */

// ---- Core Enums ----

export type Priority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = string; // Maps to a Column title — flexible by design

// ---- Core Interfaces ----

/**
 * Task — The fundamental unit of work.
 *
 * Every task tracker skeleton MUST support these fields.
 * The `metadata` field is your escape hatch for custom data.
 */
export interface Task {
  id: string; // UUID
  board_id: string; // Which board this task belongs to
  column_id: string; // Which column (status) this task is in
  title: string; // Required — the task name
  description: string; // Markdown-supported description
  priority: Priority;
  assignee: string | null; // User ID, email, or null if unassigned
  labels: string[]; // Freeform tags/labels
  due_date: string | null; // ISO 8601 datetime or null
  position: number; // Sort order within the column (0-based)
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime

  /**
   * METADATA — Put your custom fields here!
   *
   * Examples:
   *   metadata: { story_points: 5, sprint: "Sprint 12" }
   *   metadata: { time_estimate_hours: 4, client: "Acme Corp" }
   *   metadata: { github_issue: "#142", complexity: "high" }
   *
   * This field is preserved during import/export but other
   * skeleton apps may not know how to display your custom fields.
   */
  metadata: Record<string, unknown>;
}

/**
 * Column — A stage in your workflow (e.g., "To Do", "In Progress", "Done")
 */
export interface Column {
  id: string;
  board_id: string;
  title: string;
  position: number; // Sort order (0-based)
  wip_limit: number | null; // Max tasks allowed, null = unlimited
  color: string | null; // Optional hex color for the column header
}

/**
 * Board — A collection of columns and tasks, representing a project.
 */
export interface Board {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

/**
 * BoardWithDetails — Board populated with its columns and tasks.
 * This is what the API returns when you GET a single board.
 */
export interface BoardWithDetails extends Board {
  columns: ColumnWithTasks[];
}

export interface ColumnWithTasks extends Column {
  tasks: Task[];
}

// ---- API Types ----

export interface CreateTaskInput {
  title: string;
  column_id: string;
  description?: string;
  priority?: Priority;
  assignee?: string | null;
  labels?: string[];
  due_date?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  assignee?: string | null;
  labels?: string[];
  due_date?: string | null;
  metadata?: Record<string, unknown>;
}

export interface MoveTaskInput {
  column_id: string; // Target column
  position: number; // Target position within column
}

export interface CreateBoardInput {
  title: string;
  description?: string;
  columns?: { title: string; color?: string }[]; // Optional initial columns
}

export interface UpdateBoardInput {
  title?: string;
  description?: string;
}

export interface CreateColumnInput {
  title: string;
  position?: number;
  wip_limit?: number | null;
  color?: string | null;
}

export interface UpdateColumnInput {
  title?: string;
  position?: number;
  wip_limit?: number | null;
  color?: string | null;
}

// ---- Interop Types ----

/**
 * ExportPayload — The standard format for exchanging task data
 * between skeleton-based applications.
 *
 * Any app that implements the skeleton task standard MUST be able
 * to produce and consume this format.
 */
export interface ExportPayload {
  version: "1.0";
  exported_at: string; // ISO 8601
  source: string; // App name / identifier
  boards: BoardExport[];
}

export interface BoardExport {
  title: string;
  description: string;
  columns: {
    title: string;
    position: number;
    wip_limit: number | null;
    color: string | null;
  }[];
  tasks: {
    title: string;
    description: string;
    column_title: string; // Reference by title, not ID (portable)
    priority: Priority;
    assignee: string | null;
    labels: string[];
    due_date: string | null;
    position: number;
    created_at: string;
    metadata: Record<string, unknown>;
  }[];
}

// ---- API Response Wrapper ----

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  per_page: number;
}
