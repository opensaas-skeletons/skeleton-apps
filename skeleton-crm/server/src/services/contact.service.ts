import { query, queryOne } from "../db/connection";
import type { Contact, CreateContactInput, UpdateContactInput } from "@shared/types/crm";
import { ValidationError, NotFoundError } from "../errors";

export async function listContacts(filters?: {
  search?: string;
  company_id?: string;
  source?: string;
  sort_by?: string;
  sort_order?: string;
}): Promise<Contact[]> {
  let sql = `
    SELECT c.*, co.name as company_name
    FROM contacts c
    LEFT JOIN companies co ON c.company_id = co.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramCount = 1;

  if (filters?.search) {
    sql += ` AND to_tsvector('english', c.first_name || ' ' || c.last_name || ' ' || COALESCE(c.email, '')) @@ plainto_tsquery('english', $${paramCount++})`;
    params.push(filters.search);
  }
  if (filters?.company_id) {
    sql += ` AND c.company_id = $${paramCount++}`;
    params.push(filters.company_id);
  }
  if (filters?.source) {
    sql += ` AND c.source = $${paramCount++}`;
    params.push(filters.source);
  }

  const sortBy = filters?.sort_by || "created_at";
  const sortOrder = filters?.sort_order === "asc" ? "ASC" : "DESC";
  const allowedSorts = ["first_name", "last_name", "email", "created_at", "updated_at"];
  const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : "created_at";
  sql += ` ORDER BY c.${safeSortBy} ${sortOrder}`;

  return query<Contact>(sql, params);
}

export async function getContact(id: string): Promise<Contact> {
  const contact = await queryOne<Contact>(
    `SELECT c.*, co.name as company_name
     FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     WHERE c.id = $1`,
    [id]
  );
  if (!contact) throw new NotFoundError("Contact not found");
  return contact;
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  if (!input.first_name?.trim() || !input.last_name?.trim()) {
    throw new ValidationError("First name and last name are required");
  }

  const contact = await queryOne<Contact>(
    `INSERT INTO contacts (first_name, last_name, email, phone, company_id, title, source, notes, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      input.first_name.trim(),
      input.last_name.trim(),
      input.email || null,
      input.phone || null,
      input.company_id || null,
      input.title || null,
      input.source || "manual",
      input.notes || "",
      JSON.stringify(input.tags || []),
    ]
  );
  return contact!;
}

export async function updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.first_name !== undefined) { fields.push(`first_name = $${paramCount++}`); values.push(input.first_name.trim()); }
  if (input.last_name !== undefined) { fields.push(`last_name = $${paramCount++}`); values.push(input.last_name.trim()); }
  if (input.email !== undefined) { fields.push(`email = $${paramCount++}`); values.push(input.email || null); }
  if (input.phone !== undefined) { fields.push(`phone = $${paramCount++}`); values.push(input.phone || null); }
  if (input.company_id !== undefined) { fields.push(`company_id = $${paramCount++}`); values.push(input.company_id || null); }
  if (input.title !== undefined) { fields.push(`title = $${paramCount++}`); values.push(input.title || null); }
  if (input.source !== undefined) { fields.push(`source = $${paramCount++}`); values.push(input.source); }
  if (input.notes !== undefined) { fields.push(`notes = $${paramCount++}`); values.push(input.notes); }
  if (input.tags !== undefined) { fields.push(`tags = $${paramCount++}`); values.push(JSON.stringify(input.tags)); }

  if (fields.length === 0) return getContact(id);

  values.push(id);
  const contact = await queryOne<Contact>(
    `UPDATE contacts SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  if (!contact) throw new NotFoundError("Contact not found");
  return contact;
}

export async function deleteContact(id: string): Promise<void> {
  const result = await query("DELETE FROM contacts WHERE id = $1 RETURNING id", [id]);
  if (result.length === 0) throw new NotFoundError("Contact not found");
}

export async function importContacts(rows: Record<string, string>[]): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const firstName = row.first_name?.trim();
    const lastName = row.last_name?.trim();
    if (!firstName || !lastName) { skipped++; continue; }

    let companyId: string | null = null;
    if (row.company_name?.trim()) {
      const company = await queryOne<{ id: string }>(
        "SELECT id FROM companies WHERE LOWER(name) = LOWER($1)",
        [row.company_name.trim()]
      );
      if (company) {
        companyId = company.id;
      } else {
        const newCompany = await queryOne<{ id: string }>(
          "INSERT INTO companies (name) VALUES ($1) RETURNING id",
          [row.company_name.trim()]
        );
        companyId = newCompany!.id;
      }
    }

    let tags: string[] = [];
    if (row.tags) {
      tags = row.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }

    await queryOne(
      `INSERT INTO contacts (first_name, last_name, email, phone, title, company_id, source, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [firstName, lastName, row.email || null, row.phone || null, row.title || null, companyId, row.source || "import", JSON.stringify(tags)]
    );
    imported++;
  }

  return { imported, skipped };
}
