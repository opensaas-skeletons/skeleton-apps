# Customization Guide

This guide covers common customizations for Skeleton AI.

## Theme Customization

### Tailwind Theme

Edit `client/tailwind.config.js` to customize colors, fonts, and spacing:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... your brand colors
          600: '#0284c7',
          700: '#0369a1',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          // ... your surface colors
          800: '#1e293b',
          900: '#0f172a',
        }
      }
    }
  }
};
```

### Dark Mode

The app uses Tailwind's class-based dark mode. Toggle the `dark` class on the root element. Components use `dark:` prefixed utilities.

### Global Styles

Edit `client/src/styles/globals.css` for global CSS overrides. The file imports Tailwind layers and defines custom utility classes.

## Retrieval Parameter Tuning

### top_k (Default: 8)

Number of chunks retrieved per query. Increase for broader context, decrease for more focused answers.

- **Low (3-5):** More precise, faster, less context
- **Medium (6-10):** Balanced (recommended)
- **High (10-20):** More context, slower, may include noise

### similarity_threshold (Default: 0.3)

Minimum cosine similarity score. Chunks below this threshold are excluded.

- **Low (0.1-0.2):** More results, lower relevance
- **Medium (0.3-0.5):** Balanced (recommended)
- **High (0.5-0.8):** Fewer but highly relevant results

### temperature (Default: 0.3)

LLM sampling temperature. Lower values are more deterministic.

- **Low (0.0-0.3):** Factual, deterministic (recommended for code Q&A)
- **Medium (0.3-0.7):** Balanced creativity
- **High (0.7-1.0):** More creative, less predictable

### max_tokens (Default: 2048)

Maximum tokens in the LLM response. Increase for longer answers.

## Adding Providers

See [LLM-GUIDE.md](../LLM-GUIDE.md) Recipe 1 for step-by-step instructions on adding a new LLM provider.

The provider abstraction requires implementing four methods:
1. `chat()` — Streaming text generation
2. `embed()` — Text embedding (optional, Ollama handles this)
3. `listModels()` — Available models
4. `isAvailable()` — Connectivity check

## System Prompt Editing

The system prompt is stored in the settings table and can be edited via the Settings page or API:

```bash
curl -X PUT http://localhost:3006/api/settings \
  -H "Content-Type: application/json" \
  -d '{"system_prompt": "You are an expert code reviewer. Always cite sources."}'
```

### Prompt Template Variables

The system prompt is prepended with retrieved context before being sent to the LLM. The chat service builds the full prompt as:

```
{system_prompt}

Use the following sources to answer the user's question. Cite sources using [1], [2], etc.

[1] path/to/file.ts (lines 10-25):
chunk content here...

[2] path/to/readme.md:
chunk content here...
```

## Chunk Size Configuration

Edit `shared/constants.ts` to adjust chunking behavior:

- `DEFAULT_CHUNK_SIZE` (500) — Target tokens per chunk
- `MAX_CHUNK_SIZE` (1000) — Maximum tokens per chunk
- `CHUNK_OVERLAP` (50) — Overlap tokens between consecutive chunks

Smaller chunks give more precise retrieval but may lose context. Larger chunks preserve context but may include irrelevant content.

After changing chunk sizes, re-ingest your sources for the changes to take effect.

## File Type Support

Edit `SUPPORTED_FILE_EXTENSIONS` in `shared/constants.ts` to add or remove supported file types.

Edit `IGNORED_PATHS` and `IGNORED_FILES` to customize which files and directories are skipped during ingestion.
