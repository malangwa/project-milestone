import { useEffect, useState, FormEvent } from 'react';
import { projectsApi } from '../../api/projects.api';
import { resourcesApi } from '../../api/resources.api';

const RESOURCE_TYPES = ['human', 'equipment', 'material', 'software', 'other'];

const typeColors: Record<string, string> = {
  human: 'bg-blue-100 text-blue-700',
  equipment: 'bg-yellow-100 text-yellow-700',
  material: 'bg-green-100 text-green-700',
  software: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
};

const emptyForm = { name: '', type: 'human', role: '', costPerUnit: '', unit: '', quantity: '1', notes: '' };

const ResourcesPage = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    resourcesApi.getByProject(selectedProject)
      .then((res) => setResources(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      name: r.name || '',
      type: r.type || 'human',
      role: r.role || '',
      costPerUnit: r.costPerUnit != null ? String(r.costPerUnit) : '',
      unit: r.unit || '',
      quantity: r.quantity != null ? String(r.quantity) : '1',
      notes: r.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        costPerUnit: form.costPerUnit ? parseFloat(form.costPerUnit) : undefined,
        quantity: form.quantity ? parseFloat(form.quantity) : undefined,
        projectId: selectedProject,
      };
      if (editingId) {
        await resourcesApi.update(editingId, payload);
      } else {
        await resourcesApi.create(payload);
      }
      const res = await resourcesApi.getByProject(selectedProject);
      setResources(res.data?.data || res.data || []);
      setShowForm(false);
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await resourcesApi.remove(id);
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-500 text-sm mt-1">Manage project resources, personnel and materials</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            + Add Resource
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Resource' : 'Add Resource'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Lead Engineer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min="0" step="0.1" value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit ($)</label>
                  <input type="number" min="0" step="0.01" value={form.costPerUnit}
                    onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. hr, day, unit" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg">
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add Resource'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔧</p>
          <p>No resources assigned to this project yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Qty</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Cost/Unit</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => {
                const total = (r.costPerUnit ?? 0) * (r.quantity ?? 1);
                return (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{r.name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${typeColors[r.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{r.role || '—'}</td>
                    <td className="px-5 py-3.5 text-right text-gray-700">{r.quantity ?? 1} {r.unit || ''}</td>
                    <td className="px-5 py-3.5 text-right text-gray-700">
                      {r.costPerUnit != null ? `$${Number(r.costPerUnit).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                      {r.costPerUnit != null ? `$${total.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(r)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                        <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-gray-700">Total Cost</td>
                <td className="px-5 py-3 text-right font-bold text-gray-900">
                  ${resources.reduce((s, r) => s + (r.costPerUnit ?? 0) * (r.quantity ?? 1), 0).toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
