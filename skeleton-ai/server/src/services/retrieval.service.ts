import { query } from "../db/connection";
import { getProvider } from "./llm/factory";
import type { SearchOptions, RetrievalResult } from "@shared/types/ai";
import { DEFAULT_TOP_K, DEFAULT_SIMILARITY_THRESHOLD } from "@shared/constants";

export async function search(options: SearchOptions): Promise<RetrievalResult[]> {
  const provider = getProvider();
  const topK = options.top_k ?? DEFAULT_TOP_K;
  const threshold = options.similarity_threshold ?? DEFAULT_SIMILARITY_THRESHOLD;

  // Embed the query
  const queryEmbedding = await provider.embed(options.query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  let sql = `
    SELECT
      c.id as chunk_id,
      c.document_id,
      d.file_path,
      s.title as source_title,
      c.content,
      1 - (c.embedding <=> $1::vector) as score,
      c.metadata
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    JOIN sources s ON d.source_id = s.id
    WHERE c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> $1::vector) > $2
  `;

  const params: any[] = [embeddingStr, threshold];
  let paramCount = 3;

  if (options.source_ids && options.source_ids.length > 0) {
    sql += ` AND d.source_id = ANY($${paramCount++})`;
    params.push(options.source_ids);
  }

  sql += ` ORDER BY score DESC LIMIT $${paramCount}`;
  params.push(topK);

  return query<RetrievalResult>(sql, params);
}
