import { query, queryOne } from "../db/connection";
import type { Company, CreateCompanyInput, UpdateCompanyInput } from "@shared/types/crm";
import { ValidationError, NotFoundError } from "../errors";

export async function listCompanies(filters?: {
  search?: string;
  industry?: string;
  size?: string;
  sort_by?: string;
  sort_order?: string;
}): Promise<Company[]> {
  let sql = `
    SELECT c.*,
      (SELECT COUNT(*) FROM contacts WHERE company_id = c.id)::int as contact_count,
      (SELECT COUNT(*) FROM deals WHERE company_id = c.id)::int as deal_count
    FROM companies c
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramCount = 1;

  if (filters?.search) {
    sql += ` AND to_tsvector('english', c.name || ' ' || COALESCE(c.domain, '')) @@ plainto_tsquery('english', $${paramCount++})`;
    params.push(filters.search);
  }
  if (filters?.industry) {
    sql += ` AND c.industry = $${paramCount++}`;
    params.push(filters.industry);
  }
  if (filters?.size) {
    sql += ` AND c.size = $${paramCount++}`;
    params.push(filters.size);
  }

  const sortBy = filters?.sort_by || "created_at";
  const sortOrder = filters?.sort_order === "asc" ? "ASC" : "DESC";
  const allowedSorts = ["name", "industry", "created_at", "updated_at"];
  const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : "created_at";
  sql += ` ORDER BY c.${safeSortBy} ${sortOrder}`;

  return query<Company>(sql, params);
}

export async function getCompany(id: string): Promise<Company> {
  const company = await queryOne<Company>(
    `SELECT c.*,
      (SELECT COUNT(*) FROM contacts WHERE company_id = c.id)::int as contact_count,
      (SELECT COUNT(*) FROM deals WHERE company_id = c.id)::int as deal_count
     FROM companies c WHERE c.id = $1`,
    [id]
  );
  if (!company) throw new NotFoundError("Company not found");
  return company;
}

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  if (!input.name?.trim()) throw new ValidationError("Company name is required");

  const company = await queryOne<Company>(
    `INSERT INTO companies (name, domain, industry, size, address, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [input.name.trim(), input.domain || null, input.industry || null, input.size || null, input.address || "", input.notes || ""]
  );
  return company!;
}

export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<Company> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(input.name.trim()); }
  if (input.domain !== undefined) { fields.push(`domain = $${paramCount++}`); values.push(input.domain || null); }
  if (input.industry !== undefined) { fields.push(`industry = $${paramCount++}`); values.push(input.industry || null); }
  if (input.size !== undefined) { fields.push(`size = $${paramCount++}`); values.push(input.size || null); }
  if (input.address !== undefined) { fields.push(`address = $${paramCount++}`); values.push(input.address); }
  if (input.notes !== undefined) { fields.push(`notes = $${paramCount++}`); values.push(input.notes); }

  if (fields.length === 0) return getCompany(id);

  values.push(id);
  const company = await queryOne<Company>(
    `UPDATE companies SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  if (!company) throw new NotFoundError("Company not found");
  return company;
}

export async function deleteCompany(id: string): Promise<void> {
  const result = await query("DELETE FROM companies WHERE id = $1 RETURNING id", [id]);
  if (result.length === 0) throw new NotFoundError("Company not found");
}
