import { query } from "../db/connection";
import { getProvider, setProvider } from "./llm/factory";
import { search } from "./retrieval.service";
import * as conversationService from "./conversation.service";
import * as settingsService from "./settings.service";
import type {
  ChatMessage,
  Settings,
  StreamChunk,
  RetrievalResult,
  SendMessageInput,
} from "@shared/types/ai";

const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful AI assistant with access to a knowledge base about the Open SaaS Skeletons project ecosystem. You MUST answer questions using the retrieved context provided below. Synthesize information from multiple sources when needed. Cite sources using [1], [2], etc. Only say you don't know if the context truly contains no relevant information.";

function buildContextBlock(results: RetrievalResult[]): string {
  if (results.length === 0) return "";
  let block = "\n---\nUse the following sources to answer the user's question:\n\n";
  results.forEach((r, i) => {
    block += `[${i + 1}] Source: ${r.source_title} | File: ${r.file_path}\n${r.content}\n\n`;
  });
  block += "---\nAnswer based on the sources above. Cite using [1], [2], etc.\n";
  return block;
}

async function getEffectiveSettings(): Promise<Settings> {
  return settingsService.getSettings();
}

export async function sendMessage(
  conversationId: string,
  input: SendMessageInput,
  settingsOverride?: Partial<Settings>
): Promise<{ content: string; sources: RetrievalResult[]; model: string }> {
  const settings = await getEffectiveSettings();
  const merged = { ...settings, ...settingsOverride };

  // Set the provider if specified
  if (merged.provider) {
    setProvider(merged.provider);
  }
  const provider = getProvider();

  // Retrieve context
  let retrievalResults: RetrievalResult[] = [];
  if (input.content.trim()) {
    try {
      retrievalResults = await search({
        query: input.content,
        source_ids: input.source_ids,
        top_k: merged.top_k,
        similarity_threshold: merged.similarity_threshold,
      });
    } catch (err) {
      console.warn("[Chat] Retrieval failed, proceeding without context:", err);
    }
  }

  // Build messages array
  const systemPrompt = merged.system_prompt || DEFAULT_SYSTEM_PROMPT;
  const contextBlock = buildContextBlock(retrievalResults);
  const fullSystemPrompt = contextBlock
    ? `${systemPrompt}\n\n${contextBlock}`
    : systemPrompt;

  // Get conversation history
  const conversation = await conversationService.getConversationWithMessages(conversationId);
  const history: ChatMessage[] = (conversation.messages || []).map((m: any) => ({
    role: m.role,
    content: m.content,
  }));

  const messages: ChatMessage[] = [
    { role: "system", content: fullSystemPrompt },
    ...history,
    { role: "user", content: input.content },
  ];

  // Call LLM
  const response = await provider.chat(messages, {
    model: merged.chat_model,
    temperature: merged.temperature,
    max_tokens: merged.max_tokens,
  });

  // Store messages
  const sourcesJson = retrievalResults.length > 0 ? retrievalResults : undefined;
  await conversationService.addMessage(conversationId, "user", input.content);
  await conversationService.addMessage(
    conversationId,
    "assistant",
    response.content,
    sourcesJson,
    response.model,
    response.tokens_used
  );

  return {
    content: response.content,
    sources: retrievalResults,
    model: response.model,
  };
}

export async function* sendMessageStream(
  conversationId: string,
  input: SendMessageInput,
  settingsOverride?: Partial<Settings>
): AsyncGenerator<StreamChunk, void, unknown> {
  const settings = await getEffectiveSettings();
  const merged = { ...settings, ...settingsOverride };

  if (merged.provider) {
    setProvider(merged.provider);
  }
  const provider = getProvider();

  // Retrieve context
  let retrievalResults: RetrievalResult[] = [];
  if (input.content.trim()) {
    try {
      retrievalResults = await search({
        query: input.content,
        source_ids: input.source_ids,
        top_k: merged.top_k,
        similarity_threshold: merged.similarity_threshold,
      });
    } catch (err) {
      console.warn("[Chat] Retrieval failed, proceeding without context:", err);
    }
  }

  // Yield sources first
  if (retrievalResults.length > 0) {
    yield { type: "sources", sources: retrievalResults };
  }

  // Build messages
  const systemPrompt = merged.system_prompt || DEFAULT_SYSTEM_PROMPT;
  const contextBlock = buildContextBlock(retrievalResults);
  const fullSystemPrompt = contextBlock
    ? `${systemPrompt}\n\n${contextBlock}`
    : systemPrompt;

  const conversation = await conversationService.getConversationWithMessages(conversationId);
  const history: ChatMessage[] = (conversation.messages || []).map((m: any) => ({
    role: m.role,
    content: m.content,
  }));

  const messages: ChatMessage[] = [
    { role: "system", content: fullSystemPrompt },
    ...history,
    { role: "user", content: input.content },
  ];

  // Stream from LLM
  let fullContent = "";
  try {
    const stream = provider.chatStream(messages, {
      model: merged.chat_model,
      temperature: merged.temperature,
      max_tokens: merged.max_tokens,
    });

    for await (const token of stream) {
      fullContent += token;
      yield { type: "token", content: token };
    }

    // Store messages
    const sourcesJson = retrievalResults.length > 0 ? retrievalResults : undefined;
    await conversationService.addMessage(conversationId, "user", input.content);
    await conversationService.addMessage(
      conversationId,
      "assistant",
      fullContent,
      sourcesJson,
      merged.chat_model
    );

    yield { type: "done", model: merged.chat_model };
  } catch (err: any) {
    yield { type: "error", error: err.message };
  }
}
