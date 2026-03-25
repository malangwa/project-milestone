import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsApi } from '../../api/projects.api';
import { useAuthStore } from '../../store/auth.store';
import { Project } from '../../types/project.types';
import api from '../../api/axios';

const statusColor: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const canCreate = user?.role === 'admin' || user?.role === 'manager';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', description: '', industry: 'construction', status: 'planning', budget: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    projectsApi.getAll()
      .then((res) => setProjects(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get('/reports/overview')
      .then((res) => setSummary(res.data?.data || res.data))
      .catch(() => {});
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await projectsApi.create({
        ...newForm,
        budget: newForm.budget ? Number(newForm.budget) : undefined,
      });
      const created = res.data?.data || res.data;
      setProjects((prev) => [created, ...prev]);
      setShowNewProject(false);
      setNewForm({ name: '', description: '', industry: 'construction', status: 'planning', budget: '' });
      navigate(`/projects/${created.id}`);
    } catch {} finally { setCreating(false); }
  };

  const totalTasks = summary?.tasks?.reduce((s: number, t: any) => s + parseInt(t.count), 0) ?? 0;
  const doneTasks = summary?.tasks?.find((t: any) => t.status === 'done')?.count ?? 0;
  const openIssues = summary?.issues?.find((i: any) => i.status === 'open')?.count ?? 0;
  const approvedExpenses = summary?.approvedExpenses ?? 0;

  const stats = [
    { label: 'Total Projects', value: projects.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'Active', value: projects.filter((p) => p.status === 'active').length, color: 'bg-green-50 text-green-700' },
    { label: 'Tasks Done', value: `${doneTasks}/${totalTasks}`, color: 'bg-purple-50 text-purple-700' },
    { label: 'Open Issues', value: openIssues, color: 'bg-red-50 text-red-700' },
    { label: 'Approved Spend', value: `$${Number(approvedExpenses).toLocaleString()}`, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'On Hold', value: projects.filter((p) => p.status === 'on_hold').length, color: 'bg-yellow-50 text-yellow-700' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h1>
          <p className="text-gray-500 mt-1">Here's an overview of your projects</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowNewProject(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
          <Link to="/projects" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No projects yet.</p>
            <Link to="/projects" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Create your first project</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{p.industry}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor[p.status] || 'bg-gray-100 text-gray-600'}`}>
                  {p.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      {showNewProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">New Project</h2>
              <button onClick={() => setShowNewProject(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Office Renovation" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select value={newForm.industry}
                    onChange={(e) => setNewForm({ ...newForm, industry: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['construction','telecom','software','other'].map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={newForm.status}
                    onChange={(e) => setNewForm({ ...newForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['planning','active','on_hold'].map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                <input type="number" min="0" value={newForm.budget}
                  onChange={(e) => setNewForm({ ...newForm, budget: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewProject(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
