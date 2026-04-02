import React, { useState } from 'react';
import { useAuth, api } from '../App';
import { Lock, User, Eye, EyeOff, Wifi } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    const handleSubmit = async () => {
        if (!form.username || !form.password) { setError('Enter username and password'); return; }
        setLoading(true); setError('');
        const result = await api.login(form);
        setLoading(false);
        if (result && result.username) login(result);
        else setError('Invalid username or password');
    };

    return (
        <div className="min-h-screen flex items-center justify-center
      bg-gradient-to-br from-tea-dark via-tea-primary to-tea-light p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-10">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🏫</div>
                    <h1 className="font-serif text-2xl font-bold text-tea-primary mb-1">
                        The Equilibrium Academy
                    </h1>
                    <p className="text-gray-400 text-sm">School Management System</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                        <div className="relative">
                            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-tea-primary/20 focus:border-tea-primary"
                                placeholder="admin" value={form.username}
                                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type={showPw ? 'text' : 'password'}
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-tea-primary/20 focus:border-tea-primary"
                                placeholder="admin123" value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                            <button type="button" onClick={() => setShowPw(!showPw)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>
                    <button onClick={handleSubmit} disabled={loading}
                        className="w-full bg-tea-primary hover:bg-tea-light text-white font-semibold
            py-3 rounded-xl transition-colors disabled:opacity-60 mt-2">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </div>

                <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
                    <Wifi size={12} className="line-through opacity-50" />

                </div>
            </div>
        </div>
    );
}
