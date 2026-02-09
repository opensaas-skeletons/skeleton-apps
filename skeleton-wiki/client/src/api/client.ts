import type {
  Workspace,
  Page,
  PageVersion,
  PageTreeNode,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  CreatePageInput,
  UpdatePageInput,
  SearchResult,
  ApiResponse,
  WikiExportPayload,
} from "@shared/types/wiki";

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

// ---- Workspaces ----
export async function listWorkspaces(): Promise<Workspace[]> {
  const res = await request<ApiResponse<Workspace[]>>("/workspaces");
  return res.data;
}
export async function getWorkspace(id: string): Promise<Workspace> {
  const res = await request<ApiResponse<Workspace>>(`/workspaces/${id}`);
  return res.data;
}
export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  const res = await request<ApiResponse<Workspace>>("/workspaces", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}
export async function updateWorkspace(id: string, input: UpdateWorkspaceInput): Promise<Workspace> {
  const res = await request<ApiResponse<Workspace>>(`/workspaces/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}
export async function deleteWorkspace(id: string): Promise<void> {
  await request(`/workspaces/${id}`, { method: "DELETE" });
}

// ---- Pages ----
export async function listPages(workspaceId: string): Promise<Page[]> {
  const res = await request<ApiResponse<Page[]>>(`/workspaces/${workspaceId}/pages`);
  return res.data;
}
export async function getPageTree(workspaceId: string): Promise<PageTreeNode[]> {
  const res = await request<ApiResponse<PageTreeNode[]>>(`/workspaces/${workspaceId}/pages/tree`);
  return res.data;
}
export async function getPage(id: string): Promise<Page> {
  const res = await request<ApiResponse<Page>>(`/pages/${id}`);
  return res.data;
}
export async function getPageBySlug(workspaceId: string, slug: string): Promise<Page> {
  const res = await request<ApiResponse<Page>>(`/workspaces/${workspaceId}/pages/by-slug/${slug}`);
  return res.data;
}
export async function createPage(input: CreatePageInput): Promise<Page> {
  const res = await request<ApiResponse<Page>>(`/workspaces/${input.workspace_id}/pages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}
export async function updatePage(id: string, input: UpdatePageInput): Promise<Page> {
  const res = await request<ApiResponse<Page>>(`/pages/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}
export async function deletePage(id: string): Promise<void> {
  await request(`/pages/${id}`, { method: "DELETE" });
}

// ---- Search ----
export async function searchPages(workspaceId: string, query: string): Promise<SearchResult[]> {
  const res = await request<ApiResponse<SearchResult[]>>(
    `/workspaces/${workspaceId}/search?q=${encodeURIComponent(query)}`
  );
  return res.data;
}

// ---- Versions ----
export async function getPageVersions(pageId: string): Promise<PageVersion[]> {
  const res = await request<ApiResponse<PageVersion[]>>(`/pages/${pageId}/versions`);
  return res.data;
}
export async function restorePageVersion(pageId: string, versionId: string): Promise<Page> {
  const res = await request<ApiResponse<Page>>(`/pages/${pageId}/versions/${versionId}/restore`, {
    method: "POST",
  });
  return res.data;
}

// ---- Backlinks ----
export async function getBacklinks(pageId: string): Promise<Page[]> {
  const res = await request<ApiResponse<Page[]>>(`/pages/${pageId}/backlinks`);
  return res.data;
}

// ---- Interop ----
export async function exportData(): Promise<WikiExportPayload> {
  return request<WikiExportPayload>("/export");
}
export async function importData(
  payload: WikiExportPayload
): Promise<{ imported_workspaces: number }> {
  const res = await request<ApiResponse<{ imported_workspaces: number }>>(
    "/import",
    { method: "POST", body: JSON.stringify(payload) }
  );
  return res.data;
}
