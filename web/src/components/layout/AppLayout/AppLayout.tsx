import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import { authApi } from '../../../api/auth.api';
import api from '../../../api/axios';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/projects', label: 'Projects', icon: '📁' },
  { to: '/milestones', label: 'Milestones', icon: '🚩' },
  { to: '/tasks', label: 'Tasks', icon: '✓' },
  { to: '/expenses', label: 'Expenses', icon: '💰' },
  { to: '/issues', label: 'Issues', icon: '⚠' },
  { to: '/reports', label: 'Reports', icon: '📊' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/search', label: 'Search', icon: '🔍' },
  { to: '/time-tracking', label: 'Time Tracking', icon: '⏱' },
  { to: '/resources', label: 'Resources', icon: '🔧' },
  { to: '/users', label: 'Users', icon: '👥', adminOnly: true },
];

const AppLayout = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get('/notifications/unread-count')
      .then((res) => setUnreadCount((res.data?.data || res.data)?.count ?? 0))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          {!collapsed && <span className="font-bold text-blue-600 text-sm">Project Milestone</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-xs ml-auto">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.filter(({ adminOnly }) => !adminOnly || user?.role === 'admin' || user?.role === 'manager').map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span className="text-base shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-1 relative ${
                isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className="text-base shrink-0 relative">
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            {!collapsed && <span>Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}</span>}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className="text-base shrink-0">⚙</span>
            {!collapsed && <span>Settings</span>}
          </NavLink>
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${collapsed ? '' : 'mb-1'}`}>
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors`}
          >
            <span className="text-base shrink-0">⇒</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
