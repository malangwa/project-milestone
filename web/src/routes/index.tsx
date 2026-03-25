import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout/AppLayout';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';
import ProjectList from '../pages/projects/ProjectList';
import ProjectDetail from '../pages/projects/ProjectDetail';
import MilestoneList from '../pages/milestones/MilestoneList';
import TaskList from '../pages/tasks/TaskList';
import ExpenseList from '../pages/expenses/ExpenseList';
import IssueList from '../pages/issues/IssueList';
import Reports from '../pages/reports/Reports';
import Calendar from '../pages/calendar/Calendar';
import Settings from '../pages/settings/Settings';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import SearchPage from '../pages/search/SearchPage';
import UsersManagement from '../pages/users/UsersManagement';
import TimeTracking from '../pages/time-tracking/TimeTracking';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
      { path: '/', element: <Dashboard /> },
      { path: '/projects', element: <ProjectList /> },
      { path: '/projects/:id', element: <ProjectDetail /> },
      { path: '/milestones', element: <MilestoneList /> },
      { path: '/tasks', element: <TaskList /> },
      { path: '/expenses', element: <ExpenseList /> },
      { path: '/issues', element: <IssueList /> },
      { path: '/reports', element: <Reports /> },
      { path: '/calendar', element: <Calendar /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/settings', element: <Settings /> },
      { path: '/users', element: <UsersManagement /> },
      { path: '/time-tracking', element: <TimeTracking /> },
        ],
      },
    ],
  },
]);
