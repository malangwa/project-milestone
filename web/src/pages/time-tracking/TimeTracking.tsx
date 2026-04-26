import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { projectsApi } from '../../api/projects.api';
import { timeTrackingApi } from '../../api/time-tracking.api';
import { Plus, X, Clock, Trash2 } from 'lucide-react';

const TimeTracking = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ hours: '', date: new Date().toISOString().split('T')[0], description: '', taskId: '' });
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
    Promise.all([
      timeTrackingApi.getByProject(selectedProject),
      timeTrackingApi.getProjectTotal(selectedProject),
    ]).then(([entriesRes, totalRes]) => {
      setEntries(entriesRes.data?.data || entriesRes.data || []);
      const t = totalRes.data?.data || totalRes.data;
      setTotal(t?.total ?? t ?? 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedProject]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !form.hours) return;
    setSaving(true);
    try {
      const clean = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await timeTrackingApi.create({ ...clean, projectId: selectedProject, hours: parseFloat(form.hours) });
      const [entriesRes, totalRes] = await Promise.all([
        timeTrackingApi.getByProject(selectedProject),
        timeTrackingApi.getProjectTotal(selectedProject),
      ]);
      setEntries(entriesRes.data?.data || entriesRes.data || []);
      const t = totalRes.data?.data || totalRes.data;
      setTotal(t?.total ?? t ?? 0);
      setForm({ hours: '', date: new Date().toISOString().split('T')[0], description: '', taskId: '' });
      setShowForm(false);
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await timeTrackingApi.remove(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Tracking</h1>
          <p className="text-slate-500 text-sm mt-1">Log and review hours per project</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all">
            <Plus size={16} /> Log Hours
          </button>
        </div>
      </div>

      {selectedProject && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
            <p className="text-xs text-indigo-200 font-medium">Total Hours Logged</p>
            <p className="text-3xl font-bold mt-1">{Number(total).toFixed(1)}h</p>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-200">
            <p className="text-xs text-violet-200 font-medium">Total Entries</p>
            <p className="text-3xl font-bold mt-1">{entries.length}</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center"><Clock size={16} className="text-white" /></div>
                <h3 className="text-base font-semibold text-slate-900">Log Hours</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hours</label>
                <input type="number" step="0.25" min="0.25" max="24" required value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className={inp} placeholder="e.g. 2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inp} resize-none`} placeholder="What did you work on?" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all">{saving ? 'Saving…' : 'Log Hours'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Clock size={24} className="text-slate-400" /></div>
          <p className="text-slate-400 font-medium">No time entries yet for this project</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Date</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">User</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Description</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Hours</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-3.5 text-slate-700 font-medium">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-slate-600">{e.user?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{e.description || '—'}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-indigo-600">{Number(e.hours).toFixed(1)}h</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TimeTracking;
