import { getPool } from "./connection";
import type { TriggerConfig, ActionConfig, Condition } from "@skeleton-automation/shared";

const TASKS_API = process.env.SKELETON_TASKS_URL || "http://skeleton-tasks-server-1:3001";

async function seed() {
  if (
    process.env.NODE_ENV === "production" &&
    !process.argv.includes("--force")
  ) {
    console.warn(
      "Seeding disabled in production. Use --force to override."
    );
    process.exit(1);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Clear existing data
    await client.query("DELETE FROM workflow_runs");
    await client.query("DELETE FROM workflows");

    // ---- Workflow 1: Daily Standup Reminder ----
    const trigger1: TriggerConfig = {
      type: "schedule",
      config: { cron: "0 9 * * 1-5", timezone: "UTC" },
    };
    const actions1: ActionConfig[] = [
      {
        type: "http",
        config: {
          method: "POST",
          url: `${TASKS_API}/api/tasks/ingest`,
          headers: { "Content-Type": "application/json" },
          body: {
            title: "Daily Standup",
            description: "Good morning! Time for standup. What did you work on yesterday? What are you working on today?",
            priority: "medium",
            assignee: "demo@skeleton.dev",
          },
        },
      },
    ];

    const w1 = await client.query(
      `INSERT INTO workflows (title, description, enabled, trigger_config, conditions, actions, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        "Daily Standup Reminder",
        "Posts a standup reminder to a webhook every weekday at 9am UTC.",
        true,
        JSON.stringify(trigger1),
        JSON.stringify([]),
        JSON.stringify(actions1),
        JSON.stringify({ category: "team" }),
      ]
    );

    // Add a sample completed run for workflow 1
    await client.query(
      `INSERT INTO workflow_runs (workflow_id, status, trigger_data, action_results, started_at, completed_at)
       VALUES ($1, $2, $3, $4, NOW() - interval '1 day', NOW() - interval '1 day' + interval '2 seconds')`,
      [
        w1.rows[0].id,
        "completed",
        JSON.stringify({ triggered_by: "schedule", cron: "0 9 * * 1-5" }),
        JSON.stringify([
          {
            action_index: 0,
            action_type: "http",
            status: "success",
            output: { status: 201, body: { success: true } },
            duration_ms: 42,
          },
        ]),
      ]
    );

    // ---- Workflow 2: New Task Alert ----
    const trigger2: TriggerConfig = {
      type: "webhook",
      config: { path: "/hooks/new-task" },
    };
    const conditions2: Condition[] = [
      { field: "priority", operator: "equals", value: "urgent" },
    ];
    const actions2: ActionConfig[] = [
      {
        type: "email",
        config: {
          to: "team@example.com",
          subject: "Urgent Task Created: {{title}}",
          body: "A new urgent task has been created:\n\nTitle: {{title}}\nDescription: {{description}}\nAssignee: {{assignee}}",
        },
      },
    ];

    const w2 = await client.query(
      `INSERT INTO workflows (title, description, enabled, trigger_config, conditions, actions, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        "New Task Alert",
        "Sends an email notification when a new urgent task is created via webhook.",
        true,
        JSON.stringify(trigger2),
        JSON.stringify(conditions2),
        JSON.stringify(actions2),
        JSON.stringify({ category: "notifications" }),
      ]
    );

    // Add a sample failed run for workflow 2
    await client.query(
      `INSERT INTO workflow_runs (workflow_id, status, trigger_data, action_results, started_at, completed_at, error)
       VALUES ($1, $2, $3, $4, NOW() - interval '3 hours', NOW() - interval '3 hours' + interval '1 second', $5)`,
      [
        w2.rows[0].id,
        "failed",
        JSON.stringify({
          triggered_by: "webhook",
          path: "/hooks/new-task",
          payload: { title: "Fix login bug", priority: "urgent" },
        }),
        JSON.stringify([
          {
            action_index: 0,
            action_type: "email",
            status: "failed",
            error: "SMTP not configured",
            duration_ms: 15,
          },
        ]),
        "SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD environment variables.",
      ]
    );

    // ---- Workflow 3: Weekly Cleanup (disabled) ----
    const trigger3: TriggerConfig = {
      type: "schedule",
      config: { cron: "0 17 * * 5", timezone: "UTC" },
    };
    const actions3: ActionConfig[] = [
      {
        type: "http",
        config: {
          method: "POST",
          url: `${TASKS_API}/api/notifications/ingest`,
          headers: { "Content-Type": "application/json" },
          body: {
            recipient: "demo@skeleton.dev",
            event_type: "maintenance:cleanup",
            title: "Weekly Cleanup Reminder",
            body: "Scheduled cleanup: review and archive completed tasks older than 7 days.",
          },
        },
      },
    ];

    await client.query(
      `INSERT INTO workflows (title, description, enabled, trigger_config, conditions, actions, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        "Weekly Cleanup Reminder",
        "Sends a cleanup reminder notification to skeleton-tasks every Friday at 5pm. Disabled by default — enable after connecting to skeleton-tasks.",
        false,
        JSON.stringify(trigger3),
        JSON.stringify([]),
        JSON.stringify(actions3),
        JSON.stringify({ category: "maintenance", connected_app: "skeleton-tasks" }),
      ]
    );

    await client.query("COMMIT");
    console.log("Seeded: 3 workflows, 2 sample runs");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
