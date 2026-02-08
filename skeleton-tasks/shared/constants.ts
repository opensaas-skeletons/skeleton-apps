/**
 * Shared constants for the task tracker skeleton.
 * These are used by both the client and server.
 */

export const DEFAULT_COLUMNS = [
  { title: "Backlog", color: "#6B7280" },
  { title: "To Do", color: "#3B82F6" },
  { title: "In Progress", color: "#F59E0B" },
  { title: "Review", color: "#8B5CF6" },
  { title: "Done", color: "#10B981" },
];

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export const PRIORITY_COLORS: Record<string, string> = {
  low: "#6B7280",
  medium: "#3B82F6",
  high: "#F59E0B",
  urgent: "#EF4444",
};

export const SKELETON_VERSION = "1.0.0";
export const INTEROP_VERSION = "1.0";
export const APP_NAME = "skeleton-tasks";
