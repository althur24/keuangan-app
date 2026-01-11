'use client';

import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/components/providers/AuthProvider';
import {
    Settings,
    User,
    Lock,
    CreditCard,
    Moon,
    Download,
    Trash2,
    LogOut,
    ChevronRight,
    HelpCircle,
    Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Modal States
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Form States
    const [profileName, setProfileName] = useState('');
    const [passForm, setPassForm] = useState({ old: '', new: '', confirm: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    interface MenuItem {
        icon: any;
        label: string;
        onClick: () => void;
        badge?: string;
        badgeColor?: string;
        color?: string;
    }

    interface MenuGroup {
        title: string;
        items: MenuItem[];
    }

    const handleLogout = async () => {
        if (confirm('Yakin ingin keluar dari aplikasi?')) {
            setIsLoading(true);
            await signOut();
        }
    };

    const handleExport = () => {
        window.open('/api/settings/export', '_blank');
        setMessage({ type: 'success', text: 'Download dimulai...' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDeleteAll = async () => {
        const confirm1 = confirm("⚠️ BAHAYA: Apakah Anda yakin ingin menghapus SEMUA data transaksi?");
        if (!confirm1) return;

        const confirm2 = confirm("Data yang dihapus TIDAK BISA dikembalikan. Lanjutkan?");
        if (!confirm2) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/settings/delete-data', { method: 'DELETE' });
            if (!res.ok) throw new Error('Gagal menghapus data');
            alert('Semua data berhasil dihapus.');
            window.location.reload();
        } catch (err) {
            alert('Terjadi kesalahan saat menghapus data.');
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async () => {
        if (!profileName) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PATCH',
                body: JSON.stringify({ name: profileName })
            });
            if (!res.ok) throw new Error('Gagal update profile');
            setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
            setTimeout(() => {
                setShowProfileModal(false);
                window.location.reload(); // Reload to reflect changes
            }, 1000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Gagal memperbarui profil' });
        } finally {
            setIsLoading(false);
        }
    };

    const changePassword = async () => {
        if (!passForm.old || !passForm.new || !passForm.confirm) {
            setMessage({ type: 'error', text: 'Semua kolom wajib diisi' });
            return;
        }
        if (passForm.new !== passForm.confirm) {
            setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/password', {
                method: 'POST',
                body: JSON.stringify({ oldPassword: passForm.old, newPassword: passForm.new })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal ganti password');

            setMessage({ type: 'success', text: 'Password berhasil diganti' });
            setPassForm({ old: '', new: '', confirm: '' });
            setTimeout(() => setShowPasswordModal(false), 1500);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const menuGroups: MenuGroup[] = [
        {
            title: 'Akun & Keamanan',
            items: [
                {
                    icon: User,
                    label: 'Edit Profil',
                    onClick: () => {
                        setProfileName(user?.user_metadata?.name || user?.email?.split('@')[0] || ''); // Fallback setup
                        setShowProfileModal(true);
                        setMessage(null);
                    }
                },
                {
                    icon: Lock,
                    label: 'Ganti Password',
                    onClick: () => {
                        setPassForm({ old: '', new: '', confirm: '' });
                        setShowPasswordModal(true);
                        setMessage(null);
                    }
                },
                { icon: Shield, label: 'Keamanan Biometrik', badge: 'Aktif', onClick: () => { } },
            ]
        },
        {
            title: 'Langganan',
            items: [
                {
                    icon: CreditCard,
                    label: 'Status Langganan',
                    badge: 'Free',
                    badgeColor: 'bg-slate-700 text-slate-300',
                    onClick: () => alert('Halaman upgrade langganan (Demo)')
                },
            ]
        },
        {
            title: 'Tampilan & Aplikasi',
            items: [
                { icon: Moon, label: 'Tema Aplikasi', badge: 'Dark', onClick: () => { } },
                { icon: HelpCircle, label: 'Bantuan & Support', onClick: () => { } },
            ]
        },
        {
            title: 'Data',
            items: [
                { icon: Download, label: 'Export Data (CSV)', onClick: handleExport },
                { icon: Trash2, label: 'Hapus Semua Data', color: 'text-red-400', onClick: handleDeleteAll },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#F4F5F7] flex flex-col">
            {/* Header */}
            <header className="px-6 pt-10 pb-6 sticky top-0 z-20 bg-white shadow-md">
                <h1 className="text-xl font-bold text-[#172B4D] flex items-center gap-2">
                    <Settings size={22} className="text-[#00875A]" /> Pengaturan
                </h1>
            </header>

            <div className="flex-1 overflow-y-auto pb-28">
                {/* Profile Card */}
                <div className="px-6 py-6">
                    <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#00875A] flex items-center justify-center text-white text-2xl font-bold shadow-md">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-[#172B4D] font-bold text-lg truncate">Pengguna</h2>
                            <p className="text-[#6B778C] text-sm truncate">{user?.email}</p>
                            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00875A]/10 text-[#00875A] border border-[#00875A]/20">
                                Free Plan
                            </div>
                        </div>
                    </div>

                    {/* Upsell Card */}
                    <div className="mt-4 bg-[#00875A] rounded-xl p-5 text-white relative overflow-hidden group cursor-pointer transition transform active:scale-95" onClick={() => alert('Buka halaman pembayaran')}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-1">Upgrade ke Premium 👑</h3>
                            <p className="text-green-100 text-xs mb-3 max-w-[80%]">
                                Dapatkan unlimited AI chat, scan struk otomatis, dan export data.
                            </p>
                            <button className="bg-white text-[#00875A] px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-gray-50 transition">
                                Lihat Paket Hemat
                            </button>
                        </div>
                    </div>
                </div>

                {/* Settings Menu */}
                <div className="px-6 space-y-6">
                    {menuGroups.map((group, groupIdx) => (
                        <div key={groupIdx}>
                            <h3 className="text-xs font-semibold text-[#6B778C] uppercase tracking-wider mb-3 px-1">
                                {group.title}
                            </h3>
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                {group.items.map((item, itemIdx) => (
                                    <button
                                        key={itemIdx}
                                        onClick={item.onClick}
                                        className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition group ${itemIdx !== 0 ? 'border-t border-gray-100' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-gray-100 ${item.color || 'text-[#6B778C]'}`}>
                                                <item.icon size={18} />
                                            </div>
                                            <span className={`text-sm font-medium ${item.color || 'text-[#172B4D]'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.badge && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.badgeColor || 'bg-gray-200 text-[#6B778C]'}`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                            <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="w-full mt-4 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 flex items-center justify-center gap-2 text-red-500 font-medium transition active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                            <>
                                <LogOut size={18} /> Keluar Aplikasi
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-600 py-4">
                        Keuangan App v1.0.0
                    </p>
                </div>
            </div>


            {/* Profile Edit Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6 border border-slate-700 animate-fade-in-up">
                        <h3 className="text-lg font-bold text-white mb-4">Edit Profil</h3>
                        {message && (
                            <div className={`p-3 rounded-lg mb-4 text-xs font-medium ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase block mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-teal-500"
                                    placeholder="Nama Anda"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowProfileModal(false)} className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium">Batal</button>
                                <button onClick={updateProfile} disabled={isLoading} className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                    {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6 border border-slate-700 animate-fade-in-up">
                        <h3 className="text-lg font-bold text-white mb-4">Ganti Password</h3>
                        {message && (
                            <div className={`p-3 rounded-lg mb-4 text-xs font-medium ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 uppercase block mb-1">Password Lama</label>
                                <input type="password" value={passForm.old} onChange={(e) => setPassForm({ ...passForm, old: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-teal-500" placeholder="••••••" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase block mb-1">Password Baru</label>
                                <input type="password" value={passForm.new} onChange={(e) => setPassForm({ ...passForm, new: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-teal-500" placeholder="••••••" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase block mb-1">Konfirmasi Password Baru</label>
                                <input type="password" value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-teal-500" placeholder="••••••" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium">Batal</button>
                                <button onClick={changePassword} disabled={isLoading} className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                    {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Ganti
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
