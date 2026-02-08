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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      // TODO: Add auth token here
      // "Authorization": `Bearer ${getToken()}`,
    },
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
