import { query, queryOne, getPool } from "../db/connection";
import { NotFoundError, ValidationError } from "../errors";
import type { Base, CreateBaseInput, UpdateBaseInput } from "@shared/types/database";
import { DEFAULT_STATUS_OPTIONS, DEFAULT_VIEW_CONFIG } from "@shared/constants";

export async function listBases(): Promise<Base[]> {
  return query<Base>("SELECT * FROM bases ORDER BY created_at DESC");
}

export async function getBase(id: string): Promise<Base> {
  const base = await queryOne<Base>("SELECT * FROM bases WHERE id = $1", [id]);
  if (!base) {
    throw new NotFoundError("Base not found");
  }
  return base;
}

export async function createBase(input: CreateBaseInput): Promise<Base> {
  if (!input.title || !input.title.trim()) {
    throw new ValidationError("Title is required");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create the base
    const baseResult = await client.query(
      `INSERT INTO bases (title, description, icon, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        input.title.trim(),
        input.description || "",
        input.icon || "📊",
        input.color || "#3b82f6",
      ]
    );
    const base = baseResult.rows[0] as Base;

    // Create default "Table 1"
    const tableResult = await client.query(
      `INSERT INTO tables (base_id, title, description, position)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [base.id, "Table 1", "", 0]
    );
    const tableId = tableResult.rows[0].id;

    // Create default fields: Name, Notes, Status
    await client.query(
      `INSERT INTO fields (table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tableId, "Name", "text", 0, JSON.stringify({}), true]
    );

    await client.query(
      `INSERT INTO fields (table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tableId, "Notes", "long_text", 1, JSON.stringify({}), false]
    );

    await client.query(
      `INSERT INTO fields (table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tableId, "Status", "select", 2, JSON.stringify({ options: DEFAULT_STATUS_OPTIONS }), false]
    );

    // Create default "Grid View"
    await client.query(
      `INSERT INTO views (table_id, title, view_type, config, position)
       VALUES ($1, $2, $3, $4, $5)`,
      [tableId, "Grid View", "grid", JSON.stringify(DEFAULT_VIEW_CONFIG), 0]
    );

    await client.query("COMMIT");
    return base;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateBase(id: string, input: UpdateBaseInput): Promise<Base> {
  // Verify exists
  await getBase(id);

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
  if (input.icon !== undefined) {
    setClauses.push(`icon = $${paramIndex++}`);
    values.push(input.icon);
  }
  if (input.color !== undefined) {
    setClauses.push(`color = $${paramIndex++}`);
    values.push(input.color);
  }

  if (setClauses.length === 0) {
    return getBase(id);
  }

  values.push(id);
  const result = await queryOne<Base>(
    `UPDATE bases SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result!;
}

export async function deleteBase(id: string): Promise<void> {
  await getBase(id);
  await query("DELETE FROM bases WHERE id = $1", [id]);
}
