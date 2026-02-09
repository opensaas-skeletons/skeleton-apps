import type { Notification } from "@shared/types/notification";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

function getIconColor(eventType: string): string {
  if (eventType.includes("completed")) return "text-green-500";
  if (eventType.includes("failed")) return "text-red-500";
  if (eventType.includes("enabled")) return "text-blue-500";
  if (eventType.includes("disabled")) return "text-amber-500";
  return "text-surface-400";
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const isUnread = notification.status !== "read";

  return (
    <div
      onClick={() => isUnread && onRead(notification.id)}
      className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-surface-100 last:border-b-0 cursor-pointer hover:bg-surface-50 transition-colors ${
        isUnread ? "bg-blue-50/50" : ""
      }`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${getIconColor(notification.event_type)}`}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-relaxed ${isUnread ? "font-medium text-surface-800" : "text-surface-600"}`}>
          {notification.title}
        </p>
        <p className="text-[10px] text-surface-400 mt-0.5">{timeAgo(notification.created_at)}</p>
      </div>
      {isUnread && (
        <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
      )}
    </div>
  );
}
