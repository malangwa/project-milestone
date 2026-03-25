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

type Tab = 'overview' | 'milestones' | 'tasks' | 'expenses' | 'issues' | 'comments';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const canApprove = user?.role === 'admin' || user?.role === 'manager';
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    projectsApi.getOne(id).then((res) => setProject(res.data?.data || res.data)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || tab === 'overview' || tab === 'comments') return;
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
  ];

  if (loading) return <div className="p-6"><div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" /></div>;
  if (!project) return <div className="p-6 text-gray-500">Project not found.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start gap-4 mb-6">
        <Link to="/projects" className="text-gray-400 hover:text-gray-600 mt-1 text-sm">← Back</Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor[project.status]}`}>
              {project.status.replace('_', ' ')}
            </span>
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

      <div className="flex gap-1 border-b border-gray-200 mb-6">
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

      {tab !== 'overview' && tab !== 'comments' && (
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
    </div>
  );
};

export default ProjectDetail;
