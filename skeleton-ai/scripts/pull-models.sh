#!/bin/bash
# Pull required Ollama models for Skeleton AI
# Run this after `docker compose up` to download the LLM and embedding models

set -e

echo "Pulling chat model (llama3.2)..."
docker compose exec ollama ollama pull llama3.2

echo "Pulling embedding model (nomic-embed-text)..."
docker compose exec ollama ollama pull nomic-embed-text

echo ""
echo "Models pulled successfully!"
echo "You can now use Skeleton AI at http://localhost:5178"
