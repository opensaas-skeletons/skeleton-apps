import { query, queryOne } from "../db/connection";
import { broadcastNotification } from "../sse";
import { sendEmail } from "./email.service";
import type { Notification, NotificationPreference, CreateNotificationInput, NotificationListOptions } from "@skeleton-automation/shared";

export async function notify(input: CreateNotificationInput): Promise<Notification[]> {
  const channels = input.channels || ["in_app"];
  const results: Notification[] = [];

  for (const channel of channels) {
    const pref = await queryOne<NotificationPreference>(
      `SELECT * FROM notification_preferences
       WHERE recipient = $1 AND channel = $2 AND (event_type = $3 OR event_type = '*')
       ORDER BY CASE WHEN event_type = '*' THEN 1 ELSE 0 END
       LIMIT 1`,
      [input.recipient, channel, input.event_type]
    );

    if (pref && !pref.enabled) continue;

    const notification = await queryOne<Notification>(
      `INSERT INTO notifications (recipient, event_type, title, body, entity_type, entity_id, channel, status, webhook_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        input.recipient,
        input.event_type,
        input.title,
        input.body,
        input.entity_type,
        input.entity_id,
        channel,
        "pending",
        input.webhook_url || null,
        JSON.stringify(input.metadata || {}),
      ]
    );

    if (!notification) continue;

    if (channel === "in_app") {
      await queryOne(
        `UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1`,
        [notification.id]
      );
      notification.status = "sent";
      notification.sent_at = new Date().toISOString();
      broadcastNotification(input.recipient, notification);
    } else if (channel === "email") {
      try {
        await sendEmail(input.recipient, input.title, input.body);
        await queryOne(
          `UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1`,
          [notification.id]
        );
        notification.status = "sent";
      } catch (err: any) {
        await queryOne(
          `UPDATE notifications SET status = 'failed', metadata = metadata || $2 WHERE id = $1`,
          [notification.id, JSON.stringify({ error: err.message })]
        );
        notification.status = "failed";
        console.error(`[Notification] Email delivery failed:`, err.message);
      }
    } else if (channel === "webhook") {
      try {
        const url = input.webhook_url || (pref?.config as any)?.webhook_url;
        if (!url) throw new Error("No webhook URL configured");
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: input.event_type,
            title: input.title,
            body: input.body,
            entity_type: input.entity_type,
            entity_id: input.entity_id,
            metadata: input.metadata,
            timestamp: new Date().toISOString(),
          }),
        });
        const responseBody = await res.text();
        let parsed: unknown;
        try { parsed = JSON.parse(responseBody); } catch { parsed = responseBody; }
        await queryOne(
          `UPDATE notifications SET status = 'sent', sent_at = NOW(), webhook_response = $2 WHERE id = $1`,
          [notification.id, JSON.stringify({ status: res.status, body: parsed })]
        );
        notification.status = "sent";
      } catch (err: any) {
        await queryOne(
          `UPDATE notifications SET status = 'failed', webhook_response = $2 WHERE id = $1`,
          [notification.id, JSON.stringify({ error: err.message })]
        );
        notification.status = "failed";
        console.error(`[Notification] Webhook delivery failed:`, err.message);
      }
    }

    results.push(notification);
  }

  return results;
}

export async function listNotifications(
  recipient: string,
  opts: NotificationListOptions = {}
): Promise<Notification[]> {
  let sql = "SELECT * FROM notifications WHERE recipient = $1 AND channel = 'in_app'";
  const params: any[] = [recipient];
  let paramCount = 2;

  if (opts.unread_only) {
    sql += ` AND status != 'read'`;
  }

  sql += " ORDER BY created_at DESC";

  if (opts.limit) {
    sql += ` LIMIT $${paramCount++}`;
    params.push(opts.limit);
  }
  if (opts.offset) {
    sql += ` OFFSET $${paramCount++}`;
    params.push(opts.offset);
  }

  return query<Notification>(sql, params);
}

export async function getUnreadCount(recipient: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM notifications WHERE recipient = $1 AND channel = 'in_app' AND status != 'read'",
    [recipient]
  );
  return parseInt(result?.count || "0");
}

export async function markAsRead(id: string): Promise<Notification | null> {
  return queryOne<Notification>(
    "UPDATE notifications SET status = 'read', read_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );
}

export async function markAllAsRead(recipient: string): Promise<void> {
  await query(
    "UPDATE notifications SET status = 'read', read_at = NOW() WHERE recipient = $1 AND channel = 'in_app' AND status != 'read'",
    [recipient]
  );
}

export async function getPreferences(recipient: string): Promise<NotificationPreference[]> {
  return query<NotificationPreference>(
    "SELECT * FROM notification_preferences WHERE recipient = $1",
    [recipient]
  );
}

export async function upsertPreference(
  recipient: string,
  event_type: string,
  channel: string,
  enabled: boolean,
  config?: Record<string, unknown>
): Promise<NotificationPreference> {
  const result = await queryOne<NotificationPreference>(
    `INSERT INTO notification_preferences (recipient, event_type, channel, enabled, config)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (recipient, event_type, channel) DO UPDATE SET enabled = $4, config = $5
     RETURNING *`,
    [recipient, event_type, channel, enabled, JSON.stringify(config || {})]
  );
  return result!;
}
