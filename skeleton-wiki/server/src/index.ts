import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { AppError } from "./errors";
import { authMiddleware } from "./middleware/auth";
import workspaceRoutes from "./routes/workspaces";
import pageRoutes from "./routes/pages";
import interopRoutes from "./routes/interop";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3004");

// ---- Middleware ----
app.use(
  cors({
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
app.use("/api/workspaces", authMiddleware, workspaceRoutes);
app.use("/api", authMiddleware, pageRoutes);
app.use("/api", authMiddleware, interopRoutes);

// ---- Health Check ----
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    app: "skeleton-wiki",
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

// ---- Start Server ----
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
