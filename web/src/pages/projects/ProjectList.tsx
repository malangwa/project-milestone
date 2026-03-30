import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../types/project.types';
import { useSubscription } from '../../hooks/useSubscription';
import SubscriptionGate from '../../components/subscription/SubscriptionGate';

const statusColor: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const INDUSTRIES = ['construction', 'telecom', 'software', 'other'];
const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const { subscription, canCreateProject } = useSubscription();
  const [form, setForm] = useState({ name: '', description: '', location: '', industry: 'other', status: 'planning', budget: '', givenCash: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    projectsApi.getAll()
      .then((res) => setProjects(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await projectsApi.remove(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {} finally {
      setDeleting(null);
    }
  };

  const filtered = filterStatus === 'all' ? projects : projects.filter((p) => p.status === filterStatus);

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await projectsApi.create({
        ...form,
        budget: Number(form.budget) || 0,
        givenCash: Number(form.givenCash) || 0,
        location: form.location || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      setShowModal(false);
      setForm({ name: '', description: '', location: '', industry: 'other', status: 'planning', budget: '', givenCash: '', startDate: '', endDate: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const plannedBudget = Number(form.budget) || 0;
  const plannedGivenCash = Number(form.givenCash) || 0;
  const plannedRemaining = Math.max(0, plannedBudget - plannedGivenCash);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            if (!canCreateProject(projects.length)) {
              setShowGate(true);
            } else {
              setShowModal(true);
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Project
        </button>
      </div>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-colors ${
              filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s === 'all' ? `All (${projects.length})` : `${s.replace('_', ' ')} (${projects.filter(p => p.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400">No projects yet. Create your first one!</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No projects match the selected filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="relative group">
              <Link to={`/projects/${p.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 leading-tight pr-2">{p.name}</h3>
                    {p.location && <p className="text-xs text-gray-400 mt-0.5">{p.location}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${statusColor[p.status]}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
                {p.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description}</p>}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="capitalize">{p.industry}</span>
                  {p.budget > 0 && <span>${Number(p.budget).toLocaleString()}</span>}
                </div>
              </Link>
              <button
                onClick={(e) => handleDelete(p.id, e)}
                disabled={deleting === p.id}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 bg-white border border-red-100 rounded px-1.5 py-0.5 transition-opacity disabled:opacity-50"
              >
                {deleting === p.id ? '...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showGate && subscription && (
        <SubscriptionGate
          onClose={() => setShowGate(false)}
          currentPlan={subscription.plan}
          limitType="projects"
          currentCount={projects.length}
          limit={subscription.limits.projects}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Highway Construction Phase 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Brief project description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Lagos, Site A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize">
                    {INDUSTRIES.map((i) => <option key={i} value={i} className="capitalize">{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                <input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Given Cash ($)</label>
                <input type="number" min="0" value={form.givenCash} onChange={(e) => setForm({ ...form, givenCash: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 px-4 py-3 border border-gray-200">
                  <p className="text-xs text-gray-500">Given</p>
                  <p className="font-semibold text-gray-900 mt-1">${plannedGivenCash.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3 border border-gray-200">
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="font-semibold text-gray-900 mt-1">${plannedRemaining.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
