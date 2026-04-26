import React, { useEffect, useState } from 'react';
import { BarChart3, CheckSquare, DollarSign, Package, AlertTriangle, ShoppingCart, TrendingUp } from 'lucide-react';
import { projectsApi } from '../../api/projects.api';
import { tasksApi } from '../../api/tasks.api';
import { expensesApi } from '../../api/expenses.api';
import { materialRequestsApi } from '../../api/material-requests.api';
import { issuesApi } from '../../api/issues.api';
import { purchaseOrdersApi } from '../../api/procurement.api';
import { commentsApi } from '../../api/comments.api';

const Reports = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    projectsApi.getAll().then((res) => {
      const list = res.data?.data || res.data || [];
      setProjects(list);
      if (list.length > 0) setSelectedProject(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setLoading(true);
    Promise.all([
      tasksApi.getByProject(selectedProject),
      expensesApi.getByProject(selectedProject),
      materialRequestsApi.getByProject(selectedProject),
      issuesApi.getByProject(selectedProject),
      purchaseOrdersApi.getByProject(selectedProject),
      commentsApi.getByEntity('project', selectedProject),
    ]).then(([tasksRes, expensesRes, materialsRes, issuesRes, ordersRes, commentsRes]) => {
      const tasks = tasksRes.data?.data || tasksRes.data || [];
      const expenses = expensesRes.data?.data || expensesRes.data || [];
      const materials = materialsRes.data?.data || materialsRes.data || [];
      const issues = issuesRes.data?.data || issuesRes.data || [];
      const purchaseOrders = ordersRes.data?.data || ordersRes.data || [];
      const comments = commentsRes.data?.data || commentsRes.data || [];
      const approvedMaterials = materials.filter((m: any) => m.status === 'approved').reduce((s: number, m: any) => s + Number(m.requestedAmount || 0), 0);
      const pendingOrders = purchaseOrders.filter((order: any) => order.status === 'pending_approval');
      const approvedOrders = purchaseOrders.filter((order: any) => ['approved', 'sent', 'partially_received', 'received', 'closed'].includes(order.status));
      setReport({
        tasks: {
          total: tasks.length,
          done: tasks.filter((t: any) => t.status === 'done').length,
          inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
          blocked: tasks.filter((t: any) => t.status === 'blocked').length,
        },
        expenses: {
          total: expenses.length,
          totalAmount: expenses.reduce((s: number, e: any) => s + Number(e.amount), 0),
          approved: expenses.filter((e: any) => e.status === 'approved').reduce((s: number, e: any) => s + Number(e.amount), 0),
          pending: expenses.filter((e: any) => e.status === 'pending').reduce((s: number, e: any) => s + Number(e.amount), 0),
        },
        materials: {
          total: materials.length,
          approved: approvedMaterials,
          pending: materials.filter((m: any) => m.status === 'pending').reduce((s: number, m: any) => s + Number(m.requestedAmount || 0), 0),
        },
        procurement: {
          total: purchaseOrders.length,
          pendingCount: pendingOrders.length,
          pendingValue: pendingOrders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0),
          committedValue: approvedOrders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0),
          openCount: purchaseOrders.filter((order: any) => !['cancelled', 'closed', 'received'].includes(order.status)).length,
        },
        issues: {
          total: issues.length,
          open: issues.filter((i: any) => i.status === 'open').length,
          resolved: issues.filter((i: any) => i.status === 'resolved').length,
          critical: issues.filter((i: any) => i.priority === 'critical').length,
        },
        progress: {
          total: comments.length,
          recent: comments.slice(-5).reverse(),
        },
        project: projects.find((p) => p.id === selectedProject),
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedProject, projects]);

  const taskCompletion = report ? Math.round((report.tasks.done / (report.tasks.total || 1)) * 100) : 0;
  const approvedMaterials = report?.materials?.approved || 0;
  const approvedExpenses = report?.expenses?.approved || 0;
  const projectBudget = Number(report?.project?.budget || 0);
  const committedBudget = approvedExpenses + approvedMaterials;
  const budgetUsedPercent = projectBudget > 0 ? Math.round((committedBudget / projectBudget) * 100) : 0;
  const remainingBudget = Math.max(0, projectBudget - committedBudget);
  const overBudget = Math.max(0, committedBudget - projectBudget);

  const panel = (icon: React.ReactNode, title: string, rows: { label: string; value: string | number; color: string }[], footer?: React.ReactNode) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">{icon}</div>
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="space-y-2">
        {rows.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">{label}</span>
            <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
          </div>
        ))}
      </div>
      {footer}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Project performance overview</p>
        </div>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : !report ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><BarChart3 size={24} className="text-slate-400" /></div>
          <p className="text-slate-400 font-medium">Select a project to view its report</p>
        </div>
      ) : (
        <>
          {report.project && (
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 mb-6 text-white shadow-xl shadow-indigo-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wide mb-1">Project Report</p>
                  <h2 className="text-xl font-bold">{report.project.name}</h2>
                  <p className="text-indigo-200 text-sm capitalize mt-1">{report.project.industry} · {report.project.status.replace('_', ' ')}</p>
                </div>
                {report.project.budget > 0 && (
                  <div className="text-right shrink-0">
                    <p className="text-indigo-200 text-xs">Budget</p>
                    <p className="text-2xl font-bold">${Number(report.project.budget).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-indigo-200">Task Completion</span>
                  <span className="text-sm font-bold">{taskCompletion}%</span>
                </div>
                <div className="w-full h-2 bg-indigo-500/40 rounded-full overflow-hidden">
                  <div className="h-2 bg-white rounded-full transition-all" style={{ width: `${taskCompletion}%` }} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {panel(<TrendingUp size={15} />, 'Progress Updates', [
              { label: 'Total Updates', value: report.progress.total, color: 'text-slate-900' },
              { label: 'Given Cash', value: `$${Number(report.project?.givenCash || 0).toLocaleString()}`, color: 'text-emerald-600' },
              { label: 'Remaining Cash', value: `$${Math.max(0, Number(report.project?.budget || 0) - Number(report.project?.givenCash || 0)).toLocaleString()}`, color: 'text-blue-600' },
            ],
              report.progress.recent.length > 0 ? (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {report.progress.recent.map((item: any) => (
                    <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700">{item.author?.name ?? 'Unknown'}</span>
                        <span className="text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.content || 'No details.'}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">No updates yet.</p>
            )}
            {panel(<CheckSquare size={15} />, 'Tasks', [
              { label: 'Total', value: report.tasks.total, color: 'text-slate-900' },
              { label: 'Completed', value: report.tasks.done, color: 'text-emerald-600' },
              { label: 'In Progress', value: report.tasks.inProgress, color: 'text-blue-600' },
              { label: 'Blocked', value: report.tasks.blocked, color: 'text-red-600' },
            ])}
            {panel(<DollarSign size={15} />, 'Expenses', [
              { label: 'Total Submitted', value: `$${report.expenses.totalAmount.toLocaleString()}`, color: 'text-slate-900' },
              { label: 'Approved', value: `$${report.expenses.approved.toLocaleString()}`, color: 'text-emerald-600' },
              { label: 'Pending', value: `$${report.expenses.pending.toLocaleString()}`, color: 'text-amber-600' },
              { label: 'Count', value: report.expenses.total, color: 'text-slate-700' },
            ],
              report.project?.budget > 0 ? (
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">Budget Used</span>
                    <span className="text-xs font-bold text-slate-700">{budgetUsedPercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${budgetUsedPercent > 100 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`} style={{ width: `${Math.min(100, budgetUsedPercent)}%` }} />
                  </div>
                </div>
              ) : undefined
            )}
            {panel(<Package size={15} />, 'Materials', [
              { label: 'Total Requests', value: report.materials.total, color: 'text-slate-900' },
              { label: 'Approved', value: `$${report.materials.approved.toLocaleString()}`, color: 'text-indigo-600' },
              { label: 'Pending', value: `$${report.materials.pending.toLocaleString()}`, color: 'text-amber-600' },
              { label: 'Remaining Budget', value: `$${remainingBudget.toLocaleString()}`, color: overBudget > 0 ? 'text-red-600' : 'text-emerald-600' },
            ])}
            {panel(<AlertTriangle size={15} />, 'Issues', [
              { label: 'Total', value: report.issues.total, color: 'text-slate-900' },
              { label: 'Open', value: report.issues.open, color: 'text-red-600' },
              { label: 'Resolved', value: report.issues.resolved, color: 'text-emerald-600' },
              { label: 'Critical', value: report.issues.critical, color: 'text-red-700' },
            ])}
            {panel(<ShoppingCart size={15} />, 'Procurement', [
              { label: 'Purchase Orders', value: report.procurement.total, color: 'text-slate-900' },
              { label: 'Pending Approval', value: report.procurement.pendingCount, color: 'text-amber-600' },
              { label: 'Pending Value', value: `$${report.procurement.pendingValue.toLocaleString()}`, color: 'text-amber-700' },
              { label: 'Committed Value', value: `$${report.procurement.committedValue.toLocaleString()}`, color: 'text-indigo-600' },
              { label: 'Open Orders', value: report.procurement.openCount, color: 'text-blue-600' },
            ])}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
