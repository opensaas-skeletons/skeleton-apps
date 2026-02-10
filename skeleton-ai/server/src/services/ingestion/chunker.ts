import type { ChunkData } from "@shared/types/ai";
import { DEFAULT_CHUNK_SIZE, MAX_CHUNK_SIZE, CHUNK_OVERLAP } from "@shared/constants";

function estimateTokens(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function chunkContent(content: string, fileType: string, filePath: string): ChunkData[] {
  switch (fileType) {
    case "md":
      return chunkMarkdown(content, filePath);
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
    case "py":
    case "go":
    case "rs":
    case "java":
    case "c":
    case "cpp":
    case "h":
      return chunkCode(content, filePath);
    default:
      return chunkByParagraph(content, filePath);
  }
}

function chunkMarkdown(content: string, filePath: string): ChunkData[] {
  const chunks: ChunkData[] = [];
  // Split by headings (## and above)
  const sections = content.split(/(?=^#{1,3}\s)/m);
  let chunkIndex = 0;

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // Extract heading for metadata
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    const heading = headingMatch ? headingMatch[2].trim() : "";

    const tokens = estimateTokens(trimmed);

    if (tokens <= MAX_CHUNK_SIZE) {
      chunks.push({
        content: trimmed,
        metadata: { heading, file_path: filePath, type: "markdown" },
        chunkIndex: chunkIndex++,
      });
    } else {
      // Split large sections into smaller chunks
      const subChunks = splitBySize(trimmed, DEFAULT_CHUNK_SIZE, CHUNK_OVERLAP);
      for (const sub of subChunks) {
        chunks.push({
          content: sub,
          metadata: { heading, file_path: filePath, type: "markdown" },
          chunkIndex: chunkIndex++,
        });
      }
    }
  }

  if (chunks.length === 0 && content.trim()) {
    chunks.push({
      content: content.trim(),
      metadata: { file_path: filePath, type: "markdown" },
      chunkIndex: 0,
    });
  }

  return chunks;
}

function chunkCode(content: string, filePath: string): ChunkData[] {
  const chunks: ChunkData[] = [];
  const tokens = estimateTokens(content);

  // Keep small files whole
  if (tokens <= MAX_CHUNK_SIZE) {
    chunks.push({
      content: content.trim(),
      metadata: { file_path: filePath, type: "code" },
      chunkIndex: 0,
    });
    return chunks;
  }

  // Split by top-level declarations
  const declarationPattern = /(?=^(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum|def|func|fn|pub|struct|impl)\s)/m;
  const sections = content.split(declarationPattern);
  let chunkIndex = 0;

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    const sectionTokens = estimateTokens(trimmed);
    if (sectionTokens <= MAX_CHUNK_SIZE) {
      chunks.push({
        content: trimmed,
        metadata: { file_path: filePath, type: "code" },
        chunkIndex: chunkIndex++,
      });
    } else {
      const subChunks = splitBySize(trimmed, DEFAULT_CHUNK_SIZE, CHUNK_OVERLAP);
      for (const sub of subChunks) {
        chunks.push({
          content: sub,
          metadata: { file_path: filePath, type: "code" },
          chunkIndex: chunkIndex++,
        });
      }
    }
  }

  if (chunks.length === 0 && content.trim()) {
    const subChunks = splitBySize(content.trim(), DEFAULT_CHUNK_SIZE, CHUNK_OVERLAP);
    let idx = 0;
    for (const sub of subChunks) {
      chunks.push({
        content: sub,
        metadata: { file_path: filePath, type: "code" },
        chunkIndex: idx++,
      });
    }
  }

  return chunks;
}

function chunkByParagraph(content: string, filePath: string): ChunkData[] {
  const chunks: ChunkData[] = [];
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());
  let chunkIndex = 0;
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const combined = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
    const tokens = estimateTokens(combined);

    if (tokens > DEFAULT_CHUNK_SIZE && currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { file_path: filePath, type: "text" },
        chunkIndex: chunkIndex++,
      });
      currentChunk = paragraph;
    } else {
      currentChunk = combined;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: { file_path: filePath, type: "text" },
      chunkIndex: chunkIndex++,
    });
  }

  return chunks;
}

function splitBySize(text: string, targetSize: number, overlap: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + targetSize, words.length);
    chunks.push(words.slice(start, end).join(" "));
    start = end - overlap;
    if (start >= words.length) break;
    if (end === words.length) break;
  }

  return chunks;
}
