import { useEffect, useState } from 'react';
import { milestonesApi } from '../../api/milestones.api';
import { projectsApi } from '../../api/projects.api';
import type { Milestone, Project } from '../../types/project.types';
import { Plus, X, Trash2, Milestone as MilestoneIcon } from 'lucide-react';

const statusColor: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  delayed: 'bg-red-100 text-red-700',
};
const progressColor: Record<string, string> = {
  pending: 'from-slate-400 to-slate-500',
  in_progress: 'from-blue-500 to-indigo-600',
  completed: 'from-emerald-500 to-green-600',
  delayed: 'from-red-500 to-rose-600',
};

const MilestoneList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', dueDate: '', status: 'pending' });
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
    setLoading(true);
    milestonesApi.getByProject(selectedProject)
      .then((res) => setMilestones(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const clean = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await milestonesApi.create({ ...clean, projectId: selectedProject });
      setShowModal(false);
      setForm({ name: '', description: '', dueDate: '', status: 'pending' });
      milestonesApi.getByProject(selectedProject).then((res) => setMilestones(res.data?.data || res.data || []));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this milestone?')) return;
    await milestonesApi.remove(id);
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Milestones</h1>
          <p className="text-slate-500 text-sm mt-1">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} disabled={!selectedProject}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all">
            <Plus size={16} /> New Milestone
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><MilestoneIcon size={24} className="text-slate-400" /></div>
          <p className="text-slate-400 font-medium">No milestones yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5 group hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{m.name}</h3>
                  {m.description && <p className="text-sm text-slate-500 mt-1">{m.description}</p>}
                  {m.dueDate && <p className="text-xs text-slate-400 mt-2">Due {new Date(m.dueDate).toLocaleDateString()}</p>}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500 font-medium">Progress</span>
                      <span className="text-xs font-bold text-slate-700">{m.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-2 bg-gradient-to-r ${progressColor[m.status] || 'from-indigo-500 to-blue-600'} rounded-full transition-all`} style={{ width: `${m.progress}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor[m.status]}`}>{m.status.replace('_', ' ')}</span>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center"><Plus size={16} className="text-white" /></div>
                <h2 className="text-base font-semibold text-slate-900">New Milestone</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inp} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
                    {['pending', 'in_progress', 'completed', 'delayed'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all">{saving ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneList;
