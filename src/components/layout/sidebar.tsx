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
  Swords,
  Search,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const boardGameNavItems = [
  { label: 'Dashboard', href: '/bg-tracker/dashboard', icon: LayoutDashboard },
  { label: 'Games', href: '/bg-tracker/games', icon: Dice5 },
  { label: 'Sessions', href: '/bg-tracker/sessions', icon: CalendarDays },
  { label: 'Players', href: '/bg-tracker/players', icon: Users },
  { label: 'Leaderboard', href: '/bg-tracker/leaderboard', icon: Trophy },
];

const vtesNavItems = [
  { label: 'Dashboard', href: '/vtes-tracker', icon: LayoutDashboard },
  { label: 'Decks', href: '/vtes-tracker/decks', icon: Swords },
  { label: 'Sessions', href: '/vtes-tracker/sessions', icon: FileText },
  { label: 'Leaderboard', href: '/vtes-tracker/leaderboard', icon: Trophy },
  { label: 'Search Cards', href: '/vtes-tracker/cards', icon: Search },
  { label: 'CRUSADE', href: '/vtes-guess', icon: HelpCircle },
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

  const isVtes = pathname?.startsWith('/vtes-tracker') || pathname?.startsWith('/vtes-guess');
  const navItems = isVtes ? vtesNavItems : boardGameNavItems;

  // Theme configuration
  const theme = isVtes ? {
    iconBg: 'bg-gradient-to-br from-red-600 to-rose-900',
    iconColor: 'text-red-100',
    activeBg: 'bg-red-900/20',
    activeText: 'text-red-400',
    activeShadow: 'shadow-red-500/10',
    hoverBg: 'hover:bg-red-900/10',
    hoverText: 'hover:text-red-200',
    appName: 'Praxis Seizure'
  } : {
    iconBg: 'bg-gradient-to-br from-wood-500 to-wood-600',
    iconColor: 'text-white',
    activeBg: 'bg-wood-500/20',
    activeText: 'text-wood-400',
    activeShadow: 'shadow-wood-500/10',
    hoverBg: 'hover:bg-slate-800/50',
    hoverText: 'hover:text-slate-100',
    appName: 'Game Night'
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const NavLink = ({ item, mobile = false }: { item: typeof navItems[0], mobile?: boolean }) => {
    const isActive = pathname === item.href || (item.href !== '/vtes-tracker' && pathname?.startsWith(item.href + '/'));
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={() => mobile && setIsMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200',
          isActive
            ? cn(theme.activeBg, theme.activeText, 'shadow-lg', theme.activeShadow)
            : cn('text-slate-400', theme.hoverText, theme.hoverBg),
          isCollapsed && !mobile && 'justify-center px-2'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && theme.activeText)} />
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
            <Link href={isVtes ? "/vtes-tracker" : "/bg-tracker/dashboard"} className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl shadow-glow", theme.iconBg)}>
                {isVtes ? <Swords className={cn("h-6 w-6", theme.iconColor)} /> : <Dice5 className={cn("h-6 w-6", theme.iconColor)} />}
              </div>
              <span className="text-lg font-bold text-slate-100">{theme.appName}</span>
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
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 w-full transition-all duration-200"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Switch App</span>
            </Link>
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
            <Link href={isVtes ? "/vtes-tracker" : "/bg-tracker/dashboard"} className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl shadow-glow", theme.iconBg)}>
                {isVtes ? <Swords className={cn("h-6 w-6", theme.iconColor)} /> : <Dice5 className={cn("h-6 w-6", theme.iconColor)} />}
              </div>
              {!isCollapsed && (
                <span className="text-lg font-bold text-slate-100">{theme.appName}</span>
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
            <Link
              href="/"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 w-full transition-all duration-200',
                isCollapsed && 'justify-center px-2'
              )}
              title="Switch App"
            >
              <LayoutDashboard className="h-5 w-5" />
              {!isCollapsed && <span>Switch App</span>}
            </Link>

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
