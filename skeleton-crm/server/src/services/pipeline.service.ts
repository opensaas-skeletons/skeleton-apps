import { query, queryOne, getPool } from "../db/connection";
import type { Pipeline, Stage, CreatePipelineInput, UpdatePipelineInput, CreateStageInput, UpdateStageInput } from "@shared/types/crm";
import { ValidationError, NotFoundError } from "../errors";

export async function listPipelines(): Promise<Pipeline[]> {
  const pipelines = await query<Pipeline>("SELECT * FROM pipelines ORDER BY is_default DESC, created_at ASC");

  for (const pipeline of pipelines) {
    pipeline.stages = await query<Stage>(
      "SELECT * FROM stages WHERE pipeline_id = $1 ORDER BY position ASC",
      [pipeline.id]
    );
  }

  return pipelines;
}

export async function getPipeline(id: string): Promise<Pipeline> {
  const pipeline = await queryOne<Pipeline>("SELECT * FROM pipelines WHERE id = $1", [id]);
  if (!pipeline) throw new NotFoundError("Pipeline not found");

  pipeline.stages = await query<Stage>(
    "SELECT * FROM stages WHERE pipeline_id = $1 ORDER BY position ASC",
    [pipeline.id]
  );

  return pipeline;
}

export async function createPipeline(input: CreatePipelineInput): Promise<Pipeline> {
  if (!input.title?.trim()) throw new ValidationError("Pipeline title is required");

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // If setting as default, unset other defaults
    if (input.is_default) {
      await client.query("UPDATE pipelines SET is_default = false");
    }

    const pipelineResult = await client.query(
      `INSERT INTO pipelines (title, description, is_default)
       VALUES ($1, $2, $3) RETURNING *`,
      [input.title.trim(), input.description || "", input.is_default || false]
    );
    const pipeline = pipelineResult.rows[0] as Pipeline;

    // Create stages if provided
    if (input.stages && input.stages.length > 0) {
      for (let i = 0; i < input.stages.length; i++) {
        const s = input.stages[i];
        await client.query(
          `INSERT INTO stages (pipeline_id, title, position, probability, is_terminal, terminal_state, color)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [pipeline.id, s.title, s.position ?? i, s.probability ?? 0, s.is_terminal ?? false, s.terminal_state || null, s.color || "#3b82f6"]
        );
      }
    }

    await client.query("COMMIT");

    pipeline.stages = await query<Stage>(
      "SELECT * FROM stages WHERE pipeline_id = $1 ORDER BY position ASC",
      [pipeline.id]
    );

    return pipeline;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updatePipeline(id: string, input: UpdatePipelineInput): Promise<Pipeline> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.title !== undefined) { fields.push(`title = $${paramCount++}`); values.push(input.title.trim()); }
  if (input.description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(input.description); }
  if (input.is_default !== undefined) {
    if (input.is_default) {
      await query("UPDATE pipelines SET is_default = false");
    }
    fields.push(`is_default = $${paramCount++}`);
    values.push(input.is_default);
  }

  if (fields.length === 0) return getPipeline(id);

  values.push(id);
  const pipeline = await queryOne<Pipeline>(
    `UPDATE pipelines SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  if (!pipeline) throw new NotFoundError("Pipeline not found");

  pipeline.stages = await query<Stage>(
    "SELECT * FROM stages WHERE pipeline_id = $1 ORDER BY position ASC",
    [pipeline.id]
  );

  return pipeline;
}

export async function deletePipeline(id: string): Promise<void> {
  const result = await query("DELETE FROM pipelines WHERE id = $1 RETURNING id", [id]);
  if (result.length === 0) throw new NotFoundError("Pipeline not found");
}

export async function createStage(pipelineId: string, input: CreateStageInput): Promise<Stage> {
  if (!input.title?.trim()) throw new ValidationError("Stage title is required");

  // Auto-assign position if not provided
  let position = input.position;
  if (position === undefined) {
    const maxResult = await queryOne<{ max: number }>(
      "SELECT COALESCE(MAX(position), -1) as max FROM stages WHERE pipeline_id = $1",
      [pipelineId]
    );
    position = (maxResult?.max ?? -1) + 1;
  }

  const stage = await queryOne<Stage>(
    `INSERT INTO stages (pipeline_id, title, position, probability, is_terminal, terminal_state, color)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [pipelineId, input.title.trim(), position, input.probability ?? 0, input.is_terminal ?? false, input.terminal_state || null, input.color || "#3b82f6"]
  );
  return stage!;
}

export async function updateStage(id: string, input: UpdateStageInput): Promise<Stage> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.title !== undefined) { fields.push(`title = $${paramCount++}`); values.push(input.title.trim()); }
  if (input.position !== undefined) { fields.push(`position = $${paramCount++}`); values.push(input.position); }
  if (input.probability !== undefined) { fields.push(`probability = $${paramCount++}`); values.push(input.probability); }
  if (input.is_terminal !== undefined) { fields.push(`is_terminal = $${paramCount++}`); values.push(input.is_terminal); }
  if (input.terminal_state !== undefined) { fields.push(`terminal_state = $${paramCount++}`); values.push(input.terminal_state); }
  if (input.color !== undefined) { fields.push(`color = $${paramCount++}`); values.push(input.color); }

  if (fields.length === 0) {
    const stage = await queryOne<Stage>("SELECT * FROM stages WHERE id = $1", [id]);
    if (!stage) throw new NotFoundError("Stage not found");
    return stage;
  }

  values.push(id);
  const stage = await queryOne<Stage>(
    `UPDATE stages SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  if (!stage) throw new NotFoundError("Stage not found");
  return stage;
}

export async function deleteStage(id: string): Promise<void> {
  const result = await query("DELETE FROM stages WHERE id = $1 RETURNING id", [id]);
  if (result.length === 0) throw new NotFoundError("Stage not found");
}
