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
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Games', href: '/games', icon: Dice5 },
  { label: 'Sessions', href: '/sessions', icon: CalendarDays },
  { label: 'Players', href: '/players', icon: Users },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
];

const bottomItems = [
  { label: 'Settings', href: '/settings', icon: Settings },
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
    router.push('/login');
  };

  const NavLink = ({ item, mobile = false }: { item: typeof navItems[0], mobile?: boolean }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={() => mobile && setIsMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200',
          isActive
            ? 'bg-wood-500/20 text-wood-400 shadow-lg shadow-wood-500/10'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
          isCollapsed && !mobile && 'justify-center px-2'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-wood-400')} />
        {(!isCollapsed || mobile) && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-slate-900 border border-slate-800 lg:hidden"
      >
        <Menu className="h-5 w-5 text-slate-300" />
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
          'fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 transform transition-transform duration-300 lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-wood-500 to-wood-600 shadow-glow">
                <Dice5 className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-100">Game Night</span>
            </Link>
            <button onClick={() => setIsMobileOpen(false)}>
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} mobile />
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-800 space-y-1">
            {bottomItems.map((item) => (
              <NavLink key={item.href} item={item} mobile />
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-all duration-200"
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
          'hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className={cn(
            'flex items-center mb-8',
            isCollapsed ? 'justify-center' : 'gap-3'
          )}>
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-wood-500 to-wood-600 shadow-glow">
                <Dice5 className="h-6 w-6 text-white" />
              </div>
              {!isCollapsed && (
                <span className="text-lg font-bold text-slate-100">Game Night</span>
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
          <div className="pt-4 border-t border-slate-800 space-y-1">
            {bottomItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
            <button
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-all duration-200',
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
            className="mt-4 p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all duration-200 self-end"
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
