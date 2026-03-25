export type UserRole = 'admin' | 'manager' | 'engineer' | 'viewer' | 'client' | 'subcontractor';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssuesPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
