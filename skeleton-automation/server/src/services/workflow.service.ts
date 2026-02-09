import { query, queryOne } from "../db/connection";
import type {
  Workflow,
  WorkflowRun,
  CreateWorkflowInput,
  UpdateWorkflowInput,
} from "@skeleton-automation/shared";

export async function listWorkflows(): Promise<Workflow[]> {
  const rows = await query<any>(
    "SELECT * FROM workflows ORDER BY created_at DESC"
  );
  return rows.map(mapWorkflowRow);
}

export async function getWorkflow(id: string): Promise<Workflow | null> {
  const row = await queryOne<any>(
    "SELECT * FROM workflows WHERE id = $1",
    [id]
  );
  return row ? mapWorkflowRow(row) : null;
}

export async function getWorkflowByTriggerPath(
  path: string
): Promise<Workflow | null> {
  const rows = await query<any>(
    `SELECT * FROM workflows
     WHERE enabled = true
       AND trigger_config->>'type' = 'webhook'
       AND trigger_config->'config'->>'path' = $1`,
    [path]
  );
  return rows.length > 0 ? mapWorkflowRow(rows[0]) : null;
}

export async function getEnabledScheduledWorkflows(): Promise<Workflow[]> {
  const rows = await query<any>(
    `SELECT * FROM workflows
     WHERE enabled = true AND trigger_config->>'type' = 'schedule'`
  );
  return rows.map(mapWorkflowRow);
}

export async function createWorkflow(
  input: CreateWorkflowInput
): Promise<Workflow> {
  const row = await queryOne<any>(
    `INSERT INTO workflows (title, description, enabled, trigger_config, conditions, actions, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.title,
      input.description || "",
      input.enabled ?? true,
      JSON.stringify(input.trigger),
      JSON.stringify(input.conditions || []),
      JSON.stringify(input.actions),
      JSON.stringify(input.metadata || {}),
    ]
  );
  return mapWorkflowRow(row!);
}

export async function updateWorkflow(
  id: string,
  input: UpdateWorkflowInput
): Promise<Workflow | null> {
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
  if (input.enabled !== undefined) {
    fields.push(`enabled = $${paramCount++}`);
    values.push(input.enabled);
  }
  if (input.trigger !== undefined) {
    fields.push(`trigger_config = $${paramCount++}`);
    values.push(JSON.stringify(input.trigger));
  }
  if (input.conditions !== undefined) {
    fields.push(`conditions = $${paramCount++}`);
    values.push(JSON.stringify(input.conditions));
  }
  if (input.actions !== undefined) {
    fields.push(`actions = $${paramCount++}`);
    values.push(JSON.stringify(input.actions));
  }
  if (input.metadata !== undefined) {
    fields.push(`metadata = $${paramCount++}`);
    values.push(JSON.stringify(input.metadata));
  }

  if (fields.length === 0) return getWorkflow(id);

  values.push(id);
  const row = await queryOne<any>(
    `UPDATE workflows SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return row ? mapWorkflowRow(row) : null;
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  const row = await queryOne<any>(
    "DELETE FROM workflows WHERE id = $1 RETURNING id",
    [id]
  );
  return row !== null;
}

// ---- Run helpers ----

export async function listRuns(
  workflowId: string,
  limit = 50
): Promise<WorkflowRun[]> {
  const rows = await query<any>(
    `SELECT * FROM workflow_runs
     WHERE workflow_id = $1
     ORDER BY started_at DESC
     LIMIT $2`,
    [workflowId, limit]
  );
  return rows.map(mapRunRow);
}

export async function getRun(id: string): Promise<WorkflowRun | null> {
  const row = await queryOne<any>(
    "SELECT * FROM workflow_runs WHERE id = $1",
    [id]
  );
  return row ? mapRunRow(row) : null;
}

export async function createRun(
  workflowId: string,
  triggerData: Record<string, unknown>
): Promise<WorkflowRun> {
  const row = await queryOne<any>(
    `INSERT INTO workflow_runs (workflow_id, status, trigger_data)
     VALUES ($1, 'running', $2) RETURNING *`,
    [workflowId, JSON.stringify(triggerData)]
  );
  return mapRunRow(row!);
}

export async function completeRun(
  runId: string,
  actionResults: any[],
  error?: string
): Promise<WorkflowRun> {
  const status = error ? "failed" : "completed";
  const row = await queryOne<any>(
    `UPDATE workflow_runs
     SET status = $1, action_results = $2, completed_at = NOW(), error = $3
     WHERE id = $4 RETURNING *`,
    [status, JSON.stringify(actionResults), error || null, runId]
  );
  return mapRunRow(row!);
}

// ---- Row mappers ----

function mapWorkflowRow(row: any): Workflow {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    enabled: row.enabled,
    trigger: row.trigger_config,
    conditions: row.conditions,
    actions: row.actions,
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: row.metadata,
  };
}

function mapRunRow(row: any): WorkflowRun {
  return {
    id: row.id,
    workflow_id: row.workflow_id,
    status: row.status,
    trigger_data: row.trigger_data,
    action_results: row.action_results,
    started_at: row.started_at,
    completed_at: row.completed_at,
    error: row.error,
  };
}
