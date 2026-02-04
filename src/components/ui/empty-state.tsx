'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Dice5 } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-16 px-4 text-center',
          className
        )}
        {...props}
      >
        <div className="mb-4 text-wood-300">
          {icon || <Dice5 className="h-16 w-16" />}
        </div>
        <h3 className="text-lg font-semibold text-ink-rich">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-ink-muted max-w-sm">{description}</p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export { EmptyState };
