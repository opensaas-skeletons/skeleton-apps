import { Router, Request, Response, NextFunction } from "express";
import { query, queryOne } from "../db/connection";
import { ValidationError } from "../errors";
import { APP_NAME, INTEROP_VERSION } from "@shared/constants";
import type {
  AiExportPayload,
  Source,
  Conversation,
  Message,
} from "@shared/types/ai";

const router = Router();

router.get("/export", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sources = await query<Source>("SELECT * FROM sources ORDER BY created_at ASC");
    const conversations = await query<Conversation>("SELECT * FROM conversations ORDER BY created_at ASC");

    const conversationExports = [];
    for (const conv of conversations) {
      const messages = await query<Message>(
        "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [conv.id]
      );
      conversationExports.push({
        title: conv.title,
        model: conv.model,
        provider: conv.provider,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          sources: m.sources,
          model: m.model,
          created_at: m.created_at,
        })),
        created_at: conv.created_at,
      });
    }

    const payload: AiExportPayload = {
      version: INTEROP_VERSION,
      app: APP_NAME,
      exported_at: new Date().toISOString(),
      sources: sources.map((s) => ({
        title: s.title,
        description: s.description,
        source_type: s.source_type,
        config: s.config,
        document_count: s.document_count,
        chunk_count: s.chunk_count,
      })),
      conversations: conversationExports,
    };

    res.json(payload);
  } catch (err) { next(err); }
});

router.post("/import", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as AiExportPayload;

    if (!payload.version) throw new ValidationError("Invalid import payload. Expected { version, ... }.");
    if (payload.version !== "1.0") throw new ValidationError(`Unsupported version: ${payload.version}`);

    let importedSources = 0;
    let importedConversations = 0;
    let importedMessages = 0;

    // Import sources
    if (payload.sources) {
      for (const s of payload.sources) {
        if (!s.title) continue;
        await queryOne(
          `INSERT INTO sources (title, description, source_type, config, status)
           VALUES ($1, $2, $3, $4, 'pending')`,
          [s.title, s.description || "", s.source_type || "directory", JSON.stringify(s.config || {})]
        );
        importedSources++;
      }
    }

    // Import conversations with messages
    if (payload.conversations) {
      for (const c of payload.conversations) {
        if (!c.title) continue;
        const conv = await queryOne<{ id: string }>(
          `INSERT INTO conversations (title, model, provider) VALUES ($1, $2, $3) RETURNING id`,
          [c.title, c.model || null, c.provider || null]
        );
        if (!conv) continue;

        let msgCount = 0;
        if (c.messages) {
          for (const m of c.messages) {
            await queryOne(
              `INSERT INTO messages (conversation_id, role, content, sources, model)
               VALUES ($1, $2, $3, $4, $5)`,
              [conv.id, m.role, m.content, m.sources ? JSON.stringify(m.sources) : null, m.model || null]
            );
            msgCount++;
            importedMessages++;
          }
        }

        await query("UPDATE conversations SET message_count = $1 WHERE id = $2", [msgCount, conv.id]);
        importedConversations++;
      }
    }

    res.json({
      success: true,
      data: {
        imported_sources: importedSources,
        imported_conversations: importedConversations,
        imported_messages: importedMessages,
      },
    });
  } catch (err) { next(err); }
});

export default router;
