import { Router, Request, Response, NextFunction } from "express";
import * as sourceService from "../services/source.service";
import { ingestSource } from "../services/ingestion/ingestion.service";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sources = await sourceService.listSources();
    res.json({ success: true, data: sources });
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const source = await sourceService.createSource(req.body);
    res.status(201).json({ success: true, data: source });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const source = await sourceService.getSource(req.params.id);
    res.json({ success: true, data: source });
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const source = await sourceService.updateSource(req.params.id, req.body);
    res.json({ success: true, data: source });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sourceService.deleteSource(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

router.post("/:id/ingest", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const source = await sourceService.getSource(req.params.id);
    // Fire and forget
    ingestSource(source.id).catch((err) => {
      console.error(`[Ingestion] Background error for ${source.id}:`, err);
    });
    res.json({ success: true, data: { status: "ingesting" } });
  } catch (err) { next(err); }
});

router.get("/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const source = await sourceService.getSource(req.params.id);
    res.json({
      success: true,
      data: {
        status: source.status,
        document_count: source.document_count,
        chunk_count: source.chunk_count,
        error_message: source.error_message,
      },
    });
  } catch (err) { next(err); }
});

export default router;
