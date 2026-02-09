import { Router, Request, Response, NextFunction } from "express";
import { getWorkflowByTriggerPath } from "../services/workflow.service";
import { executeWorkflow } from "../services/executor.service";

const router = Router();

// POST /api/hooks/:path — Webhook receiver
// Matches workflows with trigger type "webhook" and matching path
router.post(
  "/:path(*)",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hookPath = `/hooks/${req.params.path}`;
      const workflow = await getWorkflowByTriggerPath(hookPath);

      if (!workflow) {
        res.status(404).json({
          success: false,
          error: `No active workflow found for hook path: ${hookPath}`,
        });
        return;
      }

      const triggerData = {
        triggered_by: "webhook",
        path: hookPath,
        payload: req.body || {},
        headers: {
          "content-type": req.headers["content-type"],
          "user-agent": req.headers["user-agent"],
        },
        received_at: new Date().toISOString(),
      };

      // Execute asynchronously so we can respond to the webhook quickly
      executeWorkflow(workflow, triggerData).catch((err) => {
        console.error(
          `[Webhook] Workflow "${workflow.title}" execution error:`,
          err.message
        );
      });

      res.json({
        success: true,
        data: {
          message: "Webhook received, workflow triggered",
          workflow_id: workflow.id,
          workflow_title: workflow.title,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
