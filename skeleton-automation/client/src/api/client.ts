import type {
  Workflow,
  WorkflowRun,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  AutomationExportPayload,
  ApiResponse,
} from "@shared/types/workflow";

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ---- Workflow API ----

export async function listWorkflows(): Promise<Workflow[]> {
  const res = await request<ApiResponse<Workflow[]>>("/workflows");
  return res.data;
}

export async function getWorkflow(
  id: string
): Promise<Workflow & { recent_runs: WorkflowRun[] }> {
  const res = await request<
    ApiResponse<Workflow & { recent_runs: WorkflowRun[] }>
  >(`/workflows/${id}`);
  return res.data;
}

export async function createWorkflow(
  input: CreateWorkflowInput
): Promise<Workflow> {
  const res = await request<ApiResponse<Workflow>>("/workflows", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateWorkflow(
  id: string,
  input: UpdateWorkflowInput
): Promise<Workflow> {
  const res = await request<ApiResponse<Workflow>>(`/workflows/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteWorkflow(id: string): Promise<void> {
  await request(`/workflows/${id}`, { method: "DELETE" });
}

export async function triggerWorkflow(
  id: string,
  payload?: Record<string, unknown>
): Promise<void> {
  await request(`/workflows/${id}/trigger`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

// ---- Run API ----

export async function listRuns(
  workflowId: string,
  limit?: number
): Promise<WorkflowRun[]> {
  const query = limit ? `?limit=${limit}` : "";
  const res = await request<ApiResponse<WorkflowRun[]>>(
    `/workflows/${workflowId}/runs${query}`
  );
  return res.data;
}

export async function getRun(id: string): Promise<WorkflowRun> {
  const res = await request<ApiResponse<WorkflowRun>>(`/runs/${id}`);
  return res.data;
}

// ---- Notification API ----

export async function listNotifications(recipient: string, unreadOnly?: boolean): Promise<any[]> {
  const params = new URLSearchParams({ recipient });
  if (unreadOnly) params.set("unread_only", "true");
  const res = await request<ApiResponse<any[]>>(`/notifications?${params}`);
  return res.data;
}

export async function getUnreadCount(recipient: string): Promise<number> {
  const res = await request<ApiResponse<{ count: number }>>(`/notifications/unread-count?recipient=${encodeURIComponent(recipient)}`);
  return res.data.count;
}

export async function markNotificationRead(id: string): Promise<any> {
  const res = await request<ApiResponse<any>>(`/notifications/${id}/read`, { method: "PATCH" });
  return res.data;
}

export async function markAllNotificationsRead(recipient: string): Promise<void> {
  await request(`/notifications/read-all`, {
    method: "POST",
    body: JSON.stringify({ recipient }),
  });
}

// ---- Interop API ----

export async function exportData(): Promise<AutomationExportPayload> {
  return request<AutomationExportPayload>("/export");
}

export async function importData(
  payload: AutomationExportPayload
): Promise<{ imported_workflows: number }> {
  const res = await request<
    ApiResponse<{ imported_workflows: number }>
  >("/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}
