'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'green' | 'slate' | 'outline';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'badge bg-slate-700/50 text-slate-300',
      gold: 'badge-gold',
      green: 'badge-green',
      slate: 'badge-slate',
      outline: 'badge border border-slate-600 text-slate-400',
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
