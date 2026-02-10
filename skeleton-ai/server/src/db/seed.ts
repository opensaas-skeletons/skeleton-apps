import { getPool } from "./connection";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Skip if already seeded
    const existing = await client.query("SELECT COUNT(*) as count FROM sources");
    if (parseInt(existing.rows[0].count) > 0) {
      console.log("Database already seeded, skipping.");
      await client.query("COMMIT");
      return;
    }

    console.log("Seeding database...");

    // ---- Sources: Bundled Docs + Skeleton Apps ----
    const sources = [
      {
        title: "Bundled Docs",
        description: "Documentation bundled with the application",
        path: "/app/data/bundled-docs",
      },
      {
        title: "Skeleton Tasks",
        description: "Task management app — kanban board with drag-and-drop",
        path: "/data/skeleton-tasks",
      },
      {
        title: "Skeleton Automation",
        description: "Workflow automation app — triggers, conditions, actions",
        path: "/data/skeleton-automation",
      },
      {
        title: "Skeleton Database",
        description: "Dynamic database app — custom tables, fields, records",
        path: "/data/skeleton-database",
      },
      {
        title: "Skeleton Wiki",
        description: "Wiki app — markdown pages, [[wiki links]], full-text search",
        path: "/data/skeleton-wiki",
      },
      {
        title: "Skeleton CRM",
        description: "CRM app — contacts, companies, deals pipeline, activities",
        path: "/data/skeleton-crm",
      },
    ];

    for (const source of sources) {
      await client.query(
        `INSERT INTO sources (id, title, description, source_type, config, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuidv4(),
          source.title,
          source.description,
          "directory",
          JSON.stringify({ path: source.path }),
          "pending",
        ]
      );
    }
    console.log(`  ${sources.length} sources seeded`);

    // ---- Demo Conversation ----
    const conversationId = uuidv4();
    await client.query(
      `INSERT INTO conversations (id, title, model, provider, message_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [conversationId, "Welcome to Skeleton AI", "llama3.2", "ollama", 0]
    );

    const messages: [string, string, string | null][] = [
      ["user", "What is Open SaaS Skeletons?", null],
      [
        "assistant",
        "Open SaaS Skeletons is a collection of production-ready starter projects designed to help developers quickly bootstrap full-stack applications. Each skeleton includes a server with Express and PostgreSQL, a React client with Tailwind CSS, and shared type definitions. The project provides working examples for common SaaS patterns like task management, CRM, wiki systems, and more. [1]",
        null,
      ],
      ["user", "How do I add authentication?", null],
      [
        "assistant",
        "Each skeleton includes a placeholder auth middleware located at `server/src/middleware/auth.ts`. By default, authentication is disabled. To enable it, set `AUTH_ENABLED=true` in your environment variables. The middleware supports two authentication methods: API key authentication via the `x-api-key` header, and JWT Bearer token authentication via the `Authorization` header. You can configure the valid API key with the `API_KEY` environment variable and the JWT signing secret with `JWT_SECRET`. [1]",
        null,
      ],
    ];

    for (const [role, content, model] of messages) {
      await client.query(
        `INSERT INTO messages (id, conversation_id, role, content, model)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), conversationId, role, content, model]
      );
    }

    await client.query(
      "UPDATE conversations SET message_count = $1 WHERE id = $2",
      [messages.length, conversationId]
    );
    console.log("  Conversation seeded");

    // ---- Default Settings ----
    const defaultSettings: Record<string, any> = {
      provider: "ollama",
      chat_model: "llama3.2",
      embedding_model: "nomic-embed-text",
      top_k: 8,
      similarity_threshold: 0.3,
      temperature: 0.3,
      max_tokens: 2048,
      system_prompt:
        "You are a helpful AI assistant with access to a knowledge base about the Open SaaS Skeletons project ecosystem. You MUST answer questions using the retrieved context provided below. Synthesize information from multiple sources when needed. Cite sources using [1], [2], etc. Only say you don't know if the context truly contains no relevant information.",
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, JSON.stringify(value)]
      );
    }
    console.log("  Settings seeded");

    await client.query("COMMIT");
    console.log("Database seeded successfully!");
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
