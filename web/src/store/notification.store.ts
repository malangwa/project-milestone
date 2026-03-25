import { create } from 'zustand';

interface Notification { id: string; title: string; message: string; isRead: boolean; createdAt: string; }

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.isRead).length }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));
