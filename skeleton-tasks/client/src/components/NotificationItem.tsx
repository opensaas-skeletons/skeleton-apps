import React from "react";
import type { Notification } from "@shared/types/notification";
import { CheckCircle, AlertTriangle, ArrowRight, Clock, Bell as BellIcon } from "lucide-react";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

function getIcon(eventType: string) {
  if (eventType.includes("created")) return <CheckCircle size={14} className="text-green-500" />;
  if (eventType.includes("assigned")) return <ArrowRight size={14} className="text-blue-500" />;
  if (eventType.includes("moved")) return <ArrowRight size={14} className="text-purple-500" />;
  if (eventType.includes("due_soon")) return <Clock size={14} className="text-amber-500" />;
  if (eventType.includes("urgent")) return <AlertTriangle size={14} className="text-red-500" />;
  if (eventType.includes("failed")) return <AlertTriangle size={14} className="text-red-500" />;
  return <BellIcon size={14} className="text-surface-400" />;
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

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const isUnread = notification.status !== "read";

  return (
    <div
      onClick={() => isUnread && onRead(notification.id)}
      className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-surface-100 last:border-b-0 cursor-pointer hover:bg-surface-50 transition-colors ${
        isUnread ? "bg-blue-50/50" : ""
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">{getIcon(notification.event_type)}</div>
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
