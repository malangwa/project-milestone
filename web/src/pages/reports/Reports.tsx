import { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects.api';
import { tasksApi } from '../../api/tasks.api';
import { expensesApi } from '../../api/expenses.api';
import { materialRequestsApi } from '../../api/material-requests.api';
import { issuesApi } from '../../api/issues.api';
import { purchaseOrdersApi } from '../../api/procurement.api';

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
    ]).then(([tasksRes, expensesRes, materialsRes, issuesRes, ordersRes]) => {
      const tasks = tasksRes.data?.data || tasksRes.data || [];
      const expenses = expensesRes.data?.data || expensesRes.data || [];
      const materials = materialsRes.data?.data || materialsRes.data || [];
      const issues = issuesRes.data?.data || issuesRes.data || [];
      const purchaseOrders = ordersRes.data?.data || ordersRes.data || [];
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Project performance overview</p>
        </div>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !report ? (
        <div className="text-center py-16 text-gray-400">Select a project to view its report.</div>
      ) : (
        <>
          {report.project && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{report.project.name}</h2>
                  <p className="text-sm text-gray-500 capitalize mt-0.5">{report.project.industry} · {report.project.status.replace('_', ' ')}</p>
                </div>
                {report.project.budget > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="text-xl font-bold text-gray-900">${Number(report.project.budget).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Task Completion</span>
                  <span className="text-sm font-semibold">{taskCompletion}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${taskCompletion}%` }} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Tasks</h3>
              <div className="space-y-2">
                {[
                  { label: 'Total', value: report.tasks.total, color: 'text-gray-900' },
                  { label: 'Completed', value: report.tasks.done, color: 'text-green-600' },
                  { label: 'In Progress', value: report.tasks.inProgress, color: 'text-blue-600' },
                  { label: 'Blocked', value: report.tasks.blocked, color: 'text-red-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Expenses</h3>
              <div className="space-y-2">
                {[
                  { label: 'Total Submitted', value: `$${report.expenses.totalAmount.toLocaleString()}`, color: 'text-gray-900' },
                  { label: 'Approved', value: `$${report.expenses.approved.toLocaleString()}`, color: 'text-green-600' },
                  { label: 'Pending', value: `$${report.expenses.pending.toLocaleString()}`, color: 'text-yellow-600' },
                  { label: 'Count', value: report.expenses.total, color: 'text-gray-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
              {report.project?.budget > 0 && (
                <>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Budget Used</span>
                      <span className="text-xs font-semibold">
                        {budgetUsedPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full">
                      <div className="h-1.5 bg-green-500 rounded-full" style={{
                        width: `${Math.min(100, budgetUsedPercent)}%`
                      }} />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Materials</h3>
              <div className="space-y-2">
                {[
                  { label: 'Total Requests', value: report.materials.total, color: 'text-gray-900' },
                  { label: 'Approved', value: `$${report.materials.approved.toLocaleString()}`, color: 'text-blue-600' },
                  { label: 'Pending', value: `$${report.materials.pending.toLocaleString()}`, color: 'text-yellow-600' },
                  { label: 'Remaining Budget', value: `$${remainingBudget.toLocaleString()}`, color: overBudget > 0 ? 'text-red-600' : 'text-green-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Issues</h3>
              <div className="space-y-2">
                {[
                  { label: 'Total', value: report.issues.total, color: 'text-gray-900' },
                  { label: 'Open', value: report.issues.open, color: 'text-red-600' },
                  { label: 'Resolved', value: report.issues.resolved, color: 'text-green-600' },
                  { label: 'Critical', value: report.issues.critical, color: 'text-red-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Procurement</h3>
              <div className="space-y-2">
                {[
                  { label: 'Purchase Orders', value: report.procurement.total, color: 'text-gray-900' },
                  { label: 'Pending Approval', value: report.procurement.pendingCount, color: 'text-amber-600' },
                  { label: 'Pending Value', value: `$${report.procurement.pendingValue.toLocaleString()}`, color: 'text-amber-700' },
                  { label: 'Committed Value', value: `$${report.procurement.committedValue.toLocaleString()}`, color: 'text-indigo-600' },
                  { label: 'Open Orders', value: report.procurement.openCount, color: 'text-blue-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
