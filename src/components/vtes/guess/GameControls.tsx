'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

interface GameControlsProps {
  isCrypt: boolean;
  cryptOptions: string[];
  libraryOptions: string[];
  gameMode: 'normal' | 'ranked';
  onCryptChoice: (name: string) => void;
  onLibraryChoice: (name: string) => void;
  onSkip: () => void;
  revealed: boolean;
  result: 'correct' | 'incorrect' | 'skipped' | 'timeout' | null;
  onNextCard: () => void;
  showDetails: boolean;
  toggleDetails: () => void;
  cardDetails?: {
    artists?: string[];
  };
  cardCount?: number;
}

function GameControls({
  isCrypt,
  cryptOptions,
  libraryOptions,
  gameMode,
  onCryptChoice,
  onLibraryChoice,
  onSkip,
  revealed,
  result,
  onNextCard,
  showDetails,
  toggleDetails,
  cardDetails,
  cardCount,
}: GameControlsProps) {
  const artists = cardDetails?.artists ?? [];

  // Handle result states (incorrect/skipped/timeout)
  if (revealed && (result === 'incorrect' || result === 'timeout')) {
    const isTimeout = result === 'timeout';
    return (
      <div className="flex-shrink-0 flex flex-col items-center justify-end pb-2 min-h-[140px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-lg font-bold flex items-center gap-2 mb-2"
          style={{ color: '#ef4444' }}
        >
          <span className="text-xl">{isTimeout ? '⏱️' : '✗'}</span> {isTimeout ? 'TIME OUT' : 'INCORRECT'}
        </motion.div>

        <motion.button
          onClick={onNextCard}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full max-w-[320px] py-3 mt-2 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-base shadow-lg"
          style={{
            backgroundColor: 'var(--vtes-burgundy)',
            color: 'var(--vtes-gold)',
            border: '2px solid var(--vtes-gold)',
            fontFamily: 'var(--vtes-font-display)',
          }}
        >
          NEXT
          <SkipForward className="w-4 h-4" />
        </motion.button>
      </div>
    );
  }

  if (revealed && result === 'skipped') {
    // Minimal UI - just show SKIPPED indicator, auto-advances after 800ms
    return (
      <div className="flex-shrink-0 flex flex-col items-center justify-center pb-2 min-h-[140px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg font-bold flex items-center gap-2"
          style={{ color: 'var(--vtes-text-muted)' }}
        >
          <SkipForward className="w-5 h-5" /> SKIPPED
        </motion.div>
      </div>
    );
  }

  // Normal gameplay - show answer options
  const options = isCrypt ? cryptOptions : libraryOptions;

  return (
    <div className="flex-shrink-0 flex flex-col items-center justify-end pb-2 min-h-[140px]">
      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[320px] pb-1">
        {options.map((option, i) => {
          // Dynamic text size: smaller for long names to prevent overflow
          const textSize = option.length > 20 ? 'text-[11px]' : 'text-sm';

          return (
            <motion.button
              key={i}
              onClick={() => isCrypt ? onCryptChoice(option) : onLibraryChoice(option)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97, y: 0 }}
              className={`py-2.5 px-3 rounded-xl ${textSize} font-semibold transition-all duration-200 flex items-center justify-center text-center min-h-[56px] shadow-md hover:shadow-lg`}
              style={{
                background: 'linear-gradient(180deg, var(--vtes-burgundy) 0%, var(--vtes-burgundy-dark) 100%)',
                color: 'var(--vtes-gold)',
                border: '2px solid var(--vtes-gold-dark)',
                boxShadow: '0 3px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
                fontFamily: 'var(--vtes-font-display)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {option}
            </motion.button>
          );
        })}
      </div>

      {/* Skip Button - Discreet text link */}
      {gameMode !== 'ranked' && (
        <button
          onClick={onSkip}
          className="mt-2 text-xs flex items-center gap-1 px-3 py-1 rounded transition-all duration-200 hover:opacity-80"
          style={{ color: 'var(--vtes-text-dim)' }}
        >
          <SkipForward className="w-3 h-3" />
          Skip
        </button>
      )}
    </div>
  );
}

export default memo(GameControls);
