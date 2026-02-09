import { query, queryOne } from "../db/connection";
import { NotFoundError, ValidationError } from "../errors";
import type {
  Row,
  Field,
  CreateRowInput,
  UpdateRowInput,
  BulkCreateRowsInput,
  RowQueryParams,
  FilterCondition,
  SortCondition,
  PaginatedResponse,
} from "@shared/types/database";
import { ROWS_PER_PAGE, MAX_ROWS_PER_PAGE } from "@shared/constants";

export async function listRows(
  tableId: string,
  params: RowQueryParams
): Promise<PaginatedResponse<Row>> {
  // Fetch fields for type-aware filtering and sorting
  const fields = await query<Field>(
    "SELECT * FROM fields WHERE table_id = $1",
    [tableId]
  );
  const fieldMap = new Map(fields.map((f) => [f.id, f]));

  const whereClauses: string[] = ["r.table_id = $1"];
  const queryParams: any[] = [tableId];
  let paramIndex = 2;

  // Apply filters
  if (params.filters && params.filters.length > 0) {
    for (const filter of params.filters) {
      const field = fieldMap.get(filter.field_id);
      if (!field) continue;

      const fieldType = field.field_type;
      const clause = buildFilterClause(
        filter,
        fieldType,
        paramIndex,
        queryParams
      );
      if (clause) {
        whereClauses.push(clause.sql);
        paramIndex = clause.nextParamIndex;
      }
    }
  }

  // Apply search
  if (params.search && params.search.trim()) {
    whereClauses.push(
      `EXISTS (SELECT 1 FROM jsonb_each_text(r.data) AS kv WHERE kv.value ILIKE '%' || $${paramIndex} || '%')`
    );
    queryParams.push(params.search.trim());
    paramIndex++;
  }

  const whereSQL = whereClauses.join(" AND ");

  // Build ORDER BY
  let orderSQL = "r.position ASC, r.created_at ASC";
  if (params.sorts && params.sorts.length > 0) {
    const sortClauses = buildSortClauses(params.sorts, fieldMap);
    if (sortClauses.length > 0) {
      orderSQL = sortClauses.join(", ");
    }
  }

  // Pagination
  const page = Math.max(1, params.page || 1);
  const perPage = Math.min(
    Math.max(1, params.per_page || ROWS_PER_PAGE),
    MAX_ROWS_PER_PAGE
  );
  const offset = (page - 1) * perPage;

  const sql = `
    SELECT r.*, COUNT(*) OVER() AS _total_count
    FROM rows r
    WHERE ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  queryParams.push(perPage, offset);

  const rows = await query<Row & { _total_count: string }>(sql, queryParams);

  const total = rows.length > 0 ? parseInt(rows[0]._total_count, 10) : 0;

  // Strip _total_count from results
  const cleanRows = rows.map(({ _total_count, ...row }) => row) as Row[];

  return {
    success: true,
    data: cleanRows,
    total,
    page,
    per_page: perPage,
  };
}

function buildFilterClause(
  filter: FilterCondition,
  fieldType: string,
  paramIndex: number,
  queryParams: any[]
): { sql: string; nextParamIndex: number } | null {
  const fieldRef = `r.data->>'${filter.field_id}'`;
  const isNumeric = fieldType === "number" || fieldType === "rating";
  const isCheckbox = fieldType === "checkbox";

  switch (filter.operator) {
    case "eq":
      if (isNumeric) {
        queryParams.push(parseFloat(filter.value));
        return {
          sql: `(${fieldRef})::numeric = $${paramIndex}`,
          nextParamIndex: paramIndex + 1,
        };
      }
      if (isCheckbox) {
        queryParams.push(filter.value === "true");
        return {
          sql: `(${fieldRef})::boolean = $${paramIndex}`,
          nextParamIndex: paramIndex + 1,
        };
      }
      queryParams.push(filter.value);
      return {
        sql: `${fieldRef} = $${paramIndex}`,
        nextParamIndex: paramIndex + 1,
      };

    case "neq":
      if (isNumeric) {
        queryParams.push(parseFloat(filter.value));
        return {
          sql: `(${fieldRef} IS NULL OR (${fieldRef})::numeric != $${paramIndex})`,
          nextParamIndex: paramIndex + 1,
        };
      }
      queryParams.push(filter.value);
      return {
        sql: `(${fieldRef} IS NULL OR ${fieldRef} != $${paramIndex})`,
        nextParamIndex: paramIndex + 1,
      };

    case "contains":
      queryParams.push(filter.value);
      return {
        sql: `${fieldRef} ILIKE '%' || $${paramIndex} || '%'`,
        nextParamIndex: paramIndex + 1,
      };

    case "not_contains":
      queryParams.push(filter.value);
      return {
        sql: `(${fieldRef} IS NULL OR ${fieldRef} NOT ILIKE '%' || $${paramIndex} || '%')`,
        nextParamIndex: paramIndex + 1,
      };

    case "gt":
      queryParams.push(parseFloat(filter.value));
      return {
        sql: `(${fieldRef})::numeric > $${paramIndex}`,
        nextParamIndex: paramIndex + 1,
      };

    case "lt":
      queryParams.push(parseFloat(filter.value));
      return {
        sql: `(${fieldRef})::numeric < $${paramIndex}`,
        nextParamIndex: paramIndex + 1,
      };

    case "gte":
      queryParams.push(parseFloat(filter.value));
      return {
        sql: `(${fieldRef})::numeric >= $${paramIndex}`,
        nextParamIndex: paramIndex + 1,
      };

    case "lte":
      queryParams.push(parseFloat(filter.value));
      return {
        sql: `(${fieldRef})::numeric <= $${paramIndex}`,
        nextParamIndex: paramIndex + 1,
      };

    case "is_empty":
      return {
        sql: `(${fieldRef} IS NULL OR ${fieldRef} = '')`,
        nextParamIndex: paramIndex,
      };

    case "is_not_empty":
      return {
        sql: `(${fieldRef} IS NOT NULL AND ${fieldRef} != '')`,
        nextParamIndex: paramIndex,
      };

    default:
      return null;
  }
}

function buildSortClauses(
  sorts: SortCondition[],
  fieldMap: Map<string, Field>
): string[] {
  const clauses: string[] = [];

  for (const sort of sorts) {
    const field = fieldMap.get(sort.field_id);
    if (!field) continue;

    const dir = sort.direction === "desc" ? "DESC" : "ASC";
    const isNumeric = field.field_type === "number" || field.field_type === "rating";

    if (isNumeric) {
      clauses.push(`(r.data->>'${sort.field_id}')::numeric ${dir} NULLS LAST`);
    } else {
      clauses.push(`r.data->>'${sort.field_id}' ${dir} NULLS LAST`);
    }
  }

  return clauses;
}

export async function getRow(id: string): Promise<Row> {
  const row = await queryOne<Row>("SELECT * FROM rows WHERE id = $1", [id]);
  if (!row) {
    throw new NotFoundError("Row not found");
  }
  return row;
}

export async function createRow(input: CreateRowInput): Promise<Row> {
  // Get next position
  const posResult = await query<{ next_pos: number }>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM rows WHERE table_id = $1",
    [input.table_id]
  );
  const nextPos = posResult[0].next_pos;

  const row = await queryOne<Row>(
    `INSERT INTO rows (table_id, data, position)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.table_id, JSON.stringify(input.data || {}), nextPos]
  );

  return row!;
}

export async function updateRow(id: string, input: UpdateRowInput): Promise<Row> {
  await getRow(id);

  const row = await queryOne<Row>(
    `UPDATE rows SET data = data || $1::jsonb WHERE id = $2 RETURNING *`,
    [JSON.stringify(input.data), id]
  );

  return row!;
}

export async function bulkCreateRows(input: BulkCreateRowsInput): Promise<Row[]> {
  if (!input.rows || input.rows.length === 0) {
    throw new ValidationError("At least one row is required");
  }

  // Get starting position
  const posResult = await query<{ next_pos: number }>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM rows WHERE table_id = $1",
    [input.table_id]
  );
  let nextPos = posResult[0].next_pos;

  const results: Row[] = [];

  for (const rowData of input.rows) {
    const row = await queryOne<Row>(
      `INSERT INTO rows (table_id, data, position)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.table_id, JSON.stringify(rowData || {}), nextPos++]
    );
    results.push(row!);
  }

  return results;
}

export async function bulkDeleteRows(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) {
    throw new ValidationError("At least one row ID is required");
  }

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
  await query(`DELETE FROM rows WHERE id IN (${placeholders})`, ids);
}

export async function deleteRow(id: string): Promise<void> {
  await getRow(id);
  await query("DELETE FROM rows WHERE id = $1", [id]);
}
