import { useEffect, useState } from 'react';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  engineer: 'bg-purple-100 text-purple-700',
  viewer: 'bg-gray-100 text-gray-600',
  client: 'bg-green-100 text-green-700',
  subcontractor: 'bg-yellow-100 text-yellow-700',
};

const ROLES = ['admin', 'manager', 'engineer', 'viewer', 'client', 'subcontractor'];

const UsersManagement = () => {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

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
      <div className="p-6 text-center text-gray-400 py-16">
        <p className="text-4xl mb-3">🔒</p>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm mt-1">Manage team members and roles</p>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-2.5 rounded-lg mb-4 ${
          msg.includes('updated') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>{msg}</div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                {me?.role === 'admin' && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                      {u.id === me?.id && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">You</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3.5">
                    {editingId === u.id && me?.role === 'admin' ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleColors[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {me?.role === 'admin' && (
                    <td className="px-5 py-3.5 text-right">
                      {editingId === u.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => saveEdit(u.id)} disabled={saving}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {saving ? '...' : 'Save'}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(u)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          Edit
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
