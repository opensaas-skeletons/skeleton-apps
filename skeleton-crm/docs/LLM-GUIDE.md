# LLM Builder Guide

## Quick Start for AI Agents

This guide helps LLMs understand skeleton-crm's architecture for making modifications.

## File Locations

| What | Where |
|------|-------|
| Types | `shared/types/crm.ts` |
| Constants | `shared/constants.ts` |
| DB Schema | `server/src/db/migrations/001_initial.ts` |
| Services | `server/src/services/*.service.ts` |
| Routes | `server/src/routes/*.ts` |
| API Client | `client/src/api/client.ts` |
| Hooks | `client/src/hooks/use*.ts` |
| Components | `client/src/components/**/*.tsx` |

## Adding a New Entity

1. Add types to `shared/types/crm.ts`
2. Add migration in `server/src/db/migrations/`
3. Create service in `server/src/services/`
4. Create route in `server/src/routes/`
5. Mount route in `server/src/index.ts`
6. Add API functions in `client/src/api/client.ts`
7. Create hook in `client/src/hooks/`
8. Create components in `client/src/components/`
9. Add navigation in `client/src/components/App.tsx`

## Key Patterns

- **Services** handle business logic, **routes** handle HTTP
- **Hooks** manage state + API calls, **components** render UI
- Optimistic updates for DnD (update UI immediately, sync with server, rollback on error)
- Position management uses database transactions to maintain ordering
- `@shared/*` path alias resolves to `../shared/*` in both server and client

## Deal Movement Logic

When a deal moves to a terminal stage:
- `terminal_state: 'won'` → sets `status: 'won'`, `close_date: NOW()`
- `terminal_state: 'lost'` → sets `status: 'lost'`, `close_date: NOW()`
- Moving back to non-terminal → resets `status: 'open'`, clears `close_date`
