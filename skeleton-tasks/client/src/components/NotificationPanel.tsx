import React from "react";
import type { Notification } from "@shared/types/notification";
import { NotificationItem } from "./NotificationItem";

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-lg shadow-lg border border-surface-200 z-50 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-surface-200">
          <h3 className="text-xs font-semibold text-surface-700">Notifications</h3>
          <button
            onClick={onMarkAllAsRead}
            className="text-[10px] text-brand-600 hover:text-brand-700 font-medium"
          >
            Mark all read
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-surface-400">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={onMarkAsRead} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
