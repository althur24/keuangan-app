'use client';

import { Scan } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FloatingActionButton({ onClick }: { onClick?: () => void }) {
    return (
        <button
            className={cn(
                "w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center",
                "bg-[#00875A] text-white shadow-xl shadow-[#00875A]/40",
                "hover:scale-105 active:scale-95",
                "z-50 relative"
            )}
            onClick={onClick}
            aria-label="New Transaction"
            id="chat-fab"
        >
            <Scan size={32} strokeWidth={2.5} />
        </button>
    );
}
