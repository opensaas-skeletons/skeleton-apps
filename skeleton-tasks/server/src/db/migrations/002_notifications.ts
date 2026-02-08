/**
 * Database Migration — v2.0 (Notifications)
 * ==========================================
 * Creates the notifications and notification_preferences tables.
 *
 * Run with: npm run migrate
 */

export const up = `
  -- Notifications table
  CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT DEFAULT '',
    entity_type VARCHAR(50),
    entity_id UUID,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('in_app', 'email', 'webhook')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'read', 'failed')),
    webhook_url TEXT,
    webhook_response JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient);
  CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_event_type ON notifications(event_type);
  CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_notifications_recipient_status_pending
    ON notifications(recipient, status) WHERE status = 'pending' OR status = 'sent';

  -- Notification preferences table
  CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL DEFAULT '*',
    channel VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB DEFAULT '{}',
    UNIQUE (recipient, event_type, channel)
  );
`;
