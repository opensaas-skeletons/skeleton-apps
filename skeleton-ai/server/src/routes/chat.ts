import { Router, Request, Response, NextFunction } from "express";
import * as chatService from "../services/chat.service";
import * as settingsService from "../services/settings.service";
import { ValidationError } from "../errors";

const router = Router();

// Synchronous chat
router.post("/:id/messages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, source_ids } = req.body;
    if (!content?.trim()) {
      throw new ValidationError("content is required");
    }

    const settings = await settingsService.getSettings();
    const result = await chatService.sendMessage(req.params.id, { content, source_ids }, settings);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Streaming chat via SSE
router.post("/:id/messages/stream", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, source_ids } = req.body;
    if (!content?.trim()) {
      throw new ValidationError("content is required");
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const settings = await settingsService.getSettings();
    const stream = chatService.sendMessageStream(req.params.id, { content, source_ids }, settings);

    let clientDisconnected = false;
    req.on("close", () => {
      clientDisconnected = true;
    });

    for await (const chunk of stream) {
      if (clientDisconnected) break;
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    if (!clientDisconnected) {
      res.end();
    }
  } catch (err) { next(err); }
});

export default router;
