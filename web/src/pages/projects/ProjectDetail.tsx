import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi } from '../../api/projects.api';
import { milestonesApi } from '../../api/milestones.api';
import { tasksApi } from '../../api/tasks.api';
import { expensesApi } from '../../api/expenses.api';
import { issuesApi } from '../../api/issues.api';
import { Project } from '../../types/project.types';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api/axios';

const statusColor: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

type Tab = 'overview' | 'milestones' | 'tasks' | 'expenses' | 'issues' | 'comments' | 'activity';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const canApprove = user?.role === 'admin' || user?.role === 'manager';
  const canEdit = user?.role === 'admin' || user?.role === 'manager';
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: '', industry: '', budget: '', startDate: '', endDate: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<Record<string, string>>({});
  const [createSaving, setCreateSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    projectsApi.getOne(id).then((res) => setProject(res.data?.data || res.data)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || tab === 'overview' || tab === 'comments' || tab === 'activity') return;
    setTabLoading(true);
    const fetchers: Record<string, () => Promise<any>> = {
      milestones: () => milestonesApi.getByProject(id),
      tasks: () => tasksApi.getByProject(id),
      expenses: () => expensesApi.getByProject(id),
      issues: () => issuesApi.getByProject(id),
    };
    fetchers[tab]()
      .then((res) => setData(res.data?.data || res.data || []))
      .catch(() => setData([]))
      .finally(() => setTabLoading(false));
  }, [tab, id]);

  useEffect(() => {
    if (!id || tab !== 'comments') return;
    api.get(`/comments?entityType=project&entityId=${id}`)
      .then((res) => setComments(res.data?.data || res.data || []))
      .catch(() => {});
  }, [tab, id]);

  useEffect(() => {
    if (!id || tab !== 'activity') return;
    api.get(`/activities/project/${id}?limit=50`)
      .then((res) => setActivities(res.data?.data || res.data || []))
      .catch(() => {});
  }, [tab, id]);

  const postComment = async () => {
    if (!commentText.trim() || !id) return;
    setCommentSaving(true);
    try {
      const res = await api.post('/comments', { entityType: 'project', entityId: id, content: commentText });
      const created = res.data?.data || res.data;
      setComments((prev) => [...prev, created]);
      setCommentText('');
    } catch {} finally {
      setCommentSaving(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    await api.delete(`/comments/${commentId}`);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'milestones', label: 'Milestones' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'issues', label: 'Issues' },
    { key: 'comments', label: `Comments${comments.length > 0 ? ` (${comments.length})` : ''}` },
    { key: 'activity', label: 'Activity' },
  ];

  const openEdit = () => {
    if (!project) return;
    setEditForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      industry: project.industry,
      budget: project.budget ? String(project.budget) : '',
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      endDate: project.endDate ? project.endDate.slice(0, 10) : '',
    });
    setShowEdit(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setEditSaving(true);
    try {
      const res = await projectsApi.update(id, {
        ...editForm,
        budget: editForm.budget ? Number(editForm.budget) : undefined,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
      });
      setProject(res.data?.data || res.data);
      setShowEdit(false);
    } catch {} finally { setEditSaving(false); }
  };

  const CREATE_DEFAULTS: Record<string, Record<string, string>> = {
    tasks: { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' },
    milestones: { name: '', description: '', status: 'pending', dueDate: '' },
    issues: { title: '', description: '', priority: 'medium' },
    expenses: { title: '', amount: '', category: 'other', date: '' },
  };

  const openCreate = () => {
    setCreateForm(CREATE_DEFAULTS[tab] ?? {});
    setShowCreate(true);
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setCreateSaving(true);
    try {
      if (tab === 'tasks') await tasksApi.create({ ...createForm, projectId: id, estimatedHours: undefined });
      if (tab === 'milestones') await milestonesApi.create({ ...createForm, projectId: id });
      if (tab === 'issues') await issuesApi.create({ ...createForm, projectId: id });
      if (tab === 'expenses') await expensesApi.create({ ...createForm, amount: Number(createForm.amount), projectId: id });
      setShowCreate(false);
      const fetchers: Record<string, () => Promise<any>> = {
        milestones: () => milestonesApi.getByProject(id!),
        tasks: () => tasksApi.getByProject(id!),
        expenses: () => expensesApi.getByProject(id!),
        issues: () => issuesApi.getByProject(id!),
      };
      fetchers[tab]().then((res) => setData(res.data?.data || res.data || []));
    } catch {} finally { setCreateSaving(false); }
  };

  if (loading) return <div className="p-6"><div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" /></div>;
  if (!project) return <div className="p-6 text-gray-500">Project not found.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start gap-4 mb-6">
        <Link to="/projects" className="text-gray-400 hover:text-gray-600 mt-1 text-sm">← Back</Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor[project.status]}`}>
              {project.status.replace('_', ' ')}
            </span>
            {canEdit && (
              <button onClick={openEdit}
                className="text-sm text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 ml-auto">
                Edit Project
              </button>
            )}
          </div>
          {project.description && <p className="text-gray-500 text-sm mt-1">{project.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span className="capitalize">{project.industry}</span>
            {project.budget > 0 && <span>Budget: ${Number(project.budget).toLocaleString()}</span>}
            {project.startDate && <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>}
            {project.endDate && <span>End: {new Date(project.endDate).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
        {['tasks','milestones','issues','expenses'].includes(tab) && (
          <button onClick={openCreate}
            className="ml-auto text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 mb-1">
            + New {tab.slice(0, -1)}
          </button>
        )}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ label: 'Industry', value: project.industry },
            { label: 'Status', value: project.status.replace('_', ' ') },
            { label: 'Budget', value: project.budget > 0 ? `$${Number(project.budget).toLocaleString()}` : 'N/A' },
            { label: 'Created', value: new Date(project.createdAt).toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-semibold text-gray-900 mt-1 capitalize">{value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'comments' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button onClick={postComment} disabled={!commentText.trim() || commentSaving}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {commentSaving ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
          {comments.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No comments yet. Be the first to comment!</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {c.author?.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{c.author?.name ?? 'Unknown'}</span>
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  {c.authorId === user?.id && (
                    <button onClick={() => deleteComment(c.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  )}
                </div>
                <p className="text-sm text-gray-700 ml-9">{c.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>No activity recorded for this project yet.</p>
            </div>
          ) : (
            activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-5 py-4">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {a.user?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">{a.user?.name ?? 'Someone'}</span>
                    {' '}{a.description || a.action}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full capitalize shrink-0">{a.entityType}</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab !== 'overview' && tab !== 'comments' && tab !== 'activity' && (
        tabLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No {tab} for this project yet.</div>
        ) : (
          <div className="space-y-2">
            {data.map((item: any) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                {tab === 'milestones' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.dueDate && <p className="text-xs text-gray-400 mt-0.5">Due: {new Date(item.dueDate).toLocaleDateString()}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{item.progress}%</span>
                    </div>
                  </div>
                )}
                {tab === 'tasks' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.description && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{item.priority}</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">{item.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                )}
                {tab === 'expenses' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{item.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">${Number(item.amount).toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        item.status === 'approved' ? 'bg-green-100 text-green-700' :
                        item.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{item.status}</span>
                      {canApprove && item.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={async () => { await expensesApi.approve(item.id); setTab('overview'); setTimeout(() => setTab('expenses'), 50); }}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">✓</button>
                          <button onClick={async () => { await expensesApi.reject(item.id); setTab('overview'); setTimeout(() => setTab('expenses'), 50); }}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">✗</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {tab === 'issues' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.description && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        item.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>{item.priority}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        item.status === 'open' ? 'bg-red-100 text-red-700' :
                        item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        item.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>{item.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Edit Project</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['planning','active','on_hold','completed','cancelled'].map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['construction','telecom','software','other'].map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                <input type="number" min="0" value={editForm.budget}
                  onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={editSaving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">New {tab.slice(0, -1)}</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleQuickCreate} className="p-6 space-y-4">
              {(tab === 'tasks' || tab === 'issues' || tab === 'expenses') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input required value={createForm.title ?? ''}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              {tab === 'milestones' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input required value={createForm.name ?? ''}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              {(tab === 'tasks' || tab === 'milestones' || tab === 'issues') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={createForm.description ?? ''}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              )}
              {(tab === 'tasks' || tab === 'issues') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={createForm.priority ?? 'medium'}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['low','medium','high','critical'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
              {tab === 'tasks' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={createForm.dueDate ?? ''}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              {tab === 'milestones' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input type="date" value={createForm.dueDate ?? ''}
                      onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={createForm.status ?? 'pending'}
                      onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['pending','in_progress','completed','delayed'].map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {tab === 'expenses' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
                    <input required type="number" min="0" value={createForm.amount ?? ''}
                      onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={createForm.category ?? 'other'}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['labor','material','equipment','travel','other'].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createSaving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {createSaving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
