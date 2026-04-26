import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api/axios';
import { User, Mail, Lock, CheckCircle2, AlertCircle, Save } from 'lucide-react';

const Settings = () => {
  const { user, setAuth } = useAuthStore();
  const token = useAuthStore((s) => s.accessToken);
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileLoading(true);
    try {
      const res = await api.patch('/users/me', { name: profile.name });
      const updated = res.data?.data || res.data;
      setAuth(updated, token ?? '');
      setProfileMsg('Profile updated successfully.');
    } catch {
      setProfileMsg('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    if (passwords.newPass !== passwords.confirm) {
      setPwMsg('New passwords do not match.');
      return;
    }
    if (passwords.newPass.length < 8) {
      setPwMsg('Password must be at least 8 characters.');
      return;
    }
    setPwLoading(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.newPass });
      setPasswords({ current: '', newPass: '', confirm: '' });
      setPwMsg('Password changed successfully.');
    } catch (err: any) {
      setPwMsg(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Settings</h1>
      <p className="text-slate-500 text-sm mb-8">Manage your profile and account security</p>

      {/* Profile card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-6">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
          <User size={17} className="text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">Profile</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-200">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full capitalize mt-1 inline-block">{user?.role}</span>
            </div>
          </div>
          <form onSubmit={handleProfile} className="space-y-4">
            {profileMsg && (
              <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
                profileMsg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {profileMsg.includes('success') ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {profileMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className={`${inp} pl-10`} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={profile.email} disabled className={`${inp} pl-10 opacity-60 cursor-not-allowed`} />
              </div>
            </div>
            <button type="submit" disabled={profileLoading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all">
              <Save size={14} />
              {profileLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Password card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
          <Lock size={17} className="text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handlePassword} className="space-y-4">
            {pwMsg && (
              <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
                pwMsg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {pwMsg.includes('success') ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {pwMsg}
              </div>
            )}
            {[{ label: 'Current Password', key: 'current' },
              { label: 'New Password', key: 'newPass' },
              { label: 'Confirm New Password', key: 'confirm' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" value={passwords[key as keyof typeof passwords]}
                    onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                    className={`${inp} pl-10`} placeholder="••••••••" />
                </div>
              </div>
            ))}
            <button type="submit" disabled={pwLoading}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
              <Lock size={14} />
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
