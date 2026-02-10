import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { AppError } from "./errors";
import { authMiddleware } from "./middleware/auth";
import { getProvider, getOllamaEmbedder } from "./services/llm/factory";
import { DEFAULT_EMBEDDING_MODEL, DEFAULT_CHAT_MODEL } from "@shared/constants";
import { query } from "./db/connection";
import { ingestSource } from "./services/ingestion/ingestion.service";
import sourceRoutes from "./routes/sources";
import documentRoutes from "./routes/documents";
import conversationRoutes from "./routes/conversations";
import chatRoutes from "./routes/chat";
import searchRoutes from "./routes/search";
import settingsRoutes from "./routes/settings";
import modelRoutes from "./routes/models";
import interopRoutes from "./routes/interop";
import syncRoutes from "./routes/sync";
import { initializeScheduler } from "./services/sync/scheduler.service";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3006");

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
app.use("/api/sources", authMiddleware, sourceRoutes);
app.use("/api/documents", authMiddleware, documentRoutes);
app.use("/api/conversations", authMiddleware, conversationRoutes);
app.use("/api/chat", authMiddleware, chatRoutes);
app.use("/api/search", authMiddleware, searchRoutes);
app.use("/api/settings", authMiddleware, settingsRoutes);
app.use("/api/models", authMiddleware, modelRoutes);
app.use("/api", authMiddleware, interopRoutes);
app.use("/api/sync", authMiddleware, syncRoutes);

// ---- Health Check ----
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    app: "skeleton-ai",
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
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Non-blocking Ollama check
  try {
    const provider = getProvider();
    const info = await provider.getInfo();
    console.log(`LLM Provider: ${info.name} (${info.available ? "available" : "unavailable"})`);
  } catch (e) {
    console.log("LLM provider check skipped (will retry on first request)");
  }
  // Auto-pull required models and ingest pending sources
  (async () => {
    const maxAttempts = 60;
    const delayMs = 10_000;
    const ollama = getOllamaEmbedder();
    const requiredModels = [DEFAULT_EMBEDDING_MODEL, DEFAULT_CHAT_MODEL];

    // Wait for Ollama to be reachable, then pull missing models
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const available = await ollama.isAvailable();
        if (!available) throw new Error("Ollama not reachable");

        for (const model of requiredModels) {
          const has = await ollama.hasModel(model);
          if (!has) {
            await ollama.pullModel(model);
          }
        }
        console.log("[Auto-setup] All required models available");
        break;
      } catch (err: any) {
        if (attempt < maxAttempts) {
          console.log(`[Auto-setup] Waiting for Ollama (${err.message}), retrying in ${delayMs / 1000}s... (${attempt}/${maxAttempts})`);
          await new Promise((r) => setTimeout(r, delayMs));
        } else {
          console.error(`[Auto-setup] Failed to pull models after ${maxAttempts} attempts:`, err.message);
          return;
        }
      }
    }

    // Auto-ingest pending sources
    try {
      const pending = await query<{ id: string; title: string }>(
        "SELECT id, title FROM sources WHERE status IN ('pending', 'error') AND chunk_count = 0"
      );
      if (pending.length === 0) return;

      // Verify embedding model works before ingesting
      await ollama.embed("test");

      for (const source of pending) {
        console.log(`[Auto-ingest] Ingesting: ${source.title}`);
        await query("UPDATE sources SET status = 'pending', error_message = NULL WHERE id = $1", [source.id]);
        await ingestSource(source.id);
      }

      const check = await query<{ id: string; chunk_count: number }>(
        "SELECT id, chunk_count FROM sources WHERE id = ANY($1::uuid[])",
        [pending.map((s) => s.id)]
      );
      const totalChunks = check.reduce((sum, s) => sum + s.chunk_count, 0);
      console.log(`[Auto-ingest] Complete — ${pending.length} source(s), ${totalChunks} chunks`);
    } catch (err: any) {
      console.error(`[Auto-ingest] Failed:`, err.message);
    }
  })();
  // Initialize sync scheduler
  initializeScheduler().catch((err) => {
    console.log("Sync scheduler init deferred:", err.message);
  });
});
