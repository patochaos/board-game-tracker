'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Swords,
    FileText,
    CalendarDays,
    Search,
    Gamepad2,
    Trophy,
    Home,
} from 'lucide-react';

// Navigation items for Praxis Seizure (vtes-tracker)
const praxisNavItems = [
    { label: 'Domain', href: '/vtes-tracker', icon: Swords },
    { label: 'Decks', href: '/vtes-tracker/decks', icon: FileText },
    { label: 'Sessions', href: '/vtes-tracker/sessions', icon: CalendarDays },
    { label: 'Cards', href: '/vtes-tracker/cards', icon: Search },
];

// Navigation items for Crusade (vtes-guess)
const crusadeNavItems = [
    { label: 'Home', href: '/vtes-guess', icon: Home },
    { label: 'Play', href: '/vtes-guess/guess-card', icon: Gamepad2 },
    { label: 'Ranks', href: '/vtes-guess/leaderboard', icon: Trophy },
];

export function BottomNav() {
    const pathname = usePathname();

    // Determine which app we're in
    const isPraxis = pathname?.startsWith('/vtes-tracker');
    const isCrusade = pathname?.startsWith('/vtes-guess');

    // Don't render on non-VTES pages
    if (!isPraxis && !isCrusade) {
        return null;
    }

    const navItems = isPraxis ? praxisNavItems : crusadeNavItems;

    // Theme colors
    const activeColor = 'text-red-400';
    const inactiveColor = 'text-slate-500';
    const activeBg = 'bg-red-500/10';

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
            {/* Background with blur */}
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800" />

            {/* Safe area padding for notched phones */}
            <div className="relative flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/vtes-tracker' && item.href !== '/vtes-guess' && pathname?.startsWith(item.href + '/'));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl transition-all duration-200',
                                isActive ? cn(activeColor, activeBg) : inactiveColor,
                                !isActive && 'hover:text-slate-300 active:scale-95'
                            )}
                        >
                            <Icon className={cn('h-6 w-6 mb-1', isActive && activeColor)} />
                            <span className={cn(
                                'text-[10px] font-medium',
                                isActive ? activeColor : 'text-slate-500'
                            )}>
                                {item.label}
                            </span>
                            {/* Active indicator dot */}
                            {isActive && (
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-red-400" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
