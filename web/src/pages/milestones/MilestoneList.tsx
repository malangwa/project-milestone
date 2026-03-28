import { useEffect, useState } from 'react';
import { milestonesApi } from '../../api/milestones.api';
import { projectsApi } from '../../api/projects.api';
import type { Milestone, Project } from '../../types/project.types';

const statusColor: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  delayed: 'bg-red-100 text-red-700',
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Milestones</h1>
          <p className="text-gray-500 text-sm mt-1">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} disabled={!selectedProject}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + New Milestone
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No milestones for this project yet.</div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-5 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{m.name}</h3>
                  {m.description && <p className="text-sm text-gray-500 mt-1">{m.description}</p>}
                  {m.dueDate && <p className="text-xs text-gray-400 mt-2">Due: {new Date(m.dueDate).toLocaleDateString()}</p>}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{m.progress}%</p>
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${m.progress}%` }} />
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor[m.status]}`}>
                    {m.status.replace('_', ' ')}
                  </span>
                  <button onClick={() => handleDelete(m.id)}
                    className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">New Milestone</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['pending', 'in_progress', 'completed', 'delayed'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneList;
