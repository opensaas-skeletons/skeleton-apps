import fs from "fs/promises";
import path from "path";
import type { CrawledFile } from "@shared/types/ai";
import {
  SUPPORTED_FILE_EXTENSIONS,
  IGNORED_PATHS,
  IGNORED_FILES,
  MAX_FILE_SIZE_BYTES,
} from "@shared/constants";

export async function crawlDirectory(dirPath: string): Promise<CrawledFile[]> {
  const files: CrawledFile[] = [];
  await walkDirectory(dirPath, dirPath, files);
  return files;
}

async function walkDirectory(
  basePath: string,
  currentPath: string,
  files: CrawledFile[]
): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(currentPath, { withFileTypes: true });
  } catch (err: any) {
    console.warn(`Cannot read directory ${currentPath}: ${err.message}`);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_PATHS.includes(entry.name)) continue;
      await walkDirectory(basePath, fullPath, files);
      continue;
    }

    if (!entry.isFile()) continue;
    if (IGNORED_FILES.includes(entry.name)) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_FILE_EXTENSIONS.includes(ext)) continue;

    try {
      const stat = await fs.stat(fullPath);
      if (stat.size > MAX_FILE_SIZE_BYTES) continue;

      const content = await fs.readFile(fullPath, "utf-8");
      const relativePath = path.relative(basePath, fullPath);

      files.push({
        path: relativePath,
        content,
        fileType: ext.slice(1), // remove leading dot
      });
    } catch (err: any) {
      console.warn(`Cannot read file ${fullPath}: ${err.message}`);
    }
  }
}
