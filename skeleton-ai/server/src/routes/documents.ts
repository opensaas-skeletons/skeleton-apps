import { Router, Request, Response, NextFunction } from "express";
import * as documentService from "../services/document.service";
import { ValidationError } from "../errors";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceId = req.query.source_id as string;
    if (!sourceId) {
      throw new ValidationError("source_id query parameter is required");
    }
    const documents = await documentService.listDocuments(sourceId);
    res.json({ success: true, data: documents });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await documentService.getDocument(req.params.id);
    res.json({ success: true, data: document });
  } catch (err) { next(err); }
});

router.get("/:id/content", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await documentService.getDocumentContent(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
