import type { Notification } from "@shared/types/notification";

interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
}

export default function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-lg border border-surface-200 p-3 max-w-sm flex items-start gap-2.5">
        <svg className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
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
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
