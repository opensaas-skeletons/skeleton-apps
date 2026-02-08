/**
 * Interop Routes
 * ==============
 * Import/Export endpoints for cross-application compatibility.
 *
 * ⚠️  DO NOT MODIFY THIS FILE ⚠️
 *
 * These endpoints implement the Open SaaS Task Standard v1.0.
 * Changing them will break compatibility with other skeleton-based apps.
 *
 * If you need custom export formats (CSV, etc.), create a NEW route file
 * like `routes/custom-export.ts` instead of modifying this one.
 */

import { Router, Request, Response } from "express";
import { query } from "../db/connection";
import { ExportPayload, BoardExport } from "../../../shared/types/task";
import { INTEROP_VERSION, APP_NAME } from "../../../shared/constants";
import * as boardService from "../services/board.service";

const router = Router();

// GET /api/export — Export all boards in the standard format
router.get("/export", async (_req: Request, res: Response) => {
  try {
    const boards = await boardService.listBoards();
    const boardExports: BoardExport[] = [];

    for (const board of boards) {
      const fullBoard = await boardService.getBoard(board.id);
      if (!fullBoard) continue;

      boardExports.push({
        title: fullBoard.title,
        description: fullBoard.description,
        columns: fullBoard.columns.map((col) => ({
          title: col.title,
          position: col.position,
          wip_limit: col.wip_limit,
          color: col.color,
        })),
        tasks: fullBoard.columns.flatMap((col) =>
          col.tasks.map((task) => ({
            title: task.title,
            description: task.description,
            column_title: col.title, // Reference by title for portability
            priority: task.priority,
            assignee: task.assignee,
            labels: task.labels,
            due_date: task.due_date,
            position: task.position,
            created_at: task.created_at,
            metadata: task.metadata,
          }))
        ),
      });
    }

    const payload: ExportPayload = {
      version: INTEROP_VERSION as "1.0",
      exported_at: new Date().toISOString(),
      source: APP_NAME,
      boards: boardExports,
    };

    res.json(payload);
  } catch (err) {
    console.error("Error exporting:", err);
    res.status(500).json({ success: false, error: "Failed to export data" });
  }
});

// POST /api/import — Import boards from the standard format
router.post("/import", async (req: Request, res: Response) => {
  try {
    const payload = req.body as ExportPayload;

    // Validate the payload
    if (!payload.version || payload.version !== INTEROP_VERSION || !payload.boards || !Array.isArray(payload.boards)) {
      res.status(400).json({
        success: false,
        error: `Invalid import format. Expected { version: "${INTEROP_VERSION}", boards: [...] }`,
      });
      return;
    }

    const importedBoards: string[] = [];

    for (const boardData of payload.boards) {
      // Create the board with its columns
      const board = await boardService.createBoard({
        title: boardData.title,
        description: boardData.description || "",
        columns: boardData.columns.map((col) => ({
          title: col.title,
          color: col.color || undefined,
        })),
      });

      // Build a column title → id map
      const columnMap: Record<string, string> = {};
      for (const col of board.columns) {
        columnMap[col.title] = col.id;
      }

      // Import tasks
      for (const taskData of boardData.tasks || []) {
        const columnId = columnMap[taskData.column_title];
        if (!columnId) {
          console.warn(`Skipping task "${taskData.title}" — column "${taskData.column_title}" not found`);
          continue;
        }

        await query(
          `INSERT INTO tasks (board_id, column_id, title, description, priority, assignee, labels, due_date, position, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            board.id,
            columnId,
            taskData.title,
            taskData.description || "",
            taskData.priority || "medium",
            taskData.assignee || null,
            JSON.stringify(taskData.labels || []),
            taskData.due_date || null,
            taskData.position || 0,
            JSON.stringify(taskData.metadata || {}),
          ]
        );
      }

      importedBoards.push(board.id);
    }

    res.status(201).json({
      success: true,
      data: {
        imported_boards: importedBoards.length,
        board_ids: importedBoards,
      },
    });
  } catch (err) {
    console.error("Error importing:", err);
    res.status(500).json({ success: false, error: "Failed to import data" });
  }
});

export default router;
