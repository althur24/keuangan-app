'use client';

import { createClient } from '@/lib/supabase/client';
import { Transaction } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2, Search, Calendar, MoreVertical, Pencil, Trash2, X, CreditCard } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { categoryIcons, categories, getCategoryLabel } from '@/lib/categories';

export default function HistoryPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [editForm, setEditForm] = useState({ amount: '', category: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const supabase = useMemo(() => createClient(), []);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Fetch error:', error);
                } else {
                    setTransactions(data || []);
                }
            } catch (err) {
                console.error('Fetch exception:', err);
            }
            setLoading(false);
        };

        fetchData();
    }, [user, supabase]);

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus transaksi ini?')) return;

        setDeleting(id);
        setMenuOpen(null);

        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Delete error:', error);
                alert('Gagal menghapus: ' + error.message);
            } else {
                setTransactions(prev => prev.filter(t => t.id !== id));
            }
        } catch (err: any) {
            console.error('Delete exception:', err);
            alert('Gagal menghapus: ' + err.message);
        }

        setDeleting(null);
    };

    const handleEdit = (tx: Transaction) => {
        setEditingTx(tx);
        setEditForm({
            amount: tx.amount.toString(),
            category: tx.category || 'lainnya',
            description: tx.description || ''
        });
        setMenuOpen(null);
    };

    const saveEdit = async () => {
        if (!editingTx) return;

        setSaving(true);

        try {
            const updateData = {
                amount: parseFloat(editForm.amount),
                category: editForm.category,
                description: editForm.description
            };

            const { error } = await supabase
                .from('transactions')
                .update(updateData)
                .eq('id', editingTx.id);

            if (error) {
                console.error('Update error:', error);
                alert('Gagal update: ' + error.message);
            } else {
                setTransactions(prev => prev.map(t =>
                    t.id === editingTx.id
                        ? { ...t, ...updateData }
                        : t
                ));
                setEditingTx(null);
            }
        } catch (err: any) {
            console.error('Update exception:', err);
            alert('Gagal update: ' + err.message);
        }

        setSaving(false);
    };

    const filtered = transactions.filter(t =>
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped = filtered.reduce((g, t) => {
        const d = new Date(t.created_at).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        (g[d] = g[d] || []).push(t);
        return g;
    }, {} as Record<string, Transaction[]>);


    // Removed blocking loader to prevent navigation flicker
    // if (loading || authLoading) return ...

    return (
        <div className="min-h-screen bg-[#F4F5F7] flex flex-col">
            <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-white shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
                            <Calendar size={18} className="text-[#00875A]" /> Riwayat
                        </h1>
                        <p className="text-xs text-[#6B778C]">{transactions.length} transaksi</p>
                    </div>
                </div>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" />
                    <input
                        type="text"
                        placeholder="Cari transaksi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[#F4F5F7] border border-gray-200 rounded-lg text-[#172B4D] placeholder-[#6B778C] outline-none focus:border-[#00875A] text-sm"
                    />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="animate-pulse duration-1000">
                                <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                                <div className="bg-white rounded-xl p-4 shadow-sm h-20" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[#6B778C]">
                        <CreditCard size={40} className="opacity-50 mb-3" />
                        <p className="text-sm">{searchQuery ? 'Tidak ditemukan' : 'Belum ada transaksi'}</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {Object.entries(grouped).map(([date, items]) => (
                            <div key={date} className="space-y-2">
                                <h3 className="text-xs font-semibold text-[#6B778C] uppercase tracking-wider px-1">{date}</h3>
                                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                    {items.map((t, i) => (
                                        <div
                                            key={t.id}
                                            className={cn(
                                                "p-4 flex items-center justify-between relative",
                                                deleting === t.id && "opacity-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                                    t.type === 'expense' ? 'bg-[#FF5630]/10 text-[#FF5630]' : 'bg-[#36B37E]/10 text-[#36B37E]'
                                                )}>
                                                    {categoryIcons[t.category?.toLowerCase()] || <CreditCard size={18} />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-[#172B4D] capitalize truncate text-sm">
                                                        {t.description || getCategoryLabel(t.category)}
                                                    </p>
                                                    <p className="text-xs text-[#6B778C] capitalize">{getCategoryLabel(t.category)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right mr-2">
                                                <p className={cn("font-bold text-sm", t.type === 'expense' ? 'text-[#FF5630]' : 'text-[#36B37E]')}>
                                                    {t.type === 'expense' ? '-' : '+'} {new Intl.NumberFormat('id-ID', {
                                                        style: 'currency', currency: 'IDR', maximumFractionDigits: 0
                                                    }).format(t.amount)}
                                                </p>
                                                <p className="text-[10px] text-[#6B778C] font-medium mt-0.5">
                                                    {t.created_at ? new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </p>
                                            </div>

                                            {/* Menu Button */}
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpen(menuOpen === t.id ? null : t.id);
                                                    }}
                                                    className="p-2 text-[#6B778C] hover:text-[#172B4D] hover:bg-gray-100 rounded-lg relative z-10"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Sheet - Bottom Sheet Style */}
                                {items.map(t => menuOpen === t.id && (
                                    <div key={`menu-${t.id}`} className="fixed inset-0 z-[999] flex items-end justify-center" onClick={() => setMenuOpen(null)}>
                                        <div className="absolute inset-0 bg-black/50" />
                                        <div
                                            className="relative bg-white border-t border-gray-200 rounded-t-2xl w-full max-w-md p-4 pb-8 animate-fade-in-up"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                                            <div className="mb-4 px-2">
                                                <p className="text-[#172B4D] font-medium">{t.description || t.category}</p>
                                                <p className="text-sm text-[#6B778C]">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(t.amount)}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => handleEdit(t)}
                                                    className="flex items-center gap-3 px-4 py-3.5 text-[#172B4D] bg-[#F4F5F7] hover:bg-[#EBECF0] w-full rounded-xl transition"
                                                >
                                                    <Pencil size={18} className="text-[#00875A]" /> Edit Transaksi
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="flex items-center gap-3 px-4 py-3.5 text-[#FF5630] bg-[#FFEBE6] hover:bg-[#FFCCC0] w-full rounded-xl transition"
                                                >
                                                    <Trash2 size={18} /> Hapus Transaksi
                                                </button>
                                                <button
                                                    onClick={() => setMenuOpen(null)}
                                                    className="flex items-center justify-center px-4 py-3 text-[#6B778C] hover:text-[#172B4D] w-full rounded-xl transition mt-2"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingTx && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-6">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 border border-gray-100 shadow-xl animate-fade-in-up">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#172B4D]">Edit Transaksi</h3>
                            <button
                                onClick={() => setEditingTx(null)}
                                className="p-2 text-[#6B778C] hover:text-[#172B4D]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-[#6B778C] uppercase block mb-1">Jumlah (Rp)</label>
                                <input
                                    type="number"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#F4F5F7] border border-gray-200 rounded-xl text-[#172B4D] text-lg font-bold outline-none focus:border-[#00875A]"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-[#6B778C] uppercase block mb-1">Kategori</label>
                                <select
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#F4F5F7] border border-gray-200 rounded-xl text-[#172B4D] outline-none focus:border-[#00875A] capitalize"
                                >
                                    {categories.map(c => (
                                        <option key={c} value={c} className="capitalize">{getCategoryLabel(c)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-[#6B778C] uppercase block mb-1">Deskripsi</label>
                                <input
                                    type="text"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#F4F5F7] border border-gray-200 rounded-xl text-[#172B4D] outline-none focus:border-[#00875A]"
                                    placeholder="Contoh: Makan siang"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setEditingTx(null)}
                                className="flex-1 py-3 bg-[#F4F5F7] text-[#6B778C] font-medium rounded-xl hover:bg-[#EBECF0] transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={saveEdit}
                                disabled={saving || !editForm.amount}
                                className="flex-1 py-3 bg-[#00875A] text-white font-medium rounded-xl hover:bg-[#006644] transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}



            <BottomNav />
        </div>
    );
}
