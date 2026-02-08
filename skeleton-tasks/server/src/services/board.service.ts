/**
 * Board Service
 * =============
 * Business logic for board operations.
 *
 * LLM BUILDERS: Add new board-level features here.
 * Examples: board templates, board cloning, board archiving.
 */

import { query, queryOne, getPool } from "../db/connection";
import { Board, BoardWithDetails, ColumnWithTasks, CreateBoardInput, UpdateBoardInput, CreateColumnInput, UpdateColumnInput } from "../../../shared/types/task";
import { DEFAULT_COLUMNS } from "../../../shared/constants";

export async function listBoards(): Promise<Board[]> {
  return query<Board>("SELECT * FROM boards ORDER BY created_at DESC");
}

export async function getBoard(id: string): Promise<BoardWithDetails | null> {
  const board = await queryOne<Board>("SELECT * FROM boards WHERE id = $1", [id]);
  if (!board) return null;

  const columns = await query<ColumnWithTasks>(
    "SELECT * FROM columns WHERE board_id = $1 ORDER BY position ASC",
    [id]
  );

  // Fetch tasks for each column
  for (const col of columns) {
    col.tasks = await query(
      "SELECT * FROM tasks WHERE column_id = $1 ORDER BY position ASC",
      [col.id]
    );
  }

  return { ...board, columns };
}

export async function createBoard(input: CreateBoardInput): Promise<BoardWithDetails> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const boardResult = await client.query(
      `INSERT INTO boards (title, description)
       VALUES ($1, $2) RETURNING *`,
      [input.title, input.description || ""]
    );
    const board = boardResult.rows[0];

    // Create columns — use provided columns or defaults
    const columnsToCreate = input.columns && input.columns.length > 0
      ? input.columns
      : DEFAULT_COLUMNS;

    const columns: ColumnWithTasks[] = [];
    for (let i = 0; i < columnsToCreate.length; i++) {
      const col = columnsToCreate[i];
      const colResult = await client.query(
        `INSERT INTO columns (board_id, title, position, color)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [board.id, col.title, i, col.color || null]
      );
      columns.push({ ...colResult.rows[0], tasks: [] });
    }

    await client.query("COMMIT");

    return { ...board, columns };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateBoard(id: string, input: UpdateBoardInput): Promise<Board | null> {
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

  if (fields.length === 0) return getBoard(id);

  values.push(id);
  return queryOne<Board>(
    `UPDATE boards SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
}

export async function deleteBoard(id: string): Promise<boolean> {
  const result = await query("DELETE FROM boards WHERE id = $1 RETURNING id", [id]);
  return result.length > 0;
}

// ---- Column operations ----

export async function createColumn(boardId: string, input: CreateColumnInput): Promise<any> {
  // If no position given, append to end
  let position = input.position;
  if (position === undefined) {
    const maxResult = await queryOne<{ max: number }>(
      "SELECT COALESCE(MAX(position), -1) as max FROM columns WHERE board_id = $1",
      [boardId]
    );
    position = (maxResult?.max ?? -1) + 1;
  }

  return queryOne(
    `INSERT INTO columns (board_id, title, position, wip_limit, color)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [boardId, input.title, position, input.wip_limit || null, input.color || null]
  );
}

export async function updateColumn(id: string, input: UpdateColumnInput): Promise<any> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.title !== undefined) {
    fields.push(`title = $${paramCount++}`);
    values.push(input.title);
  }
  if (input.position !== undefined) {
    fields.push(`position = $${paramCount++}`);
    values.push(input.position);
  }
  if (input.wip_limit !== undefined) {
    fields.push(`wip_limit = $${paramCount++}`);
    values.push(input.wip_limit);
  }
  if (input.color !== undefined) {
    fields.push(`color = $${paramCount++}`);
    values.push(input.color);
  }

  if (fields.length === 0) return queryOne("SELECT * FROM columns WHERE id = $1", [id]);

  values.push(id);
  return queryOne(
    `UPDATE columns SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
}

export async function deleteColumn(id: string): Promise<boolean> {
  const result = await query("DELETE FROM columns WHERE id = $1 RETURNING id", [id]);
  return result.length > 0;
}
