'use client';

import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowUpRight, ArrowDownLeft, Wallet, Loader2, Activity, CreditCard } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { categoryIcons, getCategoryLabel } from '@/lib/categories';

interface Transaction {
  id: string; type: 'income' | 'expense'; amount: number; category: string; description: string; created_at: string;
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  // Stable fetch function using useCallback
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    // 1. Fetch Recent Transactions for List
    const { data: recentData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentData) {
      setTransactions(recentData);
    }

    // 2. Fetch All Transactions for Total Balance Calculation
    const { data: allData } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id);

    if (allData) {
      const income = allData.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = allData.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      setTotalIncome(income);
      setTotalExpense(expense);
    }
  }, [user]);

  // Initial fetch on mount/user change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Refetch when page becomes visible again (fixes stale data after Chat)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTransactions();
      }
    };

    // Listen for custom event from Chat when transaction is saved
    const handleTransactionSaved = () => {
      fetchTransactions();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also refetch on window focus (for desktop tab switching)
    window.addEventListener('focus', fetchTransactions);
    window.addEventListener('transaction-saved', handleTransactionSaved);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchTransactions);
      window.removeEventListener('transaction-saved', handleTransactionSaved);
    };
  }, [fetchTransactions]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]"><Loader2 className="animate-spin text-[#00875A]" size={32} /></div>;

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col">
      <header className="px-6 pt-10 pb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[#6B778C] text-sm">Selamat datang,</p>
            <h1 className="text-xl font-bold text-[#172B4D] capitalize">{user.email?.split('@')[0]}</h1>
          </div>
          <div className="p-3 rounded-xl bg-white shadow-md">
            <Activity size={20} className="text-[#00875A]" />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl shadow-emerald-900/20 group">
          {/* Premium Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00875A] via-[#00704a] to-[#004d33]" />

          {/* Decorative Shine/Glow Effects */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Subtle Noise Texture (Optional, simulates high-quality material) */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />

          {/* Premium Border Highlight (Top) */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative z-10 text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-2 px-3 py-1 rounded-full bg-black/10 backdrop-blur-sm border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-100/90">Total Saldo</span>
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(balance)}
            </p>
          </div>

          <div className="flex gap-3 relative z-10">
            <div className="flex-1 bg-white rounded-xl p-3 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-[#36B37E]/10 flex items-center justify-center shrink-0">
                  <ArrowDownLeft size={12} className="text-[#36B37E]" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#6B778C] font-semibold">Masuk</span>
              </div>
              <p className="text-sm font-bold text-[#36B37E] truncate">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome)}</p>
            </div>
            <div className="flex-1 bg-white rounded-xl p-3 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-[#FF5630]/10 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={12} className="text-[#FF5630]" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#6B778C] font-semibold">Keluar</span>
              </div>
              <p className="text-sm font-bold text-[#FF5630] truncate">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpense)}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="flex-1 px-6 pt-2 pb-28">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-[#172B4D]">Transaksi Terakhir</h2>
          <button onClick={() => router.push('/history')} className="text-[#00875A] text-sm font-medium">Lihat Semua</button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-md px-6">
            <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} className="text-[#00875A]" />
            </div>
            <h3 className="text-[#172B4D] font-bold text-lg mb-2">Belum Ada Transaksi</h3>
            <p className="text-[#6B778C] text-sm mb-6 leading-relaxed">
              Halo! Sepertinya Anda pengguna baru. Yuk mulai catat keuanganmu atau atur saldo awal sekarang.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const chatButton = document.getElementById('chat-fab');
                  if (chatButton) chatButton.click();
                }}
                className="w-full py-3 bg-[#00875A] text-white font-bold rounded-xl shadow-md hover:bg-[#006644] transition transform active:scale-95"
              >
                Mulai Catat Transaksi
              </button>
              <p className="text-xs text-[#6B778C] mt-2">
                Tip: Coba bilang "Isi saldo awal 10 juta" ke AI Assistant.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {transactions.map((tx, i) => (
              <div key={tx.id} className={`p-4 flex items-center justify-between ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-[#36B37E]/10 text-[#36B37E]' : 'bg-[#FF5630]/10 text-[#FF5630]'}`}>
                    {categoryIcons[tx.category?.toLowerCase()] || <CreditCard size={18} />}
                  </div>
                  <div>
                    <h3 className="font-medium text-[#172B4D] text-sm capitalize">{getCategoryLabel(tx.category)}</h3>
                    <p className="text-xs text-[#6B778C]">
                      {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-[#36B37E]' : 'text-[#FF5630]'}`}>
                  {tx.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </div>
  );
}
