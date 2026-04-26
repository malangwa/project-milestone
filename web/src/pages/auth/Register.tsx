import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { Building2, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({ name: form.name, email: form.email, password: form.password });
      const { user, accessToken, refreshToken } = res.data;
      localStorage.setItem('refresh_token', refreshToken);
      setAuth(user, accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-slate-50 focus:bg-white transition-colors';

  const fields: { label: string; key: keyof typeof form; type: string; placeholder: string; Icon: React.ElementType }[] = [
    { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe', Icon: User },
    { label: 'Email address', key: 'email', type: 'email', placeholder: 'you@company.com', Icon: Mail },
    { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••', Icon: Lock },
    { label: 'Confirm Password', key: 'confirmPassword', type: 'password', placeholder: '••••••••', Icon: Lock },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 60%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #3b82f6 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">Milestone</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Start managing<br />smarter today
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Join teams already tracking projects, tasks, and expenses with Milestone.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {['Track projects from start to finish', 'Manage budgets & expenses in real time', 'Collaborate with your whole team', 'Generate reports & insights instantly'].map((feat) => (
            <div key={feat} className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-indigo-400 shrink-0" />
              <span className="text-slate-300 text-sm">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Milestone</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm mb-8">Get started — it's free</p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ label, key, type, placeholder, Icon }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={type}
                    required
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className={inp}
                    placeholder={placeholder}
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Creating account…
                </span>
              ) : (
                <>Create account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
