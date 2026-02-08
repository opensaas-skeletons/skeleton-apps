/**
 * Board Routes
 * ============
 * REST API endpoints for boards and columns.
 *
 * LLM BUILDERS: Add new board/column endpoints here.
 * Follow the pattern: validate input → call service → return response.
 */

import { Router, Request, Response, NextFunction } from "express";
import * as boardService from "../services/board.service";
import { NotFoundError, ValidationError } from "../errors";

const router = Router();

// ---- Board Endpoints ----

// GET /api/boards — List all boards
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const boards = await boardService.listBoards();
    res.json({ success: true, data: boards });
  } catch (err) {
    next(err);
  }
});

// POST /api/boards — Create a new board
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, columns } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      throw new ValidationError("Title is required");
    }

    const board = await boardService.createBoard({ title: title.trim(), description, columns });
    res.status(201).json({ success: true, data: board });
  } catch (err) {
    next(err);
  }
});

// GET /api/boards/:id — Get a board with all columns and tasks
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const board = await boardService.getBoard(req.params.id);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    res.json({ success: true, data: board });
  } catch (err) {
    next(err);
  }
});

// PUT /api/boards/:id — Update a board
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const board = await boardService.updateBoard(req.params.id, req.body);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    res.json({ success: true, data: board });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/boards/:id — Delete a board
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await boardService.deleteBoard(req.params.id);
    if (!deleted) {
      throw new NotFoundError("Board not found");
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

// ---- Column Endpoints ----

// POST /api/boards/:id/columns — Add a column to a board
router.post("/:id/columns", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, position, wip_limit, color } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      throw new ValidationError("Column title is required");
    }

    const column = await boardService.createColumn(req.params.id, {
      title: title.trim(), position, wip_limit, color,
    });
    res.status(201).json({ success: true, data: column });
  } catch (err) {
    next(err);
  }
});

// PUT /api/columns/:id — Update a column
router.put("/columns/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const column = await boardService.updateColumn(req.params.id, req.body);
    if (!column) {
      throw new NotFoundError("Column not found");
    }
    res.json({ success: true, data: column });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/columns/:id — Delete a column
router.delete("/columns/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await boardService.deleteColumn(req.params.id);
    if (!deleted) {
      throw new NotFoundError("Column not found");
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
