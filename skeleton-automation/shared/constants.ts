export const SKELETON_VERSION = "1.0.0";
export const INTEROP_VERSION = "1.0";
export const APP_NAME = "skeleton-automation";

export const TRIGGER_TYPES = ["webhook", "schedule", "event"] as const;

export const ACTION_TYPES = ["http", "email", "webhook", "transform", "delay"] as const;

export const CONDITION_OPERATORS = [
  "equals",
  "not_equals",
  "contains",
  "gt",
  "lt",
  "exists",
] as const;

export const RUN_STATUSES = ["running", "completed", "failed"] as const;

export const TRIGGER_LABELS: Record<string, string> = {
  webhook: "Webhook",
  schedule: "Schedule",
  event: "Event",
};

export const ACTION_LABELS: Record<string, string> = {
  http: "HTTP Request",
  email: "Send Email",
  webhook: "Webhook",
  transform: "Transform Data",
  delay: "Delay",
};

export const TRIGGER_COLORS: Record<string, string> = {
  webhook: "#8B5CF6",
  schedule: "#F59E0B",
  event: "#10B981",
};

export const ACTION_COLORS: Record<string, string> = {
  http: "#3B82F6",
  email: "#EF4444",
  webhook: "#8B5CF6",
  transform: "#F59E0B",
  delay: "#6B7280",
};

export const STATUS_COLORS: Record<string, string> = {
  running: "#F59E0B",
  completed: "#10B981",
  failed: "#EF4444",
};
