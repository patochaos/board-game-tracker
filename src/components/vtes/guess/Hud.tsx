'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Flame, Target, Sparkles, Settings, Trophy } from 'lucide-react';

interface HudProps {
  score: number;
  streak: number;
  gameMode: 'normal' | 'ranked';
  rankedCardIndex?: number;
  rankedScore?: number;
  rankedStreak?: number;
  onSettingsClick: () => void;
}

export default function Hud({
  score,
  streak,
  gameMode,
  rankedCardIndex = 0,
  rankedScore = 0,
  rankedStreak = 0,
  onSettingsClick,
}: HudProps) {
  // Calculate streak multiplier for visual feedback
  const streakMultiplier = useMemo(() => {
    if (streak >= 15) return { multiplier: 1.3, icon: '🔥', color: 'text-yellow-400', label: 'INFERNO' };
    if (streak >= 10) return { multiplier: 1.2, icon: '🔥', color: 'text-slate-300', label: 'FLAME' };
    if (streak >= 5) return { multiplier: 1.1, icon: '✨', color: 'text-orange-400', label: 'SPARK' };
    return null;
  }, [streak]);

  if (gameMode === 'ranked') {
    return (
      <div className="flex items-center justify-between px-4 h-12 flex-shrink-0 border-b" style={{
        backgroundColor: 'var(--vtes-bg-tertiary)',
        borderColor: 'var(--vtes-gold)',
      }}>
        {/* Card Progress - Left */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--vtes-gold)]/20">
            <Target className="w-4 h-4" style={{ color: 'var(--vtes-gold)' }} />
          </div>
          <div>
            <motion.span
              key={`ranked-idx-${rankedCardIndex}`}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold block leading-none"
              style={{ color: 'var(--vtes-text-primary)' }}
            >
              {rankedCardIndex + 1}/20
            </motion.span>
          </div>
        </div>

        {/* Streak - Center */}
        <div className="flex items-center gap-2 relative">
          <div className="p-1.5 rounded-lg bg-orange-500/20">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <motion.span
              key={`ranked-streak-${rankedStreak}`}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold block leading-none"
              style={{ color: 'var(--vtes-text-primary)' }}
            >
              {rankedStreak}
            </motion.span>
          </div>
          
          {/* Multiplier badge */}
          {streakMultiplier && (
            <div className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${streakMultiplier.color} bg-[var(--vtes-bg-secondary)] border border-[var(--vtes-gold)]`}>
              {streakMultiplier.icon}
            </div>
          )}
        </div>

        {/* Score - Right */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--vtes-blood)]/20">
            <Crown className="w-4 h-4" style={{ color: 'var(--vtes-blood)' }} />
          </div>
          <div>
            <motion.span
              key={`ranked-score-${rankedScore}`}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold block leading-none"
              style={{ color: 'var(--vtes-gold)' }}
            >
              {rankedScore}
            </motion.span>
          </div>
        </div>
      </div>
    );
  }

  // Casual mode HUD
  return (
    <div className="flex items-center justify-between px-4 h-12 flex-shrink-0 border-b" style={{
      backgroundColor: 'var(--vtes-bg-tertiary)',
      borderColor: 'var(--vtes-burgundy-dark)',
    }}>
      {/* Score - Left */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-[var(--vtes-blood)]/20">
          <Crown className="w-4 h-4" style={{ color: 'var(--vtes-blood)' }} />
        </div>
        <div>
          <motion.span
            key={`score-${score}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-lg font-bold block leading-none"
            style={{ color: 'var(--vtes-text-primary)' }}
          >
            {score}
          </motion.span>
        </div>
      </div>

      {/* Streak - Center */}
      <div className="flex items-center gap-2 relative">
        <div className="p-1.5 rounded-lg bg-orange-500/20">
          <Flame className="w-4 h-4 text-orange-500" />
        </div>
        <div>
          <motion.span
            key={`streak-${streak}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-lg font-bold block leading-none"
            style={{ color: 'var(--vtes-text-primary)' }}
          >
            {streak}
          </motion.span>
        </div>
        
        {/* Multiplier badge */}
        {streakMultiplier && (
          <div className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${streakMultiplier.color} bg-[var(--vtes-bg-secondary)] border border-[var(--vtes-gold)]`}>
            {streakMultiplier.icon}
          </div>
        )}
      </div>

      {/* Settings - Right */}
      <button
        onClick={onSettingsClick}
        className="p-2 rounded-lg transition-colors hover:bg-[var(--vtes-bg-secondary)]"
        style={{ color: 'var(--vtes-text-muted)' }}
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
}
