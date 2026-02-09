import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { AppError } from "./errors";
import workflowRoutes from "./routes/workflows";
import runRoutes from "./routes/runs";
import hookRoutes from "./routes/hooks";
import interopRoutes from "./routes/interop";
import notificationRoutes from "./routes/notifications";
import { initScheduler } from "./services/scheduler.service";
import { authMiddleware } from "./middleware/auth";
import { addNotificationClient, removeNotificationClient } from "./sse";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3002");

// ---- Middleware ----
app.use(
  cors({
    // CORS: Use "*" for development. Restrict to specific origins in production.
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ---- Mount Routes ----
// Protected routes require authentication when AUTH_ENABLED=true
app.use("/api/workflows", authMiddleware, workflowRoutes);
app.use("/api", authMiddleware, runRoutes);
// Webhook hooks are public endpoints (they receive external webhook payloads)
app.use("/api/hooks", hookRoutes);
// Interop routes (export/import) are protected
app.use("/api", authMiddleware, interopRoutes);
app.use("/api/notifications", notificationRoutes);

// ---- Health Check ----
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    app: "skeleton-automation",
    timestamp: new Date().toISOString(),
  });
});

// ---- Serve Static Frontend (Production) ----
if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../../../../client/dist");
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
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
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
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Initialize the scheduler for cron-based workflows
  try {
    await initScheduler();
  } catch (err) {
    console.error("Failed to initialize scheduler:", err);
  }
});
