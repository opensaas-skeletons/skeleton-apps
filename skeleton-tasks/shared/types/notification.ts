export interface Notification {
  id: string;
  recipient: string;
  event_type: string;
  title: string;
  body: string;
  entity_type: string;
  entity_id: string;
  channel: string;
  status: string;
  webhook_url?: string;
  webhook_response?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  read_at?: string;
  sent_at?: string;
}

export interface NotificationPreference {
  id: string;
  recipient: string;
  event_type: string;
  channel: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface CreateNotificationInput {
  recipient: string;
  event_type: string;
  title: string;
  body: string;
  entity_type: string;
  entity_id: string;
  channels?: string[];
  webhook_url?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationListOptions {
  unread_only?: boolean;
  limit?: number;
  offset?: number;
}
