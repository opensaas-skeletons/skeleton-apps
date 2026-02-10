import fs from "fs/promises";
import { query, queryOne } from "../db/connection";
import type { Document } from "@shared/types/ai";
import { NotFoundError } from "../errors";

export async function listDocuments(sourceId: string): Promise<Document[]> {
  return query<Document>(
    "SELECT * FROM documents WHERE source_id = $1 ORDER BY file_path ASC",
    [sourceId]
  );
}

export async function getDocument(id: string): Promise<Document & { chunks: any[] }> {
  const document = await queryOne<Document>("SELECT * FROM documents WHERE id = $1", [id]);
  if (!document) throw new NotFoundError("Document not found");

  const chunks = await query(
    "SELECT id, chunk_index, content, metadata, created_at FROM chunks WHERE document_id = $1 ORDER BY chunk_index ASC",
    [id]
  );

  return { ...document, chunks };
}

export async function getDocumentContent(id: string): Promise<{ file_path: string; content: string }> {
  const document = await queryOne<Document & { source_config: Record<string, any> }>(
    `SELECT d.*, s.config as source_config FROM documents d
     JOIN sources s ON d.source_id = s.id
     WHERE d.id = $1`,
    [id]
  );
  if (!document) throw new NotFoundError("Document not found");

  const basePath = document.source_config?.path || "";
  const fullPath = basePath ? `${basePath}/${document.file_path}` : document.file_path;

  try {
    const content = await fs.readFile(fullPath, "utf-8");
    return { file_path: document.file_path, content };
  } catch (err: any) {
    throw new NotFoundError(`File not found on disk: ${document.file_path}`);
  }
}
