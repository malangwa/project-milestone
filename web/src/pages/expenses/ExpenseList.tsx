import { useEffect, useState } from 'react';
import { attachmentsApi } from '../../api/attachments.api';
import { expensesApi } from '../../api/expenses.api';
import { projectsApi } from '../../api/projects.api';
import { materialRequestsApi } from '../../api/material-requests.api';
import { usePermission } from '../../hooks/usePermission';
import { printDocument, shareDocument } from '../../utils/printDocument';
import { Plus, X, Paperclip, Printer, Share2, Trash2, CheckCircle, XCircle, Receipt } from 'lucide-react';

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const CATEGORIES = ['labor', 'material', 'equipment', 'travel', 'other'];

const ExpenseList = () => {
  const { canApproveExpense, canCreateExpense } = usePermission();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedProjectInfo, setSelectedProjectInfo] = useState<any>(null);
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'other', date: '', notes: '' });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptDescription, setReceiptDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [expenseAttachments, setExpenseAttachments] = useState<Record<string, any[]>>({});

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
      const res = await expensesApi.create({ ...clean, amount: Number(form.amount), projectId: selectedProject });
      const created = res.data?.data || res.data;
      if (receiptFile && created?.id) {
        await attachmentsApi.upload(receiptFile, 'expense', created.id, receiptDescription);
      }
      setShowModal(false);
      setForm({ title: '', amount: '', category: 'other', date: '', notes: '' });
      setReceiptFile(null);
      setReceiptDescription('');
      reload();
    } finally { setSaving(false); }
  };

  const loadExpenseAttachments = async (expenseId: string) => {
    try {
      const res = await attachmentsApi.getByEntity('expense', expenseId);
      const list = res.data?.data || res.data || [];
      setExpenseAttachments((prev) => ({ ...prev, [expenseId]: list }));
    } catch {}
  };

  const handleUploadReceipt = async (expenseId: string, file: File) => {
    try {
      const description = window.prompt('What is this receipt for?', 'Receipt for workers, materials, transport, or other expense') || '';
      await attachmentsApi.upload(file, 'expense', expenseId, description);
      loadExpenseAttachments(expenseId);
    } catch {}
  };

  const handleViewReceipt = async (attachment: any) => {
    try {
      const res = await attachmentsApi.getDownloadUrl(attachment.id);
      const url = res.data?.url || res.data?.data?.url;
      if (url) window.open(url, '_blank');
    } catch {
      if (attachment.url) window.open(attachment.url, '_blank');
    }
  };

  useEffect(() => {
    expenses.forEach((e) => {
      if (!expenseAttachments[e.id]) loadExpenseAttachments(e.id);
    });
  }, [expenses]);

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

  const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">{pending} pending · ${total.toLocaleString()} approved</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {canCreateExpense && (
            <button onClick={() => setShowModal(true)} disabled={!selectedProject}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all">
              <Plus size={16} /> Submit Expense
            </button>
          )}
        </div>
      </div>

      {selectedProjectInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[{
            label: 'Project Budget', value: `$${projectBudget.toLocaleString()}`, color: 'text-slate-900', bg: 'bg-white',
          },{
            label: 'Approved Spend', value: `$${total.toLocaleString()}`, color: 'text-emerald-600', bg: 'bg-white',
          },{
            label: 'Approved Materials', value: `$${approvedMaterials.toLocaleString()}`, color: 'text-indigo-600', bg: 'bg-white',
          },{
            label: overBudget > 0 ? 'Over Budget' : 'Remaining', value: overBudget > 0 ? `$${overBudget.toLocaleString()}` : `$${remainingOwed.toLocaleString()}`, color: overBudget > 0 ? 'text-red-600' : 'text-blue-600', bg: 'bg-white',
          }].map((s) => (
            <div key={s.label} className={`${s.bg} border border-slate-200 rounded-2xl p-5 shadow-sm`}>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Receipt size={22} className="text-slate-400" /></div>
          <p className="text-slate-400 font-medium">No expenses for this project</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => {
            const receipts = expenseAttachments[e.id] || [];
            return (
            <div key={e.id} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 group hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{e.category}{e.date ? ` · ${new Date(e.date).toLocaleDateString()}` : ''}</p>
                </div>
                <p className="font-bold text-slate-900 shrink-0">${Number(e.amount).toLocaleString()}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${statusColor[e.status]}`}>{e.status}</span>
                {canApproveExpense && e.status === 'pending' && (
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleApprove(e.id)} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Approve"><CheckCircle size={15} /></button>
                    <button onClick={() => handleReject(e.id)} className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Reject"><XCircle size={15} /></button>
                  </div>
                )}
                <label className="cursor-pointer p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0" title="Upload receipt">
                  <Paperclip size={14} />
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) handleUploadReceipt(e.id, f); ev.target.value = ''; }} />
                </label>
                <button onClick={() => printDocument({ title: e.title, subtitle: 'Expense', projectName: selectedProjectInfo?.name, date: e.date ? new Date(e.date).toLocaleDateString() : undefined, status: e.status, extraFields: [{ label: 'Category', value: e.category }, { label: 'Amount', value: '$' + Number(e.amount).toLocaleString() }, ...(e.notes ? [{ label: 'Notes', value: e.notes }] : [])], total: e.amount })}
                  className="p-1.5 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 hover:bg-slate-100 rounded-lg transition-all shrink-0">
                  <Printer size={14} />
                </button>
                <button onClick={() => shareDocument({ title: e.title, subtitle: 'Expense', projectName: selectedProjectInfo?.name, date: e.date ? new Date(e.date).toLocaleDateString() : undefined, status: e.status, extraFields: [{ label: 'Category', value: e.category }, { label: 'Amount', value: '$' + Number(e.amount).toLocaleString() }, ...(e.notes ? [{ label: 'Notes', value: e.notes }] : [])], total: e.amount })}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 hover:bg-indigo-50 rounded-lg transition-all shrink-0">
                  <Share2 size={14} />
                </button>
                <button onClick={() => handleDelete(e.id)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
              {receipts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {receipts.map((a: any) => (
                    <button key={a.id} onClick={() => handleViewReceipt(a)}
                      className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                      <Paperclip size={11} />{a.description || a.filename}
                    </button>
                  ))}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center"><Plus size={16} className="text-white" /></div>
                <h2 className="text-base font-semibold text-slate-900">Submit Expense</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} placeholder="e.g. Cement purchase" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount ($) *</label>
                  <input required type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inp}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inp} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Receipt / Photo</label>
                <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                  <Paperclip size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-500">{receiptFile ? receiptFile.name : 'Attach receipt or photo…'}</span>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                </label>
                {receiptFile && <button type="button" onClick={() => setReceiptFile(null)} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove</button>}
              </div>
              {receiptFile && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">What is this receipt for?</label>
                  <input value={receiptDescription} onChange={(e) => setReceiptDescription(e.target.value)} className={inp} placeholder="e.g. Payment for workers, cement purchase" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all">{saving ? 'Submitting…' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
