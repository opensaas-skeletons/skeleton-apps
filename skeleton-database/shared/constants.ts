export const SKELETON_VERSION = "1.0.0";
export const INTEROP_VERSION = "1.0";
export const APP_NAME = "skeleton-database";

export const FIELD_TYPES = [
  "text",
  "long_text",
  "number",
  "checkbox",
  "select",
  "multi_select",
  "date",
  "email",
  "url",
  "phone",
  "rating",
  "formula",
  "relation",
] as const;

export const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  long_text: "Long Text",
  number: "Number",
  checkbox: "Checkbox",
  select: "Select",
  multi_select: "Multi Select",
  date: "Date",
  email: "Email",
  url: "URL",
  phone: "Phone",
  rating: "Rating",
  formula: "Formula",
  relation: "Relation",
};

export const FIELD_TYPE_COLORS: Record<string, string> = {
  text: "gray",
  long_text: "gray",
  number: "blue",
  checkbox: "green",
  select: "purple",
  multi_select: "purple",
  date: "orange",
  email: "cyan",
  url: "indigo",
  phone: "gray",
  rating: "amber",
  formula: "gray",
  relation: "blue",
};

export const SELECT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate
];

export const BASE_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
  "#f97316", // orange
  "#ef4444", // red
  "#eab308", // yellow
  "#ec4899", // pink
  "#14b8a6", // teal
];

export const DEFAULT_STATUS_OPTIONS = [
  { label: "To Do", color: "#64748b" },
  { label: "In Progress", color: "#3b82f6" },
  { label: "Done", color: "#22c55e" },
];

export const DEFAULT_VIEW_CONFIG = {
  filters: [],
  sorts: [],
  hidden_fields: [],
  field_widths: {},
};

export const ROWS_PER_PAGE = 50;
export const MAX_ROWS_PER_PAGE = 500;
