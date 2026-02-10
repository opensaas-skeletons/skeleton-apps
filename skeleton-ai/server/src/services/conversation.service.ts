import { query, queryOne } from "../db/connection";
import type { Conversation, Message } from "@shared/types/ai";
import { NotFoundError } from "../errors";

export async function listConversations(): Promise<Conversation[]> {
  return query<Conversation>("SELECT * FROM conversations ORDER BY updated_at DESC");
}

export async function getConversation(id: string): Promise<Conversation> {
  const conversation = await queryOne<Conversation>(
    "SELECT * FROM conversations WHERE id = $1",
    [id]
  );
  if (!conversation) throw new NotFoundError("Conversation not found");
  return conversation;
}

export async function getConversationWithMessages(
  id: string
): Promise<Conversation & { messages: Message[] }> {
  const conversation = await getConversation(id);
  const messages = await query<Message>(
    "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
    [id]
  );
  return { ...conversation, messages };
}

export async function createConversation(input?: { title?: string }): Promise<Conversation> {
  const title = input?.title?.trim() || "New Conversation";
  const conversation = await queryOne<Conversation>(
    "INSERT INTO conversations (title) VALUES ($1) RETURNING *",
    [title]
  );
  return conversation!;
}

export async function updateConversation(id: string, title: string): Promise<Conversation> {
  const conversation = await queryOne<Conversation>(
    "UPDATE conversations SET title = $1 WHERE id = $2 RETURNING *",
    [title.trim(), id]
  );
  if (!conversation) throw new NotFoundError("Conversation not found");
  return conversation;
}

export async function deleteConversation(id: string): Promise<void> {
  const result = await query("DELETE FROM conversations WHERE id = $1 RETURNING id", [id]);
  if (result.length === 0) throw new NotFoundError("Conversation not found");
}

export async function addMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  sources?: any[],
  model?: string,
  tokensUsed?: number
): Promise<Message> {
  const message = await queryOne<Message>(
    `INSERT INTO messages (conversation_id, role, content, sources, model, tokens_used)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      conversationId,
      role,
      content,
      sources ? JSON.stringify(sources) : null,
      model || null,
      tokensUsed || null,
    ]
  );

  // Update conversation message_count and updated_at
  await query(
    "UPDATE conversations SET message_count = message_count + 1 WHERE id = $1",
    [conversationId]
  );

  return message!;
}
