import { Router, Request, Response, NextFunction } from "express";
import * as workflowService from "../services/workflow.service";
import { NotFoundError } from "../errors";

const router = Router();

// GET /api/workflows/:workflowId/runs — List runs for a workflow
router.get(
  "/workflows/:workflowId/runs",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workflow = await workflowService.getWorkflow(
        req.params.workflowId
      );
      if (!workflow) {
        throw new NotFoundError("Workflow not found");
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const runs = await workflowService.listRuns(
        req.params.workflowId,
        Math.min(limit, 200)
      );

      res.json({ success: true, data: runs });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/runs/:id — Get run details
router.get(
  "/runs/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await workflowService.getRun(req.params.id);
      if (!run) {
        throw new NotFoundError("Run not found");
      }

      res.json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
