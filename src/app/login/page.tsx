'use client';

import { useState } from 'react';
import { Loader2, Mail, Lock, Sparkles, Eye, EyeOff, User } from 'lucide-react';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            setEmailError('Format email tidak valid (contoh: user@mail.com)');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;

        // Strict Validation
        if (!validateEmail(email)) return;

        if (password.length < 6) {
            setMessage({ text: 'Password minimal 6 karakter', type: 'error' });
            return;
        }

        if (mode === 'register' && !name.trim()) {
            setMessage({ text: 'Nama lengkap wajib diisi', type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const body = mode === 'login'
                ? { email, password }
                : { email, password, name };

            const res = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
            setMessage({ text: "Berhasil! Mengalihkan...", type: 'success' });
            window.location.href = '/';
        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00875A] mb-4 shadow-lg">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-[#172B4D]">Keuangan AI</h1>
                    <p className="text-[#6B778C] text-sm mt-1">Catat keuangan dengan AI</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h2 className="text-lg font-bold text-[#172B4D] text-center mb-5">{mode === 'login' ? 'Masuk Akun' : 'Daftar Baru'}</h2>

                    {message && (
                        <div className={`p-3 text-sm rounded-xl mb-4 ${message.type === 'error' ? 'bg-[#FF5630]/10 text-[#FF5630] border border-[#FF5630]/30' : 'bg-[#36B37E]/10 text-[#36B37E] border border-[#36B37E]/30'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div className="animate-fade-in-up">
                                <label className="text-xs font-medium text-[#6B778C] uppercase tracking-wider">Nama Lengkap</label>
                                <div className="relative mt-1">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B778C]" />
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        autoComplete="name"
                                        placeholder="Nama Panggilan"
                                        className="w-full pl-10 pr-4 py-3 bg-[#F4F5F7] border border-gray-200 rounded-xl text-[#172B4D] placeholder-[#6B778C] outline-none focus:border-[#00875A] transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-[#6B778C] uppercase tracking-wider">Email</label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B778C]" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                    onChange={(e) => {
                                        if (emailError) validateEmail(e.target.value);
                                    }}
                                    className={`w-full pl-10 pr-4 py-3 bg-[#F4F5F7] border ${emailError ? 'border-[#FF5630]' : 'border-gray-200'} rounded-xl text-[#172B4D] placeholder-[#6B778C] outline-none focus:border-[#00875A] transition-all`}
                                />
                            </div>
                            {emailError && <p className="text-[#FF5630] text-xs mt-1">{emailError}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-medium text-[#6B778C] uppercase tracking-wider">Password</label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B778C]" />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete={mode === 'login' ? "current-password" : "new-password"}
                                    placeholder="Minimal 6 karakter"
                                    minLength={6}
                                    className="w-full pl-10 pr-12 py-3 bg-[#F4F5F7] border border-gray-200 rounded-xl text-[#172B4D] placeholder-[#6B778C] outline-none focus:border-[#00875A] transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B778C] hover:text-[#172B4D] transition"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button disabled={loading} className="w-full py-3.5 bg-[#00875A] text-white font-semibold rounded-xl hover:bg-[#006644] transition shadow-md flex justify-center items-center gap-2 disabled:opacity-50">
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            {loading ? 'Memproses...' : (mode === 'login' ? 'Masuk' : 'Daftar')}
                        </button>
                    </form>

                    <div className="mt-5 text-center text-sm text-[#6B778C]">
                        {mode === 'login' ? "Belum punya akun?" : "Sudah punya akun?"}
                        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(null); setEmailError(''); }} className="ml-1 text-[#00875A] font-semibold hover:underline">
                            {mode === 'login' ? "Daftar" : "Masuk"}
                        </button>
                    </div>
                </div>

                <p className="text-center text-[#6B778C] text-xs mt-6">Powered by Gemini AI</p>
            </div>
        </div>
    );
}
