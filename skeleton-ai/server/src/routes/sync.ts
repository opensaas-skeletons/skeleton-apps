import { Router, Request, Response, NextFunction } from "express";
import * as syncService from "../services/sync/sync.service";
import * as schedulerService from "../services/sync/scheduler.service";

const router = Router();

// ---- Repos ----

router.get("/repos", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const repos = await syncService.listRepos();
    res.json({ success: true, data: repos });
  } catch (err) { next(err); }
});

router.post("/repos", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = await syncService.createRepo(req.body);
    res.status(201).json({ success: true, data: repo });
  } catch (err) { next(err); }
});

router.get("/repos/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = await syncService.getRepo(req.params.id);
    res.json({ success: true, data: repo });
  } catch (err) { next(err); }
});

router.put("/repos/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = await syncService.updateRepo(req.params.id, req.body);
    res.json({ success: true, data: repo });
  } catch (err) { next(err); }
});

router.delete("/repos/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await syncService.deleteRepo(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

// ---- Sync Actions ----

router.post("/repos/:id/sync", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Fire and forget — sync runs in background
    syncService.syncRepo(req.params.id).catch((err) => {
      console.error(`[Sync] Background sync error for ${req.params.id}:`, err.message);
    });
    res.json({ success: true, data: { status: "syncing" } });
  } catch (err) { next(err); }
});

router.post("/sync-all", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Fire and forget
    syncService.syncAllRepos().catch((err) => {
      console.error("[Sync] Background sync-all error:", err.message);
    });
    res.json({ success: true, data: { status: "syncing" } });
  } catch (err) { next(err); }
});

// ---- Branches ----

router.get("/repos/:id/branches", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branches = await syncService.listRepoBranches(req.params.id);
    res.json({ success: true, data: branches });
  } catch (err) { next(err); }
});

router.post("/repos/:id/branches", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branch } = req.body;
    const repo = await syncService.switchBranch(req.params.id, branch);
    res.json({ success: true, data: repo });
  } catch (err) { next(err); }
});

// ---- History ----

router.get("/history", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoId = req.query.repo_id as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await syncService.listHistory(repoId, limit);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
});

router.get("/history/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await syncService.getHistoryEntry(req.params.id);
    res.json({ success: true, data: entry });
  } catch (err) { next(err); }
});

// ---- Schedule ----

router.get("/schedule", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await schedulerService.getSchedule();
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

router.put("/schedule", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await schedulerService.updateSchedule(req.body);
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
});

// ---- Status ----

router.get("/status", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await syncService.getSyncStatus();
    res.json({ success: true, data: status });
  } catch (err) { next(err); }
});

export default router;
