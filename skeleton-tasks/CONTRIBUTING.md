# Contributing to Skeleton Tasks

Thank you for your interest in contributing to Skeleton Tasks! This document provides guidelines and instructions for contributing.

## Ways to Contribute

- **Report bugs** — Open an issue describing the bug and how to reproduce it
- **Suggest features** — Open an issue describing the feature and its use case
- **Fix bugs** — Submit a pull request with a fix
- **Add features** — Submit a pull request with new functionality
- **Improve docs** — Fix typos, clarify explanations, add examples

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- npm 9+

### Quick Start with Docker

```bash
git clone https://github.com/open-saas-skeletons/skeleton-tasks.git
cd skeleton-tasks
docker-compose up --build
```

### Manual Setup

```bash
# Clone and install
git clone https://github.com/open-saas-skeletons/skeleton-tasks.git
cd skeleton-tasks
npm install

# Set up database
cp .env.example .env
createdb skeleton_tasks
npm run migrate
npm run seed

# Start development servers
npm run dev
```

## Pull Request Process

### 1. Fork and Branch

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/skeleton-tasks.git
cd skeleton-tasks
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation if needed

### 3. Test

```bash
npm test
```

### 4. Commit

Write clear, descriptive commit messages:

```bash
git commit -m "Add task archiving feature

- Add archived column to tasks table
- Add archive/unarchive API endpoints
- Add archive button to task card"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub.

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define interfaces for data structures
- Avoid `any` types

### React Components

- Use functional components with hooks
- Define prop interfaces
- Keep components focused and composable

### API Routes

- Follow REST conventions
- Use the existing error handling pattern
- Return consistent JSON responses: `{ success: true, data: ... }`

### Database

- Use parameterized queries (never string concatenation)
- Add migrations for schema changes
- Use UUIDs for primary keys

## Project Structure

```
shared/         # Shared types (don't modify interop types)
server/         # Express API
  src/routes/   # HTTP handlers
  src/services/ # Business logic
  src/db/       # Database access
client/         # React frontend
  src/components/
  src/hooks/
  src/api/
```

## What Not to Change

The following files implement the interop standard and should not be modified:

- `server/src/routes/interop.ts`
- Core fields in `shared/types/task.ts`

See [LLM-GUIDE.md](LLM-GUIDE.md) for details.

## Questions?

Open an issue with your question and we'll be happy to help!
