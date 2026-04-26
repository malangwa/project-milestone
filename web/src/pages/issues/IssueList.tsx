import { useEffect, useState } from 'react';
import { issuesApi } from '../../api/issues.api';
import { projectsApi } from '../../api/projects.api';
import { Plus, X, Trash2, AlertTriangle } from 'lucide-react';

const priorityColor: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};
const statusColor: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
};

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const IssueList = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    projectsApi.getAll().then((res) => {
      const list = res.data?.data || res.data || [];
      setProjects(list);
      if (list.length > 0) setSelectedProject(list[0].id);
    });
  }, []);

  const reload = () => {
    if (!selectedProject) return;
    setLoading(true);
    issuesApi.getByProject(selectedProject)
      .then((res) => setIssues(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [selectedProject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await issuesApi.create({ ...form, projectId: selectedProject });
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'medium' });
      reload();
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await issuesApi.update(id, { status });
    reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this issue?')) return;
    await issuesApi.remove(id);
    setIssues((prev) => prev.filter((i) => i.id !== id));
  };

  const filtered = filter === 'all' ? issues : issues.filter((i) => i.status === filter);

  const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Issues</h1>
          <p className="text-slate-500 text-sm mt-1">{issues.filter((i) => i.status === 'open').length} open · {issues.filter((i) => i.status === 'in_progress').length} in progress</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} disabled={!selectedProject}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all">
            <Plus size={16} /> Report Issue
          </button>
        </div>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap capitalize transition-all ${
              filter === s ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
            }`}>
            {s === 'all' ? `All (${issues.length})` : `${s.replace('_', ' ')} (${issues.filter((i) => i.status === s).length})`}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><AlertTriangle size={22} className="text-slate-400" /></div>
          <p className="text-slate-400 font-medium">No issues found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((issue) => (
            <div key={issue.id} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4 group hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{issue.title}</p>
                {issue.description && <p className="text-xs text-slate-500 truncate mt-0.5">{issue.description}</p>}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${priorityColor[issue.priority]}`}>{issue.priority}</span>
              <select value={issue.status} onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border-0 cursor-pointer focus:outline-none capitalize shrink-0 ${statusColor[issue.status]}`}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <button onClick={() => handleDelete(issue.id)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center"><AlertTriangle size={15} className="text-white" /></div>
                <h2 className="text-base font-semibold text-slate-900">Report Issue</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} placeholder="Describe the issue briefly" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inp} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inp}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all">{saving ? 'Reporting…' : 'Report Issue'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueList;
