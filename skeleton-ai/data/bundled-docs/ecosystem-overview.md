# Open SaaS Skeletons Ecosystem

## What is Open SaaS Skeletons?

Open SaaS Skeletons is a collection of production-ready starter projects designed to be forked, customized, and extended by developers and LLMs into full SaaS applications. Each skeleton is a complete, working application with a consistent architecture and shared interoperability standard.

## The Skeleton Apps

### 1. Skeleton Tasks
A full-stack Kanban task tracker with drag-and-drop boards, columns, task cards, filtering, and search. Built with React + Express + PostgreSQL.

- **Key features:** Kanban board with @dnd-kit drag-and-drop, task CRUD, column management, priority levels, assignees, due dates, metadata fields, board management
- **Interop:** Task Standard v1.0 — export/import boards with columns and tasks

### 2. Skeleton Automation
A workflow automation engine with a visual node-based editor. Create triggers, conditions, and actions that execute in sequence. Built with React + Express + PostgreSQL.

- **Key features:** Visual workflow editor with React Flow, trigger/condition/action nodes, workflow execution engine, execution history, template library
- **Interop:** Automation Standard v1.0 — export/import workflows with nodes and connections

### 3. Skeleton Database
A database management interface with table creation, schema editing, and data browsing. Built with React + Express + PostgreSQL.

- **Key features:** Table CRUD, column management, row editing, data types, constraints, relationships, SQL query runner, schema visualization
- **Interop:** Database Standard v1.0 — export/import table schemas and data

### 4. Skeleton Wiki
A collaborative wiki with hierarchical pages, Markdown editing, and full-text search. Built with React + Express + PostgreSQL.

- **Key features:** Hierarchical pages with parent/child relationships, Markdown editor, [[wiki links]] with backlinks, full-text search with PostgreSQL GIN index, version history, workspaces, page pinning
- **Interop:** Wiki Standard v1.0 — export/import workspaces with pages and version history

### 5. Skeleton CRM
A customer relationship management system with contacts, companies, deal pipelines, and activity tracking. Built with React + Express + PostgreSQL.

- **Key features:** Contact management with CSV import, company management, deal pipeline with Kanban board (@dnd-kit), activity timeline, dashboard with recharts charts, pipeline stages with probability
- **Interop:** CRM Standard v1.0 — export/import contacts, companies, deals, and activities

### 6. Skeleton AI
A RAG-powered AI assistant with source ingestion, vector search, and multi-provider LLM support. Built with React + Express + PostgreSQL + pgvector + Ollama.

- **Key features:** Local LLM via Ollama (no API keys needed), RAG with pgvector, multi-provider support (Ollama/Anthropic/OpenAI), streaming chat, source management and ingestion, Markdown rendering with code highlighting, citation tracking, conversation management
- **Interop:** AI Assistant Standard v1.0 — export/import sources and conversations

## The Interop Standard

Each skeleton implements a versioned interop standard that enables data portability. The pattern is consistent across all apps:

1. **Export endpoint** (`GET /api/export`) — Returns all data as a portable JSON payload
2. **Import endpoint** (`POST /api/import`) — Accepts a JSON payload and creates records
3. **Version field** — Each payload includes a version string for forward compatibility
4. **App field** — Identifies the originating application
5. **Portable references** — Uses titles/names instead of UUIDs for cross-database portability

### Design Principles

- **No vendor lock-in** — Data can always be extracted
- **Round-trip safe** — Export then import produces equivalent data
- **Forward compatible** — New fields are optional, old importers ignore them
- **Human readable** — JSON payloads are readable without special tools

## How They Work Together

While each skeleton is independent and can be used standalone, they are designed with complementary functionality:

- **Skeleton Tasks** manages work items that could be tracked alongside...
- **Skeleton CRM** which manages the customer relationships that drive work
- **Skeleton Wiki** documents processes and knowledge for the team
- **Skeleton Database** provides data management for custom schemas
- **Skeleton Automation** connects workflows across systems
- **Skeleton AI** can ingest documentation from any other skeleton and provide intelligent Q&A

### Skeleton AI as the Knowledge Layer

Skeleton AI is particularly useful as a knowledge layer across the ecosystem. By pointing it at the source code or documentation of other skeleton apps, it can:

- Answer questions about how any skeleton app works
- Help developers customize and extend the apps
- Provide context-aware code suggestions
- Serve as an interactive documentation system

## Shared Architecture

All skeleton apps share a common architecture:

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL 16 |
| Package Manager | npm workspaces (monorepo) |
| Deployment | Docker + Docker Compose |
| Structure | shared/ + server/ + client/ packages |

This consistency means skills learned in one skeleton transfer directly to others.
