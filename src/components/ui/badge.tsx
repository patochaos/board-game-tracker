'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'winner' | 'success' | 'info' | 'muted' | 'new' | 'gold' | 'green' | 'outline';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'badge-muted',
      winner: 'badge-winner',
      success: 'badge-success',
      info: 'badge-info',
      muted: 'badge-muted',
      new: 'badge-new',
      // Legacy variants (map to new ones)
      gold: 'badge-winner',
      green: 'badge-success',
      outline: 'badge border border-wood-300 text-ink-muted',
    };

    return (
      <span
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
