import { getPool } from "./connection";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  if (
    process.env.NODE_ENV === "production" &&
    !process.argv.includes("--force")
  ) {
    console.warn(
      "Seeding disabled in production. Use --force to override."
    );
    process.exit(1);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Clear existing data
    await client.query("DELETE FROM wiki_links");
    await client.query("DELETE FROM page_versions");
    await client.query("DELETE FROM pages");
    await client.query("DELETE FROM workspaces");

    // ---- Workspace: Engineering Wiki ----
    const wsId = uuidv4();
    await client.query(
      `INSERT INTO workspaces (id, title, description, icon, color)
       VALUES ($1, $2, $3, $4, $5)`,
      [wsId, "Engineering Wiki", "Technical documentation and guides for the engineering team", "🔬", "#3b82f6"]
    );

    // ---- Root Pages ----
    const gettingStartedId = uuidv4();
    const architectureId = uuidv4();
    const onboardingId = uuidv4();
    const apiDocsId = uuidv4();
    const runbooksId = uuidv4();

    // Page: Getting Started
    await client.query(
      `INSERT INTO pages (id, workspace_id, title, slug, content, icon, position, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        gettingStartedId,
        wsId,
        "Getting Started",
        "getting-started",
        `# Getting Started

Welcome to the Engineering Wiki! This is your team's central knowledge base.

## Quick Links

- [[Architecture Overview]] — System design and tech stack
- [[Onboarding Guide]] — New engineer setup
- [[API Documentation]] — REST API reference
- [[Runbooks]] — Operational procedures

## How to Use This Wiki

1. **Browse** the page tree in the sidebar
2. **Search** for topics using the search bar (Ctrl+K)
3. **Create** new pages with the + button
4. **Link** pages together using \`[[Page Title]]\` syntax
5. **Track changes** with version history

> This wiki supports Markdown formatting. Use headings, lists, code blocks, and more!`,
        "📚",
        0,
        true,
      ]
    );

    // Page: Architecture Overview
    await client.query(
      `INSERT INTO pages (id, workspace_id, title, slug, content, icon, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        architectureId,
        wsId,
        "Architecture Overview",
        "architecture-overview",
        `# Architecture Overview

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL 16 |
| Build Tool | Vite |
| Container | Docker + Docker Compose |

## System Diagram

\`\`\`
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Client     │────▶│   Server     │────▶│  Database   │
│  (React)     │◀────│  (Express)   │◀────│ (PostgreSQL)│
│  Port 5176   │     │  Port 3004   │     │  Port 5435  │
└─────────────┘     └──────────────┘     └────────────┘
\`\`\`

## Key Design Decisions

### Monorepo Structure
We use npm workspaces with three packages:
- **shared/** — Types and constants shared between client and server
- **server/** — Express API with PostgreSQL
- **client/** — React SPA with Vite

### Markdown-First Content
All page content is stored as Markdown, rendered on the client side. This keeps the server simple and enables rich formatting.

### Wiki Links
Pages can reference each other using \`[[Page Title]]\` syntax. These links are parsed and stored in a separate table for bidirectional backlink tracking.

See also: [[API Documentation]]`,
        "🏗️",
        1,
      ]
    );

    // Page: Onboarding Guide
    await client.query(
      `INSERT INTO pages (id, workspace_id, title, slug, content, icon, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        onboardingId,
        wsId,
        "Onboarding Guide",
        "onboarding-guide",
        `# Onboarding Guide

Welcome to the team! Follow these steps to get up and running.

## Day 1: Environment Setup

### Prerequisites
- Node.js 20+
- Docker Desktop
- Git
- VS Code (recommended)

### Clone & Run
\`\`\`bash
git clone git@github.com:team/skeleton-wiki.git
cd skeleton-wiki
npm install
docker compose up --build
\`\`\`

The app will be available at:
- **Frontend:** http://localhost:5176
- **API:** http://localhost:3004
- **Database:** localhost:5435

## Day 2: Codebase Tour

1. Read the [[Architecture Overview]]
2. Explore the shared types in \`shared/types/wiki.ts\`
3. Review the API routes in \`server/src/routes/\`
4. Check out the React components in \`client/src/components/\`

## Day 3: First Contribution

1. Pick a "good first issue" from the issue tracker
2. Create a feature branch
3. Make your changes
4. Open a pull request

## Useful Resources

- [[API Documentation]] — Full API reference
- [[Runbooks]] — How to handle production issues
- [[Code Style Guide]] — Coding conventions`,
        "🎯",
        2,
      ]
    );

    // Page: API Documentation
    await client.query(
      `INSERT INTO pages (id, workspace_id, title, slug, content, icon, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        apiDocsId,
        wsId,
        "API Documentation",
        "api-documentation",
        `# API Documentation

Base URL: \`http://localhost:3004/api\`

## Workspaces

### List Workspaces
\`\`\`
GET /api/workspaces
\`\`\`

### Create Workspace
\`\`\`
POST /api/workspaces
Content-Type: application/json

{
  "title": "My Wiki",
  "description": "Optional description",
  "icon": "📚",
  "color": "#3b82f6"
}
\`\`\`

## Pages

### List Pages
\`\`\`
GET /api/workspaces/:workspaceId/pages
\`\`\`

### Get Page Tree
\`\`\`
GET /api/workspaces/:workspaceId/pages/tree
\`\`\`

### Create Page
\`\`\`
POST /api/workspaces/:workspaceId/pages
Content-Type: application/json

{
  "title": "New Page",
  "content": "# Hello World",
  "parent_id": null,
  "icon": "📄"
}
\`\`\`

### Update Page
\`\`\`
PUT /api/pages/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}
\`\`\`

### Search
\`\`\`
GET /api/workspaces/:workspaceId/search?q=keyword
\`\`\`

## Version History

### List Versions
\`\`\`
GET /api/pages/:id/versions
\`\`\`

### Restore Version
\`\`\`
POST /api/pages/:id/versions/:versionId/restore
\`\`\`

## Backlinks

### Get Backlinks
\`\`\`
GET /api/pages/:id/backlinks
\`\`\`

Returns all pages that link to the specified page via \`[[wiki links]]\`.`,
        "📐",
        3,
      ]
    );

    // Page: Runbooks
    await client.query(
      `INSERT INTO pages (id, workspace_id, title, slug, content, icon, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        runbooksId,
        wsId,
        "Runbooks",
        "runbooks",
        `# Runbooks

Operational procedures for common scenarios.

## Database Issues

### Connection Pool Exhaustion
**Symptoms:** Slow queries, connection timeouts
**Steps:**
1. Check active connections: \`SELECT count(*) FROM pg_stat_activity;\`
2. Kill idle connections older than 10 minutes
3. Restart the server pod if needed
4. Review recent code changes for connection leaks

### High Disk Usage
**Symptoms:** Database logs showing disk space warnings
**Steps:**
1. Check table sizes: \`SELECT pg_size_pretty(pg_total_relation_size('pages'));\`
2. Run VACUUM FULL on large tables
3. Archive old page versions if necessary

## Application Issues

### Server Not Starting
1. Check Docker logs: \`docker compose logs server\`
2. Verify database is healthy: \`docker compose ps\`
3. Check environment variables in docker-compose.yml
4. Try rebuilding: \`docker compose up --build\`

### Search Not Working
1. Verify the GIN index exists on the pages table
2. Check that content is not empty
3. Test with a simple query in psql
4. Rebuild the search index if needed

See also: [[Architecture Overview]] for system details.`,
        "🔧",
        4,
      ]
    );

    // ---- Child Pages ----

    // Child of Architecture: Code Style Guide
    const codeStyleId = uuidv4();
    await client.query(
      `INSERT INTO pages (id, workspace_id, parent_id, title, slug, content, icon, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        codeStyleId,
        wsId,
        architectureId,
        "Code Style Guide",
        "code-style-guide",
        `# Code Style Guide

## TypeScript

- Use \`strict\` mode always
- Prefer \`interface\` over \`type\` for object shapes
- Use explicit return types on exported functions
- Avoid \`any\` — use \`unknown\` with type guards instead

## React Components

- Use function components with hooks
- Keep components under 200 lines
- Extract custom hooks for reusable logic
- Use Tailwind CSS for styling (no CSS modules)

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | \`PageView.tsx\` |
| Hook | camelCase with \`use\` prefix | \`usePages.ts\` |
| Service | kebab-case with \`.service\` suffix | \`page.service.ts\` |
| Route | kebab-case | \`pages.ts\` |
| Type file | kebab-case | \`wiki.ts\` |

## Git Conventions

- Branch names: \`feature/short-description\` or \`fix/short-description\`
- Commit messages: imperative mood, 50 char limit for subject
- Always rebase before merging`,
        "🎨",
        0,
      ]
    );

    // Child of Architecture: Database Schema
    const dbSchemaId = uuidv4();
    await client.query(
      `INSERT INTO pages (id, workspace_id, parent_id, title, slug, content, icon, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        dbSchemaId,
        wsId,
        architectureId,
        "Database Schema",
        "database-schema",
        `# Database Schema

## Tables

### workspaces
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR(255) | Workspace name |
| description | TEXT | Optional description |
| icon | VARCHAR(50) | Emoji icon |
| color | VARCHAR(20) | Hex color |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### pages
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workspace_id | UUID | FK to workspaces |
| parent_id | UUID | FK to pages (self-referential) |
| title | VARCHAR(500) | Page title |
| slug | VARCHAR(500) | URL-friendly identifier |
| content | TEXT | Markdown content |
| icon | VARCHAR(50) | Emoji icon |
| position | INTEGER | Sort order |
| is_pinned | BOOLEAN | Pinned to top |

### page_versions
Stores historical snapshots of page content for version history.

### wiki_links
Tracks \`[[wiki link]]\` references between pages for backlink support.

## Indexes
- GIN index on pages for full-text search
- B-tree indexes on all foreign keys
- Unique constraint on (workspace_id, slug)`,
        "🗂️",
        1,
      ]
    );

    // Child of Runbooks: Deployment Guide
    const deploymentId = uuidv4();
    await client.query(
      `INSERT INTO pages (id, workspace_id, parent_id, title, slug, content, icon, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        deploymentId,
        wsId,
        runbooksId,
        "Deployment Guide",
        "deployment-guide",
        `# Deployment Guide

## Docker Compose (Development)

\`\`\`bash
# Start all services
docker compose up --build

# Stop all services
docker compose down

# Reset database
docker compose down -v
docker compose up --build
\`\`\`

## Production Deployment

### Prerequisites
- Docker registry access
- Database connection string
- Environment variables configured

### Steps
1. Build production images
2. Push to container registry
3. Update deployment configuration
4. Run migrations
5. Deploy new version
6. Verify health checks

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3004 |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_NAME | Database name | skeleton_wiki |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | postgres |
| CORS_ORIGIN | Allowed origins | * |
| AUTH_ENABLED | Enable auth | false |`,
        "🚀",
        0,
      ]
    );

    // Create version entries for all pages
    const allPageIds = [
      gettingStartedId, architectureId, onboardingId, apiDocsId,
      runbooksId, codeStyleId, dbSchemaId, deploymentId,
    ];
    for (const pageId of allPageIds) {
      const pageResult = await client.query(
        "SELECT title, content FROM pages WHERE id = $1",
        [pageId]
      );
      const page = pageResult.rows[0];
      await client.query(
        `INSERT INTO page_versions (page_id, title, content, version_number)
         VALUES ($1, $2, $3, $4)`,
        [pageId, page.title, page.content, 1]
      );
    }

    // Create wiki links based on [[references]]
    const linkPairs: [string, string][] = [
      [gettingStartedId, architectureId],
      [gettingStartedId, onboardingId],
      [gettingStartedId, apiDocsId],
      [gettingStartedId, runbooksId],
      [architectureId, apiDocsId],
      [onboardingId, architectureId],
      [onboardingId, apiDocsId],
      [onboardingId, runbooksId],
      [onboardingId, codeStyleId],
      [runbooksId, architectureId],
    ];
    for (const [source, target] of linkPairs) {
      await client.query(
        `INSERT INTO wiki_links (source_page_id, target_page_id)
         VALUES ($1, $2)`,
        [source, target]
      );
    }

    await client.query("COMMIT");
    console.log("Seeded: 1 workspace, 8 pages, 8 versions, 10 wiki links");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
