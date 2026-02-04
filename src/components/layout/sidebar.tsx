'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Dice5,
  CalendarDays,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Trophy,
  BarChart2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/bg-tracker/dashboard', icon: LayoutDashboard },
  { label: 'Games', href: '/bg-tracker/games', icon: Dice5 },
  { label: 'Sessions', href: '/bg-tracker/sessions', icon: CalendarDays },
  { label: 'Players', href: '/bg-tracker/players', icon: Users },
  { label: 'Leaderboard', href: '/bg-tracker/leaderboard', icon: Trophy },
  { label: 'Stats', href: '/bg-tracker/stats', icon: BarChart2 },
];

const bottomItems = [
  { label: 'Settings', href: '/bg-tracker/settings', icon: Settings },
];

interface SidebarProps {
  userName?: string;
  userAvatar?: string;
}

export function Sidebar({ userName = 'Player', userAvatar }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/bg-tracker/login');
  };

  const NavLink = ({ item, mobile = false }: { item: typeof navItems[0], mobile?: boolean }) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={() => mobile && setIsMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200',
          isActive
            ? 'bg-gradient-to-r from-wood-500 to-wood-600 text-white shadow-glow'
            : 'text-ink-muted hover:text-ink-rich hover:bg-surface-elevated',
          isCollapsed && !mobile && 'justify-center px-2'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {(!isCollapsed || mobile) && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-3 rounded-xl bg-surface-card border border-wood-900/30 shadow-card lg:hidden"
      >
        <Menu className="h-5 w-5 text-ink-muted" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-surface-card border-r border-wood-900/30 shadow-elevated transform transition-transform duration-300 lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8">
            <Link href="/bg-tracker/dashboard" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-wood-500 to-wood-600 shadow-glow">
                <Dice5 className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-bold text-ink-rich">Salty Meeples</span>
            </Link>
            <button onClick={() => setIsMobileOpen(false)} className="p-2 rounded-lg hover:bg-surface-elevated">
              <X className="h-5 w-5 text-ink-muted" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} mobile />
            ))}
          </nav>

          <div className="pt-4 border-t border-wood-900/30 space-y-1">
            {bottomItems.map((item) => (
              <NavLink key={item.href} item={item} mobile />
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-ink-muted hover:text-red-400 hover:bg-red-500/10 w-full transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col bg-surface-card border-r border-wood-900/30 shadow-card transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className={cn(
            'flex items-center mb-8',
            isCollapsed ? 'justify-center' : 'gap-3'
          )}>
            <Link href="/bg-tracker/dashboard" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-wood-500 to-wood-600 shadow-glow">
                <Dice5 className="h-6 w-6 text-white" />
              </div>
              {!isCollapsed && (
                <span className="text-lg font-bold text-ink-rich">Salty Meeples</span>
              )}
            </Link>
          </div>

          {/* Main Nav */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Bottom Nav */}
          <div className="pt-4 border-t border-wood-900/30 space-y-1">
            {bottomItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
            <button
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-ink-muted hover:text-red-400 hover:bg-red-500/10 w-full transition-all duration-200',
                isCollapsed && 'justify-center px-2'
              )}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mt-4 p-2 rounded-xl text-ink-faint hover:text-ink-muted hover:bg-surface-elevated transition-all duration-200 self-end"
          >
            <ChevronLeft className={cn(
              'h-5 w-5 transition-transform duration-300',
              isCollapsed && 'rotate-180'
            )} />
          </button>
        </div>
      </aside>
    </>
  );
}
