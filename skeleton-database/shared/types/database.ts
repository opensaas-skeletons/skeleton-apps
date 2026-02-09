// ---- Entity types ----

export interface Base {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  base_id: string;
  title: string;
  description: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Field {
  id: string;
  table_id: string;
  title: string;
  field_type: FieldType;
  position: number;
  config: FieldConfig;
  required: boolean;
  created_at: string;
}

export interface Row {
  id: string;
  table_id: string;
  data: Record<string, unknown>;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface View {
  id: string;
  table_id: string;
  title: string;
  view_type: ViewType;
  config: ViewConfig;
  position: number;
  created_at: string;
}

// ---- Field types ----

export type FieldType =
  | "text"
  | "long_text"
  | "number"
  | "checkbox"
  | "select"
  | "multi_select"
  | "date"
  | "email"
  | "url"
  | "phone"
  | "rating"
  | "formula"
  | "relation";

export type ViewType = "grid" | "form";

export interface FieldConfig {
  options?: SelectOption[];
  precision?: number;
  formula?: string;
  related_table_id?: string;
  default_value?: unknown;
}

export interface SelectOption {
  label: string;
  color: string;
}

export interface ViewConfig {
  filters: FilterCondition[];
  sorts: SortCondition[];
  hidden_fields: string[];
  field_widths: Record<string, number>;
}

// ---- Input types ----

export interface CreateBaseInput {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateBaseInput {
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface CreateTableInput {
  base_id: string;
  title: string;
  description?: string;
}

export interface UpdateTableInput {
  title?: string;
  description?: string;
}

export interface CreateFieldInput {
  table_id: string;
  title: string;
  field_type: FieldType;
  config?: FieldConfig;
  required?: boolean;
}

export interface UpdateFieldInput {
  title?: string;
  config?: FieldConfig;
  required?: boolean;
}

export interface CreateRowInput {
  table_id: string;
  data: Record<string, unknown>;
}

export interface UpdateRowInput {
  data: Record<string, unknown>;
}

export interface CreateViewInput {
  table_id: string;
  title: string;
  view_type: ViewType;
  config?: Partial<ViewConfig>;
}

export interface UpdateViewInput {
  title?: string;
  config?: Partial<ViewConfig>;
}

export interface BulkCreateRowsInput {
  table_id: string;
  rows: Record<string, unknown>[];
}

// ---- Query types ----

export interface FilterCondition {
  field_id: string;
  operator: FilterOperator;
  value: string;
}

export type FilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "not_contains"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "is_empty"
  | "is_not_empty";

export interface SortCondition {
  field_id: string;
  direction: "asc" | "desc";
}

export interface RowQueryParams {
  filters?: FilterCondition[];
  sorts?: SortCondition[];
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

export interface DatabaseExportPayload {
  version: "1.0";
  exported_at: string;
  source: string;
  bases: BaseExport[];
}

export interface BaseExport {
  title: string;
  description: string;
  icon: string;
  color: string;
  tables: TableExport[];
}

export interface TableExport {
  title: string;
  description: string;
  fields: FieldExport[];
  rows: RowExport[];
  views: ViewExport[];
}

export interface FieldExport {
  title: string;
  field_type: FieldType;
  config: FieldConfig;
  required: boolean;
}

export interface RowExport {
  data: Record<string, unknown>; // keyed by field TITLE not ID
}

export interface ViewExport {
  title: string;
  view_type: ViewType;
}

// ---- CSV types ----

export interface CsvImportResult {
  fields_created: number;
  rows_created: number;
  errors: string[];
}
