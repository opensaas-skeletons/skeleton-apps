import { Router, Request, Response, NextFunction } from "express";
import * as tableService from "../services/table.service";
import { ValidationError } from "../errors";

const router = Router();

// GET /api/bases/:baseId/tables — list tables for base
router.get(
  "/bases/:baseId/tables",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tables = await tableService.listTables(req.params.baseId);
      res.json({ success: true, data: tables });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/bases/:baseId/tables — create table in base
router.post(
  "/bases/:baseId/tables",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description } = req.body;
      if (!title || typeof title !== "string" || !title.trim()) {
        throw new ValidationError("Title is required");
      }
      const table = await tableService.createTable({
        base_id: req.params.baseId,
        title: title.trim(),
        description,
      });
      res.status(201).json({ success: true, data: table });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/tables/:id — get table
router.get(
  "/tables/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const table = await tableService.getTable(req.params.id);
      res.json({ success: true, data: table });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/tables/:id — update table
router.put(
  "/tables/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description } = req.body;
      const table = await tableService.updateTable(req.params.id, {
        title,
        description,
      });
      res.json({ success: true, data: table });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/tables/:id — delete table
router.delete(
  "/tables/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await tableService.deleteTable(req.params.id);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
