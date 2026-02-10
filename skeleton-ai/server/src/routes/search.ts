import { Router, Request, Response, NextFunction } from "express";
import * as retrievalService from "../services/retrieval.service";
import { ValidationError } from "../errors";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    if (!q?.trim()) {
      throw new ValidationError("q query parameter is required");
    }

    const sourceIdsParam = req.query.source_ids as string;
    const sourceIds = sourceIdsParam
      ? sourceIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const topK = req.query.top_k ? parseInt(req.query.top_k as string) : undefined;

    const results = await retrievalService.search({
      query: q,
      source_ids: sourceIds,
      top_k: topK,
    });

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

export default router;
