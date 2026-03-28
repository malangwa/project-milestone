import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { auditApi } from '../../api/audit.api';
import type { AuditLog } from '../../types/audit.types';

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    auditApi
      .getAll(200)
      .then((res) => setLogs(res.data?.data || res.data || []))
      .catch((err: unknown) => {
        if (axios.isAxiosError(err)) {
          const msg = err.response?.data?.message;
          setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to load audit logs'));
          return;
        }

        setError('Failed to load audit logs');
      })
      .finally(() => setLoading(false));
  }, []);

  const actions = useMemo(
    () => ['all', ...Array.from(new Set(logs.map((log) => log.action))).sort()],
    [logs],
  );

  const filteredLogs = useMemo(() => {
    const term = query.trim().toLowerCase();

    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false;
      }

      if (!term) return true;

      return [log.action, log.entityType, log.entityId, log.user?.name, log.user?.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [actionFilter, logs, query]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Track approvals, procurement changes, and other sensitive actions.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs text-gray-500">Events Loaded</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{logs.length}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-600">Approvals</p>
            <p className="text-xl font-bold text-blue-900 mt-1">{logs.filter((log) => log.action === 'approve').length}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs text-emerald-600">Procurement Events</p>
            <p className="text-xl font-bold text-emerald-900 mt-1">
              {logs.filter((log) => ['purchase_order', 'supplier_invoice', 'material_request'].includes(log.entityType)).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by action, entity, user, or ID"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {actions.map((action) => (
              <option key={action} value={action}>
                {action === 'all' ? 'All actions' : action}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400">
          No audit events matched the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {log.action}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {log.entityType}
                    </span>
                    {log.entityId && <span className="text-xs text-gray-400">{log.entityId}</span>}
                  </div>
                  <p className="text-sm text-gray-600">
                    {log.user?.name || 'System'} {log.user?.email ? `(${log.user.email})` : ''}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Before</p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                    {log.before ? JSON.stringify(log.before, null, 2) : 'No previous state'}
                  </pre>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">After</p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                    {log.after ? JSON.stringify(log.after, null, 2) : 'No resulting state'}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
