'use client';

import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowUpRight, ArrowDownLeft, Loader2, Activity, CreditCard, ChevronRight, Settings2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { categoryIcons, getCategoryLabel, categories } from '@/lib/categories';

interface Transaction {
  id: string; type: 'income' | 'expense'; amount: number; category: string; description: string; created_at: string;
}

interface Budget {
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'none';
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'weekly' | 'monthly' | 'none'>('monthly');
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  // Fetch all data
  const fetchData = useCallback(async () => {
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

    // 2. Fetch All Transactions for Total Balance
    const { data: allData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);

    if (allData) {
      setAllTransactions(allData);
      const income = allData.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = allData.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      setTotalIncome(income);
      setTotalExpense(expense);
    }

    // 3. Fetch Budgets
    try {
      const res = await fetch('/api/budgets');
      if (res.ok) {
        const { budgets: budgetData } = await res.json();
        setBudgets(budgetData || []);
      }
    } catch (e) {
      console.error('Failed to fetch budgets:', e);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch on visibility/focus changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    const handleTransactionSaved = () => fetchData();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchData);
    window.addEventListener('transaction-saved', handleTransactionSaved);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchData);
      window.removeEventListener('transaction-saved', handleTransactionSaved);
    };
  }, [fetchData]);

  // Calculate spending by category based on budget period
  const getSpendingForBudget = (budget: Budget) => {
    const now = new Date();
    let startDate: Date;

    if (budget.period === 'weekly') {
      // Start of current week (Monday)
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);
    } else if (budget.period === 'monthly') {
      // Start of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // 'none' - all time
      startDate = new Date(0);
    }

    return allTransactions
      .filter(t =>
        t.type === 'expense' &&
        t.category?.toLowerCase() === budget.category.toLowerCase() &&
        new Date(t.created_at) >= startDate
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'weekly': return 'Mingguan';
      case 'monthly': return 'Bulanan';
      case 'none': return 'Tanpa Reset';
      default: return 'Bulanan';
    }
  };

  const saveBudget = async () => {
    if (!editingCategory || !budgetAmount) return;

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: editingCategory,
          amount: parseInt(budgetAmount),
          period: budgetPeriod
        })
      });

      if (res.ok) {
        const { budget } = await res.json();
        setBudgets(prev => {
          const exists = prev.find(b => b.category === budget.category);
          if (exists) return prev.map(b => b.category === budget.category ? budget : b);
          return [...prev, budget];
        });
        setShowBudgetModal(false);
        setEditingCategory(null);
        setBudgetAmount('');
      }
    } catch (e) {
      console.error('Failed to save budget:', e);
    }
  };

  const deleteBudget = async () => {
    if (!editingCategory) return;
    if (!confirm(`Hapus budget untuk ${getCategoryLabel(editingCategory)}?`)) return;

    try {
      const res = await fetch(`/api/budgets?category=${editingCategory}`, { method: 'DELETE' });
      if (res.ok) {
        setBudgets(prev => prev.filter(b => b.category !== editingCategory));
        setShowBudgetModal(false);
        setEditingCategory(null);
        setBudgetAmount('');
      }
    } catch (e) {
      console.error('Failed to delete budget:', e);
    }
  };

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

        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl shadow-emerald-900/20 group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00875A] via-[#00704a] to-[#004d33]" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative z-10 text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-2 px-3 py-1 rounded-full bg-black/10 backdrop-blur-sm border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-100/90">Total Saldo</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <p className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {showBalance
                  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(balance)
                  : 'Rp ••••••••'
                }
              </p>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-sm text-white/80 hover:text-white"
              >
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 relative z-10">
            <div className="flex-1 bg-white rounded-xl p-3 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-[#36B37E]/10 flex items-center justify-center shrink-0">
                  <ArrowDownLeft size={12} className="text-[#36B37E]" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#6B778C] font-semibold">Masuk</span>
              </div>
              <p className="text-sm font-bold text-[#36B37E] truncate">
                {showBalance
                  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome)
                  : '•••••••'
                }
              </p>
            </div>
            <div className="flex-1 bg-white rounded-xl p-3 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-[#FF5630]/10 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={12} className="text-[#FF5630]" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#6B778C] font-semibold">Keluar</span>
              </div>
              <p className="text-sm font-bold text-[#FF5630] truncate">
                {showBalance
                  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpense)
                  : '•••••••'
                }
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="flex-1 px-6 pt-2 pb-28">
        {/* Budget Tracker Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#172B4D]">Budget Tracker</h2>
            <button
              onClick={() => { setShowBudgetModal(true); setEditingCategory(null); setBudgetAmount(''); setBudgetPeriod('monthly'); }}
              className="text-xs font-semibold text-[#00875A] hover:underline"
            >
              + Atur Budget
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-sm text-[#6B778C]">Belum ada budget</p>
              <p className="text-xs text-[#6B778C]/70 mt-1">Tap "+ Atur Budget" untuk mulai kontrol pengeluaran</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {budgets.slice(0, 3).map((budget, i) => {
                const spent = getSpendingForBudget(budget);
                const percentage = Math.min((spent / budget.amount) * 100, 100);
                const isOver = spent > budget.amount;

                return (
                  <div
                    key={budget.category}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition active:scale-[0.99] ${i !== 0 ? 'border-t border-gray-100' : ''}`}
                    onClick={() => {
                      setEditingCategory(budget.category);
                      setBudgetAmount(budget.amount.toString());
                      setBudgetPeriod(budget.period || 'monthly');
                      setShowBudgetModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#172B4D] capitalize">{getCategoryLabel(budget.category)}</span>
                        <span className="text-[9px] bg-gray-100 text-[#6B778C] px-1.5 py-0.5 rounded-full">{getPeriodLabel(budget.period)}</span>
                        {isOver && <span className="text-[8px] bg-[#FF5630] text-white px-1.5 py-0.5 rounded-full font-bold">OVER</span>}
                      </div>
                      <span className={`text-xs font-bold ${isOver ? 'text-[#FF5630]' : 'text-[#172B4D]'}`}>
                        {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(spent)} / {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(budget.amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-[#FF5630]' : 'bg-[#00875A]'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {budgets.length > 3 && (
                <button
                  onClick={() => router.push('/analytics')}
                  className="w-full p-2 text-center text-xs text-[#00875A] font-medium hover:bg-gray-50 border-t border-gray-100"
                >
                  Lihat {budgets.length - 3} budget lainnya →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Transactions Section */}
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
              Halo! Sepertinya Anda pengguna baru. Yuk mulai catat keuanganmu.
            </p>
            <button
              onClick={() => {
                const chatButton = document.getElementById('chat-fab');
                if (chatButton) chatButton.click();
              }}
              className="w-full py-3 bg-[#00875A] text-white font-bold rounded-xl shadow-md hover:bg-[#006644] transition transform active:scale-95"
            >
              Mulai Catat Transaksi
            </button>
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

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setShowBudgetModal(false)}>
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-28 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#172B4D] mb-4">{editingCategory ? 'Edit Budget' : 'Atur Budget Baru'}</h3>

            {/* Category Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#6B778C] mb-2">Kategori</label>
              <select
                value={editingCategory || ''}
                onChange={(e) => setEditingCategory(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 text-[#172B4D] bg-white focus:border-[#00875A] focus:outline-none"
              >
                <option value="">Pilih kategori...</option>
                {categories.filter(c => !['gaji', 'investasi', 'bonus'].includes(c)).map(c => (
                  <option key={c} value={c}>{getCategoryLabel(c)}</option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#6B778C] mb-2">Nominal Budget</label>
              <input
                type="number"
                placeholder="500000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 text-[#172B4D] focus:border-[#00875A] focus:outline-none"
              />
            </div>

            {/* Period Select */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#6B778C] mb-2">Periode Reset</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'weekly', label: 'Mingguan' },
                  { value: 'monthly', label: 'Bulanan' },
                  { value: 'none', label: 'Tanpa Reset' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBudgetPeriod(option.value as 'weekly' | 'monthly' | 'none')}
                    className={`p-2 rounded-xl text-sm font-medium transition ${budgetPeriod === option.value
                      ? 'bg-[#00875A] text-white'
                      : 'bg-gray-100 text-[#6B778C] hover:bg-gray-200'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#6B778C] mt-2">
                {budgetPeriod === 'weekly' && 'Budget akan reset setiap hari Senin'}
                {budgetPeriod === 'monthly' && 'Budget akan reset setiap tanggal 1'}
                {budgetPeriod === 'none' && 'Budget tidak akan pernah reset'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {editingCategory && budgets.some(b => b.category === editingCategory) && (
                <button
                  onClick={deleteBudget}
                  className="flex-1 py-3 rounded-xl border border-[#FF5630] text-[#FF5630] font-bold hover:bg-[#FF5630]/10 transition"
                >
                  Hapus
                </button>
              )}
              <button
                onClick={saveBudget}
                disabled={!editingCategory || !budgetAmount}
                className="flex-1 py-3 rounded-xl bg-[#00875A] text-white font-bold disabled:opacity-50 hover:bg-[#006644] transition"
              >
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
