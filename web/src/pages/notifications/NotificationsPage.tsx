import { useEffect, useState } from 'react';
import api from '../../api/axios';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
};

const typeColor: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    api.get('/notifications')
      .then((res) => setNotifications(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔔</p>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`bg-white border rounded-xl px-5 py-4 flex items-start gap-4 transition-colors cursor-pointer ${
                n.isRead ? 'border-gray-100 opacity-60' : 'border-blue-200 hover:border-blue-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-auto shrink-0 capitalize ${typeColor[n.type] ?? typeColor.info}`}>
                    {n.type}
                  </span>
                </div>
                {n.message && <p className="text-sm text-gray-500 mt-1">{n.message}</p>}
                <p className="text-xs text-gray-400 mt-1.5">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
