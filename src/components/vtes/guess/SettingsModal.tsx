'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Play, BookOpen, Skull, Target } from 'lucide-react';

const difficultyLabels: Record<number, { name: string; color: string; icon: string }> = {
  1: { name: 'Staple', color: 'text-emerald-400', icon: '🌟' },
  2: { name: 'Common', color: 'text-blue-400', icon: '📦' },
  3: { name: 'Uncommon', color: 'text-yellow-400', icon: '🔶' },
  4: { name: 'Rare', color: 'text-orange-400', icon: '🔴' },
  5: { name: 'Never Used', color: 'text-red-400', icon: '💀' },
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDifficulty: number;
  onDifficultyChange: (d: number) => void;
  cardType: 'library' | 'crypt' | 'all';
  onCardTypeChange: (t: 'library' | 'crypt' | 'all') => void;
  gameMode: 'normal' | 'ranked';
  onGameModeChange: (m: 'normal' | 'ranked') => void;
  totalCards: number;
}

export default function SettingsModal({
  isOpen,
  onClose,
  selectedDifficulty,
  onDifficultyChange,
  cardType,
  onCardTypeChange,
  gameMode,
  onGameModeChange,
  totalCards,
}: SettingsModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Bottom sheet on mobile */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[85vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--vtes-bg-secondary)',
          borderTop: '1px solid var(--vtes-burgundy-dark)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-[var(--vtes-burgundy-dark)]">
          <h2 className="text-lg font-bold" style={{
            color: 'var(--vtes-text-primary)',
            fontFamily: 'var(--vtes-font-display)'
          }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--vtes-bg-tertiary)] transition-colors"
            style={{ color: 'var(--vtes-text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Game Mode */}
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: 'var(--vtes-text-muted)' }}>
              Game Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onGameModeChange('normal')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                  gameMode === 'normal'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg'
                    : 'bg-[var(--vtes-bg-tertiary)] text-slate-400'
                }`}
                style={{ fontFamily: 'var(--vtes-font-display)' }}
              >
                <Play className={`w-4 h-4 ${gameMode === 'normal' ? 'fill-current' : ''}`} />
                Casual
              </button>
              <button
                onClick={() => onGameModeChange('ranked')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                  gameMode === 'ranked'
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-lg'
                    : 'bg-[var(--vtes-bg-tertiary)] text-slate-400'
                }`}
                style={{ fontFamily: 'var(--vtes-font-display)' }}
              >
                <Trophy className={`w-4 h-4 ${gameMode === 'ranked' ? 'fill-current' : ''}`} />
                Ranked
              </button>
            </div>
          </div>

          {/* Card Type */}
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: 'var(--vtes-text-muted)' }}>
              Card Type
            </label>
            <div className="flex gap-2">
              {[
                { type: 'library' as const, icon: <BookOpen className="w-4 h-4" />, label: 'Library' },
                { type: 'crypt' as const, icon: <Skull className="w-4 h-4" />, label: 'Crypt' },
                { type: 'all' as const, icon: <Target className="w-4 h-4" />, label: 'All' }
              ].map(({ type, icon, label }) => (
                <button
                  key={type}
                  onClick={() => onCardTypeChange(type)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    cardType === type
                      ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg'
                      : 'bg-[var(--vtes-bg-tertiary)] text-slate-400'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: 'var(--vtes-text-muted)' }}>
              Difficulty ({totalCards} cards)
            </label>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {[1, 2, 3, 4, 5].map(d => {
                const info = difficultyLabels[d];
                const isSelected = d === selectedDifficulty;
                return (
                  <button
                    key={d}
                    onClick={() => onDifficultyChange(d)}
                    className={`relative px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 min-w-[55px] ${
                      isSelected
                        ? `bg-opacity-20 ${info.color.replace('text-', 'bg-').replace('400', '500/20')} border`
                        : 'bg-[var(--vtes-bg-tertiary)] border border-transparent'
                    }`}
                    style={{
                      color: isSelected ? info.color : 'var(--vtes-text-muted)',
                      fontFamily: 'var(--vtes-font-display)',
                      borderColor: isSelected ? info.color.replace('text-', '') : 'transparent',
                    }}
                  >
                    <span className="mr-1">{info.icon}</span>
                    {info.name}
                  </button>
                );
              })}
            </div>
            <p className="text-center mt-2 text-xs" style={{ color: 'var(--vtes-text-muted)' }}>
              {difficultyLabels[selectedDifficulty].name} • {difficultyLabels[selectedDifficulty].name === 'Staple' ? 'Top 20%' : 
               difficultyLabels[selectedDifficulty].name === 'Common' ? '20-50%' :
               difficultyLabels[selectedDifficulty].name === 'Uncommon' ? '50-80%' :
               difficultyLabels[selectedDifficulty].name === 'Rare' ? 'Bottom 20%' : '0 TWDA'}
            </p>
          </div>
        </div>

        {/* Close button at bottom */}
        <div className="p-4 border-t border-[var(--vtes-burgundy-dark)]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold transition-all duration-200"
            style={{
              backgroundColor: 'var(--vtes-burgundy)',
              color: 'var(--vtes-gold)',
              border: '2px solid var(--vtes-gold)',
              fontFamily: 'var(--vtes-font-display)',
            }}
          >
            Done
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
