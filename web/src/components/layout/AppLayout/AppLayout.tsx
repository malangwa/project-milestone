import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import { authApi } from '../../../api/auth.api';
import api from '../../../api/axios';
import type { UserRole } from '../../../types/auth.types';
import {
  LayoutDashboard, FolderKanban, Milestone, CheckSquare, Receipt,
  AlertTriangle, BarChart3, ShoppingBag, CalendarDays, Search,
  Timer, Wrench, Bot, CreditCard, Users, FileText, Bell,
  Settings, LogOut, ChevronLeft, ChevronRight, Building2,
} from 'lucide-react';

type NavItem = { to: string; label: string; Icon: React.ElementType; roles?: UserRole[] };
const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', Icon: FolderKanban },
  { to: '/milestones', label: 'Milestones', Icon: Milestone },
  { to: '/tasks', label: 'Tasks', Icon: CheckSquare },
  { to: '/expenses', label: 'Expenses', Icon: Receipt },
  { to: '/issues', label: 'Issues', Icon: AlertTriangle },
  { to: '/reports', label: 'Reports', Icon: BarChart3 },
  { to: '/store', label: 'Store', Icon: ShoppingBag },
  { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { to: '/search', label: 'Search', Icon: Search },
  { to: '/time-tracking', label: 'Time Tracking', Icon: Timer },
  { to: '/resources', label: 'Resources', Icon: Wrench },
  { to: '/agent-hub', label: 'Agent Hub', Icon: Bot },
  { to: '/subscription', label: 'Subscription', Icon: CreditCard },
  { to: '/users', label: 'Users', Icon: Users, roles: ['admin', 'manager'] as UserRole[] },
  { to: '/audit-logs', label: 'Audit Logs', Icon: FileText, roles: ['admin'] as UserRole[] },
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
    try { await authApi.logout(); } catch { return undefined; }
    clearAuth();
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${
        collapsed ? 'w-[68px]' : 'w-64'
      } bg-slate-900 flex flex-col transition-all duration-300 ease-in-out shrink-0 shadow-xl`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Building2 size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Milestone</p>
                <p className="text-slate-400 text-[10px] leading-tight">Project Manager</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg">
              <Building2 size={16} className="text-white" />
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
          {navItems
            .filter(({ roles }) => !roles || (user?.role ? roles.includes(user.role) : false))
            .map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
        </nav>

        {/* Bottom section */}
        <div className="px-2 py-3 border-t border-slate-800 space-y-0.5">
          <NavLink
            to="/notifications"
            title={collapsed ? 'Notifications' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <div className="relative shrink-0">
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {!collapsed && <span>Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}</span>}
          </NavLink>

          <NavLink
            to="/settings"
            title={collapsed ? 'Settings' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Settings size={17} className="shrink-0" />
            {!collapsed && <span>Settings</span>}
          </NavLink>

          {/* User card */}
          <div className="mt-2 mx-1 p-2.5 bg-slate-800 rounded-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate capitalize">{user?.role}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all"
          >
            <LogOut size={17} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          {collapsed && (
            <button onClick={() => setCollapsed(false)} className="w-full flex items-center justify-center py-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
