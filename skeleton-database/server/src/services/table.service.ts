import { query, queryOne, getPool } from "../db/connection";
import { NotFoundError, ValidationError } from "../errors";
import type { Table, CreateTableInput, UpdateTableInput } from "@shared/types/database";
import { DEFAULT_STATUS_OPTIONS, DEFAULT_VIEW_CONFIG } from "@shared/constants";

export async function listTables(baseId: string): Promise<Table[]> {
  return query<Table>(
    "SELECT * FROM tables WHERE base_id = $1 ORDER BY position ASC, created_at ASC",
    [baseId]
  );
}

export async function getTable(id: string): Promise<Table> {
  const table = await queryOne<Table>("SELECT * FROM tables WHERE id = $1", [id]);
  if (!table) {
    throw new NotFoundError("Table not found");
  }
  return table;
}

export async function createTable(input: CreateTableInput): Promise<Table> {
  if (!input.title || !input.title.trim()) {
    throw new ValidationError("Title is required");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get next position
    const posResult = await client.query(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM tables WHERE base_id = $1",
      [input.base_id]
    );
    const nextPos = posResult.rows[0].next_pos;

    // Create the table
    const tableResult = await client.query(
      `INSERT INTO tables (base_id, title, description, position)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.base_id, input.title.trim(), input.description || "", nextPos]
    );
    const table = tableResult.rows[0] as Table;

    // Create default fields: Name, Notes, Status
    await client.query(
      `INSERT INTO fields (table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [table.id, "Name", "text", 0, JSON.stringify({}), true]
    );

    await client.query(
      `INSERT INTO fields (table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [table.id, "Notes", "long_text", 1, JSON.stringify({}), false]
    );

    await client.query(
      `INSERT INTO fields (table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [table.id, "Status", "select", 2, JSON.stringify({ options: DEFAULT_STATUS_OPTIONS }), false]
    );

    // Create default "Grid View"
    await client.query(
      `INSERT INTO views (table_id, title, view_type, config, position)
       VALUES ($1, $2, $3, $4, $5)`,
      [table.id, "Grid View", "grid", JSON.stringify(DEFAULT_VIEW_CONFIG), 0]
    );

    await client.query("COMMIT");
    return table;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateTable(id: string, input: UpdateTableInput): Promise<Table> {
  await getTable(id);

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (input.title !== undefined) {
    if (!input.title.trim()) {
      throw new ValidationError("Title cannot be empty");
    }
    setClauses.push(`title = $${paramIndex++}`);
    values.push(input.title.trim());
  }
  if (input.description !== undefined) {
    setClauses.push(`description = $${paramIndex++}`);
    values.push(input.description);
  }

  if (setClauses.length === 0) {
    return getTable(id);
  }

  values.push(id);
  const result = await queryOne<Table>(
    `UPDATE tables SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result!;
}

export async function deleteTable(id: string): Promise<void> {
  await getTable(id);
  await query("DELETE FROM tables WHERE id = $1", [id]);
}
