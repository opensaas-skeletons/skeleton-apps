import { Router, Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }
    const data = await response.json();
    res.json({ success: true, data: data.models || [] });
  } catch (err: any) {
    res.json({ success: true, data: [], error: err.message });
  }
});

router.post("/pull", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { model } = req.body;
    if (!model?.trim()) {
      throw new ValidationError("model is required");
    }

    // Set SSE headers for streaming progress
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const response = await fetch(`${OLLAMA_URL}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, stream: true }),
    });

    if (!response.ok) {
      const text = await response.text();
      res.write(`data: ${JSON.stringify({ error: `Ollama error: ${text}` })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: "No response body" })}\n\n`);
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let clientDisconnected = false;

    req.on("close", () => {
      clientDisconnected = true;
    });

    while (!clientDisconnected) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          res.write(`data: ${JSON.stringify(parsed)}\n\n`);
        } catch {
          // skip malformed lines
        }
      }
    }

    if (!clientDisconnected) {
      res.write(`data: ${JSON.stringify({ status: "success" })}\n\n`);
      res.end();
    }
  } catch (err) { next(err); }
});

export default router;
