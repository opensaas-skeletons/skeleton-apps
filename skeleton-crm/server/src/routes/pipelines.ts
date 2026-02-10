import { Router, Request, Response, NextFunction } from "express";
import * as pipelineService from "../services/pipeline.service";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pipelines = await pipelineService.listPipelines();
    res.json({ success: true, data: pipelines });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pipeline = await pipelineService.getPipeline(req.params.id);
    res.json({ success: true, data: pipeline });
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pipeline = await pipelineService.createPipeline(req.body);
    res.status(201).json({ success: true, data: pipeline });
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pipeline = await pipelineService.updatePipeline(req.params.id, req.body);
    res.json({ success: true, data: pipeline });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pipelineService.deletePipeline(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

// Stage management under pipeline
router.post("/:id/stages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stage = await pipelineService.createStage(req.params.id, req.body);
    res.status(201).json({ success: true, data: stage });
  } catch (err) { next(err); }
});

router.put("/stages/:stageId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stage = await pipelineService.updateStage(req.params.stageId, req.body);
    res.json({ success: true, data: stage });
  } catch (err) { next(err); }
});

router.delete("/stages/:stageId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pipelineService.deleteStage(req.params.stageId);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
