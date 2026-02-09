// DO NOT MODIFY -- Interop standard routes for skeleton ecosystem compatibility

import { Router, Request, Response, NextFunction } from "express";
import { query } from "../db/connection";
import { ValidationError } from "../errors";
import { APP_NAME, INTEROP_VERSION } from "@shared/constants";
import type {
  Workspace,
  Page,
  WikiExportPayload,
  WorkspaceExport,
  PageExport,
} from "@shared/types/wiki";

const router = Router();

// GET /api/export
router.get(
  "/export",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaces = await query<Workspace>(
        "SELECT * FROM workspaces ORDER BY created_at ASC"
      );

      const workspaceExports: WorkspaceExport[] = [];

      for (const ws of workspaces) {
        const pages = await query<Page>(
          "SELECT * FROM pages WHERE workspace_id = $1 ORDER BY position ASC",
          [ws.id]
        );

        // Build id -> slug map for parent references
        const idToSlug = new Map(pages.map((p) => [p.id, p.slug]));

        const pageExports: PageExport[] = pages.map((p) => ({
          title: p.title,
          slug: p.slug,
          content: p.content,
          icon: p.icon,
          parent_slug: p.parent_id ? idToSlug.get(p.parent_id) || null : null,
          position: p.position,
          is_pinned: p.is_pinned,
        }));

        workspaceExports.push({
          title: ws.title,
          description: ws.description,
          icon: ws.icon,
          color: ws.color,
          pages: pageExports,
        });
      }

      const payload: WikiExportPayload = {
        version: INTEROP_VERSION as "1.0",
        exported_at: new Date().toISOString(),
        source: APP_NAME,
        workspaces: workspaceExports,
      };

      res.json(payload);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/import
router.post(
  "/import",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as WikiExportPayload;

      if (!payload.version || !payload.workspaces) {
        throw new ValidationError(
          "Invalid import payload. Expected { version, workspaces }."
        );
      }

      if (payload.version !== "1.0") {
        throw new ValidationError(
          `Unsupported interop version: ${payload.version}. Expected 1.0.`
        );
      }

      let importedWorkspaces = 0;
      let importedPages = 0;

      for (const wsData of payload.workspaces) {
        if (!wsData.title) {
          console.warn("[Import] Skipping workspace without title");
          continue;
        }

        const wsResult = await query<Workspace>(
          `INSERT INTO workspaces (title, description, icon, color)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [
            wsData.title,
            wsData.description || "",
            wsData.icon || "📚",
            wsData.color || "#3b82f6",
          ]
        );
        const ws = wsResult[0];
        importedWorkspaces++;

        if (!wsData.pages) continue;

        // First pass: create all pages without parent_id
        const slugToId = new Map<string, string>();
        for (let i = 0; i < wsData.pages.length; i++) {
          const pageData = wsData.pages[i];
          const pageResult = await query<Page>(
            `INSERT INTO pages (workspace_id, title, slug, content, icon, position, is_pinned)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
              ws.id,
              pageData.title,
              pageData.slug,
              pageData.content || "",
              pageData.icon || "📄",
              pageData.position ?? i,
              pageData.is_pinned || false,
            ]
          );
          slugToId.set(pageData.slug, pageResult[0].id);
          importedPages++;
        }

        // Second pass: set parent_id references
        for (const pageData of wsData.pages) {
          if (pageData.parent_slug) {
            const parentId = slugToId.get(pageData.parent_slug);
            const pageId = slugToId.get(pageData.slug);
            if (parentId && pageId) {
              await query(
                "UPDATE pages SET parent_id = $1 WHERE id = $2",
                [parentId, pageId]
              );
            }
          }
        }
      }

      res.json({
        success: true,
        data: {
          imported_workspaces: importedWorkspaces,
          imported_pages: importedPages,
          total_in_payload: payload.workspaces.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
