import { query, queryOne } from "../db/connection";
import type { Source, CreateSourceInput, UpdateSourceInput } from "@shared/types/ai";
import { ValidationError, NotFoundError } from "../errors";

export async function listSources(): Promise<Source[]> {
  return query<Source>("SELECT * FROM sources ORDER BY created_at DESC");
}

export async function getSource(id: string): Promise<Source> {
  const source = await queryOne<Source>("SELECT * FROM sources WHERE id = $1", [id]);
  if (!source) throw new NotFoundError("Source not found");
  return source;
}

export async function createSource(input: CreateSourceInput): Promise<Source> {
  if (!input.title?.trim()) {
    throw new ValidationError("Title is required");
  }
  if (!input.source_type || !["directory", "url"].includes(input.source_type)) {
    throw new ValidationError("source_type must be 'directory' or 'url'");
  }

  const source = await queryOne<Source>(
    `INSERT INTO sources (title, description, source_type, config)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [input.title.trim(), input.description || "", input.source_type, JSON.stringify(input.config || {})]
  );
  return source!;
}

export async function updateSource(id: string, input: UpdateSourceInput): Promise<Source> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.title !== undefined) {
    fields.push(`title = $${paramCount++}`);
    values.push(input.title.trim());
  }
  if (input.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(input.description);
  }
  if (input.config !== undefined) {
    fields.push(`config = $${paramCount++}`);
    values.push(JSON.stringify(input.config));
  }

  if (fields.length === 0) return getSource(id);

  values.push(id);
  const source = await queryOne<Source>(
    `UPDATE sources SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  if (!source) throw new NotFoundError("Source not found");
  return source;
}

export async function deleteSource(id: string): Promise<void> {
  const result = await query("DELETE FROM sources WHERE id = $1 RETURNING id", [id]);
  if (result.length === 0) throw new NotFoundError("Source not found");
}
