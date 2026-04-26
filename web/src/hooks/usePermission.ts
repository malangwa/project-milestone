import { useAuthStore } from '../store/auth.store';
import type { UserRole } from '../types/auth.types';

interface Permissions {
  canCreateProject: boolean;
  canCreateTask: boolean;
  canCreateExpense: boolean;
  canApproveExpense: boolean;
  canDeleteTask: boolean;
  canDeleteExpense: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canViewReports: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isAdminOrManager: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, Permissions> = {
  admin: {
    canCreateProject: true,
    canCreateTask: true,
    canCreateExpense: true,
    canApproveExpense: true,
    canDeleteTask: true,
    canDeleteExpense: true,
    canManageUsers: true,
    canViewAuditLogs: true,
    canViewReports: true,
    isAdmin: true,
    isManager: false,
    isAdminOrManager: true,
  },
  manager: {
    canCreateProject: true,
    canCreateTask: true,
    canCreateExpense: true,
    canApproveExpense: true,
    canDeleteTask: true,
    canDeleteExpense: false,
    canManageUsers: true,
    canViewAuditLogs: false,
    canViewReports: true,
    isAdmin: false,
    isManager: true,
    isAdminOrManager: true,
  },
  engineer: {
    canCreateProject: false,
    canCreateTask: true,
    canCreateExpense: true,
    canApproveExpense: false,
    canDeleteTask: false,
    canDeleteExpense: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canViewReports: false,
    isAdmin: false,
    isManager: false,
    isAdminOrManager: false,
  },
  subcontractor: {
    canCreateProject: false,
    canCreateTask: true,
    canCreateExpense: true,
    canApproveExpense: false,
    canDeleteTask: false,
    canDeleteExpense: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canViewReports: false,
    isAdmin: false,
    isManager: false,
    isAdminOrManager: false,
  },
  viewer: {
    canCreateProject: false,
    canCreateTask: false,
    canCreateExpense: false,
    canApproveExpense: false,
    canDeleteTask: false,
    canDeleteExpense: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canViewReports: true,
    isAdmin: false,
    isManager: false,
    isAdminOrManager: false,
  },
  client: {
    canCreateProject: false,
    canCreateTask: false,
    canCreateExpense: false,
    canApproveExpense: false,
    canDeleteTask: false,
    canDeleteExpense: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canViewReports: true,
    isAdmin: false,
    isManager: false,
    isAdminOrManager: false,
  },
};

export function usePermission(): Permissions {
  const { user } = useAuthStore();
  if (!user) {
    return ROLE_PERMISSIONS.viewer;
  }
  return ROLE_PERMISSIONS[user.role] ?? ROLE_PERMISSIONS.viewer;
}
