import { useEffect, useState } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { attachmentsApi } from '../../api/attachments.api';
import { tasksApi } from '../../api/tasks.api';
import { projectsApi } from '../../api/projects.api';
import { inventoryApi } from '../../api/procurement.api';
import type { Task, Project, ProjectMember } from '../../types/project.types';
import type { StockItem } from '../../types/procurement.types';

const priorityColor: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const TaskList = () => {
  const { canCreateTask } = usePermission();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    estimatedHours: '',
    assignedToId: '',
    materials: [{ name: '', unit: '', quantity: '', source: 'manual', stockItemId: '' }],
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [taskAttachments, setTaskAttachments] = useState<Record<string, any[]>>({});

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
      tasksApi.getByProject(selectedProject),
      projectsApi.getMembers(selectedProject),
      inventoryApi.getByProject(selectedProject),
    ])
      .then(([tasksRes, membersRes, stockRes]) => {
        setTasks(tasksRes.data?.data || tasksRes.data || []);
        setMembers(membersRes.data?.data || membersRes.data || []);
        setStockItems(stockRes.data?.data || stockRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const reload = () => {
    if (!selectedProject) return Promise.resolve();
    return Promise.all([
      tasksApi.getByProject(selectedProject),
      projectsApi.getMembers(selectedProject),
      inventoryApi.getByProject(selectedProject),
    ]).then(([tasksRes, membersRes, stockRes]) => {
      setTasks(tasksRes.data?.data || tasksRes.data || []);
      setMembers(membersRes.data?.data || membersRes.data || []);
      setStockItems(stockRes.data?.data || stockRes.data || []);
    });
  };

  const loadTaskAttachments = async (taskId: string) => {
    try {
      const res = await attachmentsApi.getByEntity('task', taskId);
      const list = res.data?.data || res.data || [];
      setTaskAttachments((prev) => ({ ...prev, [taskId]: list }));
    } catch {}
  };

  const handleUploadPhoto = async (taskId: string, file: File) => {
    try {
      await attachmentsApi.upload(file, 'task', taskId);
      loadTaskAttachments(taskId);
    } catch {}
  };

  const handleViewAttachment = async (attachment: any) => {
    try {
      const res = await attachmentsApi.getDownloadUrl(attachment.id);
      const url = res.data?.url || res.data?.data?.url;
      if (url) window.open(url, '_blank');
    } catch {
      if (attachment.url) window.open(attachment.url, '_blank');
    }
  };

  useEffect(() => {
    tasks.forEach((t) => {
      if (!taskAttachments[t.id]) loadTaskAttachments(t.id);
    });
  }, [tasks]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await tasksApi.remove(id);
    await reload();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await tasksApi.update(id, { status });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: status as any } : t));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const materials = form.materials
        .filter((material) => material.name.trim() && material.unit.trim() && Number(material.quantity) > 0)
        .map((material) => ({
          name: material.name.trim(),
          unit: material.unit.trim(),
          quantity: Number(material.quantity),
          source: material.source,
          stockItemId: material.source === 'store' ? material.stockItemId || undefined : undefined,
          stockItemName: material.source === 'store'
            ? stockItems.find((item) => item.id === material.stockItemId)?.name
            : undefined,
        }));

      const payload = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || undefined,
        estimatedHours: Number(form.estimatedHours) || undefined,
        assignedToId: form.assignedToId || undefined,
        materials,
        projectId: selectedProject,
      };
      await tasksApi.create(payload);
      setShowModal(false);
      setForm({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        estimatedHours: '',
        assignedToId: '',
        materials: [{ name: '', unit: '', quantity: '', source: 'manual', stockItemId: '' }],
      });
      reload();
    } finally { setSaving(false); }
  };

  const updateMaterial = (index: number, patch: Partial<(typeof form.materials)[number]>) => {
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.map((material, currentIndex) => (currentIndex === index ? { ...material, ...patch } : material)),
    }));
  };

  const addMaterial = () => {
    setForm((prev) => ({
      ...prev,
      materials: [...prev.materials, { name: '', unit: '', quantity: '', source: 'manual', stockItemId: '' }],
    }));
  };

  const removeMaterial = (index: number) => {
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.length === 1 ? prev.materials : prev.materials.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {canCreateTask && (
            <button onClick={() => setShowModal(true)} disabled={!selectedProject}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              + New Task
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s === 'all' ? `All (${tasks.length})` : `${s.replace('_', ' ')} (${tasks.filter((t) => t.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No tasks found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const photos = taskAttachments[t.id] || [];
            return (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-blue-200 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{t.title}</p>
                  {t.description && <p className="text-xs text-gray-500 truncate mt-0.5">{t.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {t.assignedTo?.name || 'Unassigned'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {t.materials?.length ? `${t.materials.length} material${t.materials.length !== 1 ? 's' : ''}` : 'No materials'}
                    </span>
                  </div>
                  {t.materials?.length ? (
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {t.materials.slice(0, 2).map((material, index) => (
                        <p key={`${t.id}-${index}`}>
                          {material.quantity} {material.unit} {material.name}
                          {material.source === 'store' && material.stockItemName ? ` · from ${material.stockItemName}` : ''}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.dueDate && <span className="text-xs text-gray-400">{new Date(t.dueDate).toLocaleDateString()}</span>}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${priorityColor[t.priority]}`}>{t.priority}</span>
                  <label className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer px-2 py-1 rounded hover:bg-blue-50 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Photo
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(ev) => {
                      const f = ev.target.files?.[0];
                      if (f) handleUploadPhoto(t.id, f);
                      ev.target.value = '';
                    }} />
                  </label>
                  <select value={t.status}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50 capitalize">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                  <button onClick={() => handleDelete(t.id)}
                    className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                </div>
              </div>
              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((a: any) => (
                    <button key={a.id} onClick={() => handleViewAttachment(a)}
                      className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                      {a.mimeType?.startsWith('image/') ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      )}
                      {a.filename}
                    </button>
                  ))}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">New Task</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Task title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user?.name || member.user?.email || member.userId} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Hours</label>
                  <input type="number" min="0" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Assigned Materials</label>
                  <button type="button" onClick={addMaterial} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                    + Add material
                  </button>
                </div>
                {form.materials.map((material, index) => (
                  <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                        <input value={material.name} onChange={(e) => updateMaterial(index, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
                        <select value={material.source} onChange={(e) => updateMaterial(index, { source: e.target.value as 'manual' | 'store' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="manual">Manual</option>
                          <option value="store">Store</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                        <input type="number" min="0" step="0.01" value={material.quantity}
                          onChange={(e) => updateMaterial(index, { quantity: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                        <input value={material.unit} onChange={(e) => updateMaterial(index, { unit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Store item</label>
                        <select
                          value={material.stockItemId || ''}
                          onChange={(e) => updateMaterial(index, { stockItemId: e.target.value })}
                          disabled={material.source !== 'store'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                          <option value="">Select item</option>
                          {stockItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({Number(item.currentQuantity).toLocaleString()} {item.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => removeMaterial(index)} className="text-xs text-red-500 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
