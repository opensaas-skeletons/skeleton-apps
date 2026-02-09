// ---- Entity types ----

export interface Workspace {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  content: string;
  icon: string;
  position: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageVersion {
  id: string;
  page_id: string;
  title: string;
  content: string;
  version_number: number;
  created_at: string;
}

export interface WikiLink {
  id: string;
  source_page_id: string;
  target_page_id: string;
  created_at: string;
}

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

// ---- Input types ----

export interface CreateWorkspaceInput {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateWorkspaceInput {
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface CreatePageInput {
  workspace_id: string;
  parent_id?: string | null;
  title: string;
  content?: string;
  icon?: string;
}

export interface UpdatePageInput {
  title?: string;
  content?: string;
  parent_id?: string | null;
  icon?: string;
  position?: number;
  is_pinned?: boolean;
}

export interface MovePageInput {
  parent_id: string | null;
  position: number;
}

// ---- Query types ----

export interface SearchResult {
  page: Page;
  snippet: string;
  match_type: "title" | "content";
}

export interface PageQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
}

// ---- Response types ----

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// ---- Interop types ----

export interface WikiExportPayload {
  version: "1.0";
  exported_at: string;
  source: string;
  workspaces: WorkspaceExport[];
}

export interface WorkspaceExport {
  title: string;
  description: string;
  icon: string;
  color: string;
  pages: PageExport[];
}

export interface PageExport {
  title: string;
  slug: string;
  content: string;
  icon: string;
  parent_slug: string | null;
  position: number;
  is_pinned: boolean;
}
