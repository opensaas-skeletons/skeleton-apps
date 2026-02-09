import { query, queryOne } from "../db/connection";
import { NotFoundError, ValidationError } from "../errors";
import type { View, CreateViewInput, UpdateViewInput, ViewConfig } from "@shared/types/database";
import { DEFAULT_VIEW_CONFIG } from "@shared/constants";

export async function listViews(tableId: string): Promise<View[]> {
  return query<View>(
    "SELECT * FROM views WHERE table_id = $1 ORDER BY position ASC, created_at ASC",
    [tableId]
  );
}

export async function getView(id: string): Promise<View> {
  const view = await queryOne<View>("SELECT * FROM views WHERE id = $1", [id]);
  if (!view) {
    throw new NotFoundError("View not found");
  }
  return view;
}

export async function createView(input: CreateViewInput): Promise<View> {
  if (!input.title || !input.title.trim()) {
    throw new ValidationError("Title is required");
  }

  // Get next position
  const posResult = await query<{ next_pos: number }>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM views WHERE table_id = $1",
    [input.table_id]
  );
  const nextPos = posResult[0].next_pos;

  const config: ViewConfig = {
    ...DEFAULT_VIEW_CONFIG,
    ...input.config,
  };

  const view = await queryOne<View>(
    `INSERT INTO views (table_id, title, view_type, config, position)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.table_id,
      input.title.trim(),
      input.view_type || "grid",
      JSON.stringify(config),
      nextPos,
    ]
  );

  return view!;
}

export async function updateView(id: string, input: UpdateViewInput): Promise<View> {
  const existing = await getView(id);

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
    // Merge config: spread existing config with new partial config
    const existingConfig = typeof existing.config === "string"
      ? JSON.parse(existing.config as unknown as string)
      : existing.config;
    const mergedConfig = {
      ...existingConfig,
      ...input.config,
    };
    setClauses.push(`config = $${paramIndex++}`);
    values.push(JSON.stringify(mergedConfig));
  }

  if (setClauses.length === 0) {
    return getView(id);
  }

  values.push(id);
  const result = await queryOne<View>(
    `UPDATE views SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result!;
}

export async function deleteView(id: string): Promise<void> {
  await getView(id);
  await query("DELETE FROM views WHERE id = $1", [id]);
}
