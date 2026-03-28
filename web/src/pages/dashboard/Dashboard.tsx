import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsApi } from '../../api/projects.api';
import { expensesApi } from '../../api/expenses.api';
import { materialRequestsApi } from '../../api/material-requests.api';
import { purchaseOrdersApi } from '../../api/procurement.api';
import { useAuthStore } from '../../store/auth.store';
import type { Expense, MaterialRequest, Project } from '../../types/project.types';
import type { PurchaseOrder } from '../../types/procurement.types';
import api from '../../api/axios';

type OverviewSummary = {
  tasks?: Array<{ status: string; count: string }>;
  issues?: Array<{ status: string; count: string }>;
  approvedExpenses?: number;
};

const statusColor: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const canCreate = !!user;
  const canApprove = user?.role === 'admin' || user?.role === 'manager';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<OverviewSummary | null>(null);
  const [approvalSummary, setApprovalSummary] = useState<{
    pendingExpenses: number;
    pendingExpenseValue: number;
    pendingMaterials: number;
    pendingMaterialValue: number;
    pendingOrders: number;
    pendingOrderValue: number;
  } | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', description: '', location: '', industry: 'construction', status: 'planning', budget: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    projectsApi.getAll()
      .then((res) => setProjects(res.data?.data || res.data || []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
    api.get('/reports/overview')
      .then((res) => setSummary(res.data?.data || res.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!canApprove || projects.length === 0) {
      setApprovalSummary(null);
      return;
    }

    setApprovalLoading(true);
    Promise.allSettled(
      projects.map(async (project) => {
        const [expensesRes, materialsRes, ordersRes] = await Promise.all([
          expensesApi.getByProject(project.id),
          materialRequestsApi.getByProject(project.id),
          purchaseOrdersApi.getByProject(project.id),
        ]);

        const expenses = (expensesRes.data?.data || expensesRes.data || []) as Expense[];
        const materials = (materialsRes.data?.data || materialsRes.data || []) as MaterialRequest[];
        const orders = (ordersRes.data?.data || ordersRes.data || []) as PurchaseOrder[];

        return {
          expenses,
          materials,
          orders,
        };
      }),
    )
      .then((results) => {
        const aggregates = results
          .filter((result): result is PromiseFulfilledResult<{ expenses: Expense[]; materials: MaterialRequest[]; orders: PurchaseOrder[] }> => result.status === 'fulfilled')
          .map((result) => result.value);

        const pendingExpenses = aggregates.flatMap((item) => item.expenses).filter((expense) => expense.status === 'pending');
        const pendingMaterials = aggregates.flatMap((item) => item.materials).filter((request) => request.status === 'pending');
        const pendingOrders = aggregates.flatMap((item) => item.orders).filter((order) => order.status === 'pending_approval');

        setApprovalSummary({
          pendingExpenses: pendingExpenses.length,
          pendingExpenseValue: pendingExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
          pendingMaterials: pendingMaterials.length,
          pendingMaterialValue: pendingMaterials.reduce((sum, request) => sum + Number(request.requestedAmount || 0), 0),
          pendingOrders: pendingOrders.length,
          pendingOrderValue: pendingOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
        });
      })
      .catch(() => undefined)
      .finally(() => setApprovalLoading(false));
  }, [canApprove, projects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await projectsApi.create({
        ...newForm,
        budget: newForm.budget ? Number(newForm.budget) : undefined,
        location: newForm.location || undefined,
      });
      const created = res.data?.data || res.data;
      setProjects((prev) => [created, ...prev]);
      setShowNewProject(false);
      setNewForm({ name: '', description: '', location: '', industry: 'construction', status: 'planning', budget: '' });
      navigate(`/projects/${created.id}`);
    } catch {
      return undefined;
    } finally { setCreating(false); }
  };

  const totalTasks = summary?.tasks?.reduce((sum, task) => sum + parseInt(task.count, 10), 0) ?? 0;
  const doneTasks = summary?.tasks?.find((task) => task.status === 'done')?.count ?? 0;
  const openIssues = summary?.issues?.find((issue) => issue.status === 'open')?.count ?? 0;
  const approvedExpenses = summary?.approvedExpenses ?? 0;

  const stats = [
    { label: 'Total Projects', value: projects.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'Active', value: projects.filter((p) => p.status === 'active').length, color: 'bg-green-50 text-green-700' },
    { label: 'Tasks Done', value: `${doneTasks}/${totalTasks}`, color: 'bg-purple-50 text-purple-700' },
    { label: 'Open Issues', value: openIssues, color: 'bg-red-50 text-red-700' },
    { label: 'Approved Spend', value: `$${Number(approvedExpenses).toLocaleString()}`, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'On Hold', value: projects.filter((p) => p.status === 'on_hold').length, color: 'bg-yellow-50 text-yellow-700' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h1>
          <p className="text-gray-500 mt-1">Here's an overview of your projects</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowNewProject(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {canApprove && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
              <p className="text-sm text-gray-500 mt-1">Monitor requests that still need manager or admin action.</p>
            </div>
            <Link to="/reports" className="text-sm text-blue-600 hover:underline">Open reports</Link>
          </div>

          {approvalLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : approvalSummary ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <p className="text-sm font-medium text-amber-800">Expenses</p>
                <p className="text-2xl font-bold text-amber-900 mt-2">{approvalSummary.pendingExpenses}</p>
                <p className="text-xs text-amber-700 mt-1">${approvalSummary.pendingExpenseValue.toLocaleString()} waiting</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-medium text-blue-800">Material Requests</p>
                <p className="text-2xl font-bold text-blue-900 mt-2">{approvalSummary.pendingMaterials}</p>
                <p className="text-xs text-blue-700 mt-1">${approvalSummary.pendingMaterialValue.toLocaleString()} requested</p>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="text-sm font-medium text-indigo-800">Purchase Orders</p>
                <p className="text-2xl font-bold text-indigo-900 mt-2">{approvalSummary.pendingOrders}</p>
                <p className="text-xs text-indigo-700 mt-1">${approvalSummary.pendingOrderValue.toLocaleString()} pending approval</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No pending approvals right now.</div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
          <Link to="/projects" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No projects yet.</p>
            <Link to="/projects" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Create your first project</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{p.industry}</p>
                  {p.location && <p className="text-xs text-gray-400 mt-0.5">{p.location}</p>}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor[p.status] || 'bg-gray-100 text-gray-600'}`}>
                  {p.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      {showNewProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">New Project</h2>
              <button onClick={() => setShowNewProject(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Office Renovation" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={newForm.location}
                  onChange={(e) => setNewForm({ ...newForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Lagos, Site A" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select value={newForm.industry}
                    onChange={(e) => setNewForm({ ...newForm, industry: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['construction','telecom','software','other'].map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={newForm.status}
                    onChange={(e) => setNewForm({ ...newForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['planning','active','on_hold'].map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                <input type="number" min="0" value={newForm.budget}
                  onChange={(e) => setNewForm({ ...newForm, budget: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewProject(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
