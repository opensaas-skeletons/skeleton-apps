/**
 * Database Seed
 * =============
 * Populates the database with sample data so you can see
 * the skeleton in action immediately after setup.
 *
 * Run with: npm run seed
 * In production, use: npm run seed -- --force
 *
 * LLM BUILDERS: Modify this to match your use case!
 * Want a CRM-style board? Change the columns and tasks.
 * Want a bug tracker? Adjust the labels and priorities.
 */

import pool from "./connection";
import { DEFAULT_COLUMNS } from "@skeleton-tasks/shared";

async function seed() {
  // Production safety check
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    console.warn("⚠️  NODE_ENV is 'production'. Seeding will DELETE all existing data.");
    console.warn("   Run with --force to proceed: npm run seed -- --force");
    process.exit(1);
  }

  console.log("🌱 Seeding database...");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Clear existing data
    await client.query("DELETE FROM tasks");
    await client.query("DELETE FROM columns");
    await client.query("DELETE FROM boards");

    // Create a demo board
    const boardResult = await client.query(
      `INSERT INTO boards (title, description)
       VALUES ($1, $2) RETURNING id`,
      ["My First Project", "A demo project board to get you started. Feel free to customize!"]
    );
    const boardId = boardResult.rows[0].id;

    // Create default columns
    const columnIds: Record<string, string> = {};
    for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
      const col = DEFAULT_COLUMNS[i];
      const colResult = await client.query(
        `INSERT INTO columns (board_id, title, position, color)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [boardId, col.title, i, col.color]
      );
      columnIds[col.title] = colResult.rows[0].id;
    }

    // Create sample tasks
    const sampleTasks = [
      {
        title: "Set up project repository",
        description: "Initialize the Git repo, add README, and configure CI/CD pipeline.",
        column: "Done",
        priority: "high",
        labels: ["setup", "devops"],
        position: 0,
        assignee: "alice@example.com",
        due_date: null,
      },
      {
        title: "Design database schema",
        description: "Define the core tables and relationships for the application.\n\n- Users table\n- Projects table\n- Settings table",
        column: "Done",
        priority: "high",
        labels: ["backend", "database"],
        position: 1,
        assignee: "bob@example.com",
        due_date: null,
      },
      {
        title: "Build authentication system",
        description: "Implement JWT-based auth with login, register, and token refresh.",
        column: "Review",
        priority: "high",
        labels: ["backend", "security"],
        position: 0,
        assignee: "alice@example.com",
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Create API endpoints",
        description: "Build out the REST API for all core resources.\n\nEndpoints needed:\n- CRUD for projects\n- CRUD for tasks\n- User profile management",
        column: "In Progress",
        priority: "medium",
        labels: ["backend", "api"],
        position: 0,
        assignee: "bob@example.com",
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Design landing page mockup",
        description: "Create wireframes and high-fidelity mockups for the public landing page.",
        column: "In Progress",
        priority: "medium",
        labels: ["design", "frontend"],
        position: 1,
        assignee: "carol@example.com",
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Implement drag-and-drop",
        description: "Add drag-and-drop functionality to the Kanban board for moving tasks between columns.",
        column: "To Do",
        priority: "medium",
        labels: ["frontend", "ux"],
        position: 0,
        assignee: null,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Add email notifications",
        description: "Send email notifications when tasks are assigned or due dates approach.",
        column: "To Do",
        priority: "low",
        labels: ["backend", "notifications"],
        position: 1,
        assignee: null,
        due_date: null,
      },
      {
        title: "Write API documentation",
        description: "Document all API endpoints using OpenAPI/Swagger format.",
        column: "Backlog",
        priority: "low",
        labels: ["docs"],
        position: 0,
        assignee: "carol@example.com",
        due_date: null,
      },
      {
        title: "Mobile responsive design",
        description: "Ensure the entire application works well on tablets and phones.",
        column: "Backlog",
        priority: "medium",
        labels: ["frontend", "mobile"],
        position: 1,
        assignee: null,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Performance optimization",
        description: "Profile and optimize database queries, add caching where needed.",
        column: "Backlog",
        priority: "low",
        labels: ["backend", "performance"],
        position: 2,
        assignee: null,
        due_date: null,
      },
    ];

    for (const task of sampleTasks) {
      await client.query(
        `INSERT INTO tasks (board_id, column_id, title, description, priority, labels, position, assignee, due_date, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          boardId,
          columnIds[task.column],
          task.title,
          task.description,
          task.priority,
          JSON.stringify(task.labels),
          task.position,
          task.assignee,
          task.due_date,
          JSON.stringify({}),
        ]
      );
    }

    await client.query("COMMIT");
    console.log(`✅ Seeded: 1 board, ${DEFAULT_COLUMNS.length} columns, ${sampleTasks.length} tasks`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
