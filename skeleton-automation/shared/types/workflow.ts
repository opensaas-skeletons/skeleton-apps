// ---- Trigger Types ----

export type TriggerType = "webhook" | "schedule" | "event";

export interface WebhookTriggerConfig {
  type: "webhook";
  config: {
    path: string;
  };
}

export interface ScheduleTriggerConfig {
  type: "schedule";
  config: {
    cron: string;
    timezone?: string;
  };
}

export interface EventTriggerConfig {
  type: "event";
  config: {
    source: string;
    event: string;
    filter?: Record<string, unknown>;
  };
}

export type TriggerConfig =
  | WebhookTriggerConfig
  | ScheduleTriggerConfig
  | EventTriggerConfig;

// ---- Action Types ----

export type ActionType = "http" | "email" | "webhook" | "transform" | "delay";

export interface HttpActionConfig {
  type: "http";
  config: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
}

export interface EmailActionConfig {
  type: "email";
  config: {
    to: string;
    subject: string;
    body: string;
  };
}

export interface WebhookActionConfig {
  type: "webhook";
  config: {
    url: string;
    payload?: unknown;
  };
}

export interface TransformActionConfig {
  type: "transform";
  config: {
    expression: string;
  };
}

export interface DelayActionConfig {
  type: "delay";
  config: {
    seconds: number;
  };
}

export type ActionConfig =
  | HttpActionConfig
  | EmailActionConfig
  | WebhookActionConfig
  | TransformActionConfig
  | DelayActionConfig;

// ---- Condition ----

export interface Condition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "gt" | "lt" | "exists";
  value: unknown;
}

// ---- Run Status ----

export type RunStatus = "running" | "completed" | "failed";

// ---- Core Entities ----

export interface Workflow {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  trigger: TriggerConfig;
  conditions: Condition[];
  actions: ActionConfig[];
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: RunStatus;
  trigger_data: Record<string, unknown>;
  action_results: ActionResult[];
  started_at: string;
  completed_at: string | null;
  error: string | null;
}

export interface ActionResult {
  action_index: number;
  action_type: ActionType;
  status: "success" | "failed" | "skipped";
  output?: unknown;
  error?: string;
  duration_ms: number;
}

// ---- Input Types ----

export interface CreateWorkflowInput {
  title: string;
  description?: string;
  enabled?: boolean;
  trigger: TriggerConfig;
  conditions?: Condition[];
  actions: ActionConfig[];
  metadata?: Record<string, unknown>;
}

export interface UpdateWorkflowInput {
  title?: string;
  description?: string;
  enabled?: boolean;
  trigger?: TriggerConfig;
  conditions?: Condition[];
  actions?: ActionConfig[];
  metadata?: Record<string, unknown>;
}

// ---- API Response ----

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
}

// ---- Interop Format ----

export interface AutomationExportPayload {
  version: "1.0";
  exported_at: string;
  source: string;
  workflows: WorkflowExport[];
}

export interface WorkflowExport {
  title: string;
  description: string;
  enabled: boolean;
  trigger: TriggerConfig;
  conditions: Condition[];
  actions: ActionConfig[];
  metadata: Record<string, unknown>;
}
