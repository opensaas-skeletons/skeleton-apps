import type { ChatMessage, ChatOptions, ChatResponse, ProviderInfo } from "@shared/types/ai";
import { LLMProvider } from "./provider";

const OPENAI_API_URL = "https://api.openai.com/v1";
const DEFAULT_CHAT_MODEL = "gpt-4o-mini";
const DEFAULT_EMBED_MODEL = "text-embedding-3-small";

export class OpenAIProvider implements LLMProvider {
  readonly id = "openai";
  readonly name = "OpenAI";

  private get apiKey(): string {
    return process.env.OPENAI_API_KEY || "";
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const model = options?.model || DEFAULT_CHAT_MODEL;

    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.max_tokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI chat failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      model,
      tokens_used: data.usage?.completion_tokens,
    };
  }

  async *chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown> {
    const model = options?.model || DEFAULT_CHAT_MODEL;

    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.max_tokens ?? 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI stream failed: ${response.status} ${text}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") return;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${OPENAI_API_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_EMBED_MODEL,
        input: text,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI embed failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${OPENAI_API_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_EMBED_MODEL,
        input: texts,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI embedBatch failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return data.data.map((d: any) => d.embedding);
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getInfo(): Promise<ProviderInfo> {
    if (!this.apiKey) {
      return {
        name: this.name,
        id: this.id,
        available: false,
        error: "OPENAI_API_KEY not set",
      };
    }
    return {
      name: this.name,
      id: this.id,
      available: true,
      models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    };
  }
}
