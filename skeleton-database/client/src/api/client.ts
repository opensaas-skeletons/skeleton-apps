import type {
  Base,
  Table,
  Field,
  Row,
  View,
  CreateBaseInput,
  UpdateBaseInput,
  CreateTableInput,
  UpdateTableInput,
  CreateFieldInput,
  UpdateFieldInput,
  CreateRowInput,
  UpdateRowInput,
  CreateViewInput,
  UpdateViewInput,
  BulkCreateRowsInput,
  RowQueryParams,
  ApiResponse,
  PaginatedResponse,
  DatabaseExportPayload,
  CsvImportResult,
} from "@shared/types/database";

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

// ---- Bases ----
export async function listBases(): Promise<Base[]> {
  const res = await request<ApiResponse<Base[]>>("/bases");
  return res.data;
}
export async function getBase(id: string): Promise<Base> {
  const res = await request<ApiResponse<Base>>(`/bases/${id}`);
  return res.data;
}
export async function createBase(input: CreateBaseInput): Promise<Base> {
  const res = await request<ApiResponse<Base>>("/bases", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}
export async function updateBase(
  id: string,
  input: UpdateBaseInput
): Promise<Base> {
  const res = await request<ApiResponse<Base>>(`/bases/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}
export async function deleteBase(id: string): Promise<void> {
  await request(`/bases/${id}`, { method: "DELETE" });
}

// ---- Tables ----
export async function listTables(baseId: string): Promise<Table[]> {
  const res = await request<ApiResponse<Table[]>>(
    `/bases/${baseId}/tables`
  );
  return res.data;
}
export async function getTable(id: string): Promise<Table> {
  const res = await request<ApiResponse<Table>>(`/tables/${id}`);
  return res.data;
}
export async function createTable(input: CreateTableInput): Promise<Table> {
  const res = await request<ApiResponse<Table>>(
    `/bases/${input.base_id}/tables`,
    { method: "POST", body: JSON.stringify(input) }
  );
  return res.data;
}
export async function updateTable(
  id: string,
  input: UpdateTableInput
): Promise<Table> {
  const res = await request<ApiResponse<Table>>(`/tables/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}
export async function deleteTable(id: string): Promise<void> {
  await request(`/tables/${id}`, { method: "DELETE" });
}

// ---- Fields ----
export async function listFields(tableId: string): Promise<Field[]> {
  const res = await request<ApiResponse<Field[]>>(
    `/tables/${tableId}/fields`
  );
  return res.data;
}
export async function createField(input: CreateFieldInput): Promise<Field> {
  const res = await request<ApiResponse<Field>>(
    `/tables/${input.table_id}/fields`,
    { method: "POST", body: JSON.stringify(input) }
  );
  return res.data;
}
export async function updateField(
  id: string,
  input: UpdateFieldInput
): Promise<Field> {
  const res = await request<ApiResponse<Field>>(`/fields/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}
export async function deleteField(id: string): Promise<void> {
  await request(`/fields/${id}`, { method: "DELETE" });
}

// ---- Rows ----
export async function listRows(
  tableId: string,
  params?: RowQueryParams
): Promise<PaginatedResponse<Row>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.per_page) searchParams.set("per_page", String(params.per_page));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.filters?.length)
    searchParams.set("filters", JSON.stringify(params.filters));
  if (params?.sorts?.length)
    searchParams.set("sorts", JSON.stringify(params.sorts));
  const qs = searchParams.toString();
  return request<PaginatedResponse<Row>>(
    `/tables/${tableId}/rows${qs ? `?${qs}` : ""}`
  );
}
export async function getRow(id: string): Promise<Row> {
  const res = await request<ApiResponse<Row>>(`/rows/${id}`);
  return res.data;
}
export async function createRow(input: CreateRowInput): Promise<Row> {
  const res = await request<ApiResponse<Row>>(
    `/tables/${input.table_id}/rows`,
    { method: "POST", body: JSON.stringify(input) }
  );
  return res.data;
}
export async function updateRow(
  id: string,
  input: UpdateRowInput
): Promise<Row> {
  const res = await request<ApiResponse<Row>>(`/rows/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}
export async function deleteRow(id: string): Promise<void> {
  await request(`/rows/${id}`, { method: "DELETE" });
}
export async function bulkCreateRows(
  input: BulkCreateRowsInput
): Promise<Row[]> {
  const res = await request<ApiResponse<Row[]>>(
    `/tables/${input.table_id}/rows/bulk`,
    { method: "POST", body: JSON.stringify(input) }
  );
  return res.data;
}
export async function bulkDeleteRows(ids: string[]): Promise<void> {
  await request("/rows/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

// ---- Views ----
export async function listViews(tableId: string): Promise<View[]> {
  const res = await request<ApiResponse<View[]>>(
    `/tables/${tableId}/views`
  );
  return res.data;
}
export async function createView(input: CreateViewInput): Promise<View> {
  const res = await request<ApiResponse<View>>(
    `/tables/${input.table_id}/views`,
    { method: "POST", body: JSON.stringify(input) }
  );
  return res.data;
}
export async function updateView(
  id: string,
  input: UpdateViewInput
): Promise<View> {
  const res = await request<ApiResponse<View>>(`/views/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}
export async function deleteView(id: string): Promise<void> {
  await request(`/views/${id}`, { method: "DELETE" });
}

// ---- CSV ----
export async function importCsv(
  tableId: string,
  file: File
): Promise<CsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/tables/${tableId}/import/csv`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Import failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}
export async function exportCsv(tableId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/tables/${tableId}/export/csv`);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Interop ----
export async function exportData(): Promise<DatabaseExportPayload> {
  return request<DatabaseExportPayload>("/export");
}
export async function importData(
  payload: DatabaseExportPayload
): Promise<{ imported_bases: number }> {
  const res = await request<ApiResponse<{ imported_bases: number }>>(
    "/import",
    { method: "POST", body: JSON.stringify(payload) }
  );
  return res.data;
}
