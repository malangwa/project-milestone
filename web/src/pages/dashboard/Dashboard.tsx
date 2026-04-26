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
import {
  FolderKanban, CheckSquare, AlertTriangle, DollarSign,
  TrendingUp, PauseCircle, Plus, X, Clock, ArrowUpRight,
  PackageCheck, ShoppingCart, MapPin, Layers,
} from 'lucide-react';

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
    { label: 'Total Projects', value: projects.length, icon: FolderKanban, gradient: 'from-blue-500 to-blue-600', light: 'bg-blue-50 text-blue-600' },
    { label: 'Active Projects', value: projects.filter((p) => p.status === 'active').length, icon: TrendingUp, gradient: 'from-emerald-500 to-green-600', light: 'bg-emerald-50 text-emerald-600' },
    { label: 'Tasks Done', value: `${doneTasks}/${totalTasks}`, icon: CheckSquare, gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50 text-violet-600' },
    { label: 'Open Issues', value: openIssues, icon: AlertTriangle, gradient: 'from-red-500 to-rose-600', light: 'bg-red-50 text-red-600' },
    { label: 'Approved Spend', value: `$${Number(approvedExpenses).toLocaleString()}`, icon: DollarSign, gradient: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50 text-indigo-600' },
    { label: 'On Hold', value: projects.filter((p) => p.status === 'on_hold').length, icon: PauseCircle, gradient: 'from-amber-500 to-orange-500', light: 'bg-amber-50 text-amber-600' },
  ];

  const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-slate-400 text-sm mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">Here's what's happening across your projects</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Recent Projects */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">Recent Projects</h2>
            </div>
            <Link to="/projects" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-14">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FolderKanban size={24} className="text-slate-400" />
                </div>
                <p className="text-slate-400 text-sm font-medium">No projects yet</p>
                <button onClick={() => setShowNewProject(true)} className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-semibold">Create your first project →</button>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 6).map((p) => (
                  <Link key={p.id} to={`/projects/${p.id}`}
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-indigo-700 font-bold text-sm">{p.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400 capitalize">{p.industry}</span>
                          {p.location && <><span className="text-slate-300">·</span><span className="text-[11px] text-slate-400 flex items-center gap-0.5"><MapPin size={9}/>{p.location}</span></>}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor[p.status] || 'bg-slate-100 text-slate-600'}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Pending Approvals */}
        {canApprove && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-500" />
                <h2 className="text-base font-semibold text-slate-900">Pending Approvals</h2>
              </div>
              <Link to="/reports" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Reports <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {approvalLoading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)
              ) : approvalSummary ? (
                [{
                  icon: DollarSign, label: 'Expenses', count: approvalSummary.pendingExpenses,
                  value: approvalSummary.pendingExpenseValue, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700', sub: 'waiting for approval',
                },{
                  icon: PackageCheck, label: 'Material Requests', count: approvalSummary.pendingMaterials,
                  value: approvalSummary.pendingMaterialValue, color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', text: 'text-blue-700', sub: 'items requested',
                },{
                  icon: ShoppingCart, label: 'Purchase Orders', count: approvalSummary.pendingOrders,
                  value: approvalSummary.pendingOrderValue, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-700', sub: 'pending approval',
                }].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                            <Icon size={15} className="text-white" />
                          </div>
                          <span className={`text-xs font-semibold ${item.text}`}>{item.label}</span>
                        </div>
                        <span className={`text-2xl font-bold ${item.text}`}>{item.count}</span>
                      </div>
                      <p className={`text-xs mt-2 ${item.text} opacity-80`}>${item.value.toLocaleString()} {item.sub}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10">
                  <CheckSquare size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No pending approvals</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Plus size={16} className="text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-900">New Project</h2>
              </div>
              <button onClick={() => setShowNewProject(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name *</label>
                <input required value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className={inp} placeholder="e.g. Office Renovation" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  rows={2} className={`${inp} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                <input value={newForm.location}
                  onChange={(e) => setNewForm({ ...newForm, location: e.target.value })}
                  className={inp} placeholder="e.g. Lagos, Site A" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Industry</label>
                  <select value={newForm.industry}
                    onChange={(e) => setNewForm({ ...newForm, industry: e.target.value })}
                    className={inp}>
                    {['construction','telecom','software','other'].map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select value={newForm.status}
                    onChange={(e) => setNewForm({ ...newForm, status: e.target.value })}
                    className={inp}>
                    {['planning','active','on_hold'].map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Budget ($)</label>
                <input type="number" min="0" value={newForm.budget}
                  onChange={(e) => setNewForm({ ...newForm, budget: e.target.value })}
                  className={inp} placeholder="Optional" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewProject(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all">
                  {creating ? 'Creating…' : 'Create Project'}
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
