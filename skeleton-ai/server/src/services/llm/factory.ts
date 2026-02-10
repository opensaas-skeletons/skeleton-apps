import { LLMProvider } from "./provider";
import { OllamaProvider } from "./ollama";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";

let currentProvider: LLMProvider | null = null;

export function getProvider(): LLMProvider {
  if (currentProvider) return currentProvider;
  const providerName = process.env.LLM_PROVIDER || "ollama";
  switch (providerName) {
    case "anthropic":
      currentProvider = new AnthropicProvider();
      break;
    case "openai":
      currentProvider = new OpenAIProvider();
      break;
    default:
      currentProvider = new OllamaProvider();
      break;
  }
  return currentProvider;
}

export function setProvider(providerName: string): LLMProvider {
  switch (providerName) {
    case "anthropic":
      currentProvider = new AnthropicProvider();
      break;
    case "openai":
      currentProvider = new OpenAIProvider();
      break;
    default:
      currentProvider = new OllamaProvider();
      break;
  }
  return currentProvider;
}

export function getOllamaEmbedder(): OllamaProvider {
  return new OllamaProvider();
}
