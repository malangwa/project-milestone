import { useEffect, useState } from 'react';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { Plus, X, Users, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-indigo-100 text-indigo-700',
  engineer: 'bg-violet-100 text-violet-700',
  viewer: 'bg-slate-100 text-slate-600',
  client: 'bg-emerald-100 text-emerald-700',
  subcontractor: 'bg-amber-100 text-amber-700',
};
const avatarGrad: Record<string, string> = {
  admin: 'from-red-500 to-rose-600',
  manager: 'from-indigo-500 to-blue-600',
  engineer: 'from-violet-500 to-purple-600',
  viewer: 'from-slate-400 to-slate-500',
  client: 'from-emerald-500 to-green-600',
  subcontractor: 'from-amber-500 to-orange-500',
};

const ROLES = ['admin', 'manager', 'engineer', 'viewer', 'client', 'subcontractor'];

const EMPTY_CREATE = { name: '', email: '', password: '', role: 'engineer' };

const UsersManagement = () => {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  const reload = () => {
    setLoading(true);
    usersApi.getAll()
      .then((res) => setUsers(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setEditRole(u.role);
    setMsg('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSaving(true);
    setCreateError('');
    try {
      const res = await usersApi.createUser(createForm);
      const newUser = res.data?.data || res.data;
      setUsers((prev) => [...prev, newUser]);
      setShowCreate(false);
      setCreateForm({ ...EMPTY_CREATE });
      setMsg('User created successfully.');
    } catch (err: any) {
      const m = err.response?.data?.message;
      setCreateError(Array.isArray(m) ? m.join(', ') : (m || 'Failed to create user'));
    } finally {
      setCreateSaving(false);
    }
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await usersApi.update(id, { role: editRole });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: editRole } : u));
      setEditingId(null);
      setMsg('Role updated.');
    } catch {
      setMsg('Failed to update role.');
    } finally {
      setSaving(false);
    }
  };

  if (me?.role !== 'admin' && me?.role !== 'manager') {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center py-24">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4"><Lock size={24} className="text-slate-400" /></div>
        <p className="text-slate-500 font-medium">You don’t have permission to view this page.</p>
      </div>
    );
  }

  const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
        </div>
        {me?.role === 'admin' && (
          <button onClick={() => { setShowCreate(true); setCreateError(''); setCreateForm({ ...EMPTY_CREATE }); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all">
            <Plus size={16} /> New User
          </button>
        )}
      </div>

      {msg && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4 ${
          msg.includes('updated') || msg.includes('created') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.includes('updated') || msg.includes('created') ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {msg}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Users size={24} className="text-slate-400" /></div>
          <p className="text-slate-400 font-medium">No users yet</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Name</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Email</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Role</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Status</th>
                {me?.role === 'admin' && <th className="px-5 py-3.5" />}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarGrad[u.role] || 'from-slate-400 to-slate-500'} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">{u.name}</span>
                      {u.id === me?.id && <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-1.5 py-0.5 rounded-full">You</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3.5">
                    {editingId === u.id && me?.role === 'admin' ? (
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleColors[u.role] ?? 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {me?.role === 'admin' && (
                    <td className="px-5 py-3.5 text-right">
                      {editingId === u.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => saveEdit(u.id)} disabled={saving}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold">
                            {saving ? '…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(u)} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">Edit</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center"><Plus size={16} className="text-white" /></div>
                <h2 className="text-base font-semibold text-slate-900">Create New User</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"><AlertCircle size={14} />{createError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                <input required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className={inp} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input required type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={inp} placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
                <input required type="password" minLength={6} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className={inp} placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className={inp}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={createSaving} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all">{createSaving ? 'Creating…' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
