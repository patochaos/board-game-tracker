'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({
  className,
  variant = 'text',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-800/60',
        variant === 'text' && 'h-4 w-full rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
      {...props}
    />
  );
}

export function GameListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2" role="status" aria-live="polite" aria-label="Loading games">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center gap-4">
          <div className="w-[44px]" />
          <Skeleton variant="rectangular" className="w-14 h-14 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function SessionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading sessions">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="rectangular" className="w-16 h-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="flex -space-x-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} variant="circular" className="w-10 h-10" />
              ))}
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="status" aria-live="polite" aria-label="Loading statistics">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card">
          <div className="space-y-3">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function PlayerListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-label="Loading players">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <Skeleton variant="circular" className="w-12 h-12 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/6" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function SessionDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6" role="status" aria-live="polite" aria-label="Loading session">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Game Info Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <Skeleton variant="rectangular" className="w-20 h-20 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-2/5" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Players Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="w-5 h-5" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Notes Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <Skeleton className="h-6 w-16 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
