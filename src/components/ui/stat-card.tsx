'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ 
    className, 
    label, 
    value, 
    subValue, 
    icon,
    trend,
    trendValue,
    ...props 
  }, ref) => {
    const TrendIcon = trend === 'up' 
      ? TrendingUp 
      : trend === 'down' 
        ? TrendingDown 
        : Minus;

    const trendColors = {
      up: 'text-felt-600',
      down: 'text-red-500',
      neutral: 'text-ink-faint',
    };

    return (
      <Card
        ref={ref}
        variant="stat"
        className={cn('relative', className)}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-muted">{label}</p>
            <p className="mt-2 text-3xl font-bold text-ink-rich">{value}</p>
            {subValue && (
              <p className="mt-1 text-sm text-ink-faint">{subValue}</p>
            )}
            {trend && trendValue && (
              <div className={cn('mt-2 flex items-center gap-1 text-sm', trendColors[trend])}>
                <TrendIcon className="h-4 w-4" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="text-wood-400">
              {icon}
            </div>
          )}
        </div>
      </Card>
    );
  }
);

StatCard.displayName = 'StatCard';

export { StatCard };
