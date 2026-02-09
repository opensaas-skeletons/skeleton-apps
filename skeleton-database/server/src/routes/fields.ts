import { Router, Request, Response, NextFunction } from "express";
import * as fieldService from "../services/field.service";
import { ValidationError } from "../errors";

const router = Router();

// GET /api/tables/:tableId/fields — list fields for table
router.get(
  "/tables/:tableId/fields",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fields = await fieldService.listFields(req.params.tableId);
      res.json({ success: true, data: fields });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/tables/:tableId/fields — create field in table
router.post(
  "/tables/:tableId/fields",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, field_type, config, required } = req.body;
      if (!title || typeof title !== "string" || !title.trim()) {
        throw new ValidationError("Title is required");
      }
      if (!field_type) {
        throw new ValidationError("Field type is required");
      }
      const field = await fieldService.createField({
        table_id: req.params.tableId,
        title: title.trim(),
        field_type,
        config,
        required,
      });
      res.status(201).json({ success: true, data: field });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/fields/:id — update field
router.put(
  "/fields/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, config, required } = req.body;
      const field = await fieldService.updateField(req.params.id, {
        title,
        config,
        required,
      });
      res.json({ success: true, data: field });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/fields/:id — delete field (also cleans row data)
router.delete(
  "/fields/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fieldService.deleteField(req.params.id);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
