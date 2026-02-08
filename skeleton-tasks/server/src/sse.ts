import { Response } from "express";

interface NotificationSSEClient {
  id: string;
  recipient: string;
  res: Response;
}

const notificationClients: NotificationSSEClient[] = [];

export function addNotificationClient(recipient: string, res: Response): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  notificationClients.push({ id, recipient, res });
  return id;
}

export function removeNotificationClient(id: string): void {
  const idx = notificationClients.findIndex((c) => c.id === id);
  if (idx !== -1) notificationClients.splice(idx, 1);
}

export function broadcastNotification(recipient: string, notification: unknown): void {
  const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
  for (const client of notificationClients) {
    if (client.recipient === recipient) {
      client.res.write(payload);
    }
  }
}
