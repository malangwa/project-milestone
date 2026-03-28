import { useEffect, useState } from 'react';
import { expensesApi } from '../../api/expenses.api';
import { projectsApi } from '../../api/projects.api';
import { materialRequestsApi } from '../../api/material-requests.api';
import { useAuthStore } from '../../store/auth.store';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const CATEGORIES = ['labor', 'material', 'equipment', 'travel', 'other'];

const ExpenseList = () => {
  const { user } = useAuthStore();
  const canApprove = user?.role === 'admin' || user?.role === 'manager';
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedProjectInfo, setSelectedProjectInfo] = useState<any>(null);
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'other', date: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    projectsApi.getAll().then((res) => {
      const list = res.data?.data || res.data || [];
      setProjects(list);
      if (list.length > 0) setSelectedProject(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    projectsApi.getOne(selectedProject)
      .then((res) => setSelectedProjectInfo(res.data?.data || res.data || null))
      .catch(() => setSelectedProjectInfo(null));
    materialRequestsApi.getByProject(selectedProject)
      .then((res) => setMaterialRequests(res.data?.data || res.data || []))
      .catch(() => setMaterialRequests([]));
  }, [selectedProject]);

  const reload = () => {
    if (!selectedProject) return;
    setLoading(true);
    expensesApi.getByProject(selectedProject)
      .then((res) => setExpenses(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [selectedProject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const clean = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await expensesApi.create({ ...clean, amount: Number(form.amount), projectId: selectedProject });
      setShowModal(false);
      setForm({ title: '', amount: '', category: 'other', date: '', notes: '' });
      reload();
    } finally { setSaving(false); }
  };

  const handleApprove = async (id: string) => { await expensesApi.approve(id); reload(); };
  const handleReject = async (id: string) => { await expensesApi.reject(id); reload(); };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await expensesApi.remove(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const total = expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0);
  const approvedMaterials = materialRequests
    .filter((request) => request.status === 'approved')
    .reduce((sum, request) => sum + Number(request.requestedAmount || 0), 0);
  const pending = expenses.filter((e) => e.status === 'pending').length;
  const projectBudget = Number(selectedProjectInfo?.budget || 0);
  const committedBudget = total + approvedMaterials;
  const remainingOwed = Math.max(0, projectBudget - committedBudget);
  const overBudget = Math.max(0, committedBudget - projectBudget);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">{pending} pending · ${total.toLocaleString()} approved</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} disabled={!selectedProject}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Submit Expense
          </button>
        </div>
      </div>

      {selectedProjectInfo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500">Project Budget</p>
            <p className="text-xl font-bold text-gray-900 mt-1">${projectBudget.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500">Approved Spend</p>
            <p className="text-xl font-bold text-green-600 mt-1">${total.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500">Approved Materials</p>
            <p className="text-xl font-bold text-blue-600 mt-1">${approvedMaterials.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500">Owed</p>
            <p className="text-xl font-bold text-blue-600 mt-1">${remainingOwed.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 md:col-span-4">
            <p className="text-xs text-gray-500">Status</p>
            <p className={`text-xl font-bold mt-1 ${overBudget > 0 ? 'text-red-700' : 'text-green-600'}`}>
              {overBudget > 0 ? `Budget exceeded by $${overBudget.toLocaleString()}` : 'Within budget'}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No expenses for this project.</div>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4 group">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{e.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{e.category}{e.date ? ` · ${new Date(e.date).toLocaleDateString()}` : ''}</p>
              </div>
              <p className="font-semibold text-gray-900">${Number(e.amount).toLocaleString()}</p>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor[e.status]}`}>{e.status}</span>
              {canApprove && e.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(e.id)}
                    className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                  <button onClick={() => handleReject(e.id)}
                    className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Reject</button>
                </div>
              )}
              <button onClick={() => handleDelete(e.id)}
                className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Submit Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Cement purchase" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
                  <input required type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
