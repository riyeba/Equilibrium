import React, { useState, useEffect } from 'react';
import { api, useAuth, useSettings } from '../App';
import { Save, Lock, CheckCircle } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { settings, refreshSettings } = useSettings();
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => { if (settings) setForm({ ...settings }); }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await api.saveSettings(form);
    await refreshSettings();
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePw = async () => {
    setPwError(''); setPwMsg('');
    if (!pwForm.current) { setPwError('Enter current password'); return; }
    if (pwForm.newPw.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match'); return; }

    // Correct: check result.success (not result.username)
    const verify = await api.login({ username: user.username, password: pwForm.current });
    if (!verify || !verify.success) { setPwError('Current password is incorrect'); return; }

    await api.changePassword({ userId: user.id, newPassword: pwForm.newPw });
    setPwMsg('Password changed successfully!');
    setPwForm({ current: '', newPw: '', confirm: '' });
  };

  const fields = [
    ['school_name',       'School Name'],
    ['school_address',    'School Address'],
    ['school_phone',      'Phone Numbers'],
    ['school_email',      'Email Address'],
    ['chairman_name',     "Chairman's Name"],
    ['current_term',      'Current Term'],
    ['current_year',      'Academic Year (e.g. 2024/2025)'],
    ['admission_counter', 'Admission Counter (e.g. 1000)'],
    ['admission_prefix',  'Admission Prefix (e.g. TEA)'],
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* School Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-5">School Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(([key, label]) => (
            <div key={key} className={key === 'school_address' || key === 'school_name' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{label}</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${saved ? 'bg-green-500 text-white' : 'bg-blue-900 hover:bg-blue-700 text-white'} disabled:opacity-60`}>
            {saved
              ? <><CheckCircle size={14} /> Saved!</>
              : <><Save size={14} />{saving ? 'Saving...' : 'Save Settings'}</>}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-5">Change Password</h2>
        {pwError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{pwError}</div>
        )}
        {pwMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">{pwMsg}</div>
        )}
        <div className="space-y-4">
          {[['current', 'Current Password'], ['newPw', 'New Password'], ['confirm', 'Confirm New Password']].map(([k, label]) => (
            <div key={k}>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{label}</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pwForm[k]}
                  onChange={e => setPwForm(f => ({ ...f, [k]: e.target.value }))}
                />
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <button
              onClick={handleChangePw}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-700
                text-white rounded-xl text-sm font-semibold transition-colors">
              <Lock size={14} /> Change Password
            </button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 text-sm text-blue-800">
        <div className="font-bold mb-1">System Information</div>
        <div className="text-blue-600 text-xs">TEA School Management System</div>
        <div className="text-blue-500 text-xs mt-1">Logged in as: <strong>{user?.username}</strong></div>
      </div>
    </div>
  );
}
