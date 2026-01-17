'use client';

import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className={cn(
        'lg:pl-64 min-h-screen transition-all duration-300',
        className
      )}>
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
