import { query, queryOne, getPool } from "../db/connection";
import { NotFoundError, ValidationError } from "../errors";
import type { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput } from "@shared/types/wiki";

export async function listWorkspaces(): Promise<Workspace[]> {
  return query<Workspace>("SELECT * FROM workspaces ORDER BY created_at DESC");
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const ws = await queryOne<Workspace>("SELECT * FROM workspaces WHERE id = $1", [id]);
  if (!ws) {
    throw new NotFoundError("Workspace not found");
  }
  return ws;
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  if (!input.title || !input.title.trim()) {
    throw new ValidationError("Title is required");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const wsResult = await client.query(
      `INSERT INTO workspaces (title, description, icon, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        input.title.trim(),
        input.description || "",
        input.icon || "📚",
        input.color || "#3b82f6",
      ]
    );
    const ws = wsResult.rows[0] as Workspace;

    // Create a default "Getting Started" page
    await client.query(
      `INSERT INTO pages (workspace_id, title, slug, content, icon, position)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        ws.id,
        "Getting Started",
        "getting-started",
        "# Getting Started\n\nWelcome to your new wiki workspace! Start by editing this page or creating new ones.",
        "📄",
        0,
      ]
    );

    await client.query("COMMIT");
    return ws;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateWorkspace(id: string, input: UpdateWorkspaceInput): Promise<Workspace> {
  await getWorkspace(id);

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
    return getWorkspace(id);
  }

  values.push(id);
  const result = await queryOne<Workspace>(
    `UPDATE workspaces SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result!;
}

export async function deleteWorkspace(id: string): Promise<void> {
  await getWorkspace(id);
  await query("DELETE FROM workspaces WHERE id = $1", [id]);
}
