import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi } from '../../api/projects.api';
import { milestonesApi } from '../../api/milestones.api';
import { tasksApi } from '../../api/tasks.api';
import { expensesApi } from '../../api/expenses.api';
import { materialRequestsApi } from '../../api/material-requests.api';
import { issuesApi } from '../../api/issues.api';
import { resourcesApi } from '../../api/resources.api';
import { inventoryApi } from '../../api/procurement.api';
import { ProcurementPanel } from '../../components/projects/ProcurementPanel';
import type { MaterialRequest, Project, ProjectMember } from '../../types/project.types';
import type { StockItem } from '../../types/procurement.types';
import { useAuthStore } from '../../store/auth.store';
import { attachmentsApi } from '../../api/attachments.api';
import api from '../../api/axios';

const statusColor: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

type Tab = 'overview' | 'members' | 'milestones' | 'tasks' | 'expenses' | 'materials' | 'resources' | 'procurement' | 'issues' | 'files' | 'comments' | 'activity';

type MaterialRequestFormItem = {
  name: string;
  quantity: string;
  unit: string;
  estimatedCost: string;
  notes: string;
};

type MaterialRequestFormState = {
  title: string;
  purpose: string;
  notes: string;
  items: MaterialRequestFormItem[];
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [projectExpenses, setProjectExpenses] = useState<any[]>([]);
  const [projectMaterialRequests, setProjectMaterialRequests] = useState<MaterialRequest[]>([]);
  const isOwner = !!user && !!project && user.id === project.ownerId;
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  const canEdit = isAdminOrManager || isOwner;
  const canApprove = isAdminOrManager || isOwner;
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: '', role: 'engineer' });
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [materialForm, setMaterialForm] = useState<MaterialRequestFormState>({
    title: '',
    purpose: '',
    notes: '',
    items: [{ name: '', quantity: '1', unit: '', estimatedCost: '', notes: '' }],
  });
  const [materialSaving, setMaterialSaving] = useState(false);
  const [materialError, setMaterialError] = useState('');
  const [selectedMaterialRequestId, setSelectedMaterialRequestId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentPhoto, setCommentPhoto] = useState<File | null>(null);
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentAttachments, setCommentAttachments] = useState<Record<string, any[]>>({});
  const [activities, setActivities] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', location: '', status: '', industry: '', budget: '', givenCash: '', startDate: '', endDate: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<Record<string, string>>({});
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [taskMembers, setTaskMembers] = useState<ProjectMember[]>([]);
  const [taskStockItems, setTaskStockItems] = useState<StockItem[]>([]);
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskMaterials, setTaskMaterials] = useState([{ name: '', unit: '', quantity: '', source: 'manual', stockItemId: '' }]);

  useEffect(() => {
    if (!id) return;
    projectsApi.getOne(id).then((res) => setProject(res.data?.data || res.data)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    expensesApi.getByProject(id)
      .then((res) => setProjectExpenses(res.data?.data || res.data || []))
      .catch(() => setProjectExpenses([]));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    materialRequestsApi.getByProject(id)
      .then((res) => setProjectMaterialRequests(res.data?.data || res.data || []))
      .catch(() => setProjectMaterialRequests([]));
  }, [id]);

  useEffect(() => {
    if (!id || tab === 'overview' || tab === 'comments' || tab === 'activity' || tab === 'procurement' || tab === 'files') return;
    setTabLoading(true);
    const fetchers: Partial<Record<Tab, () => Promise<any>>> = {
      milestones: () => milestonesApi.getByProject(id),
      tasks: () => Promise.all([
        tasksApi.getByProject(id),
        projectsApi.getMembers(id),
        inventoryApi.getByProject(id),
      ]),
      expenses: () => expensesApi.getByProject(id),
      materials: () => materialRequestsApi.getByProject(id),
      resources: () => resourcesApi.getByProject(id),
      issues: () => issuesApi.getByProject(id),
      members: () => projectsApi.getMembers(id),
    };
    const fetchTabData = fetchers[tab];
    if (!fetchTabData) {
      setData([]);
      setTabLoading(false);
      return;
    }
    fetchTabData()
      .then((res) => {
        if (tab === 'tasks' && Array.isArray(res)) {
          const [tasksRes, membersRes, stockRes] = res;
          setData(tasksRes.data?.data || tasksRes.data || []);
          setTaskMembers(membersRes.data?.data || membersRes.data || []);
          setTaskStockItems(stockRes.data?.data || stockRes.data || []);
          return;
        }
        setData(res.data?.data || res.data || []);
      })
      .catch(() => setData([]))
      .finally(() => setTabLoading(false));
  }, [tab, id]);

  useEffect(() => {
    if (!id || (tab !== 'comments' && tab !== 'overview')) return;
    api.get(`/comments?entityType=project&entityId=${id}`)
      .then((res) => setComments(res.data?.data || res.data || []))
      .catch(() => {});
  }, [tab, id]);

  useEffect(() => {
    if (!id) return;
    if (tab !== 'files' && tab !== 'overview') return;
    attachmentsApi.getByEntity('project', id)
      .then((res) => setAttachments(res.data?.data || res.data || []))
      .catch(() => setAttachments([]));
  }, [tab, id]);

  useEffect(() => {
    if (!id || tab !== 'activity') return;
    api.get(`/activities/project/${id}?limit=50`)
      .then((res) => setActivities(res.data?.data || res.data || []))
      .catch(() => {});
  }, [tab, id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !id) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const res = await attachmentsApi.upload(file, 'project', id);
        const created = res.data?.data || res.data;
        setAttachments((prev) => [...prev, created]);
      }
    } catch {} finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (attachment: any) => {
    try {
      const res = await attachmentsApi.getDownloadUrl(attachment.id);
      const url = res.data?.url || res.data?.data?.url;
      if (url) window.open(url, '_blank');
    } catch {
      if (attachment.url) window.open(attachment.url, '_blank');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Delete this file?')) return;
    await attachmentsApi.remove(attachmentId);
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const postComment = async () => {
    if ((!commentText.trim() && !commentPhoto) || !id) return;
    setCommentSaving(true);
    try {
      const content = commentText.trim() || (commentPhoto ? `📷 Photo update: ${commentPhoto.name}` : '');
      const res = await api.post('/comments', { entityType: 'project', entityId: id, content });
      const created = res.data?.data || res.data;
      if (commentPhoto && created?.id) {
        try {
          const uploadRes = await attachmentsApi.upload(commentPhoto, 'comment', created.id);
          const uploaded = uploadRes.data?.data || uploadRes.data;
          setCommentAttachments((prev) => ({ ...prev, [created.id]: [uploaded] }));
        } catch {}
      }
      setComments((prev) => [...prev, created]);
      setCommentText('');
      setCommentPhoto(null);
    } catch {} finally {
      setCommentSaving(false);
    }
  };

  const loadCommentAttachments = async (commentId: string) => {
    try {
      const res = await attachmentsApi.getByEntity('comment', commentId);
      const list = res.data?.data || res.data || [];
      if (list.length > 0) setCommentAttachments((prev) => ({ ...prev, [commentId]: list }));
    } catch {}
  };

  useEffect(() => {
    comments.forEach((c) => {
      if (!commentAttachments[c.id]) loadCommentAttachments(c.id);
    });
  }, [comments]);

  const deleteComment = async (commentId: string) => {
    await api.delete(`/comments/${commentId}`);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: 'Members' },
    { key: 'milestones', label: 'Milestones' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'materials', label: 'Materials' },
    { key: 'resources', label: 'Engineer Tools' },
    { key: 'procurement', label: 'Procurement' },
    { key: 'issues', label: 'Issues' },
    { key: 'files', label: `Files${attachments.length > 0 ? ` (${attachments.length})` : ''}` },
    { key: 'comments', label: `Updates${comments.length > 0 ? ` (${comments.length})` : ''}` },
    { key: 'activity', label: 'Activity' },
  ];

  const openEdit = () => {
    if (!project) return;
    setEditForm({
      name: project.name,
      description: project.description || '',
      location: project.location || '',
      status: project.status,
      industry: project.industry,
      budget: project.budget ? String(project.budget) : '',
      givenCash: project.givenCash ? String(project.givenCash) : '',
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
        givenCash: editForm.givenCash ? Number(editForm.givenCash) : 0,
        location: editForm.location.trim() || undefined,
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
    if (tab === 'tasks') {
      setTaskAssigneeId('');
      setTaskMaterials([{ name: '', unit: '', quantity: '', source: 'manual', stockItemId: '' }]);
    }
    setCreateError('');
    setShowCreate(true);
  };

  const updateTaskMaterial = (index: number, patch: Partial<(typeof taskMaterials)[number]>) => {
    setTaskMaterials((prev) => prev.map((material, currentIndex) => (currentIndex === index ? { ...material, ...patch } : material)));
  };

  const addTaskMaterial = () => {
    setTaskMaterials((prev) => [...prev, { name: '', unit: '', quantity: '', source: 'manual', stockItemId: '' }]);
  };

  const removeTaskMaterial = (index: number) => {
    setTaskMaterials((prev) => prev.length === 1 ? prev : prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const projectBudget = Number(project?.budget || 0);
  const spentSoFar = projectExpenses
    .filter((expense) => expense.status === 'approved')
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const givenCash = Number(project?.givenCash || 0);
  const approvedMaterialCommitment = projectMaterialRequests
    .filter((request) => request.status === 'approved')
    .reduce((sum, request) => sum + Number(request.requestedAmount || 0), 0);
  const remainingOwed = Math.max(0, projectBudget - givenCash);
  const overBudget = Math.max(0, givenCash - projectBudget);
  const editedBudget = Number(editForm.budget || 0);
  const editedGivenCash = Number(editForm.givenCash || 0);
  const editedRemaining = Math.max(0, editedBudget - editedGivenCash);
  const recentComments = comments.slice(-5).reverse();

  const money = (value: number | string | null | undefined) => `$${Number(value ?? 0).toLocaleString()}`;

  const stripEmpty = (obj: Record<string, string>) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined));

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setMemberSaving(true);
    setMemberError('');
    try {
      await projectsApi.addMember(id, memberForm);
      const res = await projectsApi.getMembers(id);
      setData(res.data?.data || res.data || []);
      setMemberForm({ email: '', role: 'engineer' });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setMemberError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to add member'));
    } finally {
      setMemberSaving(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!id) return;
    await projectsApi.removeMember(id, memberUserId);
    const res = await projectsApi.getMembers(id);
    setData(res.data?.data || res.data || []);
  };

  const resetMaterialForm = () => {
    setMaterialForm({
      title: '',
      purpose: '',
      notes: '',
      items: [{ name: '', quantity: '1', unit: '', estimatedCost: '', notes: '' }],
    });
  };

  const addMaterialItem = () => {
    setMaterialForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: '1', unit: '', estimatedCost: '', notes: '' }],
    }));
  };

  const removeMaterialItem = (index: number) => {
    setMaterialForm((prev) => {
      if (prev.items.length === 1) return prev;
      return { ...prev, items: prev.items.filter((_, itemIndex) => itemIndex !== index) };
    });
  };

  const updateMaterialItem = (index: number, field: keyof MaterialRequestFormItem, value: string) => {
    setMaterialForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  };

  const refreshMaterialRequests = async () => {
    if (!id) return;
    const res = await materialRequestsApi.getByProject(id);
    const requests = res.data?.data || res.data || [];
    setProjectMaterialRequests(requests);
    setData(requests);
  };

  const handleCreateMaterialRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setMaterialSaving(true);
    setMaterialError('');
    try {
      const items = materialForm.items.map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity),
        unit: item.unit.trim(),
        estimatedCost: Number(item.estimatedCost),
        notes: item.notes.trim() || undefined,
      }));
      await materialRequestsApi.create(id, {
        title: materialForm.title.trim(),
        purpose: materialForm.purpose.trim() || undefined,
        notes: materialForm.notes.trim() || undefined,
        items,
      });
      resetMaterialForm();
      await refreshMaterialRequests();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setMaterialError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to create material request'));
    } finally {
      setMaterialSaving(false);
    }
  };

  const handleMaterialRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      await materialRequestsApi.approve(requestId);
    } else {
      await materialRequestsApi.reject(requestId);
    }
    await refreshMaterialRequests();
  };

  const openProcurementFromRequest = (requestId: string) => {
    setSelectedMaterialRequestId(requestId);
    setTab('procurement');
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setCreateSaving(true);
    setCreateError('');
    try {
      const clean = stripEmpty(createForm);
      if (tab === 'tasks') {
        const materials = taskMaterials
          .filter((material) => material.name.trim() && material.unit.trim() && Number(material.quantity) > 0)
          .map((material) => ({
            name: material.name.trim(),
            unit: material.unit.trim(),
            quantity: Number(material.quantity),
            source: material.source,
            stockItemId: material.source === 'store' ? material.stockItemId || undefined : undefined,
            stockItemName: material.source === 'store'
              ? taskStockItems.find((item) => item.id === material.stockItemId)?.name
              : undefined,
          }));

        await tasksApi.create({ ...clean, projectId: id, assignedToId: taskAssigneeId || undefined, materials });
      }
      if (tab === 'milestones') await milestonesApi.create({ ...clean, projectId: id });
      if (tab === 'issues') await issuesApi.create({ ...clean, projectId: id });
      if (tab === 'expenses') await expensesApi.create({ ...clean, amount: Number(clean.amount), projectId: id });
      setShowCreate(false);
      setCreateError('');
      const fetchers: Record<string, () => Promise<any>> = {
        milestones: () => milestonesApi.getByProject(id!),
        tasks: () => tasksApi.getByProject(id!),
        expenses: () => expensesApi.getByProject(id!),
        issues: () => issuesApi.getByProject(id!),
      };
      fetchers[tab]().then((res) => setData(res.data?.data || res.data || []));
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setCreateError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to create'));
    } finally { setCreateSaving(false); }
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
            {project.location && <span>{project.location}</span>}
            {project.budget > 0 && <span>Budget: {money(projectBudget)}</span>}
            <span>Given Cash: {money(givenCash)}</span>
            <span>Spent: {money(spentSoFar)}</span>
            <span>Materials: {money(approvedMaterialCommitment)}</span>
            <span>Owed: {money(remainingOwed)}</span>
            {project.startDate && <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>}
            {project.endDate && <span>End: {new Date(project.endDate).toLocaleDateString()}</span>}
          </div>
          {overBudget > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              <span className="font-semibold">Budget exceeded</span>
              <span>by {money(overBudget)}</span>
            </div>
          )}
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
        <div className="space-y-6">
          {/* Budget Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Total Budget</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{project.budget > 0 ? money(projectBudget) : 'N/A'}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Given (Expenses)</p>
              <p className="text-xl font-bold text-green-600 mt-1">{money(givenCash)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Spent</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{money(spentSoFar)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Materials Approved</p>
              <p className="text-xl font-bold text-indigo-600 mt-1">{money(approvedMaterialCommitment)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Remaining</p>
              <p className={`text-xl font-bold mt-1 ${remainingOwed > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{money(remainingOwed)}</p>
            </div>
            <div className={`border rounded-xl p-4 ${overBudget > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-xs ${overBudget > 0 ? 'text-red-600' : 'text-green-600'}`}>Status</p>
              <p className={`text-xl font-bold mt-1 ${overBudget > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {overBudget > 0 ? `-${money(overBudget)}` : 'On track'}
              </p>
            </div>
          </div>

          {/* Budget progress bar */}
          {projectBudget > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Budget utilization</span>
                <span>{Math.min(100, Math.round((givenCash / projectBudget) * 100))}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-3 rounded-full transition-all ${givenCash > projectBudget ? 'bg-red-500' : givenCash > projectBudget * 0.8 ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, (givenCash / projectBudget) * 100)}%` }} />
              </div>
            </div>
          )}

          {/* Project info cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{ label: 'Industry', value: project.industry },
              { label: 'Location', value: project.location || 'N/A' },
              { label: 'Status', value: project.status.replace('_', ' ') },
              { label: 'Created', value: new Date(project.createdAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-semibold text-gray-900 mt-1 capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* Quick Upload Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Project Files & Photos</h3>
                <p className="text-xs text-gray-500 mt-0.5">Upload progress photos, receipts, documents</p>
              </div>
              <div className="flex gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Upload
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={() => setTab('files')} className="text-sm text-blue-600 hover:text-blue-700 px-3 py-2 border border-blue-200 rounded-lg hover:bg-blue-50">
                  View all ({attachments.length})
                </button>
              </div>
            </div>
            {attachments.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.slice(0, 6).map((a: any) => (
                  <button key={a.id} onClick={() => handleDownload(a)}
                    className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                    {a.mimeType?.startsWith('image/') ? '🖼️' : a.mimeType?.includes('pdf') ? '📄' : '📎'}
                    <span className="truncate max-w-[120px]">{a.filename}</span>
                  </button>
                ))}
                {attachments.length > 6 && <span className="text-xs text-gray-400 self-center">+{attachments.length - 6} more</span>}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-2">No files uploaded yet. Upload progress photos, receipts, or documents.</p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Continuous Progress Log</h3>
                <p className="text-xs text-gray-500 mt-0.5">Post field updates here and they will also appear in reports.</p>
              </div>
              <button onClick={() => setTab('comments')} className="text-sm text-blue-600 hover:text-blue-700 px-3 py-2 border border-blue-200 rounded-lg hover:bg-blue-50">
                View all updates
              </button>
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share progress, milestones achieved, issues encountered..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {commentPhoto && (
              <div className="mt-2 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-xs text-blue-700">📷 {commentPhoto.name}</span>
                <button onClick={() => setCommentPhoto(null)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <label className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Add photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setCommentPhoto(e.target.files?.[0] || null)} />
              </label>
              <button onClick={postComment} disabled={(!commentText.trim() && !commentPhoto) || commentSaving}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {commentSaving ? 'Posting...' : 'Post Update'}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {recentComments.length === 0 ? (
                <p className="text-sm text-gray-400">No progress updates yet. Post the first one.</p>
              ) : (
                recentComments.map((c) => {
                  const cPhotos = commentAttachments[c.id] || [];
                  return (
                    <div key={c.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-gray-900">{c.author?.name ?? 'Unknown'}</span>
                        <span className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{c.content}</p>
                      {cPhotos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {cPhotos.map((a: any) => (
                            <button key={a.id} onClick={() => handleDownload(a)}
                              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                              {a.mimeType?.startsWith('image/') ? '🖼️' : '📎'} {a.filename}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-4">
          {canEdit && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invite by email</label>
                  <input
                    required
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['manager', 'engineer', 'viewer', 'client', 'subcontractor'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={memberSaving}
                  className="px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {memberSaving ? 'Adding...' : 'Add Member'}
                </button>
              </form>
              {memberError && <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{memberError}</div>}
            </div>
          )}

          {tabLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No members added to this project yet.</div>
          ) : (
            <div className="space-y-2">
              {data.map((item: ProjectMember) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.user?.name ?? item.user?.email ?? item.userId}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.user?.email ?? ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{item.role}</span>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveMember(item.userId)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'comments' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Post a progress update</p>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share progress, milestones achieved, issues encountered..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {commentPhoto && (
              <div className="mt-2 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-xs text-blue-700">📷 {commentPhoto.name}</span>
                <button onClick={() => setCommentPhoto(null)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <label className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Add photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setCommentPhoto(e.target.files?.[0] || null)} />
              </label>
              <button onClick={postComment} disabled={(!commentText.trim() && !commentPhoto) || commentSaving}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {commentSaving ? 'Posting...' : 'Post Update'}
              </button>
            </div>
          </div>
          {comments.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No progress updates yet. Post the first one!</div>
          ) : (
            comments.map((c) => {
              const cPhotos = commentAttachments[c.id] || [];
              return (
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
                {cPhotos.length > 0 && (
                  <div className="ml-9 mt-2 flex flex-wrap gap-2">
                    {cPhotos.map((a: any) => (
                      <button key={a.id} onClick={() => handleDownload(a)}
                        className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                        {a.mimeType?.startsWith('image/') ? '🖼️' : '📎'} {a.filename}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              );
            })
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

      {tab === 'materials' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Material Request</h2>
              <p className="text-sm text-gray-500 mt-1">Build a material list and send it for fund approval.</p>
            </div>

            {materialError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {materialError}
              </div>
            )}

            <form onSubmit={handleCreateMaterialRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    required
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Cement and steel for foundation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <input
                    value={materialForm.purpose}
                    onChange={(e) => setMaterialForm({ ...materialForm, purpose: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Short reason for the request"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={materialForm.notes}
                  onChange={(e) => setMaterialForm({ ...materialForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Optional context for approvers"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Material List</label>
                  <button
                    type="button"
                    onClick={addMaterialItem}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Add item
                  </button>
                </div>

                {materialForm.items.map((item, index) => (
                  <div key={`${index}-${item.name}`} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Item {index + 1}</p>
                      {materialForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMaterialItem(index)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        required
                        value={item.name}
                        onChange={(e) => updateMaterialItem(index, 'name', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Item name"
                      />
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateMaterialItem(index, 'quantity', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Qty"
                      />
                      <input
                        required
                        value={item.unit}
                        onChange={(e) => updateMaterialItem(index, 'unit', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Unit"
                      />
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.estimatedCost}
                        onChange={(e) => updateMaterialItem(index, 'estimatedCost', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Estimated cost"
                      />
                    </div>

                    <textarea
                      value={item.notes}
                      onChange={(e) => updateMaterialItem(index, 'notes', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Item notes"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={materialSaving}
                  className="px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {materialSaving ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>

          {tabLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No material requests yet.</div>
          ) : (
            <div className="space-y-3">
              {data.map((request: MaterialRequest) => {
                const requestItems = Array.isArray(request.items) ? request.items : [];

                return (
                <div key={request.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{request.title}</p>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : request.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      {request.purpose && <p className="text-sm text-gray-500 mt-1">{request.purpose}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Requested by {request.requestedBy?.name ?? request.requestedById} · {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">${Number(request.requestedAmount).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">Total requested</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {requestItems.map((item) => (
                      <div key={item.id ?? `${item.name}-${item.unit}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                          {item.notes && <p className="text-xs text-gray-400 mt-1">{item.notes}</p>}
                        </div>
                        <p className="text-sm font-semibold text-gray-900">${Number(item.estimatedCost).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {canEdit && request.status === 'approved' && (
                    <div className="flex items-center justify-end gap-2">
                      <label className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer inline-flex items-center gap-1">
                        📎 Upload Receipt
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={async (ev) => {
                          const f = ev.target.files?.[0];
                          if (f) {
                            await attachmentsApi.upload(f, 'material_request', request.id);
                            ev.target.value = '';
                          }
                        }} />
                      </label>
                      <button
                        type="button"
                        onClick={() => openProcurementFromRequest(request.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Create Purchase Order
                      </button>
                    </div>
                  )}

                  {canApprove && request.status === 'pending' && (
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleMaterialRequestAction(request.id, 'reject')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMaterialRequestAction(request.id, 'approve')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'resources' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Engineer Tools / Resources</h2>
              <p className="text-sm text-gray-500 mt-1">Project personnel, equipment, and materials used on this project.</p>
            </div>
            <Link to="/resources" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Open full resources page
            </Link>
          </div>

          {tabLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No resources assigned to this project yet.</div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Type</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600">Qty</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600">Cost/Unit</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any) => {
                    const total = (item.costPerUnit ?? 0) * (item.quantity ?? 1);
                    return (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{item.name}</td>
                        <td className="px-5 py-3.5 text-gray-500 capitalize">{item.type}</td>
                        <td className="px-5 py-3.5 text-gray-500">{item.role || '—'}</td>
                        <td className="px-5 py-3.5 text-right text-gray-700">{item.quantity ?? 1} {item.unit || ''}</td>
                        <td className="px-5 py-3.5 text-right text-gray-700">{item.costPerUnit != null ? `$${Number(item.costPerUnit).toLocaleString()}` : '—'}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-gray-900">${Number(total).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'procurement' && id && (
        <ProcurementPanel projectId={id} canApprove={canApprove} canEdit={canEdit} initialMaterialRequestId={selectedMaterialRequestId} />
      )}

      {tab === 'files' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Project Files</h2>
                <p className="text-sm text-gray-500 mt-1">Upload and manage files for this project (max 25 MB per file).</p>
              </div>
              <label className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                uploading ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                {uploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Upload Files
                  </>
                )}
                <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {attachments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <p>No files uploaded yet. Click "Upload Files" to add documents, images, or other files.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((a: any) => (
                <div key={a.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      {a.mimeType?.startsWith('image/') ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      ) : a.mimeType?.includes('pdf') ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{a.filename}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>{a.mimeType}</span>
                        {a.size && <span>{(a.size / 1024).toFixed(1)} KB</span>}
                        <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleDownload(a)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                      Download
                    </button>
                    {canEdit && (
                      <button onClick={() => handleDeleteAttachment(a.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab !== 'overview' && tab !== 'members' && tab !== 'materials' && tab !== 'resources' && tab !== 'procurement' && tab !== 'files' && tab !== 'comments' && tab !== 'activity' && (
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
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.assignedTo?.name || 'Unassigned'}</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {item.materials?.length ? `${item.materials.length} material${item.materials.length !== 1 ? 's' : ''}` : 'No materials'}
                        </span>
                      </div>
                      {item.materials?.length ? (
                        <div className="mt-2 space-y-1 text-xs text-gray-500">
                          {item.materials.slice(0, 2).map((material: any, index: number) => (
                            <p key={`${item.id}-material-${index}`}>
                              {material.quantity} {material.unit} {material.name}
                              {material.source === 'store' && material.stockItemName ? ` · from ${material.stockItemName}` : ''}
                            </p>
                          ))}
                        </div>
                      ) : null}
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
                          <button onClick={async () => { await expensesApi.approve(item.id); setData((prev: any[]) => prev.map((e) => e.id === item.id ? { ...e, status: 'approved' } : e)); }}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">✓</button>
                          <button onClick={async () => { await expensesApi.reject(item.id); setData((prev: any[]) => prev.map((e) => e.id === item.id ? { ...e, status: 'rejected' } : e)); }}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Project location" />
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
                <div className="rounded-lg bg-gray-50 px-4 py-3 border border-gray-200">
                  <p className="text-xs text-gray-500">Given Cash</p>
                  <p className="font-semibold text-gray-900 mt-1">{money(editedGivenCash)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3 border border-gray-200">
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="font-semibold text-gray-900 mt-1">{money(editedRemaining)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Given Cash ($)</label>
                <input type="number" min="0" value={editForm.givenCash}
                  onChange={(e) => setEditForm({ ...editForm, givenCash: e.target.value })}
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
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{createError}</div>
              )}
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
              {tab === 'tasks' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <select value={taskAssigneeId} onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Unassigned</option>
                    {taskMembers.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.user?.name || member.user?.email || member.userId} ({member.role})
                      </option>
                    ))}
                  </select>
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
              {tab === 'tasks' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Assigned Materials</label>
                    <button type="button" onClick={addTaskMaterial} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                      + Add material
                    </button>
                  </div>
                  {taskMaterials.map((material, index) => (
                    <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                          <input value={material.name} onChange={(e) => updateTaskMaterial(index, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
                          <select value={material.source} onChange={(e) => updateTaskMaterial(index, { source: e.target.value as 'manual' | 'store' })}
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
                            onChange={(e) => updateTaskMaterial(index, { quantity: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                          <input value={material.unit} onChange={(e) => updateTaskMaterial(index, { unit: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Store item</label>
                          <select value={material.stockItemId || ''} disabled={material.source !== 'store'}
                            onChange={(e) => updateTaskMaterial(index, { stockItemId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                            <option value="">Select item</option>
                            {taskStockItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({Number(item.currentQuantity).toLocaleString()} {item.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button type="button" onClick={() => removeTaskMaterial(index)} className="text-xs text-red-500 hover:text-red-700">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
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
