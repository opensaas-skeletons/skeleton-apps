import { Router, Request, Response, NextFunction } from "express";
import * as rowService from "../services/row.service";
import { ValidationError } from "../errors";
import type { FilterCondition, SortCondition } from "@shared/types/database";

const router = Router();

// GET /api/tables/:tableId/rows — list rows with filtering/sorting/pagination
router.get(
  "/tables/:tableId/rows",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let filters: FilterCondition[] | undefined;
      let sorts: SortCondition[] | undefined;

      if (req.query.filters) {
        try {
          filters = JSON.parse(req.query.filters as string);
        } catch {
          throw new ValidationError("Invalid filters JSON");
        }
      }

      if (req.query.sorts) {
        try {
          sorts = JSON.parse(req.query.sorts as string);
        } catch {
          throw new ValidationError("Invalid sorts JSON");
        }
      }

      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const per_page = req.query.per_page
        ? parseInt(req.query.per_page as string, 10)
        : undefined;

      const result = await rowService.listRows(req.params.tableId, {
        filters,
        sorts,
        search,
        page,
        per_page,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/tables/:tableId/rows — create row
router.post(
  "/tables/:tableId/rows",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body;
      const row = await rowService.createRow({
        table_id: req.params.tableId,
        data: data || {},
      });
      res.status(201).json({ success: true, data: row });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/tables/:tableId/rows/bulk — bulk create rows
router.post(
  "/tables/:tableId/rows/bulk",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = req.body;
      if (!rows || !Array.isArray(rows)) {
        throw new ValidationError("rows array is required");
      }
      const created = await rowService.bulkCreateRows({
        table_id: req.params.tableId,
        rows,
      });
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/rows/:id — get single row
router.get(
  "/rows/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const row = await rowService.getRow(req.params.id);
      res.json({ success: true, data: row });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/rows/:id — update row
router.put(
  "/rows/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body;
      if (!data || typeof data !== "object") {
        throw new ValidationError("data object is required");
      }
      const row = await rowService.updateRow(req.params.id, { data });
      res.json({ success: true, data: row });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/rows/:id — delete row
router.delete(
  "/rows/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await rowService.deleteRow(req.params.id);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/rows/bulk-delete — bulk delete rows
router.post(
  "/rows/bulk-delete",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        throw new ValidationError("ids array is required");
      }
      await rowService.bulkDeleteRows(ids);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
