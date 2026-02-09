// DO NOT MODIFY -- Interop standard routes for skeleton ecosystem compatibility

import { Router, Request, Response, NextFunction } from "express";
import { query } from "../db/connection";
import { ValidationError } from "../errors";
import { APP_NAME, INTEROP_VERSION } from "@shared/constants";
import type {
  Base,
  Table,
  Field,
  Row,
  View,
  DatabaseExportPayload,
  BaseExport,
  TableExport,
  FieldExport,
  RowExport,
  ViewExport,
} from "@shared/types/database";

const router = Router();

// GET /api/export -- exports all bases with their tables, fields, rows, views
router.get(
  "/export",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const bases = await query<Base>("SELECT * FROM bases ORDER BY created_at ASC");

      const baseExports: BaseExport[] = [];

      for (const base of bases) {
        const tables = await query<Table>(
          "SELECT * FROM tables WHERE base_id = $1 ORDER BY position ASC",
          [base.id]
        );

        const tableExports: TableExport[] = [];

        for (const table of tables) {
          const fields = await query<Field>(
            "SELECT * FROM fields WHERE table_id = $1 ORDER BY position ASC",
            [table.id]
          );
          const rows = await query<Row>(
            "SELECT * FROM rows WHERE table_id = $1 ORDER BY position ASC",
            [table.id]
          );
          const views = await query<View>(
            "SELECT * FROM views WHERE table_id = $1 ORDER BY position ASC",
            [table.id]
          );

          // Build field ID -> title map for converting row data keys
          const fieldIdToTitle = new Map(fields.map((f) => [f.id, f.title]));

          const fieldExports: FieldExport[] = fields.map((f) => ({
            title: f.title,
            field_type: f.field_type,
            config: f.config,
            required: f.required,
          }));

          // Convert row data from field-UUID-keyed to field-title-keyed
          const rowExports: RowExport[] = rows.map((r) => {
            const data: Record<string, unknown> = {};
            for (const [fieldId, value] of Object.entries(r.data)) {
              const title = fieldIdToTitle.get(fieldId);
              if (title) {
                data[title] = value;
              }
            }
            return { data };
          });

          const viewExports: ViewExport[] = views.map((v) => ({
            title: v.title,
            view_type: v.view_type,
          }));

          tableExports.push({
            title: table.title,
            description: table.description,
            fields: fieldExports,
            rows: rowExports,
            views: viewExports,
          });
        }

        baseExports.push({
          title: base.title,
          description: base.description,
          icon: base.icon,
          color: base.color,
          tables: tableExports,
        });
      }

      const payload: DatabaseExportPayload = {
        version: INTEROP_VERSION as "1.0",
        exported_at: new Date().toISOString(),
        source: APP_NAME,
        bases: baseExports,
      };

      res.json(payload);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/import -- imports bases from interop format
router.post(
  "/import",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as DatabaseExportPayload;

      if (!payload.version || !payload.bases) {
        throw new ValidationError(
          "Invalid import payload. Expected { version, bases }."
        );
      }

      if (payload.version !== "1.0") {
        throw new ValidationError(
          `Unsupported interop version: ${payload.version}. Expected 1.0.`
        );
      }

      let importedBases = 0;
      let importedTables = 0;
      let importedRows = 0;

      for (const baseData of payload.bases) {
        if (!baseData.title) {
          console.warn("[Import] Skipping base without title");
          continue;
        }

        // Create base
        const baseResult = await query<Base>(
          `INSERT INTO bases (title, description, icon, color)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [
            baseData.title,
            baseData.description || "",
            baseData.icon || "📊",
            baseData.color || "#3b82f6",
          ]
        );
        const base = baseResult[0];
        importedBases++;

        if (!baseData.tables) continue;

        for (let tIdx = 0; tIdx < baseData.tables.length; tIdx++) {
          const tableData = baseData.tables[tIdx];

          // Create table
          const tableResult = await query<Table>(
            `INSERT INTO tables (base_id, title, description, position)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [base.id, tableData.title, tableData.description || "", tIdx]
          );
          const table = tableResult[0];
          importedTables++;

          // Create fields and build title -> ID map
          const fieldTitleToId = new Map<string, string>();

          if (tableData.fields) {
            for (let fIdx = 0; fIdx < tableData.fields.length; fIdx++) {
              const fieldData = tableData.fields[fIdx];
              const fieldResult = await query<Field>(
                `INSERT INTO fields (table_id, title, field_type, position, config, required)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [
                  table.id,
                  fieldData.title,
                  fieldData.field_type,
                  fIdx,
                  JSON.stringify(fieldData.config || {}),
                  fieldData.required || false,
                ]
              );
              fieldTitleToId.set(fieldData.title, fieldResult[0].id);
            }
          }

          // Create rows, converting field-title-keyed data to field-UUID-keyed
          if (tableData.rows) {
            for (let rIdx = 0; rIdx < tableData.rows.length; rIdx++) {
              const rowData = tableData.rows[rIdx];
              const data: Record<string, unknown> = {};

              for (const [title, value] of Object.entries(rowData.data)) {
                const fieldId = fieldTitleToId.get(title);
                if (fieldId) {
                  data[fieldId] = value;
                }
              }

              await query(
                `INSERT INTO rows (table_id, data, position)
                 VALUES ($1, $2, $3)`,
                [table.id, JSON.stringify(data), rIdx]
              );
              importedRows++;
            }
          }

          // Create views
          if (tableData.views) {
            for (let vIdx = 0; vIdx < tableData.views.length; vIdx++) {
              const viewData = tableData.views[vIdx];
              await query(
                `INSERT INTO views (table_id, title, view_type, config, position)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                  table.id,
                  viewData.title,
                  viewData.view_type || "grid",
                  JSON.stringify({ filters: [], sorts: [], hidden_fields: [], field_widths: {} }),
                  vIdx,
                ]
              );
            }
          }
        }
      }

      res.json({
        success: true,
        data: {
          imported_bases: importedBases,
          imported_tables: importedTables,
          imported_rows: importedRows,
          total_in_payload: payload.bases.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
