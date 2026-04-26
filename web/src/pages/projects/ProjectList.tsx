import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../types/project.types';
import { useSubscription } from '../../hooks/useSubscription';
import SubscriptionGate from '../../components/subscription/SubscriptionGate';
import { Plus, Trash2, MapPin, X, AlertCircle, FolderKanban } from 'lucide-react';

const statusColor: Record<string, string> = {
  planning: 'bg-slate-100 text-slate-600',
  active: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusDot: Record<string, string> = {
  planning: 'bg-slate-400',
  active: 'bg-emerald-500',
  on_hold: 'bg-amber-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-red-500',
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

  const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => { if (!canCreateProject(projects.length)) { setShowGate(true); } else { setShowModal(true); } }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap capitalize transition-all ${
              filterStatus === s
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
            }`}>
            {s === 'all' ? `All (${projects.length})` : `${s.replace('_', ' ')} (${projects.filter(p => p.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No projects yet</p>
          <p className="text-slate-400 text-sm mt-1">Create your first project to get started</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No projects match the selected filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div key={p.id} className="relative group">
              <Link to={`/projects/${p.id}`}
                className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 transition-all">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-indigo-700 font-bold">{p.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 flex items-center gap-1.5 ${statusColor[p.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status]}`} />
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 leading-tight mb-1 group-hover:text-indigo-700 transition-colors">{p.name}</h3>
                {p.location && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                    <MapPin size={10} />{p.location}
                  </p>
                )}
                {p.description && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{p.description}</p>}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-50">
                  <span className="capitalize font-medium">{p.industry}</span>
                  {p.budget > 0 && <span className="font-semibold text-slate-600">${Number(p.budget).toLocaleString()}</span>}
                </div>
              </Link>
              <button
                onClick={(e) => handleDelete(p.id, e)}
                disabled={deleting === p.id}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-lg border border-slate-200 hover:border-red-200 shadow-sm transition-all disabled:opacity-30"
                title="Delete project"
              >
                {deleting === p.id ? <span className="text-xs">...</span> : <Trash2 size={13} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {showGate && (
        <SubscriptionGate
          onClose={() => setShowGate(false)}
          currentPlan={subscription.plan}
          limitType="projects"
          currentCount={projects.length}
          limit={subscription.limits.projects}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center"><Plus size={16} className="text-white" /></div>
                <h2 className="text-base font-semibold text-slate-900">New Project</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
                  <AlertCircle size={14} />{error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="e.g. Highway Construction Phase 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className={`${inp} resize-none`} placeholder="Brief project description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inp} placeholder="e.g. Lagos, Site A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Industry</label>
                  <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inp}>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Budget ($)</label>
                  <input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className={inp} placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Given Cash ($)</label>
                  <input type="number" min="0" value={form.givenCash} onChange={(e) => setForm({ ...form, givenCash: e.target.value })} className={inp} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-indigo-50 px-4 py-3 border border-indigo-100">
                  <p className="text-xs text-indigo-500 font-medium">Given</p>
                  <p className="font-bold text-indigo-900 mt-1">${plannedGivenCash.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">Remaining</p>
                  <p className="font-bold text-slate-900 mt-1">${plannedRemaining.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inp} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all">
                  {saving ? 'Creating…' : 'Create Project'}
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
