import {
    Utensils,
    UtensilsCrossed,
    Coffee,
    Car,
    ShoppingBag,
    Gamepad2,
    Receipt,
    Banknote,
    TrendingUp,
    CreditCard,
    Home,
    Heart,
    Plane,
    GraduationCap,
    Gift,
    Smartphone
} from 'lucide-react';

// Category icon mapping - consistent across all pages
export const categoryIcons: Record<string, React.ReactNode> = {
    // Pengeluaran
    fnb: <Utensils size={18} />,
    transport: <Car size={18} />,
    belanja: <ShoppingBag size={18} />,
    hiburan: <Gamepad2 size={18} />,
    tagihan: <Receipt size={18} />,
    kesehatan: <Heart size={18} />,
    pendidikan: <GraduationCap size={18} />,
    liburan: <Plane size={18} />,
    pulsa: <Smartphone size={18} />,
    hadiah: <Gift size={18} />,
    rumah: <Home size={18} />,

    // Pemasukan
    gaji: <Banknote size={18} />,
    investasi: <TrendingUp size={18} />,
    bonus: <Gift size={18} />,

    // Default
    lainnya: <CreditCard size={18} />,
};

// Small version for analytics
export const categoryIconsSmall: Record<string, React.ReactNode> = {
    fnb: <Utensils size={16} />,
    transport: <Car size={16} />,
    belanja: <ShoppingBag size={16} />,
    hiburan: <Gamepad2 size={16} />,
    tagihan: <Receipt size={16} />,
    kesehatan: <Heart size={16} />,
    pendidikan: <GraduationCap size={16} />,
    liburan: <Plane size={16} />,
    pulsa: <Smartphone size={16} />,
    hadiah: <Gift size={16} />,
    rumah: <Home size={16} />,
    gaji: <Banknote size={16} />,
    investasi: <TrendingUp size={16} />,
    bonus: <Gift size={16} />,
    lainnya: <CreditCard size={16} />,
};

// Category colors for charts
export const categoryColors: Record<string, string> = {
    fnb: '#ef4444',  // red
    transport: '#eab308',    // yellow
    belanja: '#22c55e',      // green
    hiburan: '#06b6d4',      // cyan
    tagihan: '#14b8a6',      // teal
    kesehatan: '#ec4899',    // pink
    pendidikan: '#8b5cf6',   // violet
    liburan: '#3b82f6',      // blue
    pulsa: '#6366f1',        // indigo
    hadiah: '#f43f5e',       // rose
    rumah: '#84cc16',        // lime
    gaji: '#10b981',         // emerald
    investasi: '#a855f7',    // purple
    bonus: '#fbbf24',        // amber
    lainnya: '#6b7280',      // gray
};

// Available categories for dropdown
export const categories = [
    'fnb',
    'transport',
    'belanja',
    'hiburan',
    'tagihan',
    'kesehatan',
    'pendidikan',
    'liburan',
    'pulsa',
    'hadiah',
    'rumah',
    'gaji',
    'investasi',
    'bonus',
    'lainnya'
];

// Category labels for UI display (Indonesian)
export const categoryLabels: Record<string, string> = {
    // Pengeluaran
    fnb: 'Makanan & Minuman',
    transport: 'Transportasi',
    belanja: 'Belanja',
    hiburan: 'Hiburan',
    tagihan: 'Tagihan & Utilitas',
    kesehatan: 'Kesehatan',
    pendidikan: 'Pendidikan',
    liburan: 'Liburan & Wisata',
    pulsa: 'Pulsa & Data',
    hadiah: 'Hadiah & Donasi',
    rumah: 'Keperluan Rumah',

    // Pemasukan
    gaji: 'Gaji',
    investasi: 'Investasi',
    bonus: 'Bonus',

    // Default
    lainnya: 'Lainnya',
};

// Get label by category (with fallback)
export function getCategoryLabel(category: string) {
    const cat = category?.toLowerCase() || 'lainnya';
    // Handle cases where category might be just mixed case but not in map
    return categoryLabels[cat] || (category.charAt(0).toUpperCase() + category.slice(1));
}

// Get icon by category (with fallback)
export function getCategoryIcon(category: string, size: 'sm' | 'md' = 'md') {
    const cat = category?.toLowerCase() || 'lainnya';
    if (size === 'sm') {
        return categoryIconsSmall[cat] || <CreditCard size={16} />;
    }
    return categoryIcons[cat] || <CreditCard size={18} />;
}
