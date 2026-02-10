import { Router, Request, Response, NextFunction } from "express";
import * as dealService from "../services/deal.service";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deals = await dealService.listDeals({
      pipeline_id: req.query.pipeline_id as string,
      stage_id: req.query.stage_id as string,
      status: req.query.status as string,
      contact_id: req.query.contact_id as string,
      company_id: req.query.company_id as string,
    });
    res.json({ success: true, data: deals });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deal = await dealService.getDeal(req.params.id);
    res.json({ success: true, data: deal });
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deal = await dealService.createDeal(req.body);
    res.status(201).json({ success: true, data: deal });
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deal = await dealService.updateDeal(req.params.id, req.body);
    res.json({ success: true, data: deal });
  } catch (err) { next(err); }
});

router.put("/:id/move", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deal = await dealService.moveDeal(req.params.id, req.body);
    res.json({ success: true, data: deal });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await dealService.deleteDeal(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
