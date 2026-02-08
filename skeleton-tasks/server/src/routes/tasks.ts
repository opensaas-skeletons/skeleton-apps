/**
 * Task Routes
 * ===========
 * REST API endpoints for task operations.
 *
 * LLM BUILDERS: Add new task endpoints here.
 * Examples: bulk update, duplicate task, assign multiple users.
 */

import { Router, Request, Response, NextFunction } from "express";
import * as taskService from "../services/task.service";
import { query, queryOne } from "../db/connection";
import { NotFoundError, ValidationError } from "../errors";

const router = Router();

// GET /api/boards/:boardId/tasks — List tasks for a board (with optional filters)
router.get("/boards/:boardId/tasks", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      column_id: req.query.column_id as string | undefined,
      priority: req.query.priority as string | undefined,
      assignee: req.query.assignee as string | undefined,
      label: req.query.label as string | undefined,
      search: req.query.search as string | undefined,
    };

    const tasks = await taskService.listTasks(req.params.boardId, filters);
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

// POST /api/boards/:boardId/tasks — Create a task
router.post("/boards/:boardId/tasks", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, column_id } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      throw new ValidationError("Title is required");
    }
    if (!column_id) {
      throw new ValidationError("column_id is required");
    }

    const task = await taskService.createTask(req.params.boardId, {
      ...req.body,
      title: title.trim(),
    });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id — Get a single task
router.get("/tasks/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.getTask(req.params.id);
    if (!task) {
      throw new NotFoundError("Task not found");
    }
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id — Update a task
router.put("/tasks/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    if (!task) {
      throw new NotFoundError("Task not found");
    }
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id/move — Move a task between columns/positions
router.patch("/tasks/:id/move", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { column_id, position } = req.body;

    if (!column_id) {
      throw new ValidationError("column_id is required");
    }
    if (position === undefined || typeof position !== "number") {
      throw new ValidationError("position is required and must be a number");
    }

    const task = await taskService.moveTask(req.params.id, { column_id, position });
    if (!task) {
      throw new NotFoundError("Task not found");
    }
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id — Delete a task
router.delete("/tasks/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await taskService.deleteTask(req.params.id);
    if (!deleted) {
      throw new NotFoundError("Task not found");
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/ingest — Create a task from an external source (e.g. skeleton-automation)
router.post("/tasks/ingest", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, priority, assignee, labels, due_date, board_id, column_id, metadata } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      throw new ValidationError("title is required");
    }

    // Resolve board: use provided board_id or fall back to the first board
    let resolvedBoardId = board_id;
    if (!resolvedBoardId) {
      const firstBoard = await queryOne<{ id: string }>("SELECT id FROM boards ORDER BY created_at ASC LIMIT 1");
      if (!firstBoard) {
        throw new ValidationError("No boards exist. Create a board first.");
      }
      resolvedBoardId = firstBoard.id;
    }

    // Resolve column: use provided column_id or fall back to the first column of the board
    let resolvedColumnId = column_id;
    if (!resolvedColumnId) {
      const firstColumn = await queryOne<{ id: string }>(
        "SELECT id FROM columns WHERE board_id = $1 ORDER BY position ASC LIMIT 1",
        [resolvedBoardId]
      );
      if (!firstColumn) {
        throw new ValidationError("No columns exist on the target board.");
      }
      resolvedColumnId = firstColumn.id;
    }

    const task = await taskService.createTask(resolvedBoardId, {
      title: title.trim(),
      description: description || "",
      priority: priority || "medium",
      assignee: assignee || null,
      labels: labels || [],
      due_date: due_date || null,
      column_id: resolvedColumnId,
      metadata: metadata || {},
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

export default router;
