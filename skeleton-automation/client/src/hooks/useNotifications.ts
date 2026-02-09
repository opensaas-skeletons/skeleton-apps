import { useState, useEffect, useCallback, useRef } from "react";
import type { Notification } from "@shared/types/notification";
import * as api from "../api/client";

const DEFAULT_RECIPIENT = "demo@skeleton.dev";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<Notification | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const recipient = DEFAULT_RECIPIENT;

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.listNotifications(recipient);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [recipient]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await api.getUnreadCount(recipient);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, [recipient]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "read", read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead(recipient);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "read", read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }, [recipient]);

  // SSE subscription
  useEffect(() => {
    const es = new EventSource(`/api/notifications/stream?recipient=${encodeURIComponent(recipient)}`);
    eventSourceRef.current = es;

    es.addEventListener("notification", (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        setToast(notification);
      } catch (err) {
        console.error("Failed to parse notification SSE:", err);
      }
    });

    es.onerror = () => {
      console.error("Notification SSE connection error");
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [recipient]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    toast,
    dismissToast: () => setToast(null),
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
