# Deployment Guide

## Docker Deployment

### Quick Start

```bash
docker-compose up --build -d
```

This starts all services:
- **PostgreSQL** with pgvector on port 5437
- **Express API** on port 3006
- **React client** on port 5178
- **Ollama** on port 11434

### Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5437/skeleton_ai` | PostgreSQL connection string |
| `PORT` | `3006` | API server port |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `ANTHROPIC_API_KEY` | (none) | Anthropic API key (optional) |
| `OPENAI_API_KEY` | (none) | OpenAI API key (optional) |
| `NODE_ENV` | `development` | Environment (development/production) |

### Production Configuration

For production deployments:

1. **Use strong database credentials:**
   ```
   DATABASE_URL=postgresql://appuser:strong-password@db-host:5432/skeleton_ai
   ```

2. **Run behind a reverse proxy (nginx/caddy):**
   ```nginx
   server {
     listen 443 ssl;
     server_name ai.yourdomain.com;

     location / {
       proxy_pass http://localhost:5178;
     }

     location /api {
       proxy_pass http://localhost:3006;
       proxy_http_version 1.1;
       proxy_set_header Connection "";
       proxy_buffering off;  # Required for SSE streaming
     }
   }
   ```

3. **Disable SSE buffering** in your proxy for streaming to work correctly.

4. **Set NODE_ENV=production:**
   ```
   NODE_ENV=production
   ```

## Ollama Model Management

### Pulling Models

Ollama models are downloaded on first use. Pre-pull them for faster startup:

```bash
# Chat model (required)
ollama pull llama3.2

# Embedding model (required)
ollama pull all-minilm

# Alternative chat models
ollama pull mistral
ollama pull codellama
ollama pull llama3.2:1b  # Smaller, faster
```

### Model Storage

Ollama stores models in `~/.ollama/models/`. In Docker, this is mounted as a volume to persist models across restarts.

### GPU Support

Ollama automatically uses GPU if available. For Docker with NVIDIA GPU:

```yaml
# docker-compose.yml
services:
  ollama:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Memory Requirements

| Model | RAM Required |
|-------|-------------|
| all-minilm (embedding) | ~100MB |
| llama3.2 (3B) | ~4GB |
| llama3.2:1b | ~1.5GB |
| mistral (7B) | ~6GB |
| codellama (7B) | ~6GB |

## Database Setup

### pgvector Extension

The pgvector extension must be installed in PostgreSQL. The Docker setup handles this automatically using the `pgvector/pgvector:pg16` image.

For manual installations:

```bash
# Ubuntu/Debian
sudo apt install postgresql-16-pgvector

# macOS (Homebrew)
brew install pgvector
```

Enable the extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Backup and Restore

```bash
# Backup
pg_dump -h localhost -p 5437 -U postgres skeleton_ai > backup.sql

# Restore
psql -h localhost -p 5437 -U postgres skeleton_ai < backup.sql
```

### Using the Interop Export

For a portable backup that works across different databases:

```bash
# Export
curl http://localhost:3006/api/export > backup.json

# Import (into a fresh instance)
curl -X POST http://localhost:3006/api/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

Note: Interop export does not include embeddings. Re-ingest sources after import.

## Scaling Considerations

### Embedding Performance

- Embedding is CPU-bound (or GPU if available)
- Process in batches of 32 (configurable via `EMBEDDING_BATCH_SIZE`)
- For large codebases, initial ingestion may take several minutes

### Vector Search Performance

- pgvector uses IVFFlat index for approximate nearest neighbor search
- Index is created automatically in the migration
- For very large datasets (>100k chunks), consider tuning the `lists` parameter in the index

### LLM Response Time

- Local Ollama: 10-50 tokens/second depending on model and hardware
- Cloud providers (Anthropic, OpenAI): 30-100 tokens/second
- Streaming mitigates perceived latency
