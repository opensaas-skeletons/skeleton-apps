import { query, queryOne, getPool } from "../db/connection";
import { ValidationError } from "../errors";
import type { Field, Row, CsvImportResult, FieldType } from "@shared/types/database";

export async function importCsv(
  tableId: string,
  csvContent: string
): Promise<CsvImportResult> {
  const lines = parseCsvLines(csvContent);
  if (lines.length < 1) {
    throw new ValidationError("CSV file is empty");
  }

  const headers = lines[0];
  const dataLines = lines.slice(1);
  const errors: string[] = [];

  if (headers.length === 0) {
    throw new ValidationError("CSV file has no columns");
  }

  // Collect sample values for each column
  const columnSamples: string[][] = headers.map(() => []);
  for (const line of dataLines) {
    for (let i = 0; i < headers.length; i++) {
      const val = line[i] || "";
      if (val.trim()) {
        columnSamples[i].push(val.trim());
      }
    }
  }

  // Detect types for each column
  const detectedTypes: FieldType[] = headers.map((_, i) =>
    detectFieldType(columnSamples[i])
  );

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get starting field position
    const fieldPosResult = await client.query(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM fields WHERE table_id = $1",
      [tableId]
    );
    let fieldPos = fieldPosResult.rows[0].next_pos;

    // Create fields and collect their IDs
    const fieldIds: string[] = [];
    for (let i = 0; i < headers.length; i++) {
      const result = await client.query(
        `INSERT INTO fields (table_id, title, field_type, position, config, required)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [tableId, headers[i], detectedTypes[i], fieldPos++, JSON.stringify({}), i === 0]
      );
      fieldIds.push(result.rows[0].id);
    }

    // Get starting row position
    const rowPosResult = await client.query(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM rows WHERE table_id = $1",
      [tableId]
    );
    let rowPos = rowPosResult.rows[0].next_pos;

    // Create rows
    let rowsCreated = 0;
    for (let lineIdx = 0; lineIdx < dataLines.length; lineIdx++) {
      const line = dataLines[lineIdx];
      try {
        const data: Record<string, unknown> = {};
        for (let i = 0; i < headers.length; i++) {
          const rawValue = line[i] || "";
          data[fieldIds[i]] = convertValue(rawValue, detectedTypes[i]);
        }

        await client.query(
          `INSERT INTO rows (table_id, data, position)
           VALUES ($1, $2, $3)`,
          [tableId, JSON.stringify(data), rowPos++]
        );
        rowsCreated++;
      } catch (err: any) {
        errors.push(`Row ${lineIdx + 2}: ${err.message}`);
      }
    }

    await client.query("COMMIT");

    return {
      fields_created: fieldIds.length,
      rows_created: rowsCreated,
      errors,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function exportCsv(tableId: string): Promise<string> {
  const fields = await query<Field>(
    "SELECT * FROM fields WHERE table_id = $1 ORDER BY position ASC",
    [tableId]
  );

  const rows = await query<Row>(
    "SELECT * FROM rows WHERE table_id = $1 ORDER BY position ASC",
    [tableId]
  );

  // Build CSV header
  const headers = fields.map((f) => escapeCsvValue(f.title));
  const csvLines: string[] = [headers.join(",")];

  // Build CSV rows
  for (const row of rows) {
    const values = fields.map((f) => {
      const val = row.data[f.id];
      if (val === null || val === undefined) return "";
      return escapeCsvValue(String(val));
    });
    csvLines.push(values.join(","));
  }

  return csvLines.join("\n");
}

function escapeCsvValue(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLines(content: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentLine.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        currentLine.push(currentField.trim());
        if (currentLine.some((v) => v !== "")) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = "";
        if (char === "\r") i++; // Skip \n after \r
      } else {
        currentField += char;
      }
    }
  }

  // Handle last line
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some((v) => v !== "")) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function detectFieldType(samples: string[]): FieldType {
  if (samples.length === 0) return "text";

  // Check checkbox (all "true" or "false")
  if (
    samples.every(
      (s) => s.toLowerCase() === "true" || s.toLowerCase() === "false"
    )
  ) {
    return "checkbox";
  }

  // Check number (all numeric)
  if (samples.every((s) => !isNaN(Number(s)) && s !== "")) {
    return "number";
  }

  // Check email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (samples.every((s) => emailRegex.test(s))) {
    return "email";
  }

  // Check URL
  const urlRegex = /^https?:\/\//i;
  if (samples.every((s) => urlRegex.test(s))) {
    return "url";
  }

  // Check date (ISO-like patterns)
  const dateRegex = /^\d{4}-\d{2}-\d{2}/;
  if (samples.every((s) => dateRegex.test(s))) {
    return "date";
  }

  return "text";
}

function convertValue(raw: string, fieldType: FieldType): unknown {
  if (!raw) return raw;

  switch (fieldType) {
    case "number":
    case "rating":
      return isNaN(Number(raw)) ? raw : Number(raw);
    case "checkbox":
      return raw.toLowerCase() === "true";
    default:
      return raw;
  }
}
