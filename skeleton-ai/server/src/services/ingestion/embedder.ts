import { EMBEDDING_BATCH_SIZE } from "@shared/constants";
import { getProvider } from "../llm/factory";

export async function embedTexts(
  texts: string[],
  onProgress?: (processed: number, total: number) => void
): Promise<number[][]> {
  const provider = getProvider();
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const embeddings = await provider.embedBatch(batch);
    allEmbeddings.push(...embeddings);

    if (onProgress) {
      onProgress(Math.min(i + EMBEDDING_BATCH_SIZE, texts.length), texts.length);
    }
  }

  return allEmbeddings;
}
