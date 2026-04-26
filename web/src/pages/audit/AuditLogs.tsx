import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { auditApi } from '../../api/audit.api';
import type { AuditLog } from '../../types/audit.types';
import { Search, Activity, AlertCircle } from 'lucide-react';

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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Track approvals, procurement changes, and other sensitive actions.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Events Loaded</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{logs.length}</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
            <p className="text-xs text-indigo-600 font-medium">Approvals</p>
            <p className="text-xl font-bold text-indigo-900 mt-1">{logs.filter((log) => log.action === 'approve').length}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
            <p className="text-xs text-emerald-600 font-medium">Procurement Events</p>
            <p className="text-xl font-bold text-emerald-900 mt-1">
              {logs.filter((log) => ['purchase_order', 'supplier_invoice', 'material_request'].includes(log.entityType)).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by action, entity, user, or ID"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
          </div>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
            {actions.map((action) => <option key={action} value={action}>{action === 'all' ? 'All actions' : action}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Activity size={22} className="text-slate-400" /></div>
          <p className="text-slate-400 font-medium">No audit events matched the current filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{log.action}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">{log.entityType}</span>
                    {log.entityId && <span className="text-xs text-slate-400 font-mono">{log.entityId}</span>}
                  </div>
                  <p className="text-sm text-slate-600">{log.user?.name || 'System'}{log.user?.email ? ` · ${log.user.email}` : ''}</p>
                </div>
                <span className="text-xs text-slate-400 font-medium shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Before</p>
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap break-words">{log.before ? JSON.stringify(log.before, null, 2) : 'No previous state'}</pre>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">After</p>
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap break-words">{log.after ? JSON.stringify(log.after, null, 2) : 'No resulting state'}</pre>
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
