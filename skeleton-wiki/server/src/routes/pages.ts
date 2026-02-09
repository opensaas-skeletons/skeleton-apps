import { Router, Request, Response, NextFunction } from "express";
import * as pageService from "../services/page.service";
import { ValidationError } from "../errors";

const router = Router();

// GET /api/workspaces/:workspaceId/pages
router.get(
  "/workspaces/:workspaceId/pages",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pages = await pageService.listPages(req.params.workspaceId);
      res.json({ success: true, data: pages });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/workspaces/:workspaceId/pages/tree
router.get(
  "/workspaces/:workspaceId/pages/tree",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tree = await pageService.getPageTree(req.params.workspaceId);
      res.json({ success: true, data: tree });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/workspaces/:workspaceId/search
router.get(
  "/workspaces/:workspaceId/search",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query.q as string;
      if (!q) {
        res.json({ success: true, data: [] });
        return;
      }
      const results = await pageService.searchPages(req.params.workspaceId, q);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/workspaces/:workspaceId/pages/by-slug/:slug
router.get(
  "/workspaces/:workspaceId/pages/by-slug/:slug",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = await pageService.getPageBySlug(
        req.params.workspaceId,
        req.params.slug
      );
      res.json({ success: true, data: page });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/workspaces/:workspaceId/pages
router.post(
  "/workspaces/:workspaceId/pages",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, content, parent_id, icon } = req.body;
      if (!title || typeof title !== "string" || !title.trim()) {
        throw new ValidationError("Title is required");
      }
      const page = await pageService.createPage({
        workspace_id: req.params.workspaceId,
        parent_id,
        title: title.trim(),
        content,
        icon,
      });
      res.status(201).json({ success: true, data: page });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/pages/:id
router.get("/pages/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = await pageService.getPage(req.params.id);
    res.json({ success: true, data: page });
  } catch (err) {
    next(err);
  }
});

// PUT /api/pages/:id
router.put("/pages/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, parent_id, icon, position, is_pinned } = req.body;
    const page = await pageService.updatePage(req.params.id, {
      title,
      content,
      parent_id,
      icon,
      position,
      is_pinned,
    });
    res.json({ success: true, data: page });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/pages/:id
router.delete("/pages/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pageService.deletePage(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// GET /api/pages/:id/versions
router.get(
  "/pages/:id/versions",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const versions = await pageService.getPageVersions(req.params.id);
      res.json({ success: true, data: versions });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/pages/:id/versions/:versionId/restore
router.post(
  "/pages/:id/versions/:versionId/restore",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = await pageService.restorePageVersion(
        req.params.id,
        req.params.versionId
      );
      res.json({ success: true, data: page });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/pages/:id/backlinks
router.get(
  "/pages/:id/backlinks",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const backlinks = await pageService.getBacklinks(req.params.id);
      res.json({ success: true, data: backlinks });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
