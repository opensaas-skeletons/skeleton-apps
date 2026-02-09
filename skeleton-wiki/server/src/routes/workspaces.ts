import { Router, Request, Response, NextFunction } from "express";
import * as workspaceService from "../services/workspace.service";
import { ValidationError } from "../errors";

const router = Router();

// GET /api/workspaces
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaces = await workspaceService.listWorkspaces();
    res.json({ success: true, data: workspaces });
  } catch (err) {
    next(err);
  }
});

// POST /api/workspaces
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, icon, color } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new ValidationError("Title is required");
    }
    const ws = await workspaceService.createWorkspace({
      title: title.trim(),
      description,
      icon,
      color,
    });
    res.status(201).json({ success: true, data: ws });
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ws = await workspaceService.getWorkspace(req.params.id);
    res.json({ success: true, data: ws });
  } catch (err) {
    next(err);
  }
});

// PUT /api/workspaces/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, icon, color } = req.body;
    const ws = await workspaceService.updateWorkspace(req.params.id, {
      title,
      description,
      icon,
      color,
    });
    res.json({ success: true, data: ws });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/workspaces/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await workspaceService.deleteWorkspace(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
