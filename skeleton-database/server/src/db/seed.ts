import { getPool } from "./connection";
import { v4 as uuidv4 } from "uuid";

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
    await client.query("DELETE FROM rows");
    await client.query("DELETE FROM views");
    await client.query("DELETE FROM fields");
    await client.query("DELETE FROM tables");
    await client.query("DELETE FROM bases");

    // ---- Create Base: Project Tracker ----
    const baseId = uuidv4();
    await client.query(
      `INSERT INTO bases (id, title, description, icon, color)
       VALUES ($1, $2, $3, $4, $5)`,
      [baseId, "Project Tracker", "Track project tasks and team members", "📋", "#3b82f6"]
    );

    // ==== Table 1: Tasks ====
    const tasksTableId = uuidv4();
    await client.query(
      `INSERT INTO tables (id, base_id, title, description, position)
       VALUES ($1, $2, $3, $4, $5)`,
      [tasksTableId, baseId, "Tasks", "Project tasks and their status", 0]
    );

    // Fields for Tasks
    const nameFieldId = uuidv4();
    const descFieldId = uuidv4();
    const statusFieldId = uuidv4();
    const priorityFieldId = uuidv4();
    const assigneeFieldId = uuidv4();
    const dueDateFieldId = uuidv4();
    const estHoursFieldId = uuidv4();
    const completedFieldId = uuidv4();
    const tagsFieldId = uuidv4();

    // 1. Name (text, required)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [nameFieldId, tasksTableId, "Name", "text", 0, JSON.stringify({}), true]
    );

    // 2. Description (long_text)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [descFieldId, tasksTableId, "Description", "long_text", 1, JSON.stringify({}), false]
    );

    // 3. Status (select)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        statusFieldId,
        tasksTableId,
        "Status",
        "select",
        2,
        JSON.stringify({
          options: [
            { label: "Backlog", color: "#64748b" },
            { label: "To Do", color: "#3b82f6" },
            { label: "In Progress", color: "#f97316" },
            { label: "Review", color: "#a855f7" },
            { label: "Done", color: "#22c55e" },
          ],
        }),
        false,
      ]
    );

    // 4. Priority (select)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        priorityFieldId,
        tasksTableId,
        "Priority",
        "select",
        3,
        JSON.stringify({
          options: [
            { label: "Low", color: "#22c55e" },
            { label: "Medium", color: "#eab308" },
            { label: "High", color: "#f97316" },
            { label: "Urgent", color: "#ef4444" },
          ],
        }),
        false,
      ]
    );

    // 5. Assignee (text)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [assigneeFieldId, tasksTableId, "Assignee", "text", 4, JSON.stringify({}), false]
    );

    // 6. Due Date (date)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [dueDateFieldId, tasksTableId, "Due Date", "date", 5, JSON.stringify({}), false]
    );

    // 7. Estimated Hours (number, precision:1)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        estHoursFieldId,
        tasksTableId,
        "Estimated Hours",
        "number",
        6,
        JSON.stringify({ precision: 1 }),
        false,
      ]
    );

    // 8. Completed (checkbox)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [completedFieldId, tasksTableId, "Completed", "checkbox", 7, JSON.stringify({}), false]
    );

    // 9. Tags (multi_select)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tagsFieldId,
        tasksTableId,
        "Tags",
        "multi_select",
        8,
        JSON.stringify({
          options: [
            { label: "Frontend", color: "#3b82f6" },
            { label: "Backend", color: "#22c55e" },
            { label: "Design", color: "#a855f7" },
            { label: "Bug", color: "#ef4444" },
            { label: "Feature", color: "#14b8a6" },
          ],
        }),
        false,
      ]
    );

    // ---- Insert 15 Task Rows ----
    const taskRows = [
      {
        [nameFieldId]: "Set up project repository",
        [descFieldId]: "Initialize the Git repository with the project structure, CI/CD pipeline, and README.",
        [statusFieldId]: "Done",
        [priorityFieldId]: "High",
        [assigneeFieldId]: "Alice Chen",
        [dueDateFieldId]: "2026-01-15",
        [estHoursFieldId]: 4,
        [completedFieldId]: true,
        [tagsFieldId]: "Backend",
      },
      {
        [nameFieldId]: "Design system tokens",
        [descFieldId]: "Define color palette, typography scale, and spacing tokens for the design system.",
        [statusFieldId]: "Done",
        [priorityFieldId]: "High",
        [assigneeFieldId]: "Maria Lopez",
        [dueDateFieldId]: "2026-01-18",
        [estHoursFieldId]: 8,
        [completedFieldId]: true,
        [tagsFieldId]: "Design",
      },
      {
        [nameFieldId]: "User authentication API",
        [descFieldId]: "Implement JWT-based authentication with login, register, and refresh token endpoints.",
        [statusFieldId]: "Done",
        [priorityFieldId]: "Urgent",
        [assigneeFieldId]: "Bob Kim",
        [dueDateFieldId]: "2026-01-22",
        [estHoursFieldId]: 16,
        [completedFieldId]: true,
        [tagsFieldId]: "Backend",
      },
      {
        [nameFieldId]: "Dashboard layout component",
        [descFieldId]: "Build the main dashboard layout with sidebar navigation and top header.",
        [statusFieldId]: "Review",
        [priorityFieldId]: "High",
        [assigneeFieldId]: "Alice Chen",
        [dueDateFieldId]: "2026-02-01",
        [estHoursFieldId]: 12,
        [completedFieldId]: false,
        [tagsFieldId]: "Frontend",
      },
      {
        [nameFieldId]: "Database schema migration",
        [descFieldId]: "Create migration scripts for the new reporting tables and indexes.",
        [statusFieldId]: "In Progress",
        [priorityFieldId]: "High",
        [assigneeFieldId]: "Bob Kim",
        [dueDateFieldId]: "2026-02-05",
        [estHoursFieldId]: 6,
        [completedFieldId]: false,
        [tagsFieldId]: "Backend",
      },
      {
        [nameFieldId]: "Search functionality",
        [descFieldId]: "Implement full-text search across all entities with filters and facets.",
        [statusFieldId]: "In Progress",
        [priorityFieldId]: "Medium",
        [assigneeFieldId]: "Carol Nguyen",
        [dueDateFieldId]: "2026-02-10",
        [estHoursFieldId]: 20,
        [completedFieldId]: false,
        [tagsFieldId]: "Backend",
      },
      {
        [nameFieldId]: "Responsive mobile views",
        [descFieldId]: "Adapt all pages and components to work on mobile and tablet screen sizes.",
        [statusFieldId]: "To Do",
        [priorityFieldId]: "Medium",
        [assigneeFieldId]: "Maria Lopez",
        [dueDateFieldId]: "2026-02-14",
        [estHoursFieldId]: 16,
        [completedFieldId]: false,
        [tagsFieldId]: "Frontend",
      },
      {
        [nameFieldId]: "File upload service",
        [descFieldId]: "Build file upload with drag-and-drop, progress tracking, and S3 storage integration.",
        [statusFieldId]: "To Do",
        [priorityFieldId]: "Medium",
        [assigneeFieldId]: "Bob Kim",
        [dueDateFieldId]: "2026-02-18",
        [estHoursFieldId]: 14,
        [completedFieldId]: false,
        [tagsFieldId]: "Backend",
      },
      {
        [nameFieldId]: "Fix login redirect loop",
        [descFieldId]: "Users are getting stuck in a redirect loop when their session expires during navigation.",
        [statusFieldId]: "In Progress",
        [priorityFieldId]: "Urgent",
        [assigneeFieldId]: "Alice Chen",
        [dueDateFieldId]: "2026-02-03",
        [estHoursFieldId]: 3,
        [completedFieldId]: false,
        [tagsFieldId]: "Bug",
      },
      {
        [nameFieldId]: "Data export feature",
        [descFieldId]: "Allow users to export their data as CSV and JSON files.",
        [statusFieldId]: "To Do",
        [priorityFieldId]: "Low",
        [assigneeFieldId]: "Carol Nguyen",
        [dueDateFieldId]: "2026-02-22",
        [estHoursFieldId]: 8,
        [completedFieldId]: false,
        [tagsFieldId]: "Feature",
      },
      {
        [nameFieldId]: "Performance audit",
        [descFieldId]: "Run Lighthouse and custom performance benchmarks, identify bottlenecks, and optimize.",
        [statusFieldId]: "Backlog",
        [priorityFieldId]: "Low",
        [assigneeFieldId]: "Dave Park",
        [dueDateFieldId]: "2026-03-01",
        [estHoursFieldId]: 10,
        [completedFieldId]: false,
        [tagsFieldId]: "Frontend",
      },
      {
        [nameFieldId]: "API rate limiting",
        [descFieldId]: "Implement rate limiting middleware to protect against abuse and ensure fair usage.",
        [statusFieldId]: "Backlog",
        [priorityFieldId]: "Medium",
        [assigneeFieldId]: "Bob Kim",
        [dueDateFieldId]: "2026-03-05",
        [estHoursFieldId]: 6,
        [completedFieldId]: false,
        [tagsFieldId]: "Backend",
      },
      {
        [nameFieldId]: "Notification system",
        [descFieldId]: "Build in-app notification system with real-time updates via SSE.",
        [statusFieldId]: "Backlog",
        [priorityFieldId]: "Medium",
        [assigneeFieldId]: "Carol Nguyen",
        [dueDateFieldId]: "2026-03-10",
        [estHoursFieldId]: 18,
        [completedFieldId]: false,
        [tagsFieldId]: "Feature",
      },
      {
        [nameFieldId]: "Onboarding flow redesign",
        [descFieldId]: "Redesign the new user onboarding experience with guided tours and tooltips.",
        [statusFieldId]: "Review",
        [priorityFieldId]: "High",
        [assigneeFieldId]: "Maria Lopez",
        [dueDateFieldId]: "2026-02-08",
        [estHoursFieldId]: 12,
        [completedFieldId]: false,
        [tagsFieldId]: "Design",
      },
      {
        [nameFieldId]: "Fix table sort crash",
        [descFieldId]: "Sorting by date column crashes when some cells are empty. Add null-safe comparisons.",
        [statusFieldId]: "To Do",
        [priorityFieldId]: "High",
        [assigneeFieldId]: "Dave Park",
        [dueDateFieldId]: "2026-02-06",
        [estHoursFieldId]: 2,
        [completedFieldId]: false,
        [tagsFieldId]: "Bug",
      },
    ];

    for (let i = 0; i < taskRows.length; i++) {
      await client.query(
        `INSERT INTO rows (table_id, data, position)
         VALUES ($1, $2, $3)`,
        [tasksTableId, JSON.stringify(taskRows[i]), i]
      );
    }

    // ---- Views for Tasks ----

    // View 1: "All Tasks" - default grid view
    await client.query(
      `INSERT INTO views (table_id, title, view_type, config, position)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        tasksTableId,
        "All Tasks",
        "grid",
        JSON.stringify({
          filters: [],
          sorts: [],
          hidden_fields: [],
          field_widths: {},
        }),
        0,
      ]
    );

    // View 2: "Active Work" - filtered to To Do, In Progress, Review + sorted by status
    await client.query(
      `INSERT INTO views (table_id, title, view_type, config, position)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        tasksTableId,
        "Active Work",
        "grid",
        JSON.stringify({
          filters: [
            { field_id: statusFieldId, operator: "eq", value: "To Do" },
            { field_id: statusFieldId, operator: "eq", value: "In Progress" },
            { field_id: statusFieldId, operator: "eq", value: "Review" },
          ],
          sorts: [
            { field_id: statusFieldId, direction: "asc" },
          ],
          hidden_fields: [],
          field_widths: {},
        }),
        1,
      ]
    );

    // ==== Table 2: Team Members ====
    const teamTableId = uuidv4();
    await client.query(
      `INSERT INTO tables (id, base_id, title, description, position)
       VALUES ($1, $2, $3, $4, $5)`,
      [teamTableId, baseId, "Team Members", "Project team directory", 1]
    );

    // Fields for Team Members
    const tmNameFieldId = uuidv4();
    const tmEmailFieldId = uuidv4();
    const tmRoleFieldId = uuidv4();
    const tmDeptFieldId = uuidv4();
    const tmStartDateFieldId = uuidv4();
    const tmRatingFieldId = uuidv4();
    const tmActiveFieldId = uuidv4();

    // 1. Name (text, required)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tmNameFieldId, teamTableId, "Name", "text", 0, JSON.stringify({}), true]
    );

    // 2. Email (email)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tmEmailFieldId, teamTableId, "Email", "email", 1, JSON.stringify({}), false]
    );

    // 3. Role (select)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tmRoleFieldId,
        teamTableId,
        "Role",
        "select",
        2,
        JSON.stringify({
          options: [
            { label: "Engineer", color: "#3b82f6" },
            { label: "Designer", color: "#a855f7" },
            { label: "PM", color: "#f97316" },
            { label: "QA", color: "#22c55e" },
          ],
        }),
        false,
      ]
    );

    // 4. Department (text)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tmDeptFieldId, teamTableId, "Department", "text", 3, JSON.stringify({}), false]
    );

    // 5. Start Date (date)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tmStartDateFieldId, teamTableId, "Start Date", "date", 4, JSON.stringify({}), false]
    );

    // 6. Rating (rating)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tmRatingFieldId, teamTableId, "Rating", "rating", 5, JSON.stringify({}), false]
    );

    // 7. Active (checkbox)
    await client.query(
      `INSERT INTO fields (id, table_id, title, field_type, position, config, required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tmActiveFieldId, teamTableId, "Active", "checkbox", 6, JSON.stringify({}), false]
    );

    // ---- Insert 6 Team Member Rows ----
    const teamRows = [
      {
        [tmNameFieldId]: "Alice Chen",
        [tmEmailFieldId]: "alice.chen@example.com",
        [tmRoleFieldId]: "Engineer",
        [tmDeptFieldId]: "Engineering",
        [tmStartDateFieldId]: "2024-03-15",
        [tmRatingFieldId]: 5,
        [tmActiveFieldId]: true,
      },
      {
        [tmNameFieldId]: "Bob Kim",
        [tmEmailFieldId]: "bob.kim@example.com",
        [tmRoleFieldId]: "Engineer",
        [tmDeptFieldId]: "Engineering",
        [tmStartDateFieldId]: "2024-06-01",
        [tmRatingFieldId]: 4,
        [tmActiveFieldId]: true,
      },
      {
        [tmNameFieldId]: "Carol Nguyen",
        [tmEmailFieldId]: "carol.nguyen@example.com",
        [tmRoleFieldId]: "Engineer",
        [tmDeptFieldId]: "Engineering",
        [tmStartDateFieldId]: "2025-01-10",
        [tmRatingFieldId]: 4,
        [tmActiveFieldId]: true,
      },
      {
        [tmNameFieldId]: "Dave Park",
        [tmEmailFieldId]: "dave.park@example.com",
        [tmRoleFieldId]: "QA",
        [tmDeptFieldId]: "Quality Assurance",
        [tmStartDateFieldId]: "2024-09-20",
        [tmRatingFieldId]: 3,
        [tmActiveFieldId]: true,
      },
      {
        [tmNameFieldId]: "Maria Lopez",
        [tmEmailFieldId]: "maria.lopez@example.com",
        [tmRoleFieldId]: "Designer",
        [tmDeptFieldId]: "Design",
        [tmStartDateFieldId]: "2024-04-08",
        [tmRatingFieldId]: 5,
        [tmActiveFieldId]: true,
      },
      {
        [tmNameFieldId]: "James Wilson",
        [tmEmailFieldId]: "james.wilson@example.com",
        [tmRoleFieldId]: "PM",
        [tmDeptFieldId]: "Product",
        [tmStartDateFieldId]: "2023-11-15",
        [tmRatingFieldId]: 4,
        [tmActiveFieldId]: true,
      },
    ];

    for (let i = 0; i < teamRows.length; i++) {
      await client.query(
        `INSERT INTO rows (table_id, data, position)
         VALUES ($1, $2, $3)`,
        [teamTableId, JSON.stringify(teamRows[i]), i]
      );
    }

    // ---- View for Team Members ----
    await client.query(
      `INSERT INTO views (table_id, title, view_type, config, position)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        teamTableId,
        "Grid View",
        "grid",
        JSON.stringify({
          filters: [],
          sorts: [],
          hidden_fields: [],
          field_widths: {},
        }),
        0,
      ]
    );

    await client.query("COMMIT");
    console.log("Seeded: 1 base, 2 tables, 16 fields, 21 rows, 3 views");
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
