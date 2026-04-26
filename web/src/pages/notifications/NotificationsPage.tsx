import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { BellOff, CheckCheck } from 'lucide-react';

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
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
};
const typeDot: Record<string, string> = {
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
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
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors">
            <CheckCheck size={14} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><BellOff size={22} className="text-slate-400" /></div>
          <p className="text-slate-400 font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
              className={`bg-white border rounded-2xl px-5 py-4 flex items-start gap-4 transition-all cursor-pointer ${
                n.isRead ? 'border-slate-100 opacity-60' : 'border-indigo-200 hover:border-indigo-300 hover:shadow-sm'
              }`}>
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.isRead ? 'bg-slate-200' : (typeDot[n.type] || 'bg-indigo-500')}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${n.isRead ? 'text-slate-500' : 'text-slate-900'}`}>{n.title}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-auto shrink-0 capitalize ${typeColor[n.type] ?? typeColor.info}`}>{n.type}</span>
                </div>
                {n.message && <p className="text-sm text-slate-500 mt-1">{n.message}</p>}
                <p className="text-xs text-slate-400 mt-1.5">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
