import { Router, Request, Response, NextFunction } from "express";
import * as viewService from "../services/view.service";
import { ValidationError } from "../errors";

const router = Router();

// GET /api/tables/:tableId/views — list views for table
router.get(
  "/tables/:tableId/views",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const views = await viewService.listViews(req.params.tableId);
      res.json({ success: true, data: views });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/tables/:tableId/views — create view
router.post(
  "/tables/:tableId/views",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, view_type, config } = req.body;
      if (!title || typeof title !== "string" || !title.trim()) {
        throw new ValidationError("Title is required");
      }
      const view = await viewService.createView({
        table_id: req.params.tableId,
        title: title.trim(),
        view_type: view_type || "grid",
        config,
      });
      res.status(201).json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/views/:id — update view
router.put(
  "/views/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, config } = req.body;
      const view = await viewService.updateView(req.params.id, {
        title,
        config,
      });
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/views/:id — delete view
router.delete(
  "/views/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await viewService.deleteView(req.params.id);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
