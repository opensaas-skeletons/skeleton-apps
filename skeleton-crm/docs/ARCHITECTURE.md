# Architecture

## Overview

Skeleton CRM is a monorepo with three npm workspace packages:

- **shared/** — TypeScript types and constants used by both server and client
- **server/** — Express.js REST API with PostgreSQL
- **client/** — React SPA with Vite, Tailwind CSS, dnd-kit, and Recharts

## Database Schema

### Entity Relationships

```
companies 1──N contacts
companies 1──N deals
contacts  1──N deals
contacts  1──N activities
deals     1──N activities
companies 1──N activities
pipelines 1──N stages
stages    1──N deals
```

### Tables

- **contacts** — People you do business with
- **companies** — Organizations contacts belong to
- **pipelines** — Sales processes (e.g., "Sales Pipeline", "Partnership Pipeline")
- **stages** — Steps within a pipeline (e.g., Lead → Qualified → Proposal → Won/Lost)
- **deals** — Revenue opportunities tied to a pipeline stage, contact, and company
- **activities** — Interactions logged against contacts, deals, or companies

### Key Design Decisions

1. **Stages belong to Pipelines** — Each pipeline has its own set of stages with positions, probabilities, and terminal states
2. **Terminal stages** — Stages marked as terminal auto-set deal status to 'won' or 'lost'
3. **Position-based ordering** — Deals within stages and stages within pipelines use integer positions for drag-and-drop reordering
4. **JSONB tags** — Contact tags stored as JSONB arrays for flexible filtering
5. **Full-text search** — PostgreSQL GIN indexes on contacts and companies for fast search

## API Design

All API responses follow the pattern:
```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Authentication

Auth is disabled by default (development mode). Enable with `AUTH_ENABLED=true` environment variable. Supports:
- API key via `x-api-key` header
- JWT Bearer token via `Authorization` header
