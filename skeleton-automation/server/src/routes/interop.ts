// DO NOT MODIFY — Interop standard routes for skeleton ecosystem compatibility

import { Router, Request, Response, NextFunction } from "express";
import * as workflowService from "../services/workflow.service";
import { ValidationError } from "../errors";
import {
  APP_NAME,
  INTEROP_VERSION,
} from "@skeleton-automation/shared";
import type {
  AutomationExportPayload,
  WorkflowExport,
} from "@skeleton-automation/shared";

const router = Router();

// GET /api/export — Export all workflows in interop format
router.get(
  "/export",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const workflows = await workflowService.listWorkflows();

      const payload: AutomationExportPayload = {
        version: INTEROP_VERSION as "1.0",
        exported_at: new Date().toISOString(),
        source: APP_NAME,
        workflows: workflows.map(
          (w): WorkflowExport => ({
            title: w.title,
            description: w.description,
            enabled: w.enabled,
            trigger: w.trigger,
            conditions: w.conditions,
            actions: w.actions,
            metadata: w.metadata,
          })
        ),
      };

      res.json(payload);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/import — Import workflows from interop format
router.post(
  "/import",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as AutomationExportPayload;

      if (!payload.version || !payload.workflows) {
        throw new ValidationError(
          "Invalid import payload. Expected { version, workflows }."
        );
      }

      if (payload.version !== "1.0") {
        throw new ValidationError(
          `Unsupported interop version: ${payload.version}. Expected 1.0.`
        );
      }

      let importedCount = 0;

      for (const workflowData of payload.workflows) {
        if (!workflowData.title || !workflowData.trigger || !workflowData.actions) {
          console.warn(
            `[Import] Skipping invalid workflow: missing required fields`
          );
          continue;
        }

        await workflowService.createWorkflow({
          title: workflowData.title,
          description: workflowData.description || "",
          enabled: workflowData.enabled ?? false, // Import as disabled by default for safety
          trigger: workflowData.trigger,
          conditions: workflowData.conditions || [],
          actions: workflowData.actions,
          metadata: {
            ...workflowData.metadata,
            imported_from: payload.source,
            imported_at: new Date().toISOString(),
          },
        });

        importedCount++;
      }

      res.json({
        success: true,
        data: {
          imported_workflows: importedCount,
          total_in_payload: payload.workflows.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
