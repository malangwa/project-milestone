import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { UserRole } from '../types/auth.types';

type RoleRouteProps = {
  allowedRoles: UserRole[];
  redirectTo?: string;
};

export const RoleRoute = ({ allowedRoles, redirectTo = '/' }: RoleRouteProps) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
