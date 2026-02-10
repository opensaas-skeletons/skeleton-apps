import type { ChatMessage, ChatOptions, ChatResponse, ProviderInfo } from "@shared/types/ai";

export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  isAvailable(): Promise<boolean>;
  getInfo(): Promise<ProviderInfo>;
}
