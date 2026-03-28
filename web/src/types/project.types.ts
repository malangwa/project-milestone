export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type Industry = 'construction' | 'telecom' | 'software' | 'other';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ProjectMemberRole = 'manager' | 'engineer' | 'viewer' | 'client' | 'subcontractor';
export type MaterialRequestStatus = 'pending' | 'approved' | 'rejected';

export type Project = {
  id: string; name: string; description: string;
  location?: string | null;
  status: ProjectStatus; industry: Industry;
  startDate: string; endDate: string; budget: number;
  ownerId: string; createdAt: string; updatedAt: string;
};

export type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: string;
  user?: { id: string; name: string; email: string; role: string };
};

export type Milestone = {
  id: string; projectId: string; name: string;
  description: string; status: MilestoneStatus;
  dueDate: string; progress: number; createdAt: string;
};

export type Task = {
  id: string; projectId: string; milestoneId?: string;
  title: string; description: string;
  status: TaskStatus; priority: TaskPriority;
  assignedToId?: string;
  assignedTo?: { id: string; name: string; email: string; role: string };
  materials?: Array<{
    name: string;
    unit: string;
    quantity: number;
    source: 'manual' | 'store';
    stockItemId?: string | null;
    stockItemName?: string | null;
  }>;
  dueDate?: string;
  estimatedHours?: number; actualHours?: number;
  createdAt: string; updatedAt: string;
};

export type Expense = {
  id: string; projectId: string;
  title: string; description?: string;
  amount: number; category: string;
  status: ExpenseStatus;
  submittedById?: string;
  createdAt: string; updatedAt: string;
};

export type MaterialRequestItem = {
  id?: string;
  materialRequestId?: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  notes?: string | null;
};

export type MaterialRequest = {
  id: string;
  projectId: string;
  title: string;
  purpose?: string | null;
  requestedAmount: number;
  status: MaterialRequestStatus;
  requestedById: string;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  notes?: string | null;
  items: MaterialRequestItem[];
  requestedBy?: { id: string; name: string; email: string; role: string };
  reviewedBy?: { id: string; name: string; email: string; role: string };
  createdAt: string;
  updatedAt: string;
};

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export type Issue = {
  id: string; projectId: string;
  title: string; description?: string;
  status: IssueStatus; priority: IssuePriority;
  reportedById?: string; assignedToId?: string;
  createdAt: string; updatedAt: string;
};
