import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import * as csvService from "../services/csv.service";
import { ValidationError } from "../errors";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/tables/:tableId/import/csv — import CSV
router.post(
  "/tables/:tableId/import/csv",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ValidationError("CSV file is required. Upload as 'file' field.");
      }

      const csvContent = req.file.buffer.toString("utf-8");
      const result = await csvService.importCsv(req.params.tableId, csvContent);

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/tables/:tableId/export/csv — export table as CSV download
router.get(
  "/tables/:tableId/export/csv",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const csv = await csvService.exportCsv(req.params.tableId);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="table-${req.params.tableId}.csv"`
      );
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
