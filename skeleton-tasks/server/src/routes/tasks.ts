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

export default router;
