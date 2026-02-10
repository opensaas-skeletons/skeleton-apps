export const APP_NAME = "Skeleton AI";

export const INTEROP_VERSION = "1.0";

export const SUPPORTED_FILE_EXTENSIONS = [
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".yaml",
  ".yml",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".css",
  ".html",
  ".sql",
  ".sh",
  ".bash",
  ".txt",
  ".env.example",
  ".toml",
  ".cfg",
  ".ini",
  ".xml",
  ".csv",
];

export const IGNORED_PATHS = [
  "node_modules",
  "dist",
  "build",
  ".git",
  "pgdata",
  ".env",
  ".vite",
  ".claude",
  "coverage",
  "__pycache__",
  ".next",
  ".nuxt",
  "vendor",
];

export const IGNORED_FILES = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".DS_Store",
  "Thumbs.db",
];

export const MAX_FILE_SIZE_BYTES = 1_000_000;

export const DEFAULT_CHUNK_SIZE = 300;
export const MAX_CHUNK_SIZE = 600;
export const CHUNK_OVERLAP = 30;

export const DEFAULT_EMBEDDING_MODEL = "nomic-embed-text";
export const FALLBACK_EMBEDDING_MODEL = "all-minilm";
export const DEFAULT_CHAT_MODEL = "llama3.2";

export const DEFAULT_TOP_K = 12;
export const DEFAULT_SIMILARITY_THRESHOLD = 0.25;
export const DEFAULT_TEMPERATURE = 0.3;
export const DEFAULT_MAX_TOKENS = 2048;

export const EMBEDDING_DIMENSIONS = 768;
export const EMBEDDING_BATCH_SIZE = 32;

export const PROVIDER_NAMES = {
  ollama: "Ollama (Local)",
  anthropic: "Anthropic",
  openai: "OpenAI",
} as const;

export const SOURCE_STATUSES = {
  pending: "pending",
  ingesting: "ingesting",
  ready: "ready",
  error: "error",
} as const;
