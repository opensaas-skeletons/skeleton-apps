import { query, queryOne } from "../db/connection";
import type { Activity, CreateActivityInput, UpdateActivityInput } from "@shared/types/crm";
import { ValidationError, NotFoundError } from "../errors";

export async function listActivities(filters?: {
  contact_id?: string;
  deal_id?: string;
  company_id?: string;
  type?: string;
  completed?: string;
}): Promise<Activity[]> {
  let sql = `
    SELECT a.*,
      CONCAT(c.first_name, ' ', c.last_name) as contact_name,
      d.title as deal_title,
      co.name as company_name
    FROM activities a
    LEFT JOIN contacts c ON a.contact_id = c.id
    LEFT JOIN deals d ON a.deal_id = d.id
    LEFT JOIN companies co ON a.company_id = co.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramCount = 1;

  if (filters?.contact_id) { sql += ` AND a.contact_id = $${paramCount++}`; params.push(filters.contact_id); }
  if (filters?.deal_id) { sql += ` AND a.deal_id = $${paramCount++}`; params.push(filters.deal_id); }
  if (filters?.company_id) { sql += ` AND a.company_id = $${paramCount++}`; params.push(filters.company_id); }
  if (filters?.type) { sql += ` AND a.type = $${paramCount++}`; params.push(filters.type); }
  if (filters?.completed !== undefined) {
    sql += ` AND a.completed = $${paramCount++}`;
    params.push(filters.completed === "true");
  }

  sql += " ORDER BY a.created_at DESC";

  return query<Activity>(sql, params);
}

export async function getActivity(id: string): Promise<Activity> {
  const activity = await queryOne<Activity>(
    `SELECT a.*,
      CONCAT(c.first_name, ' ', c.last_name) as contact_name,
      d.title as deal_title,
      co.name as company_name
     FROM activities a
     LEFT JOIN contacts c ON a.contact_id = c.id
     LEFT JOIN deals d ON a.deal_id = d.id
     LEFT JOIN companies co ON a.company_id = co.id
     WHERE a.id = $1`,
    [id]
  );
  if (!activity) throw new NotFoundError("Activity not found");
  return activity;
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  if (!input.type?.trim()) throw new ValidationError("Activity type is required");
  if (!input.title?.trim()) throw new ValidationError("Activity title is required");

  const activity = await queryOne<Activity>(
    `INSERT INTO activities (type, title, description, contact_id, deal_id, company_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      input.type.trim(),
      input.title.trim(),
      input.description || "",
      input.contact_id || null,
      input.deal_id || null,
      input.company_id || null,
      input.due_date || null,
    ]
  );
  return activity!;
}

export async function updateActivity(id: string, input: UpdateActivityInput): Promise<Activity> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.type !== undefined) { fields.push(`type = $${paramCount++}`); values.push(input.type); }
  if (input.title !== undefined) { fields.push(`title = $${paramCount++}`); values.push(input.title.trim()); }
  if (input.description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(input.description); }
  if (input.contact_id !== undefined) { fields.push(`contact_id = $${paramCount++}`); values.push(input.contact_id); }
  if (input.deal_id !== undefined) { fields.push(`deal_id = $${paramCount++}`); values.push(input.deal_id); }
  if (input.company_id !== undefined) { fields.push(`company_id = $${paramCount++}`); values.push(input.company_id); }
  if (input.due_date !== undefined) { fields.push(`due_date = $${paramCount++}`); values.push(input.due_date); }
  if (input.completed !== undefined) {
    fields.push(`completed = $${paramCount++}`);
    values.push(input.completed);
    if (input.completed) {
      fields.push(`completed_at = NOW()`);
    } else {
      fields.push(`completed_at = NULL`);
    }
  }

  if (fields.length === 0) return getActivity(id);

  values.push(id);
  const activity = await queryOne<Activity>(
    `UPDATE activities SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  if (!activity) throw new NotFoundError("Activity not found");
  return activity;
}

export async function deleteActivity(id: string): Promise<void> {
  const result = await query("DELETE FROM activities WHERE id = $1 RETURNING id", [id]);
  if (result.length === 0) throw new NotFoundError("Activity not found");
}
