import React from "react";
import type { Notification } from "@shared/types/notification";
import { Bell, X } from "lucide-react";

interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
}

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-lg border border-surface-200 p-3 max-w-sm flex items-start gap-2.5">
        <Bell size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-surface-800">{notification.title}</p>
          {notification.body && (
            <p className="text-[10px] text-surface-500 mt-0.5 line-clamp-2">{notification.body}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-surface-400 hover:text-surface-600 flex-shrink-0"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
