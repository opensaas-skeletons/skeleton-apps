import { Router, Request, Response, NextFunction } from "express";
import * as activityService from "../services/activity.service";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activities = await activityService.listActivities({
      contact_id: req.query.contact_id as string,
      deal_id: req.query.deal_id as string,
      company_id: req.query.company_id as string,
      type: req.query.type as string,
      completed: req.query.completed as string,
    });
    res.json({ success: true, data: activities });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await activityService.getActivity(req.params.id);
    res.json({ success: true, data: activity });
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await activityService.createActivity(req.body);
    res.status(201).json({ success: true, data: activity });
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await activityService.updateActivity(req.params.id, req.body);
    res.json({ success: true, data: activity });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await activityService.deleteActivity(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
