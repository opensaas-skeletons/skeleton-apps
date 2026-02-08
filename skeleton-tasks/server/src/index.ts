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

// ---- WebSocket (TODO) ----
// TODO: Add Socket.io for real-time updates
//
// import { Server as SocketServer } from "socket.io";
// const httpServer = createServer(app);
// const io = new SocketServer(httpServer, { cors: { origin: CORS_ORIGIN } });
//
// io.on("connection", (socket) => {
//   socket.on("join-board", (boardId) => socket.join(`board:${boardId}`));
//   // Emit "task:moved", "task:created", "task:deleted" events from services
// });
//
// Replace app.listen() below with httpServer.listen()

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
});

export default app;
