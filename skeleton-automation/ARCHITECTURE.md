# Architecture — Skeleton Automation

## System Overview

Skeleton Automation is a workflow engine that processes **TRIGGER → CONDITION → ACTION** chains. It runs as a monorepo with three packages: shared types, an Express API server, and a React frontend.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client     │────▶│   Server     │────▶│  PostgreSQL  │
│  React/Vite  │◀────│  Express     │◀────│             │
│  port 5174   │     │  port 3002   │     │  port 5433  │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────┴───────┐
                    │  Scheduler   │
                    │  (node-cron) │
                    └──────────────┘
```

## Core Concepts

### Workflow

A workflow is the central entity. It contains:
- **Trigger:** What starts the workflow (webhook, schedule, or event)
- **Conditions:** Optional filters that must pass before actions run (AND logic)
- **Actions:** An ordered list of steps executed sequentially

### Workflow Execution Flow

```
1. Trigger fires (webhook POST, cron tick, or event)
2. Create WorkflowRun record (status: "running")
3. Evaluate conditions against trigger data
   └─ If conditions fail → mark run as completed (skipped)
4. Execute actions sequentially:
   ├─ Action 1: execute → record result
   ├─ Action 2: execute → record result (may use transform output from step 1)
   └─ Action N: execute → record result
5. Mark run as "completed" or "failed"
```

### Data Flow Through Actions

Trigger data flows into the first action as `input`. Transform actions can modify this data for subsequent actions:

```
trigger_data → action_1(input) → action_2(input) → action_3(input)
                                     ↑
                              transform output merged
                              into input for next action
```

## Database Schema

### workflows

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR(255) | Workflow name |
| description | TEXT | Description |
| enabled | BOOLEAN | Whether the workflow is active |
| trigger_config | JSONB | Trigger type and configuration |
| conditions | JSONB | Array of condition objects |
| actions | JSONB | Array of action configurations |
| metadata | JSONB | Extensible metadata |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update (auto-trigger) |

### workflow_runs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workflow_id | UUID | FK to workflows (CASCADE delete) |
| status | VARCHAR(20) | running, completed, failed |
| trigger_data | JSONB | What triggered the run |
| action_results | JSONB | Array of action execution results |
| started_at | TIMESTAMPTZ | When execution started |
| completed_at | TIMESTAMPTZ | When execution finished |
| error | TEXT | Error message if failed |

## Server Architecture

### Service Layer

- **workflow.service.ts** — CRUD operations for workflows and runs. Database queries, row mapping.
- **executor.service.ts** — Workflow execution engine. Evaluates conditions, runs actions in sequence, records results.
- **scheduler.service.ts** — Manages cron jobs for schedule-triggered workflows. Initializes on server start, refreshes when workflows change.
- **action.service.ts** — Executes individual actions (HTTP, email, webhook, transform, delay). Handles template interpolation.

### Route Layer

- **workflows.ts** — CRUD endpoints + manual trigger
- **runs.ts** — Run listing and detail endpoints
- **hooks.ts** — Webhook receiver that matches incoming requests to workflows
- **interop.ts** — Export/import in skeleton interop format (DO NOT MODIFY)

### Template Interpolation

Action configurations support `{{variable}}` placeholders that are replaced with trigger data at execution time:

```
"subject": "New task: {{title}}"
```

Nested paths are supported: `{{payload.user.name}}`

## Client Architecture

### State Management

- **useWorkflows hook** — Manages the workflow list, CRUD operations, and toggle/trigger actions
- **useWorkflowDetail hook** — Fetches a single workflow with its recent runs

### Component Structure

```
App
├── Header (export/import, create button)
├── WorkflowList (workflow cards with actions)
├── WorkflowEditor (step-by-step form)
│   ├── Step 1: TriggerConfig
│   ├── Step 2: Conditions
│   ├── Step 3: ActionConfig
│   └── Step 4: Review
└── RunHistory (execution log with expandable details)
```

### Design System

Matches the skeleton-tasks design system:
- Font: DM Sans (body), JetBrains Mono (code)
- Colors: brand (blue), surface (slate)
- Shadows: card, card-hover
- Layout: max-w-4xl centered content

## Extensibility

### Adding a New Action Type

1. Add the type to `shared/types/workflow.ts`
2. Add a label/color to `shared/constants.ts`
3. Implement the executor in `server/src/services/action.service.ts`
4. Add a form component in `client/src/components/ActionConfig.tsx`

### Adding a New Trigger Type

1. Add the type to `shared/types/workflow.ts`
2. Add a label/color to `shared/constants.ts`
3. Handle it in the server startup or route layer
4. Add a form component in `client/src/components/TriggerConfig.tsx`

## Security Considerations

- The `transform` action uses `new Function()` which can execute arbitrary code. In production, consider sandboxing this with a VM2 or isolated-vm.
- Webhook endpoints are unauthenticated by default. Add webhook secrets/signatures for production use.
- CORS is set to `*` in development. Restrict to specific origins in production.
- The auth middleware is a placeholder — implement JWT or session auth before deploying.
