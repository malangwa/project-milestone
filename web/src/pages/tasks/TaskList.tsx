import { useEffect, useState } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { Plus, X, Trash2, Camera, CheckSquare } from 'lucide-react';
import { attachmentsApi } from '../../api/attachments.api';
import { tasksApi } from '../../api/tasks.api';
import { projectsApi } from '../../api/projects.api';
import { inventoryApi } from '../../api/procurement.api';
import type { Task, Project, ProjectMember } from '../../types/project.types';
import type { StockItem } from '../../types/procurement.types';

const priorityColor: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};
const statusChip: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-violet-100 text-violet-700',
  done: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-red-100 text-red-700',
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

  const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';
  const inpSm = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {canCreateTask && (
            <button onClick={() => setShowModal(true)} disabled={!selectedProject}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all">
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap capitalize transition-all ${
              filter === s ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
            }`}>
            {s === 'all' ? `All (${tasks.length})` : `${s.replace('_', ' ')} (${tasks.filter((t) => t.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><CheckSquare size={24} className="text-slate-400" /></div>
          <p className="text-slate-400 font-medium">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const photos = taskAttachments[t.id] || [];
            return (
            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:border-indigo-200 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                  {t.description && <p className="text-xs text-slate-500 truncate mt-0.5">{t.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">{t.assignedTo?.name || 'Unassigned'}</span>
                    {t.materials?.length ? <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">{t.materials.length} material{t.materials.length !== 1 ? 's' : ''}</span> : null}
                    {t.dueDate && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">{new Date(t.dueDate).toLocaleDateString()}</span>}
                  </div>
                  {t.materials?.length ? (
                    <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                      {t.materials.slice(0, 2).map((mat, i) => (
                        <p key={`${t.id}-${i}`} className="truncate">{mat.quantity} {mat.unit} {mat.name}{mat.source === 'store' && mat.stockItemName ? ` · from ${mat.stockItemName}` : ''}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${priorityColor[t.priority]}`}>{t.priority}</span>
                  <label className="cursor-pointer p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Upload photo">
                    <Camera size={15} />
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) handleUploadPhoto(t.id, f); ev.target.value = ''; }} />
                  </label>
                  <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    className={`text-xs font-semibold border rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 capitalize cursor-pointer ${statusChip[t.status] || 'bg-slate-100 text-slate-600'}`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((a: any) => (
                    <button key={a.id} onClick={() => handleViewAttachment(a)}
                      className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                      {a.mimeType?.startsWith('image/') ? <Camera size={12} /> : null}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center"><Plus size={16} className="text-white" /></div>
                <h2 className="text-base font-semibold text-slate-900">New Task</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} placeholder="Task title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inp} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assignee</label>
                <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} className={inp}>
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.userId} value={m.userId}>{m.user?.name || m.user?.email || m.userId} ({m.role})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inp}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Est. Hours</label>
                  <input type="number" min="0" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} className={inp} placeholder="0" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Materials</label>
                  <button type="button" onClick={addMaterial} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <Plus size={12} /> Add material
                  </button>
                </div>
                {form.materials.map((material, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                        <input value={material.name} onChange={(e) => updateMaterial(index, { name: e.target.value })} className={inpSm} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Source</label>
                        <select value={material.source} onChange={(e) => updateMaterial(index, { source: e.target.value as 'manual' | 'store' })} className={inpSm}>
                          <option value="manual">Manual</option>
                          <option value="store">Store</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Qty</label>
                        <input type="number" min="0" step="0.01" value={material.quantity} onChange={(e) => updateMaterial(index, { quantity: e.target.value })} className={inpSm} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Unit</label>
                        <input value={material.unit} onChange={(e) => updateMaterial(index, { unit: e.target.value })} className={inpSm} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Store item</label>
                        <select value={material.stockItemId || ''} onChange={(e) => updateMaterial(index, { stockItemId: e.target.value })} disabled={material.source !== 'store'} className={`${inpSm} disabled:opacity-50`}>
                          <option value="">Select</option>
                          {stockItems.map((item) => <option key={item.id} value={item.id}>{item.name} ({Number(item.currentQuantity).toLocaleString()} {item.unit})</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => removeMaterial(index)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all">
                  {saving ? 'Creating…' : 'Create Task'}
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
