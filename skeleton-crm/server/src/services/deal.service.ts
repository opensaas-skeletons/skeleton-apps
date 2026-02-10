import { query, queryOne, getPool } from "../db/connection";
import type { Deal, Stage, CreateDealInput, UpdateDealInput, MoveDealInput } from "@shared/types/crm";
import { ValidationError, NotFoundError } from "../errors";

export async function listDeals(filters?: {
  pipeline_id?: string;
  stage_id?: string;
  status?: string;
  contact_id?: string;
  company_id?: string;
}): Promise<Deal[]> {
  let sql = `
    SELECT d.*,
      CONCAT(c.first_name, ' ', c.last_name) as contact_name,
      co.name as company_name,
      s.title as stage_title
    FROM deals d
    LEFT JOIN contacts c ON d.contact_id = c.id
    LEFT JOIN companies co ON d.company_id = co.id
    LEFT JOIN stages s ON d.stage_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramCount = 1;

  if (filters?.pipeline_id) { sql += ` AND d.pipeline_id = $${paramCount++}`; params.push(filters.pipeline_id); }
  if (filters?.stage_id) { sql += ` AND d.stage_id = $${paramCount++}`; params.push(filters.stage_id); }
  if (filters?.status) { sql += ` AND d.status = $${paramCount++}`; params.push(filters.status); }
  if (filters?.contact_id) { sql += ` AND d.contact_id = $${paramCount++}`; params.push(filters.contact_id); }
  if (filters?.company_id) { sql += ` AND d.company_id = $${paramCount++}`; params.push(filters.company_id); }

  sql += " ORDER BY d.position ASC";

  return query<Deal>(sql, params);
}

export async function getDeal(id: string): Promise<Deal> {
  const deal = await queryOne<Deal>(
    `SELECT d.*,
      CONCAT(c.first_name, ' ', c.last_name) as contact_name,
      co.name as company_name,
      s.title as stage_title
     FROM deals d
     LEFT JOIN contacts c ON d.contact_id = c.id
     LEFT JOIN companies co ON d.company_id = co.id
     LEFT JOIN stages s ON d.stage_id = s.id
     WHERE d.id = $1`,
    [id]
  );
  if (!deal) throw new NotFoundError("Deal not found");
  return deal;
}

export async function createDeal(input: CreateDealInput): Promise<Deal> {
  if (!input.title?.trim()) throw new ValidationError("Deal title is required");
  if (!input.stage_id) throw new ValidationError("Stage is required");
  if (!input.pipeline_id) throw new ValidationError("Pipeline is required");

  // Auto-assign position to end of stage
  const maxResult = await queryOne<{ max: number }>(
    "SELECT COALESCE(MAX(position), -1) as max FROM deals WHERE stage_id = $1",
    [input.stage_id]
  );
  const position = (maxResult?.max ?? -1) + 1;

  const deal = await queryOne<Deal>(
    `INSERT INTO deals (title, value, currency, stage_id, pipeline_id, contact_id, company_id, expected_close_date, notes, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      input.title.trim(),
      input.value || 0,
      input.currency || "USD",
      input.stage_id,
      input.pipeline_id,
      input.contact_id || null,
      input.company_id || null,
      input.expected_close_date || null,
      input.notes || "",
      position,
    ]
  );
  return deal!;
}

export async function updateDeal(id: string, input: UpdateDealInput): Promise<Deal> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.title !== undefined) { fields.push(`title = $${paramCount++}`); values.push(input.title.trim()); }
  if (input.value !== undefined) { fields.push(`value = $${paramCount++}`); values.push(input.value); }
  if (input.currency !== undefined) { fields.push(`currency = $${paramCount++}`); values.push(input.currency); }
  if (input.stage_id !== undefined) { fields.push(`stage_id = $${paramCount++}`); values.push(input.stage_id); }
  if (input.contact_id !== undefined) { fields.push(`contact_id = $${paramCount++}`); values.push(input.contact_id); }
  if (input.company_id !== undefined) { fields.push(`company_id = $${paramCount++}`); values.push(input.company_id); }
  if (input.status !== undefined) { fields.push(`status = $${paramCount++}`); values.push(input.status); }
  if (input.close_date !== undefined) { fields.push(`close_date = $${paramCount++}`); values.push(input.close_date); }
  if (input.expected_close_date !== undefined) { fields.push(`expected_close_date = $${paramCount++}`); values.push(input.expected_close_date); }
  if (input.lost_reason !== undefined) { fields.push(`lost_reason = $${paramCount++}`); values.push(input.lost_reason); }
  if (input.notes !== undefined) { fields.push(`notes = $${paramCount++}`); values.push(input.notes); }

  if (fields.length === 0) return getDeal(id);

  values.push(id);
  const deal = await queryOne<Deal>(
    `UPDATE deals SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  if (!deal) throw new NotFoundError("Deal not found");
  return deal;
}

export async function moveDeal(id: string, input: MoveDealInput): Promise<Deal> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get current deal
    const dealResult = await client.query("SELECT * FROM deals WHERE id = $1", [id]);
    if (dealResult.rows.length === 0) {
      await client.query("ROLLBACK");
      throw new NotFoundError("Deal not found");
    }
    const deal = dealResult.rows[0];

    const oldStageId = deal.stage_id;
    const newStageId = input.stage_id;
    const newPosition = input.position;

    // Position management
    if (oldStageId === newStageId) {
      const oldPosition = deal.position;
      if (oldPosition < newPosition) {
        await client.query(
          `UPDATE deals SET position = position - 1
           WHERE stage_id = $1 AND position > $2 AND position <= $3`,
          [newStageId, oldPosition, newPosition]
        );
      } else if (oldPosition > newPosition) {
        await client.query(
          `UPDATE deals SET position = position + 1
           WHERE stage_id = $1 AND position >= $2 AND position < $3`,
          [newStageId, newPosition, oldPosition]
        );
      }
    } else {
      // Close gap in old stage
      await client.query(
        `UPDATE deals SET position = position - 1
         WHERE stage_id = $1 AND position > $2`,
        [oldStageId, deal.position]
      );
      // Make space in new stage
      await client.query(
        `UPDATE deals SET position = position + 1
         WHERE stage_id = $1 AND position >= $2`,
        [newStageId, newPosition]
      );
    }

    // Check if target stage is terminal
    const stageResult = await client.query("SELECT * FROM stages WHERE id = $1", [newStageId]);
    const targetStage = stageResult.rows[0] as Stage;

    let status = deal.status;
    let closeDate = deal.close_date;
    let lostReason = deal.lost_reason;

    if (targetStage.is_terminal && targetStage.terminal_state === "won") {
      status = "won";
      closeDate = new Date().toISOString().split("T")[0];
    } else if (targetStage.is_terminal && targetStage.terminal_state === "lost") {
      status = "lost";
      closeDate = new Date().toISOString().split("T")[0];
    } else if (!targetStage.is_terminal && deal.status !== "open") {
      // Moving back to non-terminal stage
      status = "open";
      closeDate = null;
      lostReason = null;
    }

    const result = await client.query(
      `UPDATE deals SET stage_id = $1, position = $2, status = $3, close_date = $4, lost_reason = $5
       WHERE id = $6 RETURNING *`,
      [newStageId, newPosition, status, closeDate, lostReason, id]
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

export async function deleteDeal(id: string): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const dealResult = await client.query("SELECT * FROM deals WHERE id = $1", [id]);
    if (dealResult.rows.length === 0) {
      await client.query("ROLLBACK");
      throw new NotFoundError("Deal not found");
    }
    const deal = dealResult.rows[0];

    await client.query("DELETE FROM deals WHERE id = $1", [id]);
    await client.query(
      `UPDATE deals SET position = position - 1
       WHERE stage_id = $1 AND position > $2`,
      [deal.stage_id, deal.position]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
