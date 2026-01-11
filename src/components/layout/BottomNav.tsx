'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, PieChart, Settings, CreditCard } from 'lucide-react'; // Changed LogOut to Settings
import { cn } from '@/lib/utils';
import { FloatingActionButton } from './FloatingActionButton';
import { ChatInterface } from '@/components/features/ChatInterface';
import { useState } from 'react';
// import { useAuth } from '@/components/providers/AuthProvider'; // No longer needed for direct logout

export function BottomNav() {
    const pathname = usePathname();
    const [isChatOpen, setIsChatOpen] = useState(false);
    // const { signOut } = useAuth(); // Moved to Settings page

    const navItems = [
        { label: 'Beranda', icon: Home, href: '/' },
        { label: 'Riwayat', icon: History, href: '/history' },
        { label: '', icon: null, href: '#' },
        { label: 'Analitik', icon: PieChart, href: '/analytics' },
        { label: 'Pengaturan', icon: Settings, href: '/settings' },
    ];

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
                {/* Custom Curved SVG Background */}
                <div className="relative w-full h-[88px] flex justify-center filter drop-shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 375 90"
                        preserveAspectRatio="none"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute bottom-0 text-white fill-current filter drop-shadow-[0_-5px_10px_rgba(0,0,0,0.05)]"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M0 12C0 5.373 5.373 0 12 0H132C140 0 148 10 153 20C160 38 172 48 187.5 48C203 48 215 38 222 20C227 10 235 0 243 0H363C369.627 0 375 5.373 375 12V90H0V12Z"
                            fill="white"
                        />
                    </svg>

                    {/* FAB positioned in the notch */}
                    <div className="absolute -top-6">
                        <FloatingActionButton onClick={() => setIsChatOpen(true)} />
                    </div>

                    {/* Nav Items Container */}
                    <div className="absolute inset-0 flex items-center justify-between px-6 pt-2 pb-6">
                        {navItems.map((item, index) => {
                            if (!item.icon) return <div key={index} className="w-10" />; // Spacer for center
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 w-14 z-10", isActive ? "text-[#00875A]" : "text-[#6B778C]")}>
                                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="transition-all" />
                                    <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
            <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
    );
}
