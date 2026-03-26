import { useEffect, useState, FormEvent } from 'react';
import { projectsApi } from '../../api/projects.api';
import { timeTrackingApi } from '../../api/time-tracking.api';

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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-500 text-sm mt-1">Log and review hours per project</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            + Log Hours
          </button>
        </div>
      </div>

      {selectedProject && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-5">
            <p className="text-xs text-blue-600 font-medium">Total Hours Logged</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{Number(total).toFixed(1)}h</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-5">
            <p className="text-xs text-purple-600 font-medium">Total Entries</p>
            <p className="text-3xl font-bold text-purple-700 mt-1">{entries.length}</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Log Hours</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                <input type="number" step="0.25" min="0.25" max="24" required
                  value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="What did you work on?" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg">
                  {saving ? 'Saving...' : 'Log Hours'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">⏱</p>
          <p>No time entries yet for this project.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Description</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Hours</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3.5 text-gray-700">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-gray-600">{e.user?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{e.description || '—'}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-blue-700">{Number(e.hours).toFixed(1)}h</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => handleDelete(e.id)}
                      className="text-xs text-red-400 hover:text-red-600">Delete</button>
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
