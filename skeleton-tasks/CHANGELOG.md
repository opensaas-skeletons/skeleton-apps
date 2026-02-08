# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added

- **Kanban Board UI** — Drag-and-drop task management with @dnd-kit
- **Board Management** — Create, update, and delete boards
- **Column Management** — Customizable columns with colors and WIP limits
- **Task Management** — Full CRUD with priority, labels, assignee, due dates
- **Filtering** — Filter tasks by priority, label, assignee, and search text
- **Task Modal** — Detailed task editing with Markdown description support
- **Interop System** — Export/import boards in Open SaaS Task Standard v1.0 format
- **Docker Support** — One-command setup with docker-compose
- **PostgreSQL** — Production-ready database with migrations and seed data
- **TypeScript** — Full-stack type safety with shared types package
- **Tailwind CSS** — Modern, customizable styling
- **Extensible Architecture** — Metadata fields, service layer, clear patterns

### Documentation

- README with quick start and project structure
- Architecture documentation with request flows
- LLM Builder Guide with customization recipes
- Interop Standard specification
- Deployment guide (Docker, PM2, systemd, nginx)
- Customization guide (themes, columns, metadata)
- Adding features guide (endpoints, components, tables)

### Technical

- npm workspaces monorepo structure
- Express.js REST API with error handling
- React 18 with Vite and hot reload
- Database migrations with seed data
- Vitest for testing
