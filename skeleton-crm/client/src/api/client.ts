import type {
  Contact, Company, Pipeline, Deal, Activity,
  CreateContactInput, UpdateContactInput,
  CreateCompanyInput, UpdateCompanyInput,
  CreatePipelineInput, UpdatePipelineInput,
  CreateDealInput, UpdateDealInput, MoveDealInput,
  CreateActivityInput, UpdateActivityInput,
  ApiResponse, DashboardSummary, PipelineFunnelEntry,
  ActivitySummary, RecentDeal, WinRateEntry,
  CrmExportPayload,
} from "@shared/types/crm";

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ---- Contacts ----
export async function listContacts(params?: Record<string, string>): Promise<Contact[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await request<ApiResponse<Contact[]>>(`/contacts${qs}`);
  return res.data;
}
export async function getContact(id: string): Promise<Contact> {
  const res = await request<ApiResponse<Contact>>(`/contacts/${id}`);
  return res.data;
}
export async function createContact(input: CreateContactInput): Promise<Contact> {
  const res = await request<ApiResponse<Contact>>("/contacts", { method: "POST", body: JSON.stringify(input) });
  return res.data;
}
export async function updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
  const res = await request<ApiResponse<Contact>>(`/contacts/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return res.data;
}
export async function deleteContact(id: string): Promise<void> {
  await request(`/contacts/${id}`, { method: "DELETE" });
}
export async function importContacts(file: File): Promise<{ imported: number; skipped: number }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/contacts/import`, { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Import failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.data;
}

// ---- Companies ----
export async function listCompanies(params?: Record<string, string>): Promise<Company[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await request<ApiResponse<Company[]>>(`/companies${qs}`);
  return res.data;
}
export async function getCompany(id: string): Promise<Company> {
  const res = await request<ApiResponse<Company>>(`/companies/${id}`);
  return res.data;
}
export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const res = await request<ApiResponse<Company>>("/companies", { method: "POST", body: JSON.stringify(input) });
  return res.data;
}
export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<Company> {
  const res = await request<ApiResponse<Company>>(`/companies/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return res.data;
}
export async function deleteCompany(id: string): Promise<void> {
  await request(`/companies/${id}`, { method: "DELETE" });
}

// ---- Pipelines ----
export async function listPipelines(): Promise<Pipeline[]> {
  const res = await request<ApiResponse<Pipeline[]>>("/pipelines");
  return res.data;
}
export async function getPipeline(id: string): Promise<Pipeline> {
  const res = await request<ApiResponse<Pipeline>>(`/pipelines/${id}`);
  return res.data;
}
export async function createPipeline(input: CreatePipelineInput): Promise<Pipeline> {
  const res = await request<ApiResponse<Pipeline>>("/pipelines", { method: "POST", body: JSON.stringify(input) });
  return res.data;
}
export async function updatePipeline(id: string, input: UpdatePipelineInput): Promise<Pipeline> {
  const res = await request<ApiResponse<Pipeline>>(`/pipelines/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return res.data;
}
export async function deletePipeline(id: string): Promise<void> {
  await request(`/pipelines/${id}`, { method: "DELETE" });
}

// ---- Deals ----
export async function listDeals(params?: Record<string, string>): Promise<Deal[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await request<ApiResponse<Deal[]>>(`/deals${qs}`);
  return res.data;
}
export async function getDeal(id: string): Promise<Deal> {
  const res = await request<ApiResponse<Deal>>(`/deals/${id}`);
  return res.data;
}
export async function createDeal(input: CreateDealInput): Promise<Deal> {
  const res = await request<ApiResponse<Deal>>("/deals", { method: "POST", body: JSON.stringify(input) });
  return res.data;
}
export async function updateDeal(id: string, input: UpdateDealInput): Promise<Deal> {
  const res = await request<ApiResponse<Deal>>(`/deals/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return res.data;
}
export async function moveDeal(id: string, input: MoveDealInput): Promise<Deal> {
  const res = await request<ApiResponse<Deal>>(`/deals/${id}/move`, { method: "PUT", body: JSON.stringify(input) });
  return res.data;
}
export async function deleteDeal(id: string): Promise<void> {
  await request(`/deals/${id}`, { method: "DELETE" });
}

// ---- Activities ----
export async function listActivities(params?: Record<string, string>): Promise<Activity[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await request<ApiResponse<Activity[]>>(`/activities${qs}`);
  return res.data;
}
export async function getActivity(id: string): Promise<Activity> {
  const res = await request<ApiResponse<Activity>>(`/activities/${id}`);
  return res.data;
}
export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const res = await request<ApiResponse<Activity>>("/activities", { method: "POST", body: JSON.stringify(input) });
  return res.data;
}
export async function updateActivity(id: string, input: UpdateActivityInput): Promise<Activity> {
  const res = await request<ApiResponse<Activity>>(`/activities/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return res.data;
}
export async function deleteActivity(id: string): Promise<void> {
  await request(`/activities/${id}`, { method: "DELETE" });
}

// ---- Dashboard ----
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await request<ApiResponse<DashboardSummary>>("/dashboard/summary");
  return res.data;
}
export async function getPipelineFunnel(pipelineId: string): Promise<PipelineFunnelEntry[]> {
  const res = await request<ApiResponse<PipelineFunnelEntry[]>>(`/dashboard/pipeline-funnel?pipeline_id=${pipelineId}`);
  return res.data;
}
export async function getActivitySummary(): Promise<ActivitySummary[]> {
  const res = await request<ApiResponse<ActivitySummary[]>>("/dashboard/activity-summary");
  return res.data;
}
export async function getRecentDeals(): Promise<RecentDeal[]> {
  const res = await request<ApiResponse<RecentDeal[]>>("/dashboard/recent-deals");
  return res.data;
}
export async function getWinRate(): Promise<WinRateEntry[]> {
  const res = await request<ApiResponse<WinRateEntry[]>>("/dashboard/win-rate");
  return res.data;
}

// ---- Interop ----
export async function exportData(): Promise<CrmExportPayload> {
  return request<CrmExportPayload>("/export");
}
export async function importData(payload: CrmExportPayload): Promise<{ imported_companies: number; imported_contacts: number; imported_pipelines: number; imported_deals: number; imported_activities: number }> {
  const res = await request<ApiResponse<any>>("/import", { method: "POST", body: JSON.stringify(payload) });
  return res.data;
}
