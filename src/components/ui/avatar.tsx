'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import { cn, getInitials, getPlayerColor } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colorIndex?: number;
  showBorder?: boolean;
  isWinner?: boolean;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className, 
    src, 
    name, 
    size = 'md', 
    colorIndex = 0,
    showBorder = false,
    isWinner = false,
    ...props 
  }, ref) => {
    const sizes = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    };

    const imageSizes = {
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64,
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full font-medium',
          sizes[size],
          !src && getPlayerColor(colorIndex),
          !src && 'text-white',
          showBorder && 'ring-2 ring-slate-800',
          isWinner && 'ring-2 ring-wood-500 shadow-glow',
          className
        )}
        title={name}
        {...props}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            width={imageSizes[size]}
            height={imageSizes[size]}
            className="rounded-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
        {isWinner && (
          <span className="absolute -top-1 -right-1 text-sm">👑</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<{ src?: string | null; name: string; isWinner?: boolean }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, avatars, max = 4, size = 'md', ...props }, ref) => {
    const visibleAvatars = avatars.slice(0, max);
    const remainingCount = avatars.length - max;

    return (
      <div
        ref={ref}
        className={cn('flex -space-x-2', className)}
        {...props}
      >
        {visibleAvatars.map((avatar, index) => (
          <Avatar
            key={index}
            src={avatar.src}
            name={avatar.name}
            size={size}
            colorIndex={index}
            showBorder
            isWinner={avatar.isWinner}
          />
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              'inline-flex items-center justify-center rounded-full bg-slate-700 text-slate-300 font-medium ring-2 ring-slate-800',
              size === 'sm' && 'h-8 w-8 text-xs',
              size === 'md' && 'h-10 w-10 text-sm',
              size === 'lg' && 'h-12 w-12 text-base'
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup };
