import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api/axios';

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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize mt-1 inline-block">{user?.role}</span>
          </div>
        </div>
        <form onSubmit={handleProfile} className="space-y-4">
          {profileMsg && (
            <div className={`text-sm px-4 py-2.5 rounded-lg ${
              profileMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>{profileMsg}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={profile.email} disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={profileLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handlePassword} className="space-y-4">
          {pwMsg && (
            <div className={`text-sm px-4 py-2.5 rounded-lg ${
              pwMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>{pwMsg}</div>
          )}
          {[{ label: 'Current Password', key: 'current' },
            { label: 'New Password', key: 'newPass' },
            { label: 'Confirm New Password', key: 'confirm' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="password" value={passwords[key as keyof typeof passwords]}
                onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••" />
            </div>
          ))}
          <button type="submit" disabled={pwLoading}
            className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
