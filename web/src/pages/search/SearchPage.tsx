import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../../api/search.api';
import { Search, ChevronRight, Layers } from 'lucide-react';

type ResultItem = {
  id: string;
  label: string;
  subtitle: string;
  type: 'project' | 'task' | 'issue' | 'milestone';
  href: string;
};

const typeColor: Record<string, string> = {
  project: 'bg-indigo-100 text-indigo-700',
  task: 'bg-violet-100 text-violet-700',
  issue: 'bg-red-100 text-red-700',
  milestone: 'bg-emerald-100 text-emerald-700',
};

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchApi.search(q);
      const data = res.data?.data || res.data || {};
      const all: ResultItem[] = [
        ...(data.projects || []).map((p: any) => ({
          id: p.id, label: p.title, subtitle: p.status ?? '',
          type: 'project' as const, href: `/projects/${p.id}`,
        })),
        ...(data.milestones || []).map((m: any) => ({
          id: m.id, label: m.title, subtitle: `Milestone · ${m.status ?? ''}`,
          type: 'milestone' as const, href: `/projects/${m.projectId}`,
        })),
        ...(data.tasks || []).map((t: any) => ({
          id: t.id, label: t.title, subtitle: `Task · ${t.status ?? ''}`,
          type: 'task' as const, href: `/tasks`,
        })),
        ...(data.issues || []).map((i: any) => ({
          id: i.id, label: i.title, subtitle: `Issue · ${i.status ?? ''}`,
          type: 'issue' as const, href: `/issues`,
        })),
      ];
      setResults(all);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') runSearch();
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Search</h1>
      <p className="text-slate-500 text-sm mb-6">Find projects, tasks, milestones, and issues</p>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKey}
            placeholder="Search projects, tasks, milestones, issues…"
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
        </div>
        <button onClick={runSearch} disabled={!query.trim() || loading}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all">
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Search size={20} className="text-slate-400" /></div>
          <p className="text-slate-400 font-medium">No results for “{query}”</p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <Link key={`${r.type}-${r.id}`} to={r.href}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:border-indigo-200 hover:shadow-sm transition-all group">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${typeColor[r.type]}`}>{r.type}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{r.label}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5 capitalize">{r.subtitle}</p>
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {!searched && (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Layers size={24} className="text-slate-400" /></div>
          <p className="text-slate-400 font-medium">Type to search across all your projects</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
