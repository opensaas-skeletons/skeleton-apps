/**
 * Server Entry Point
 * ==================
 * Express application setup and configuration.
 *
 * LLM BUILDERS:
 * - Add new route files in the "Mount routes" section below
 * - Add global middleware in the "Middleware" section
 * - Configure CORS origins for your deployment
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { AppError } from "./errors";

import boardRoutes from "./routes/boards";
import taskRoutes from "./routes/tasks";
import interopRoutes from "./routes/interop";
import notificationRoutes from "./routes/notifications";
import { addNotificationClient, removeNotificationClient } from "./sse";
import { notify } from "./services/notification.service";
import { query } from "./db/connection";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001");

// ---- Middleware ----

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" })); // 10mb for large imports

// Request logging (simple — replace with morgan/pino for production)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ---- Mount Routes ----

app.use("/api/boards", boardRoutes);
app.use("/api", taskRoutes);      // Handles /api/boards/:id/tasks AND /api/tasks/:id
app.use("/api", interopRoutes);    // Handles /api/import and /api/export
app.use("/api/notifications", notificationRoutes);

// ---- Health Check ----

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ---- Serve Static Frontend (Production) ----

if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

// ---- Global Error Handler ----

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Unknown errors
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ---- Real-time Updates via Server-Sent Events (SSE) ----
//
// Clients connect to GET /api/events?board=<boardId> to receive a live
// event stream. Emit events from services by calling broadcastEvent().

import { Response as ExpressResponse } from "express";

interface SSEClient {
  id: string;
  boardId: string;
  res: ExpressResponse;
}

const sseClients: SSEClient[] = [];

/**
 * Broadcast an event to all clients watching a specific board.
 * Call this from services after task/column mutations.
 *
 * Example: broadcastEvent(boardId, "task:created", { taskId, title });
 */
export function broadcastEvent(boardId: string, event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    if (client.boardId === boardId) {
      client.res.write(payload);
    }
  }
}

app.get("/api/events", (req, res) => {
  const boardId = req.query.board as string;
  if (!boardId) {
    res.status(400).json({ success: false, error: "board query parameter is required" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send an initial heartbeat so the client knows the connection is live
  res.write("event: connected\ndata: {}\n\n");

  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const client: SSEClient = { id: clientId, boardId, res };
  sseClients.push(client);

  // Keep-alive heartbeat every 30 seconds to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const idx = sseClients.findIndex((c) => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// ---- Notification SSE ----
app.get("/api/notifications/stream", (req, res) => {
  const recipient = req.query.recipient as string;
  if (!recipient) {
    res.status(400).json({ success: false, error: "recipient query parameter is required" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write("event: connected\ndata: {}\n\n");

  const clientId = addNotificationClient(recipient, res);

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeNotificationClient(clientId);
  });
});

// ---- Start Server ----

app.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │                                         │
  │   🗂️  Skeleton Tasks API Server          │
  │   Running on http://localhost:${PORT}      │
  │                                         │
  │   Endpoints:                            │
  │   GET  /api/health      Health check    │
  │   GET  /api/boards      List boards     │
  │   GET  /api/export      Export data     │
  │   POST /api/import      Import data     │
  │                                         │
  └─────────────────────────────────────────┘
  `);

  // Hourly due-date check
  setInterval(async () => {
    try {
      const tasks = await query<any>(
        `SELECT * FROM tasks WHERE due_date IS NOT NULL AND assignee IS NOT NULL
         AND due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'`
      );
      for (const task of tasks) {
        await notify({
          recipient: task.assignee,
          event_type: "task:due_soon",
          title: `Task due soon: ${task.title}`,
          body: `Your task "${task.title}" is due within 24 hours.`,
          entity_type: "task",
          entity_id: task.id,
          channels: ["in_app"],
        }).catch((err: any) => console.error("[DueSoon] notify error:", err.message));
      }
    } catch (err: any) {
      console.error("[DueSoon] check error:", err.message);
    }
  }, 3600000); // Every hour
});

export default app;
