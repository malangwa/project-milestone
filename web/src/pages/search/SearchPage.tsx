import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../../api/search.api';

type ResultItem = {
  id: string;
  label: string;
  subtitle: string;
  type: 'project' | 'task' | 'issue' | 'milestone';
  href: string;
};

const typeColor: Record<string, string> = {
  project: 'bg-blue-100 text-blue-700',
  task: 'bg-purple-100 text-purple-700',
  issue: 'bg-red-100 text-red-700',
  milestone: 'bg-green-100 text-green-700',
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
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Search</h1>

      <div className="flex gap-3 mb-6">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Search projects, tasks, milestones, issues..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={runSearch} disabled={!query.trim() || loading}
          className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No results for "{query}".</div>
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <Link key={`${r.type}-${r.id}`} to={r.href}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-blue-200 transition-colors">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${typeColor[r.type]}`}>
                {r.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{r.label}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5 capitalize">{r.subtitle}</p>
              </div>
              <span className="text-gray-400 text-sm">→</span>
            </Link>
          ))}
        </div>
      )}

      {!searched && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>Type to search across all your projects.</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
