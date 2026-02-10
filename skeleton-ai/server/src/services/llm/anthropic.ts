import type { ChatMessage, ChatOptions, ChatResponse, ProviderInfo } from "@shared/types/ai";
import { LLMProvider } from "./provider";
import { OllamaProvider } from "./ollama";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic";
  readonly name = "Anthropic";
  private ollamaEmbedder = new OllamaProvider();

  private get apiKey(): string {
    return process.env.ANTHROPIC_API_KEY || "";
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const model = options?.model || DEFAULT_MODEL;

    // Separate system message from the rest
    const systemMessages = messages.filter((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const body: any = {
      model,
      max_tokens: options?.max_tokens ?? 2048,
      messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
    };

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    if (systemMessages.length > 0) {
      body.system = systemMessages.map((m) => m.content).join("\n\n");
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic chat failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    const content = data.content
      ?.map((block: any) => block.text || "")
      .join("") || "";

    return {
      content,
      model,
      tokens_used: data.usage?.output_tokens,
    };
  }

  async *chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown> {
    const model = options?.model || DEFAULT_MODEL;

    const systemMessages = messages.filter((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const body: any = {
      model,
      max_tokens: options?.max_tokens ?? 2048,
      stream: true,
      messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
    };

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    if (systemMessages.length > 0) {
      body.system = systemMessages.map((m) => m.content).join("\n\n");
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic stream failed: ${response.status} ${text}`);
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
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              yield parsed.delta.text;
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    return this.ollamaEmbedder.embed(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.ollamaEmbedder.embedBatch(texts);
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
        error: "ANTHROPIC_API_KEY not set",
      };
    }
    return {
      name: this.name,
      id: this.id,
      available: true,
      models: [
        "claude-sonnet-4-20250514",
        "claude-haiku-4-5-20251001",
        "claude-opus-4-20250514",
      ],
    };
  }
}
