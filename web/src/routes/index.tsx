/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

const AppLayout = lazy(() => import('../components/layout/AppLayout/AppLayout'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const ProjectList = lazy(() => import('../pages/projects/ProjectList'));
const ProjectDetail = lazy(() => import('../pages/projects/ProjectDetail'));
const MilestoneList = lazy(() => import('../pages/milestones/MilestoneList'));
const TaskList = lazy(() => import('../pages/tasks/TaskList'));
const ExpenseList = lazy(() => import('../pages/expenses/ExpenseList'));
const IssueList = lazy(() => import('../pages/issues/IssueList'));
const Reports = lazy(() => import('../pages/reports/Reports'));
const StorePage = lazy(() => import('../pages/store/StorePage'));
const Calendar = lazy(() => import('../pages/calendar/Calendar'));
const Settings = lazy(() => import('../pages/settings/Settings'));
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'));
const SearchPage = lazy(() => import('../pages/search/SearchPage'));
const UsersManagement = lazy(() => import('../pages/users/UsersManagement'));
const TimeTracking = lazy(() => import('../pages/time-tracking/TimeTracking'));
const ResourcesPage = lazy(() => import('../pages/resources/ResourcesPage'));
const AuditLogs = lazy(() => import('../pages/audit/AuditLogs'));
const AgentHubPage = lazy(() => import('../pages/agent-hub/AgentHubPage'));
const SubscriptionPage = lazy(() => import('../pages/subscription/SubscriptionPage'));

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading...</div>}>{element}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(<Login />) },
  { path: '/register', element: withSuspense(<Register />) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: withSuspense(<AppLayout />),
        children: [
          { path: '/', element: withSuspense(<Dashboard />) },
          { path: '/projects', element: withSuspense(<ProjectList />) },
          { path: '/projects/:id', element: withSuspense(<ProjectDetail />) },
          { path: '/milestones', element: withSuspense(<MilestoneList />) },
          { path: '/tasks', element: withSuspense(<TaskList />) },
          { path: '/expenses', element: withSuspense(<ExpenseList />) },
          { path: '/issues', element: withSuspense(<IssueList />) },
          { path: '/reports', element: withSuspense(<Reports />) },
          { path: '/store', element: withSuspense(<StorePage />) },
          { path: '/calendar', element: withSuspense(<Calendar />) },
          { path: '/notifications', element: withSuspense(<NotificationsPage />) },
          { path: '/search', element: withSuspense(<SearchPage />) },
          { path: '/settings', element: withSuspense(<Settings />) },
          {
            element: <RoleRoute allowedRoles={['admin', 'manager']} />,
            children: [{ path: '/users', element: withSuspense(<UsersManagement />) }],
          },
          {
            element: <RoleRoute allowedRoles={['admin']} />,
            children: [{ path: '/audit-logs', element: withSuspense(<AuditLogs />) }],
          },
          { path: '/time-tracking', element: withSuspense(<TimeTracking />) },
          { path: '/resources', element: withSuspense(<ResourcesPage />) },
          { path: '/agent-hub', element: withSuspense(<AgentHubPage />) },
          { path: '/subscription', element: withSuspense(<SubscriptionPage />) },
        ],
      },
    ],
  },
]);
