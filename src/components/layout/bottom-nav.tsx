'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Dice5,
    CalendarDays,
    Trophy,
} from 'lucide-react';

// Navigation items for Board Game Tracker
const navItems = [
    { label: 'Home', href: '/bg-tracker/dashboard', icon: LayoutDashboard },
    { label: 'Games', href: '/bg-tracker/games', icon: Dice5 },
    { label: 'Sessions', href: '/bg-tracker/sessions', icon: CalendarDays },
    { label: 'Ranks', href: '/bg-tracker/leaderboard', icon: Trophy },
];

export function BottomNav() {
    const pathname = usePathname();

    // Only render on BG Tracker pages
    if (!pathname?.startsWith('/bg-tracker')) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
            {/* Background with blur */}
            <div className="absolute inset-0 bg-surface-card/95 backdrop-blur-xl border-t border-wood-900/30" />

            {/* Safe area padding for notched phones */}
            <div className="relative flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center flex-1 min-h-[48px] py-2 px-1 rounded-xl transition-all duration-200',
                                isActive
                                    ? 'text-wood-400 bg-wood-500/20'
                                    : 'text-ink-faint hover:text-ink-muted active:scale-95'
                            )}
                        >
                            <Icon className="h-5 w-5 mb-0.5" />
                            <span className={cn(
                                'text-[10px] font-semibold truncate max-w-full',
                                isActive ? 'text-wood-400' : 'text-ink-faint'
                            )}>
                                {item.label}
                            </span>
                            {/* Active indicator dot */}
                            {isActive && (
                                <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-wood-500" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
