import { query, queryOne, getPool } from "../db/connection";
import { NotFoundError, ValidationError } from "../errors";
import type { Field, CreateFieldInput, UpdateFieldInput } from "@shared/types/database";
import { FIELD_TYPES } from "@shared/constants";

export async function listFields(tableId: string): Promise<Field[]> {
  return query<Field>(
    "SELECT * FROM fields WHERE table_id = $1 ORDER BY position ASC, created_at ASC",
    [tableId]
  );
}

export async function getField(id: string): Promise<Field> {
  const field = await queryOne<Field>("SELECT * FROM fields WHERE id = $1", [id]);
  if (!field) {
    throw new NotFoundError("Field not found");
  }
  return field;
}

export async function createField(input: CreateFieldInput): Promise<Field> {
  if (!input.title || !input.title.trim()) {
    throw new ValidationError("Title is required");
  }

  if (!FIELD_TYPES.includes(input.field_type as any)) {
    throw new ValidationError(`Invalid field type: ${input.field_type}`);
  }

  // Get next position
  const posResult = await query<{ next_pos: number }>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM fields WHERE table_id = $1",
    [input.table_id]
  );
  const nextPos = posResult[0].next_pos;

  const field = await queryOne<Field>(
    `INSERT INTO fields (table_id, title, field_type, position, config, required)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.table_id,
      input.title.trim(),
      input.field_type,
      nextPos,
      JSON.stringify(input.config || {}),
      input.required || false,
    ]
  );

  return field!;
}

export async function updateField(id: string, input: UpdateFieldInput): Promise<Field> {
  await getField(id);

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
  if (input.config !== undefined) {
    setClauses.push(`config = $${paramIndex++}`);
    values.push(JSON.stringify(input.config));
  }
  if (input.required !== undefined) {
    setClauses.push(`required = $${paramIndex++}`);
    values.push(input.required);
  }

  if (setClauses.length === 0) {
    return getField(id);
  }

  values.push(id);
  const result = await queryOne<Field>(
    `UPDATE fields SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result!;
}

export async function deleteField(id: string): Promise<void> {
  const field = await getField(id);

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Delete the field
    await client.query("DELETE FROM fields WHERE id = $1", [id]);

    // Remove the field's UUID key from all rows' JSONB data
    await client.query(
      "UPDATE rows SET data = data - $1 WHERE table_id = $2",
      [id, field.table_id]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
