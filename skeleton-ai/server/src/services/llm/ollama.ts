import type { ChatMessage, ChatOptions, ChatResponse, ProviderInfo } from "@shared/types/ai";
import { DEFAULT_CHAT_MODEL, DEFAULT_EMBEDDING_MODEL } from "@shared/constants";
import { LLMProvider } from "./provider";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

export class OllamaProvider implements LLMProvider {
  readonly id = "ollama";
  readonly name = "Ollama (Local)";

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const model = options?.model || DEFAULT_CHAT_MODEL;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.3,
          num_predict: options?.max_tokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama chat failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || "",
      model,
      tokens_used: data.eval_count,
    };
  }

  async *chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown> {
    const model = options?.model || DEFAULT_CHAT_MODEL;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.3,
          num_predict: options?.max_tokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama chat stream failed: ${response.status} ${text}`);
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
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            yield parsed.message.content;
          }
        } catch {
          // skip malformed JSON lines
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        if (parsed.message?.content) {
          yield parsed.message.content;
        }
      } catch {
        // skip
      }
    }
  }

  private getEmbeddingModel(): string {
    return process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
  }

  async embed(text: string): Promise<number[]> {
    const model = this.getEmbeddingModel();

    const response = await fetch(`${OLLAMA_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: text }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama embed failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return data.embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const model = this.getEmbeddingModel();

    const response = await fetch(`${OLLAMA_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: texts }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama embedBatch failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return data.embeddings;
  }

  async pullModel(model: string): Promise<void> {
    console.log(`[Ollama] Pulling model: ${model}...`);
    const response = await fetch(`${OLLAMA_URL}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model, stream: false }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama pull failed: ${response.status} ${errText}`);
    }

    await response.json();
    console.log(`[Ollama] Model ${model} pulled successfully`);
  }

  async hasModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      if (!response.ok) return false;
      const data = await response.json();
      const models: string[] = (data.models || []).map((m: any) => m.name);
      return models.some((m) => m === modelName || m.startsWith(`${modelName}:`));
    } catch {
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getInfo(): Promise<ProviderInfo> {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      if (!response.ok) {
        return { name: this.name, id: this.id, available: false, error: `HTTP ${response.status}` };
      }
      const data = await response.json();
      const models = (data.models || []).map((m: any) => m.name);
      return { name: this.name, id: this.id, available: true, models };
    } catch (err: any) {
      return { name: this.name, id: this.id, available: false, error: err.message };
    }
  }
}
