import { Router, Request, Response, NextFunction } from "express";
import * as baseService from "../services/base.service";
import { ValidationError } from "../errors";

const router = Router();

// GET /api/bases — list bases
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const bases = await baseService.listBases();
    res.json({ success: true, data: bases });
  } catch (err) {
    next(err);
  }
});

// POST /api/bases — create base
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, icon, color } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new ValidationError("Title is required");
    }
    const base = await baseService.createBase({
      title: title.trim(),
      description,
      icon,
      color,
    });
    res.status(201).json({ success: true, data: base });
  } catch (err) {
    next(err);
  }
});

// GET /api/bases/:id — get base
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const base = await baseService.getBase(req.params.id);
    res.json({ success: true, data: base });
  } catch (err) {
    next(err);
  }
});

// PUT /api/bases/:id — update base
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, icon, color } = req.body;
    const base = await baseService.updateBase(req.params.id, {
      title,
      description,
      icon,
      color,
    });
    res.json({ success: true, data: base });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/bases/:id — delete base
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await baseService.deleteBase(req.params.id);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
