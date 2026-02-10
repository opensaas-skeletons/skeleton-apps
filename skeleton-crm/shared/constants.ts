export const APP_NAME = "skeleton-crm";
export const INTEROP_VERSION = "1.0";

export const ACTIVITY_TYPES = ["call", "email", "meeting", "note", "task"] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

export const DEAL_STATUSES = ["open", "won", "lost"] as const;
export type DealStatus = typeof DEAL_STATUSES[number];

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

export const CONTACT_SOURCES = ["manual", "import", "referral", "website", "linkedin", "other"] as const;

export const DEFAULT_PIPELINE_STAGES = [
  { title: "Lead", probability: 10, is_terminal: false, terminal_state: null, color: "#94a3b8" },
  { title: "Qualified", probability: 25, is_terminal: false, terminal_state: null, color: "#3b82f6" },
  { title: "Proposal", probability: 50, is_terminal: false, terminal_state: null, color: "#8b5cf6" },
  { title: "Negotiation", probability: 75, is_terminal: false, terminal_state: null, color: "#f59e0b" },
  { title: "Closed Won", probability: 100, is_terminal: true, terminal_state: "won", color: "#22c55e" },
  { title: "Closed Lost", probability: 0, is_terminal: true, terminal_state: "lost", color: "#ef4444" },
] as const;

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;
