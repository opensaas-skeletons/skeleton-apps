/**
 * API Client
 * ==========
 * Centralized HTTP client for the task tracker API.
 *
 * LLM BUILDERS: If you add auth, attach the token in the headers below.
 * If you add new endpoints, add corresponding functions here.
 */

import type {
  Board,
  BoardWithDetails,
  Task,
  CreateBoardInput,
  UpdateBoardInput,
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  CreateColumnInput,
  UpdateColumnInput,
  ExportPayload,
  ApiResponse,
} from "@shared/types/task";

const BASE_URL = "/api";
const AUTH_TOKEN_KEY = "skeleton_tasks_token";

/**
 * Get the stored JWT token. Returns null if no token is stored.
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Store a JWT token for subsequent API requests.
 */
export function setToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Clear the stored JWT token (logout).
 */
export function clearToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ---- Board API ----

export async function listBoards(): Promise<Board[]> {
  const res = await request<ApiResponse<Board[]>>("/boards");
  return res.data;
}

export async function getBoard(id: string): Promise<BoardWithDetails> {
  const res = await request<ApiResponse<BoardWithDetails>>(`/boards/${id}`);
  return res.data;
}

export async function createBoard(input: CreateBoardInput): Promise<BoardWithDetails> {
  const res = await request<ApiResponse<BoardWithDetails>>("/boards", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateBoard(id: string, input: UpdateBoardInput): Promise<Board> {
  const res = await request<ApiResponse<Board>>(`/boards/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteBoard(id: string): Promise<void> {
  await request(`/boards/${id}`, { method: "DELETE" });
}

// ---- Column API ----

export async function createColumn(boardId: string, input: CreateColumnInput): Promise<any> {
  const res = await request<ApiResponse<any>>(`/boards/${boardId}/columns`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateColumn(id: string, input: UpdateColumnInput): Promise<any> {
  const res = await request<ApiResponse<any>>(`/boards/columns/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteColumn(id: string): Promise<void> {
  await request(`/boards/columns/${id}`, { method: "DELETE" });
}

// ---- Task API ----

export async function createTask(boardId: string, input: CreateTaskInput): Promise<Task> {
  const res = await request<ApiResponse<Task>>(`/boards/${boardId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const res = await request<ApiResponse<Task>>(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function moveTask(id: string, input: MoveTaskInput): Promise<Task> {
  const res = await request<ApiResponse<Task>>(`/tasks/${id}/move`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteTask(id: string): Promise<void> {
  await request(`/tasks/${id}`, { method: "DELETE" });
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

export async function exportData(): Promise<ExportPayload> {
  return request<ExportPayload>("/export");
}

export async function importData(payload: ExportPayload): Promise<{ imported_boards: number }> {
  const res = await request<ApiResponse<{ imported_boards: number }>>("/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}
