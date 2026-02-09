import { Router, Request, Response, NextFunction } from "express";
import * as workflowService from "../services/workflow.service";
import { executeWorkflow } from "../services/executor.service";
import { refreshScheduler } from "../services/scheduler.service";
import { NotFoundError, ValidationError } from "../errors";
import { notify } from "../services/notification.service";

const router = Router();

// GET /api/workflows — List all workflows
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const workflows = await workflowService.listWorkflows();
    res.json({ success: true, data: workflows });
  } catch (err) {
    next(err);
  }
});

// POST /api/workflows — Create workflow
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, enabled, trigger, conditions, actions, metadata } =
      req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      throw new ValidationError("Title is required");
    }
    if (!trigger || !trigger.type) {
      throw new ValidationError("Trigger configuration is required");
    }
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      throw new ValidationError("At least one action is required");
    }

    const workflow = await workflowService.createWorkflow({
      title: title.trim(),
      description,
      enabled,
      trigger,
      conditions,
      actions,
      metadata,
    });

    // Refresh scheduler if this is a scheduled workflow
    if (trigger.type === "schedule") {
      await refreshScheduler();
    }

    res.status(201).json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
});

// GET /api/workflows/:id — Get workflow with recent runs
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowService.getWorkflow(req.params.id);
    if (!workflow) {
      throw new NotFoundError("Workflow not found");
    }

    const runs = await workflowService.listRuns(req.params.id, 10);

    res.json({ success: true, data: { ...workflow, recent_runs: runs } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/workflows/:id — Update workflow
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, enabled, trigger, conditions, actions, metadata } =
      req.body;

    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      throw new ValidationError("Title cannot be empty");
    }

    const workflow = await workflowService.updateWorkflow(req.params.id, {
      title: title?.trim(),
      description,
      enabled,
      trigger,
      conditions,
      actions,
      metadata,
    });

    if (!workflow) {
      throw new NotFoundError("Workflow not found");
    }

    // Refresh scheduler when workflow changes
    await refreshScheduler();

    // Notify on enable/disable
    if (enabled !== undefined && workflow) {
      const notifRecipient = process.env.NOTIFICATION_DEFAULT_RECIPIENT || "demo@skeleton.dev";
      const eventType = enabled ? "workflow:enabled" : "workflow:disabled";
      notify({
        recipient: notifRecipient,
        event_type: eventType,
        title: `Workflow ${enabled ? "enabled" : "disabled"}: ${workflow.title}`,
        body: `Workflow "${workflow.title}" has been ${enabled ? "enabled" : "disabled"}.`,
        entity_type: "workflow",
        entity_id: workflow.id,
        channels: ["in_app"],
      }).catch((err) => console.error(`[Notification] ${eventType} failed:`, err));
    }

    res.json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/workflows/:id — Delete workflow
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await workflowService.deleteWorkflow(req.params.id);
      if (!deleted) {
        throw new NotFoundError("Workflow not found");
      }

      await refreshScheduler();

      res.json({ success: true, data: { deleted: true } });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/workflows/:id/trigger — Manually trigger a workflow
router.post(
  "/:id/trigger",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workflow = await workflowService.getWorkflow(req.params.id);
      if (!workflow) {
        throw new NotFoundError("Workflow not found");
      }

      // Execute in background so we can respond immediately
      const triggerData = {
        triggered_by: "manual",
        triggered_at: new Date().toISOString(),
        payload: req.body || {},
      };

      // Fire and forget — run execution asynchronously
      executeWorkflow(workflow, triggerData).catch((err) => {
        console.error(
          `[Manual Trigger] Workflow "${workflow.title}" execution error:`,
          err.message
        );
      });

      res.json({
        success: true,
        data: { message: "Workflow triggered", workflow_id: workflow.id },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
