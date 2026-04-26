export type UserRole = 'admin' | 'manager' | 'engineer' | 'viewer' | 'client' | 'subcontractor';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectIndustry = 'construction' | 'telecom' | 'software' | 'other';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';
export type ExpenseCategory = 'labor' | 'material' | 'equipment' | 'travel' | 'other';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssuesPriority = 'low' | 'medium' | 'high' | 'critical';
export type ResourceType = 'human' | 'equipment' | 'material' | 'software' | 'other';
export type UnitStatus = 'pending' | 'in_progress' | 'completed' | 'defective';
export type CommentEntityType = 'task' | 'milestone' | 'issue' | 'activity' | 'expense' | 'project';
export type NotificationType = 'task_assigned' | 'milestone_due' | 'expense_approved' | 'issue_raised' | 'comment_added' | 'info';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  industry: ProjectIndustry;
  startDate?: string;
  endDate?: string;
  budget?: number;
  location?: string;
  ownerId: string;
  owner?: User;
  members?: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user?: User;
  role: UserRole;
  joinedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: MilestoneStatus;
  dueDate?: string;
  progress: number;
  createdBy: string;
  creator?: User;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId?: string;
  assignedTo?: User;
  createdBy: string;
  creator?: User;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  materials?: TaskMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskMaterial {
  name: string;
  unit: string;
  quantity: number;
  source: 'manual' | 'store';
  stockItemId?: string;
  stockItemName?: string;
}

export interface Expense {
  id: string;
  projectId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  status: ExpenseStatus;
  submittedBy: string;
  submitter?: User;
  approvedBy?: string;
  approver?: User;
  receiptUrl?: string;
  notes?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  projectId: string;
  name: string;
  type: ResourceType;
  quantity?: number;
  unit?: string;
  costPerUnit?: number;
  role?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  projectId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  userId?: string;
  user?: User;
  createdAt: string;
}

export interface Unit {
  id: string;
  projectId: string;
  name: string;
  type: string;
  status: UnitStatus;
  progress: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  priority: IssuesPriority;
  status: IssueStatus;
  assignedToId?: string;
  assignedTo?: User;
  reportedBy: string;
  reporter?: User;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  entityType: CommentEntityType;
  entityId: string;
  content: string;
  authorId: string;
  author?: User;
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploader?: User;
  uploadedAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  task?: Task;
  userId: string;
  user?: User;
  hours: number;
  description?: string;
  date: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  type: NotificationType;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject';
  entityType: string;
  entityId: string;
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  ipAddress?: string;
  createdAt: string;
}

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

export interface SearchResult {
  type: 'project' | 'task' | 'issue' | 'milestone';
  id: string;
  title: string;
  subtitle?: string;
  projectId?: string;
  projectName?: string;
}

export interface ReportSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  tasksByStatus: Array<{ status: string; count: number }>;
  issuesByStatus: Array<{ status: string; count: number }>;
  totalExpensesApproved: number;
  recentActivities: Activity[];
}

export interface BudgetReport {
  projectId: string;
  projectName: string;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  expensesByCategory: Array<{ category: string; amount: number }>;
}

export interface ProgressReport {
  projectId: string;
  projectName: string;
  milestonesCompleted: number;
  totalMilestones: number;
  tasksCompleted: number;
  totalTasks: number;
  overallProgress: number;
  milestoneProgress: Array<{ id: string; name: string; progress: number }>;
}