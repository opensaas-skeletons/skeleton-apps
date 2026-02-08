import React from "react";
import { Bell } from "lucide-react";

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
      title="Notifications"
    >
      <Bell size={16} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
