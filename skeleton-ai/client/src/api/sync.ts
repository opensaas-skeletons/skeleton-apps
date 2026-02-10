import type {
  SyncRepo,
  SyncHistory,
  SyncSchedule,
  CreateSyncRepoInput,
  UpdateSyncRepoInput,
  ApiResponse,
} from "@shared/types/ai";

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

// Repos
export async function listSyncRepos(): Promise<SyncRepo[]> {
  const res = await request<ApiResponse<SyncRepo[]>>("/sync/repos");
  return res.data;
}

export async function getSyncRepo(id: string): Promise<SyncRepo> {
  const res = await request<ApiResponse<SyncRepo>>(`/sync/repos/${id}`);
  return res.data;
}

export async function createSyncRepo(input: CreateSyncRepoInput): Promise<SyncRepo> {
  const res = await request<ApiResponse<SyncRepo>>("/sync/repos", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateSyncRepo(id: string, input: UpdateSyncRepoInput): Promise<SyncRepo> {
  const res = await request<ApiResponse<SyncRepo>>(`/sync/repos/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteSyncRepo(id: string): Promise<void> {
  await request(`/sync/repos/${id}`, { method: "DELETE" });
}

// Sync actions
export async function triggerSync(repoId: string): Promise<void> {
  await request(`/sync/repos/${repoId}/sync`, { method: "POST" });
}

export async function triggerSyncAll(): Promise<void> {
  await request("/sync/sync-all", { method: "POST" });
}

// Branches
export async function listBranches(repoId: string): Promise<string[]> {
  const res = await request<ApiResponse<string[]>>(`/sync/repos/${repoId}/branches`);
  return res.data;
}

export async function switchBranch(repoId: string, branch: string): Promise<SyncRepo> {
  const res = await request<ApiResponse<SyncRepo>>(`/sync/repos/${repoId}/branches`, {
    method: "POST",
    body: JSON.stringify({ branch }),
  });
  return res.data;
}

// History
export async function listSyncHistory(repoId?: string, limit?: number): Promise<SyncHistory[]> {
  const params = new URLSearchParams();
  if (repoId) params.set("repo_id", repoId);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  const res = await request<ApiResponse<SyncHistory[]>>(`/sync/history${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function getSyncHistoryEntry(id: string): Promise<SyncHistory> {
  const res = await request<ApiResponse<SyncHistory>>(`/sync/history/${id}`);
  return res.data;
}

// Schedule
export async function getSyncSchedule(): Promise<SyncSchedule> {
  const res = await request<ApiResponse<SyncSchedule>>("/sync/schedule");
  return res.data;
}

export async function updateSyncSchedule(schedule: Partial<SyncSchedule>): Promise<SyncSchedule> {
  const res = await request<ApiResponse<SyncSchedule>>("/sync/schedule", {
    method: "PUT",
    body: JSON.stringify(schedule),
  });
  return res.data;
}

// Status
export async function getSyncStatus(): Promise<{
  total_repos: number;
  syncing: number;
  synced: number;
  errors: number;
  last_sync_at: string | null;
}> {
  const res = await request<ApiResponse<{
    total_repos: number;
    syncing: number;
    synced: number;
    errors: number;
    last_sync_at: string | null;
  }>>("/sync/status");
  return res.data;
}
