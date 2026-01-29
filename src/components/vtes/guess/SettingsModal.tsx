'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Skull, Target } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardType: 'library' | 'crypt' | 'all';
  onCardTypeChange: (t: 'library' | 'crypt' | 'all') => void;
  gameMode: 'normal' | 'ranked';
  onGameModeChange: (m: 'normal' | 'ranked') => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  cardType,
  onCardTypeChange,
  gameMode,
  onGameModeChange,
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
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-200 flex flex-col items-center gap-1 ${
                  gameMode === 'normal'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg'
                    : 'bg-[var(--vtes-bg-tertiary)] text-slate-400'
                }`}
                style={{ fontFamily: 'var(--vtes-font-display)' }}
              >
                <span className="text-lg">🏛️</span>
                <span className="text-sm">PRACTICE</span>
                <span className={`text-[10px] ${gameMode === 'normal' ? 'text-emerald-200' : 'text-slate-500'}`}>
                  The Elysium
                </span>
              </button>
              <button
                onClick={() => onGameModeChange('ranked')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-200 flex flex-col items-center gap-1 ${
                  gameMode === 'ranked'
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-lg'
                    : 'bg-[var(--vtes-bg-tertiary)] text-slate-400'
                }`}
                style={{ fontFamily: 'var(--vtes-font-display)' }}
              >
                <span className="text-lg">🔥</span>
                <span className="text-sm">RANKED</span>
                <span className={`text-[10px] ${gameMode === 'ranked' ? 'text-amber-200' : 'text-slate-500'}`}>
                  Gehenna
                </span>
              </button>
            </div>
          </div>

          {/* Card Type - Only show in Practice mode */}
          {gameMode === 'normal' && (
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onCardTypeChange(type);
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      cardType === type
                        ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg'
                        : 'bg-[var(--vtes-bg-tertiary)] text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
              {/* Info about difficulty */}
              <p className="text-xs text-center mt-3" style={{ color: 'var(--vtes-text-dim)' }}>
                Difficulty can be changed using the tabs at the bottom.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
