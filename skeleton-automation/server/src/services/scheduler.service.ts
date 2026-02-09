import cron from "node-cron";
import { getEnabledScheduledWorkflows } from "./workflow.service";
import { executeWorkflow } from "./executor.service";
import type { Workflow } from "@skeleton-automation/shared";

const scheduledJobs = new Map<string, cron.ScheduledTask>();

/**
 * Initialize the scheduler: load all enabled scheduled workflows
 * and register their cron jobs.
 */
export async function initScheduler(): Promise<void> {
  console.log("[Scheduler] Initializing...");
  const workflows = await getEnabledScheduledWorkflows();

  for (const workflow of workflows) {
    scheduleWorkflow(workflow);
  }

  console.log(`[Scheduler] Registered ${workflows.length} scheduled workflow(s).`);
}

/**
 * Schedule a single workflow's cron job.
 */
export function scheduleWorkflow(workflow: Workflow): void {
  if (workflow.trigger.type !== "schedule") return;

  const cronExpression = workflow.trigger.config.cron;

  if (!cron.validate(cronExpression)) {
    console.error(
      `[Scheduler] Invalid cron expression for workflow "${workflow.title}": ${cronExpression}`
    );
    return;
  }

  // Remove existing job if re-scheduling
  unscheduleWorkflow(workflow.id);

  const job = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] Cron triggered for workflow "${workflow.title}"`);
    try {
      await executeWorkflow(workflow, {
        triggered_by: "schedule",
        cron: cronExpression,
        triggered_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error(
        `[Scheduler] Error executing workflow "${workflow.title}": ${err.message}`
      );
    }
  });

  scheduledJobs.set(workflow.id, job);
  console.log(
    `[Scheduler] Scheduled "${workflow.title}" with cron: ${cronExpression}`
  );
}

/**
 * Unschedule a workflow's cron job.
 */
export function unscheduleWorkflow(workflowId: string): void {
  const existing = scheduledJobs.get(workflowId);
  if (existing) {
    existing.stop();
    scheduledJobs.delete(workflowId);
  }
}

/**
 * Refresh scheduler: reload all scheduled workflows from the database.
 * Call this after creating, updating, or deleting workflows.
 */
export async function refreshScheduler(): Promise<void> {
  // Stop all existing jobs
  for (const [_id, job] of scheduledJobs) {
    job.stop();
  }
  scheduledJobs.clear();

  // Re-initialize
  await initScheduler();
}

/**
 * Get count of active scheduled jobs.
 */
export function getScheduledJobCount(): number {
  return scheduledJobs.size;
}
