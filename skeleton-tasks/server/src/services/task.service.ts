/**
 * Task Service
 * ============
 * Business logic for task operations.
 *
 * LLM BUILDERS: This is where you add task-level features.
 * Examples: subtasks, time tracking, recurring tasks, task templates.
 */

import { query, queryOne, getPool } from "../db/connection";
import { Task, CreateTaskInput, UpdateTaskInput, MoveTaskInput } from "@skeleton-tasks/shared";

export async function listTasks(boardId: string, filters?: {
  column_id?: string;
  priority?: string;
  assignee?: string;
  label?: string;
  search?: string;
}): Promise<Task[]> {
  let sql = "SELECT * FROM tasks WHERE board_id = $1";
  const params: any[] = [boardId];
  let paramCount = 2;

  if (filters?.column_id) {
    sql += ` AND column_id = $${paramCount++}`;
    params.push(filters.column_id);
  }
  if (filters?.priority) {
    sql += ` AND priority = $${paramCount++}`;
    params.push(filters.priority);
  }
  if (filters?.assignee) {
    sql += ` AND assignee = $${paramCount++}`;
    params.push(filters.assignee);
  }
  if (filters?.label) {
    sql += ` AND labels ? $${paramCount++}`;
    params.push(filters.label);
  }
  if (filters?.search) {
    sql += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
    params.push(`%${filters.search}%`);
    paramCount++;
  }

  sql += " ORDER BY position ASC";

  return query<Task>(sql, params);
}

export async function getTask(id: string): Promise<Task | null> {
  return queryOne<Task>("SELECT * FROM tasks WHERE id = $1", [id]);
}

export async function createTask(boardId: string, input: CreateTaskInput): Promise<Task> {
  // Auto-assign position to end of column
  const maxResult = await queryOne<{ max: number }>(
    "SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE column_id = $1",
    [input.column_id]
  );
  const position = (maxResult?.max ?? -1) + 1;

  const result = await queryOne<Task>(
    `INSERT INTO tasks (board_id, column_id, title, description, priority, assignee, labels, due_date, position, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      boardId,
      input.column_id,
      input.title,
      input.description || "",
      input.priority || "medium",
      input.assignee || null,
      JSON.stringify(input.labels || []),
      input.due_date || null,
      position,
      JSON.stringify(input.metadata || {}),
    ]
  );

  return result!;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.title !== undefined) {
    fields.push(`title = $${paramCount++}`);
    values.push(input.title);
  }
  if (input.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(input.description);
  }
  if (input.priority !== undefined) {
    fields.push(`priority = $${paramCount++}`);
    values.push(input.priority);
  }
  if (input.assignee !== undefined) {
    fields.push(`assignee = $${paramCount++}`);
    values.push(input.assignee);
  }
  if (input.labels !== undefined) {
    fields.push(`labels = $${paramCount++}`);
    values.push(JSON.stringify(input.labels));
  }
  if (input.due_date !== undefined) {
    fields.push(`due_date = $${paramCount++}`);
    values.push(input.due_date);
  }
  if (input.metadata !== undefined) {
    fields.push(`metadata = $${paramCount++}`);
    values.push(JSON.stringify(input.metadata));
  }

  if (fields.length === 0) return getTask(id);

  values.push(id);
  return queryOne<Task>(
    `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
}

export async function moveTask(id: string, input: MoveTaskInput): Promise<Task | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get current task info
    const taskResult = await client.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (taskResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    const task = taskResult.rows[0];

    const oldColumnId = task.column_id;
    const newColumnId = input.column_id;
    const newPosition = input.position;

    // If moving within the same column
    if (oldColumnId === newColumnId) {
      const oldPosition = task.position;
      if (oldPosition < newPosition) {
        // Moving down — shift items between old+1 and new up
        await client.query(
          `UPDATE tasks SET position = position - 1
           WHERE column_id = $1 AND position > $2 AND position <= $3`,
          [newColumnId, oldPosition, newPosition]
        );
      } else if (oldPosition > newPosition) {
        // Moving up — shift items between new and old-1 down
        await client.query(
          `UPDATE tasks SET position = position + 1
           WHERE column_id = $1 AND position >= $2 AND position < $3`,
          [newColumnId, newPosition, oldPosition]
        );
      }
    } else {
      // Moving to a different column
      // Close gap in old column
      await client.query(
        `UPDATE tasks SET position = position - 1
         WHERE column_id = $1 AND position > $2`,
        [oldColumnId, task.position]
      );
      // Make space in new column
      await client.query(
        `UPDATE tasks SET position = position + 1
         WHERE column_id = $1 AND position >= $2`,
        [newColumnId, newPosition]
      );
    }

    // Move the task
    const result = await client.query(
      `UPDATE tasks SET column_id = $1, position = $2 WHERE id = $3 RETURNING *`,
      [newColumnId, newPosition, id]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get task info to close the gap
    const taskResult = await client.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (taskResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return false;
    }
    const task = taskResult.rows[0];

    // Delete the task
    await client.query("DELETE FROM tasks WHERE id = $1", [id]);

    // Close the position gap
    await client.query(
      `UPDATE tasks SET position = position - 1
       WHERE column_id = $1 AND position > $2`,
      [task.column_id, task.position]
    );

    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
