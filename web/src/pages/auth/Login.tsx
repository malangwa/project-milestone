import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { Building2, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(form);
      const { user, accessToken, refreshToken } = res.data;
      localStorage.setItem('refresh_token', refreshToken);
      setAuth(user, accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #6366f1 0%, transparent 50%), radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">Milestone</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage projects<br />with confidence
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Track milestones, expenses, materials, and your entire team — all in one place.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'Active Projects', value: '24+' },
            { label: 'Tasks Tracked', value: '1.2k' },
            { label: 'Team Members', value: '80+' },
            { label: 'Expenses Logged', value: '$2M+' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Milestone</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to continue to your workspace</p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-50 focus:bg-white transition-colors"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-50 focus:bg-white transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Signing in…
                </span>
              ) : (
                <>Sign in <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
