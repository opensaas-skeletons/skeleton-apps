import cron from "node-cron";
import { query, queryOne } from "../../db/connection";
import { syncAllRepos, syncRepo } from "./sync.service";
import type { SyncSchedule } from "@shared/types/ai";

let scheduledTask: cron.ScheduledTask | null = null;
let isRunning = false;

const DEFAULT_CRON = "0 3 * * 0"; // Weekly at 3am Sunday

// ---- Schedule Management ----

export async function getSchedule(): Promise<SyncSchedule> {
  const row = await queryOne<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'sync_schedule'"
  );

  if (row) {
    return JSON.parse(row.value) as SyncSchedule;
  }

  // Return defaults
  return {
    enabled: true,
    cron_expression: DEFAULT_CRON,
    last_run_at: null,
    next_run_at: null,
  };
}

export async function updateSchedule(
  schedule: Partial<SyncSchedule>
): Promise<SyncSchedule> {
  const current = await getSchedule();
  const updated: SyncSchedule = {
    ...current,
    ...schedule,
  };

  await query(
    `INSERT INTO settings (key, value) VALUES ('sync_schedule', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [JSON.stringify(updated)]
  );

  // Restart scheduler with new config
  if (updated.enabled) {
    startScheduler(updated.cron_expression);
  } else {
    stopScheduler();
  }

  return updated;
}

// ---- Scheduler Control ----

export function startScheduler(cronExpression?: string): void {
  stopScheduler();

  const expr = cronExpression || DEFAULT_CRON;

  if (!cron.validate(expr)) {
    console.error(`[Scheduler] Invalid cron expression: ${expr}`);
    return;
  }

  console.log(`[Scheduler] Starting with schedule: ${expr}`);

  scheduledTask = cron.schedule(expr, async () => {
    if (isRunning) {
      console.log("[Scheduler] Skipping — previous sync still running");
      return;
    }

    isRunning = true;
    console.log("[Scheduler] Starting scheduled sync...");

    try {
      const result = await syncAllRepos();
      console.log(
        `[Scheduler] Sync complete: ${result.synced} synced, ${result.errors} errors`
      );

      // Update last run time
      await query(
        `INSERT INTO settings (key, value) VALUES ('sync_schedule', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
        [
          JSON.stringify({
            enabled: true,
            cron_expression: expr,
            last_run_at: new Date().toISOString(),
            next_run_at: null,
          }),
        ]
      );
    } catch (err: any) {
      console.error("[Scheduler] Sync failed:", err.message);
    } finally {
      isRunning = false;
    }
  });
}

export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[Scheduler] Stopped");
  }
}

export function isSchedulerRunning(): boolean {
  return scheduledTask !== null;
}

// ---- Initialization ----

export async function initializeScheduler(): Promise<void> {
  try {
    const schedule = await getSchedule();
    if (schedule.enabled) {
      startScheduler(schedule.cron_expression);
    } else {
      console.log("[Scheduler] Disabled by configuration");
    }
  } catch (err: any) {
    console.log("[Scheduler] Init skipped (DB may not be ready):", err.message);
  }
}
