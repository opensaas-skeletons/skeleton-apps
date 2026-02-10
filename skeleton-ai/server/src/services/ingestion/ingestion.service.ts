import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne, getPool } from "../../db/connection";
import { crawlDirectory } from "./crawler";
import { chunkContent } from "./chunker";
import { embedTexts } from "./embedder";
import type { Source, IngestionResult } from "@shared/types/ai";

export async function ingestSource(sourceId: string): Promise<void> {
  try {
    // Update status to ingesting
    await query("UPDATE sources SET status = 'ingesting', error_message = NULL WHERE id = $1", [sourceId]);

    const source = await queryOne<Source>("SELECT * FROM sources WHERE id = $1", [sourceId]);
    if (!source) throw new Error(`Source ${sourceId} not found`);

    const dirPath = source.config.path;
    if (!dirPath) throw new Error("Source config.path is required");

    console.log(`[Ingestion] Starting ingestion for source "${source.title}" at ${dirPath}`);

    // Crawl files
    const crawledFiles = await crawlDirectory(dirPath);
    console.log(`[Ingestion] Found ${crawledFiles.length} files`);

    const result: IngestionResult = {
      source_id: sourceId,
      documents_processed: 0,
      documents_added: 0,
      documents_updated: 0,
      documents_removed: 0,
      chunks_created: 0,
      errors: [],
    };

    const processedPaths = new Set<string>();

    for (const file of crawledFiles) {
      const pool = getPool();
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const contentHash = crypto.createHash("sha256").update(file.content).digest("hex");
        processedPaths.add(file.path);

        // Check if document already exists
        const existing = await client.query(
          "SELECT id, content_hash FROM documents WHERE source_id = $1 AND file_path = $2",
          [sourceId, file.path]
        );

        let documentId: string;

        if (existing.rows.length > 0) {
          const existingDoc = existing.rows[0];
          if (existingDoc.content_hash === contentHash) {
            // File unchanged, skip
            await client.query("COMMIT");
            result.documents_processed++;
            continue;
          }

          // File changed — delete old chunks and update document
          documentId = existingDoc.id;
          await client.query("DELETE FROM chunks WHERE document_id = $1", [documentId]);
          await client.query(
            "UPDATE documents SET content_hash = $1, file_type = $2, updated_at = NOW() WHERE id = $3",
            [contentHash, file.fileType, documentId]
          );
          result.documents_updated++;
        } else {
          // New document
          documentId = uuidv4();
          await client.query(
            `INSERT INTO documents (id, source_id, file_path, file_type, content_hash, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [documentId, sourceId, file.path, file.fileType, contentHash, JSON.stringify({})]
          );
          result.documents_added++;
        }

        // Chunk the content
        const chunks = chunkContent(file.content, file.fileType, file.path);

        if (chunks.length > 0) {
          // Embed all chunks
          const chunkTexts = chunks.map((c) => c.content);
          const embeddings = await embedTexts(chunkTexts);

          // Store chunks with embeddings
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = embeddings[i];
            const embeddingStr = `[${embedding.join(",")}]`;

            await client.query(
              `INSERT INTO chunks (id, document_id, content, chunk_index, metadata, embedding)
               VALUES ($1, $2, $3, $4, $5, $6::vector)`,
              [uuidv4(), documentId, chunk.content, chunk.chunkIndex, JSON.stringify(chunk.metadata), embeddingStr]
            );
            result.chunks_created++;
          }

          // Update document chunk_count
          await client.query("UPDATE documents SET chunk_count = $1 WHERE id = $2", [chunks.length, documentId]);
        }

        await client.query("COMMIT");
        result.documents_processed++;
      } catch (err: any) {
        await client.query("ROLLBACK");
        result.errors.push(`${file.path}: ${err.message}`);
        console.error(`[Ingestion] Error processing ${file.path}:`, err.message);
      } finally {
        client.release();
      }
    }

    // Remove documents for files that no longer exist
    const existingDocs = await query<{ id: string; file_path: string }>(
      "SELECT id, file_path FROM documents WHERE source_id = $1",
      [sourceId]
    );

    for (const doc of existingDocs) {
      if (!processedPaths.has(doc.file_path)) {
        await query("DELETE FROM documents WHERE id = $1", [doc.id]);
        result.documents_removed++;
      }
    }

    // Update source counts
    const docCount = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM documents WHERE source_id = $1",
      [sourceId]
    );
    const chunkCount = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM chunks c JOIN documents d ON c.document_id = d.id WHERE d.source_id = $1",
      [sourceId]
    );

    await query(
      "UPDATE sources SET status = 'ready', document_count = $1, chunk_count = $2 WHERE id = $3",
      [parseInt(docCount?.count || "0"), parseInt(chunkCount?.count || "0"), sourceId]
    );

    console.log(`[Ingestion] Complete: ${result.documents_added} added, ${result.documents_updated} updated, ${result.documents_removed} removed, ${result.chunks_created} chunks`);
  } catch (err: any) {
    console.error(`[Ingestion] Fatal error for source ${sourceId}:`, err.message);
    await query(
      "UPDATE sources SET status = 'error', error_message = $1 WHERE id = $2",
      [err.message, sourceId]
    );
  }
}
