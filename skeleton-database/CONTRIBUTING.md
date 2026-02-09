# Contributing to skeleton-database

Thank you for your interest in contributing to skeleton-database. This guide will help you get started.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/skeleton-database.git
   cd skeleton-database
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the development environment**:
   ```bash
   docker compose up db -d
   npm run migrate -w server
   npm run dev -w server &
   npm run dev -w client
   ```

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** following the code style guidelines below
3. **Test your changes** locally
4. **Commit your changes** with a clear commit message
5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** against the `main` branch

## Code Style

- **TypeScript** is used throughout the project. All new code must be typed.
- **No `any` types** unless absolutely necessary and documented with a comment explaining why.
- **Shared types** go in `shared/types/database.ts`. Do not duplicate type definitions across packages.
- **Constants** go in `shared/constants.ts`.
- **Server services** contain business logic. Routes should be thin handlers that call services and return responses.
- **React components** use functional components with hooks. No class components.
- **Tailwind CSS** for all styling. No inline styles or CSS modules.
- **Named exports** preferred over default exports.

## Commit Messages

Use clear, descriptive commit messages:

```
Add kanban view type with drag-and-drop support

- Create KanbanView component with column layout
- Add group_field_id to ViewConfig
- Implement drag-and-drop row reordering between columns
```

The first line should be imperative mood ("Add" not "Added"), under 72 characters. Additional detail goes in the body after a blank line.

## Pull Request Guidelines

- **Keep PRs focused**: One feature or fix per PR
- **Update types**: If your change affects the data model, update `shared/types/database.ts` first
- **Update constants**: If adding a new field type, view type, or similar, update `shared/constants.ts`
- **Test the interop format**: If your change affects data structures, verify that export/import still works correctly
- **Include a description**: Explain what your PR does and why

## Adding a New Field Type

This is one of the most common contributions. Follow the recipe in [LLM-GUIDE.md](./LLM-GUIDE.md#how-to-add-a-new-field-type) for the step-by-step process.

## Adding a New View Type

See the recipe in [LLM-GUIDE.md](./LLM-GUIDE.md#how-to-add-a-new-view-type).

## Project Structure

See the [README](./README.md#project-structure) for the full project structure and [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions.

## Reporting Issues

- Use the GitHub issue tracker
- Include steps to reproduce the issue
- Include the expected vs actual behavior
- Include browser/OS information if relevant

## Questions

If you have questions about the codebase or how to implement something, open a discussion on GitHub or check the [LLM-GUIDE.md](./LLM-GUIDE.md) for common recipes.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
