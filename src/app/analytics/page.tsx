'use client';

import { createClient } from '@/lib/supabase/client';
import { Transaction } from '@/types';
import { Loader2, PieChart, TrendingUp, TrendingDown, Wallet, CreditCard, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { categoryIconsSmall, categoryColors, getCategoryLabel, categories } from '@/lib/categories';

type DateFilter = 'all' | '7d' | '30d' | '90d' | 'custom';

// Mini Calendar Component
function MiniCalendar({
    selectedDate,
    onSelect,
    label
}: {
    selectedDate: Date | null;
    onSelect: (date: Date) => void;
    label: string;
}) {
    const [viewDate, setViewDate] = useState(selectedDate || new Date());

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const isSelected = selectedDate &&
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
        const isToday = date.toDateString() === new Date().toDateString();

        days.push(
            <button
                key={day}
                onClick={() => onSelect(date)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${isSelected
                    ? 'bg-[#00875A] text-white'
                    : isToday
                        ? 'bg-gray-200 text-[#172B4D]'
                        : 'text-[#6B778C] hover:bg-gray-100'
                    }`}
            >
                {day}
            </button>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-xs text-slate-400 uppercase">{label}</p>
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                    className="p-1.5 text-[#6B778C] hover:text-[#172B4D] hover:bg-gray-100 rounded-lg"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-[#172B4D]">
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                    className="p-1.5 text-[#6B778C] hover:text-[#172B4D] hover:bg-gray-100 rounded-lg"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {dayNames.map(d => (
                    <div key={d} className="w-8 h-6 text-[10px] text-[#6B778C] flex items-center justify-center">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days}
            </div>
            {selectedDate && (
                <div className="pt-2 border-t border-gray-200 text-center">
                    <span className="text-sm text-[#00875A] font-medium">
                        {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            )}
        </div>
    );
}

export default function AnalyticsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState<DateFilter>('30d');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [activeCalendar, setActiveCalendar] = useState<'start' | 'end'>('start');

    // Trend Chart state - separate periods for each chart
    type TrendPeriod = '7d' | '30d' | '12m';
    const [expensePeriod, setExpensePeriod] = useState<TrendPeriod>('7d');
    const [incomePeriod, setIncomePeriod] = useState<TrendPeriod>('7d');

    // Budget Tracker state
    const [budgets, setBudgets] = useState<{ category: string; amount: number }[]>([]);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [budgetAmount, setBudgetAmount] = useState('');

    const supabase = createClient();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

    // Fetch transactions and budgets
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            // Fetch transactions
            const { data: txData } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            setTransactions(txData || []);

            // Fetch budgets
            try {
                const res = await fetch('/api/budgets');
                if (res.ok) {
                    const { budgets: budgetData } = await res.json();
                    setBudgets(budgetData || []);
                }
            } catch (e) {
                console.log('Budgets table may not exist yet');
            }

            setLoading(false);
        };

        fetchData();
    }, [user]);

    const getFilteredTransactions = () => {
        const now = new Date();
        let filtered = transactions;

        if (dateFilter === '7d') {
            const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = transactions.filter(t => new Date(t.created_at) >= cutoff);
        } else if (dateFilter === '30d') {
            const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = transactions.filter(t => new Date(t.created_at) >= cutoff);
        } else if (dateFilter === '90d') {
            const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            filtered = transactions.filter(t => new Date(t.created_at) >= cutoff);
        } else if (dateFilter === 'custom' && startDate && endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59);
            filtered = transactions.filter(t => {
                const d = new Date(t.created_at);
                return d >= startDate && d <= end;
            });
        }

        return filtered;
    };

    const filteredTx = getFilteredTransactions();
    const totalIncome = filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const byCategory = filteredTx.filter(t => t.type === 'expense').reduce((a, t) => {
        const c = t.category?.toLowerCase() || 'lainnya';
        a[c] = (a[c] || 0) + t.amount;
        return a;
    }, {} as Record<string, number>);
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...Object.values(byCategory), 1);

    // Period Comparison: Current Month vs Last Month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthExpense = transactions
        .filter(t => t.type === 'expense' && new Date(t.created_at) >= currentMonthStart)
        .reduce((s, t) => s + t.amount, 0);

    const lastMonthExpense = transactions
        .filter(t => {
            const d = new Date(t.created_at);
            return t.type === 'expense' && d >= lastMonthStart && d <= lastMonthEnd;
        })
        .reduce((s, t) => s + t.amount, 0);

    const periodChange = lastMonthExpense > 0
        ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100
        : 0;

    // Trend Chart: Dynamic periods (7 days, 30 days, 12 months)
    const getTrendDataForPeriod = (period: TrendPeriod, type: 'expense' | 'income'): { label: string; amount: number }[] => {
        const data: { label: string; amount: number }[] = [];

        if (period === '7d') {
            // 7 days - daily data
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);

                const dayTotal = transactions
                    .filter(t => {
                        const d = new Date(t.created_at);
                        return t.type === type && d >= date && d < nextDay;
                    })
                    .reduce((s, t) => s + t.amount, 0);

                data.push({
                    label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
                    amount: dayTotal
                });
            }
        } else if (period === '30d') {
            // 30 days - 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekEnd = new Date(now);
                weekEnd.setDate(weekEnd.getDate() - (i * 7));
                weekEnd.setHours(23, 59, 59, 999);
                const weekStart = new Date(weekEnd);
                weekStart.setDate(weekStart.getDate() - 6);
                weekStart.setHours(0, 0, 0, 0);

                const weekTotal = transactions
                    .filter(t => {
                        const d = new Date(t.created_at);
                        return t.type === type && d >= weekStart && d <= weekEnd;
                    })
                    .reduce((s, t) => s + t.amount, 0);

                data.push({
                    label: `Mg ${4 - i}`,
                    amount: weekTotal
                });
            }
        } else {
            // 12 months - monthly data
            for (let i = 11; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

                const monthTotal = transactions
                    .filter(t => {
                        const d = new Date(t.created_at);
                        return t.type === type && d >= monthDate && d <= monthEnd;
                    })
                    .reduce((s, t) => s + t.amount, 0);

                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                data.push({
                    label: monthNames[monthDate.getMonth()],
                    amount: monthTotal
                });
            }
        }

        return data;
    };

    const trendExpenseData = getTrendDataForPeriod(expensePeriod, 'expense');
    const trendIncomeData = getTrendDataForPeriod(incomePeriod, 'income');
    const trendExpenseMax = Math.max(...trendExpenseData.map(d => d.amount), 1);
    const trendIncomeMax = Math.max(...trendIncomeData.map(d => d.amount), 1);

    // For backward compatibility (old variable name)
    const trendData = trendExpenseData;
    const trendMax = trendExpenseMax;

    const filterLabels: Record<DateFilter, string> = {
        'all': 'Semua',
        '7d': '7 Hari',
        '30d': '30 Hari',
        '90d': '3 Bulan',
        'custom': 'Kustom'
    };

    const getDateRangeLabel = () => {
        if (dateFilter === 'custom' && startDate && endDate) {
            return `${startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
        }
        return filterLabels[dateFilter];
    };

    const applyCustomDate = () => {
        if (startDate && endDate) {
            setShowDatePicker(false);
        }
    };

    // Removed blocking loader to prevent flickering on navigation
    // if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-teal-400" size={32} /></div>;

    return (
        <div className="min-h-screen bg-[#F4F5F7] flex flex-col">
            <header className="px-6 pt-10 pb-4 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-lg font-bold text-[#172B4D] flex items-center gap-2"><PieChart size={18} className="text-[#00875A]" /> Analitik</h1>
                        <p className="text-xs text-[#6B778C] mt-1">{filteredTx.length} transaksi</p>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="flex gap-2 flex-wrap">
                    {(['7d', '30d', '90d', 'all'] as DateFilter[]).map(f => (
                        <button
                            key={f}
                            onClick={() => { setDateFilter(f); setShowDatePicker(false); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${dateFilter === f
                                ? 'bg-[#00875A] text-white'
                                : 'bg-[#F4F5F7] text-[#6B778C] border border-gray-200'
                                }`}
                        >
                            {filterLabels[f]}
                        </button>
                    ))}
                    <button
                        onClick={() => { setDateFilter('custom'); setShowDatePicker(!showDatePicker); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${dateFilter === 'custom'
                            ? 'bg-[#00875A] text-white'
                            : 'bg-[#F4F5F7] text-[#6B778C] border border-gray-200'
                            }`}
                    >
                        <Calendar size={12} /> Kustom
                    </button>
                </div>

                {/* Current Filter Label */}
                <div className="mt-3 text-xs text-[#6B778C]">
                    Menampilkan: <span className="text-[#00875A] font-medium">{getDateRangeLabel()}</span>
                </div>
            </header>

            {/* Custom Date Picker Modal */}
            {showDatePicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-xl p-5 shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[#172B4D] font-bold">Pilih Rentang Tanggal</h3>
                            <button onClick={() => setShowDatePicker(false)} className="p-1 text-[#6B778C] hover:text-[#172B4D]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Date Selection Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setActiveCalendar('start')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeCalendar === 'start'
                                    ? 'bg-[#00875A]/10 text-[#00875A] border border-[#00875A]/30'
                                    : 'bg-[#F4F5F7] text-[#6B778C]'
                                    }`}
                            >
                                Dari: {startDate ? startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                            </button>
                            <button
                                onClick={() => setActiveCalendar('end')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeCalendar === 'end'
                                    ? 'bg-[#00875A]/10 text-[#00875A] border border-[#00875A]/30'
                                    : 'bg-[#F4F5F7] text-[#6B778C]'
                                    }`}
                            >
                                Sampai: {endDate ? endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                            </button>
                        </div>

                        {/* Calendar */}
                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                            <MiniCalendar
                                key={activeCalendar}
                                selectedDate={activeCalendar === 'start' ? startDate : endDate}
                                onSelect={(date) => {
                                    if (activeCalendar === 'start') {
                                        setStartDate(date);
                                        setActiveCalendar('end');
                                    } else {
                                        setEndDate(date);
                                    }
                                }}
                                label={activeCalendar === 'start' ? 'Tanggal Mulai' : 'Tanggal Akhir'}
                            />
                        </div>

                        <button
                            onClick={applyCustomDate}
                            disabled={!startDate || !endDate}
                            className="w-full mt-4 py-3 bg-[#00875A] text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-[#006644] transition shadow-md"
                        >
                            Terapkan Filter
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards with Skeleton */}
            <div className="px-6 py-4 grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-lg bg-[#36B37E]/10"><TrendingUp size={14} className="text-[#36B37E]" /></div><span className="text-xs text-[#6B778C]">Pemasukan</span></div>
                    {loading ? (
                        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                    ) : (
                        <p className="text-base font-bold text-[#36B37E]">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome)}</p>
                    )}
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-lg bg-[#FF5630]/10"><TrendingDown size={14} className="text-[#FF5630]" /></div><span className="text-xs text-[#6B778C]">Pengeluaran</span></div>
                    {loading ? (
                        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                    ) : (
                        <p className="text-base font-bold text-[#FF5630]">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpense)}</p>
                    )}
                </div>
            </div>

            <div className="px-6 mb-4">
                <div className="bg-[#00875A] rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-1"><Wallet size={16} className="opacity-80" /><span className="text-sm opacity-80">{dateFilter === 'all' ? 'Total Saldo' : 'Surplus / Defisit'}</span></div>
                    {loading ? (
                        <div className="h-8 w-32 bg-white/20 rounded animate-pulse mt-1" />
                    ) : (
                        <p className="text-2xl font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(balance)}</p>
                    )}
                </div>
            </div>

            {/* Trend Charts Section */}
            <div className="px-6 mb-4 space-y-4">
                {/* Expense Trend Chart */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-[#FF5630]/10">
                                <TrendingDown size={14} className="text-[#FF5630]" />
                            </div>
                            <h3 className="text-sm font-bold text-[#172B4D]">Tren Pengeluaran</h3>
                        </div>
                    </div>
                    {/* Period Toggle for Expense */}
                    <div className="flex gap-1.5 mb-4">
                        {([
                            { key: '7d', label: '7 Hari' },
                            { key: '30d', label: '30 Hari' },
                            { key: '12m', label: '12 Bulan' }
                        ] as { key: TrendPeriod; label: string }[]).map(p => (
                            <button
                                key={p.key}
                                onClick={() => setExpensePeriod(p.key)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition ${expensePeriod === p.key
                                        ? 'bg-[#FF5630] text-white'
                                        : 'bg-[#F4F5F7] text-[#6B778C] hover:bg-gray-200'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {loading ? (
                        <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl animate-pulse" />
                    ) : (
                        <div className="relative">
                            <svg viewBox={`0 0 320 140`} className="w-full h-36" preserveAspectRatio="xMidYMid meet">
                                <defs>
                                    <linearGradient id="expenseLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#FF5630" />
                                        <stop offset="50%" stopColor="#FF7452" />
                                        <stop offset="100%" stopColor="#FF5630" />
                                    </linearGradient>
                                    <linearGradient id="expenseAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#FF5630" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#FF5630" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <line x1="30" y1="110" x2="300" y2="110" stroke="#E5E7EB" strokeWidth="1" />
                                <line x1="30" y1="75" x2="300" y2="75" stroke="#F3F4F6" strokeWidth="0.5" strokeDasharray="4 4" />
                                <line x1="30" y1="40" x2="300" y2="40" stroke="#F3F4F6" strokeWidth="0.5" strokeDasharray="4 4" />
                                <path
                                    d={`M 30,110 ${trendExpenseData.map((d, i) => {
                                        const x = 30 + (i * (270 / Math.max(trendExpenseData.length - 1, 1)));
                                        const y = 110 - ((d.amount / (trendExpenseMax || 1)) * 60);
                                        return `L ${x},${Math.max(y, 30)}`;
                                    }).join(' ')} L ${30 + ((trendExpenseData.length - 1) * (270 / Math.max(trendExpenseData.length - 1, 1)))},110 Z`}
                                    fill="url(#expenseAreaGradient)"
                                />
                                <polyline
                                    points={trendExpenseData.map((d, i) => {
                                        const x = 30 + (i * (270 / Math.max(trendExpenseData.length - 1, 1)));
                                        const y = 110 - ((d.amount / (trendExpenseMax || 1)) * 60);
                                        return `${x},${Math.max(y, 30)}`;
                                    }).join(' ')}
                                    fill="none"
                                    stroke="url(#expenseLineGradient)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {trendExpenseData.map((d, i) => {
                                    const x = 30 + (i * (270 / Math.max(trendExpenseData.length - 1, 1)));
                                    const y = 110 - ((d.amount / (trendExpenseMax || 1)) * 60);
                                    const clampedY = Math.max(y, 30);
                                    return (
                                        <g key={i}>
                                            <circle cx={x} cy={clampedY} r="6" fill="#FF5630" opacity="0.1" />
                                            <circle cx={x} cy={clampedY} r="3" fill="white" stroke="#FF5630" strokeWidth="2" />
                                        </g>
                                    );
                                })}
                            </svg>
                            <div className="flex justify-between px-1 -mt-1">
                                {trendExpenseData.map((d, i) => (
                                    <div key={i} className="flex flex-col items-center" style={{ width: `${100 / trendExpenseData.length}%` }}>
                                        <span className="text-[9px] font-medium text-[#6B778C] truncate">{d.label}</span>
                                    </div>
                                ))}
                            </div>
                            {trendExpenseMax > 1 && (
                                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-[10px] text-[#6B778C]">Total Periode</span>
                                    <span className="text-xs font-bold text-[#FF5630]">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(trendExpenseData.reduce((s, d) => s + d.amount, 0))}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Income Trend Chart */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-[#36B37E]/10">
                                <TrendingUp size={14} className="text-[#36B37E]" />
                            </div>
                            <h3 className="text-sm font-bold text-[#172B4D]">Tren Pemasukan</h3>
                        </div>
                    </div>
                    {/* Period Toggle for Income */}
                    <div className="flex gap-1.5 mb-4">
                        {([
                            { key: '7d', label: '7 Hari' },
                            { key: '30d', label: '30 Hari' },
                            { key: '12m', label: '12 Bulan' }
                        ] as { key: TrendPeriod; label: string }[]).map(p => (
                            <button
                                key={p.key}
                                onClick={() => setIncomePeriod(p.key)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition ${incomePeriod === p.key
                                        ? 'bg-[#36B37E] text-white'
                                        : 'bg-[#F4F5F7] text-[#6B778C] hover:bg-gray-200'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {loading ? (
                        <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl animate-pulse" />
                    ) : (
                        <div className="relative">
                            <svg viewBox={`0 0 320 140`} className="w-full h-36" preserveAspectRatio="xMidYMid meet">
                                <defs>
                                    <linearGradient id="incomeLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#36B37E" />
                                        <stop offset="50%" stopColor="#57D9A3" />
                                        <stop offset="100%" stopColor="#36B37E" />
                                    </linearGradient>
                                    <linearGradient id="incomeAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#36B37E" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#36B37E" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <line x1="30" y1="110" x2="300" y2="110" stroke="#E5E7EB" strokeWidth="1" />
                                <line x1="30" y1="75" x2="300" y2="75" stroke="#F3F4F6" strokeWidth="0.5" strokeDasharray="4 4" />
                                <line x1="30" y1="40" x2="300" y2="40" stroke="#F3F4F6" strokeWidth="0.5" strokeDasharray="4 4" />
                                <path
                                    d={`M 30,110 ${trendIncomeData.map((d, i) => {
                                        const x = 30 + (i * (270 / Math.max(trendIncomeData.length - 1, 1)));
                                        const y = 110 - ((d.amount / (trendIncomeMax || 1)) * 60);
                                        return `L ${x},${Math.max(y, 30)}`;
                                    }).join(' ')} L ${30 + ((trendIncomeData.length - 1) * (270 / Math.max(trendIncomeData.length - 1, 1)))},110 Z`}
                                    fill="url(#incomeAreaGradient)"
                                />
                                <polyline
                                    points={trendIncomeData.map((d, i) => {
                                        const x = 30 + (i * (270 / Math.max(trendIncomeData.length - 1, 1)));
                                        const y = 110 - ((d.amount / (trendIncomeMax || 1)) * 60);
                                        return `${x},${Math.max(y, 30)}`;
                                    }).join(' ')}
                                    fill="none"
                                    stroke="url(#incomeLineGradient)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {trendIncomeData.map((d, i) => {
                                    const x = 30 + (i * (270 / Math.max(trendIncomeData.length - 1, 1)));
                                    const y = 110 - ((d.amount / (trendIncomeMax || 1)) * 60);
                                    const clampedY = Math.max(y, 30);
                                    return (
                                        <g key={i}>
                                            <circle cx={x} cy={clampedY} r="6" fill="#36B37E" opacity="0.1" />
                                            <circle cx={x} cy={clampedY} r="3" fill="white" stroke="#36B37E" strokeWidth="2" />
                                        </g>
                                    );
                                })}
                            </svg>
                            <div className="flex justify-between px-1 -mt-1">
                                {trendIncomeData.map((d, i) => (
                                    <div key={i} className="flex flex-col items-center" style={{ width: `${100 / trendIncomeData.length}%` }}>
                                        <span className="text-[9px] font-medium text-[#6B778C] truncate">{d.label}</span>
                                    </div>
                                ))}
                            </div>
                            {trendIncomeMax > 1 && (
                                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-[10px] text-[#6B778C]">Total Periode</span>
                                    <span className="text-xs font-bold text-[#36B37E]">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(trendIncomeData.reduce((s, d) => s + d.amount, 0))}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <section className="flex-1 bg-white rounded-t-2xl px-6 pt-5 pb-28 shadow-lg">
                {/* Budget Tracker Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-[#172B4D]">Budget Tracker</h2>
                        <button
                            onClick={() => { setShowBudgetModal(true); setEditingCategory(null); setBudgetAmount(''); }}
                            className="text-xs font-semibold text-[#00875A] hover:underline"
                        >
                            + Atur Budget
                        </button>
                    </div>

                    {budgets.length === 0 ? (
                        <div className="bg-[#F4F5F7] rounded-lg p-4 text-center">
                            <p className="text-sm text-[#6B778C]">Belum ada budget yang diatur</p>
                            <p className="text-xs text-[#6B778C]/70 mt-1">Tap "+ Atur Budget" untuk mulai</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {budgets.map(budget => {
                                const spent = byCategory[budget.category] || 0;
                                const percentage = Math.min((spent / budget.amount) * 100, 100);
                                const isOver = spent > budget.amount;

                                return (
                                    <div
                                        key={budget.category}
                                        className="bg-[#F4F5F7] rounded-lg p-3 cursor-pointer hover:bg-[#EBECF0] transition active:scale-[0.98]"
                                        onClick={() => {
                                            setEditingCategory(budget.category);
                                            setBudgetAmount(budget.amount.toString());
                                            setShowBudgetModal(true);
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-[#172B4D] capitalize">{getCategoryLabel(budget.category)}</span>
                                                {isOver && <span className="text-[8px] bg-[#FF5630] text-white px-1.5 py-0.5 rounded-full font-bold">OVER</span>}
                                            </div>
                                            <span className={`text-xs font-bold ${isOver ? 'text-[#FF5630]' : 'text-[#172B4D]'}`}>
                                                {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(spent)} / {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(budget.amount)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-white rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-[#FF5630]' : 'bg-[#00875A]'}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-[10px] text-[#6B778C]">{percentage.toFixed(0)}% terpakai</p>
                                            <p className="text-[10px] text-[#00875A] font-medium">Tap untuk edit</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pengeluaran per Kategori Section */}
                <div className="pt-4 border-t border-gray-100">
                    <h2 className="text-base font-bold text-[#172B4D] mb-4">Pengeluaran per Kategori</h2>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="flex justify-between mb-2">
                                        <div className="h-4 w-24 bg-gray-200 rounded" />
                                        <div className="h-4 w-16 bg-gray-200 rounded" />
                                    </div>
                                    <div className="h-2 w-full bg-gray-200 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="text-center py-12"><CreditCard size={36} className="mx-auto text-gray-400 mb-3" /><p className="text-[#6B778C] text-sm">Tidak ada data di periode ini</p></div>
                    ) : (
                        <div className="space-y-4">
                            {sorted.map(([cat, amount], i) => (
                                <div key={cat}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${categoryColors[cat] || '#6b7280'}15` }}>
                                                <span style={{ color: categoryColors[cat] || '#6b7280' }}>{categoryIconsSmall[cat] || <CreditCard size={16} />}</span>
                                            </div>
                                            <span className="text-[#172B4D] capitalize text-sm font-medium">{getCategoryLabel(cat)}</span>
                                        </div>
                                        <span className="text-[#172B4D] font-semibold text-sm">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${totalExpense > 0 ? (amount / totalExpense) * 100 : 0}%`, backgroundColor: categoryColors[cat] || '#6b7280' }} /></div>
                                    <p className="text-[10px] text-[#6B778C] mt-1">{totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0}% dari total</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Budget Modal */}
            {showBudgetModal && (
                <div className="fixed inset-0 z-[999] flex items-end justify-center" onClick={() => setShowBudgetModal(false)}>
                    <div className="absolute inset-0 bg-black/50" />
                    <div
                        className="relative bg-white rounded-t-2xl w-full max-w-md p-6 pb-8 animate-fade-in-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-[#172B4D] mb-4">Atur Budget Kategori</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-[#6B778C] mb-1 block">Pilih Kategori</label>
                                <select
                                    value={editingCategory || ''}
                                    onChange={(e) => setEditingCategory(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-200 text-sm text-[#172B4D] bg-white"
                                >
                                    <option value="">-- Pilih --</option>
                                    {categories.filter(c => !['gaji', 'investasi', 'bonus'].includes(c)).map(cat => (
                                        <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-[#6B778C] mb-1 block">Limit Budget (Rp)</label>
                                <input
                                    type="number"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(e.target.value)}
                                    placeholder="Contoh: 500000"
                                    className="w-full p-3 rounded-lg border border-gray-200 text-sm text-[#172B4D]"
                                />
                            </div>

                            <button
                                onClick={async () => {
                                    if (!editingCategory || !budgetAmount) {
                                        alert('Pilih kategori dan masukkan nominal budget');
                                        return;
                                    }
                                    try {
                                        console.log('Saving budget:', { category: editingCategory, amount: parseInt(budgetAmount) });
                                        const res = await fetch('/api/budgets', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ category: editingCategory, amount: parseInt(budgetAmount) })
                                        });
                                        console.log('API response status:', res.status);
                                        const result = await res.json();
                                        console.log('API response:', result);

                                        if (res.ok && result.budget) {
                                            setBudgets(prev => {
                                                const exists = prev.find(b => b.category === result.budget.category);
                                                if (exists) {
                                                    return prev.map(b => b.category === result.budget.category ? result.budget : b);
                                                }
                                                return [...prev, result.budget];
                                            });
                                            setShowBudgetModal(false);
                                            setEditingCategory(null);
                                            setBudgetAmount('');
                                        } else {
                                            alert('Gagal menyimpan: ' + (result.error || 'Unknown error'));
                                        }
                                    } catch (e) {
                                        console.error('Failed to save budget:', e);
                                        alert('Terjadi kesalahan jaringan');
                                    }
                                }}
                                disabled={!editingCategory || !budgetAmount}
                                className="w-full py-3 bg-[#00875A] text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-[#006644] transition shadow-md"
                            >
                                Simpan Budget
                            </button>

                            {/* Delete button - only show when editing existing budget */}
                            {editingCategory && budgets.some(b => b.category === editingCategory) && (
                                <button
                                    onClick={async () => {
                                        if (!confirm(`Hapus budget untuk ${getCategoryLabel(editingCategory)}?`)) return;
                                        try {
                                            const res = await fetch(`/api/budgets?category=${editingCategory}`, {
                                                method: 'DELETE'
                                            });
                                            if (res.ok) {
                                                setBudgets(prev => prev.filter(b => b.category !== editingCategory));
                                                setShowBudgetModal(false);
                                                setEditingCategory(null);
                                                setBudgetAmount('');
                                            } else {
                                                alert('Gagal menghapus budget');
                                            }
                                        } catch (e) {
                                            alert('Terjadi kesalahan jaringan');
                                        }
                                    }}
                                    className="w-full py-3 bg-white text-[#FF5630] font-semibold rounded-xl border border-[#FF5630] hover:bg-[#FF5630]/5 transition mt-2"
                                >
                                    Hapus Budget
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
