'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SkipForward, Clock } from 'lucide-react';

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
  selectedAnswer?: string | null;
  correctAnswer?: string | null;
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
  selectedAnswer,
  correctAnswer,
}: GameControlsProps) {
  const artists = cardDetails?.artists ?? [];

  // Handle result states (incorrect/skipped/timeout)
  if (revealed && (result === 'incorrect' || result === 'timeout')) {
    const isTimeout = result === 'timeout';
    // Distinct colors: amber/orange for timeout, red for incorrect
    const feedbackColor = isTimeout ? '#f59e0b' : '#ef4444';
    const feedbackBg = isTimeout ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';

    return (
      <div
        className="flex-shrink-0 flex flex-col items-center justify-end pb-2 min-h-[140px]"
        role="status"
        aria-live="polite"
        aria-label={isTimeout ? 'Time ran out' : 'Incorrect answer'}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="text-lg font-bold flex items-center gap-2 mb-2 px-4 py-1.5 rounded-full"
          style={{
            color: feedbackColor,
            backgroundColor: feedbackBg,
          }}
        >
          {isTimeout ? (
            <Clock className="w-5 h-5" aria-hidden="true" />
          ) : (
            <span className="text-xl" aria-hidden="true">✗</span>
          )}
          {isTimeout ? 'TIME OUT' : 'INCORRECT'}
        </motion.div>

        <motion.button
          onClick={onNextCard}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full max-w-[320px] py-3 mt-2 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-base shadow-lg"
          style={{
            backgroundColor: 'var(--vtes-burgundy)',
            color: 'var(--vtes-gold)',
            border: '2px solid var(--vtes-gold)',
            fontFamily: 'var(--vtes-font-display)',
          }}
          aria-label="Load next card"
        >
          NEXT
          <SkipForward className="w-4 h-4" aria-hidden="true" />
        </motion.button>
      </div>
    );
  }

  if (revealed && result === 'skipped') {
    // Minimal UI - just show SKIPPED indicator, auto-advances after 800ms
    return (
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center pb-2 min-h-[140px]"
        role="status"
        aria-live="polite"
        aria-label="Card skipped"
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="text-lg font-bold flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{
            color: 'var(--vtes-text-muted)',
            backgroundColor: 'rgba(100, 116, 139, 0.15)',
          }}
        >
          <SkipForward className="w-5 h-5" aria-hidden="true" /> SKIPPED
        </motion.div>
      </div>
    );
  }

  // Normal gameplay - show answer options
  const options = isCrypt ? cryptOptions : libraryOptions;

  // Determine button states when revealed
  const getButtonStyle = (option: string) => {
    const isSelected = selectedAnswer === option;
    const isCorrect = option === correctAnswer;

    // When revealed, show correct/incorrect styling
    if (revealed && (result === 'correct' || result === 'incorrect' || result === 'timeout')) {
      if (isCorrect) {
        // Correct answer - always show green
        return {
          background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
          border: '2px solid #22c55e',
          boxShadow: '0 0 12px rgba(34, 197, 94, 0.4), 0 3px 0 rgba(0,0,0,0.3)',
        };
      }
      if (isSelected && !isCorrect) {
        // Wrong answer selected - show red
        return {
          background: 'linear-gradient(180deg, #991b1b 0%, #7f1d1d 100%)',
          border: '2px solid #ef4444',
          boxShadow: '0 0 12px rgba(239, 68, 68, 0.4), 0 3px 0 rgba(0,0,0,0.3)',
        };
      }
      // Other options - dim them
      return {
        background: 'linear-gradient(180deg, var(--vtes-burgundy) 0%, var(--vtes-burgundy-dark) 100%)',
        border: '2px solid var(--vtes-gold-dark)',
        boxShadow: '0 3px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
        opacity: 0.4,
      };
    }

    // Default style
    return {
      background: 'linear-gradient(180deg, var(--vtes-burgundy) 0%, var(--vtes-burgundy-dark) 100%)',
      border: '2px solid var(--vtes-gold-dark)',
      boxShadow: '0 3px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
    };
  };

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center justify-end pb-2 min-h-[140px]"
      role="group"
      aria-label="Answer options"
    >
      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[320px] pb-1">
        {options.map((option, i) => {
          // Dynamic text size: smaller for long names to prevent overflow
          const textSize = option.length > 20 ? 'text-[11px]' : 'text-sm';
          const isSelected = selectedAnswer === option;
          const isCorrect = option === correctAnswer;
          const showIndicator = revealed && (result === 'correct' || result === 'incorrect' || result === 'timeout');

          return (
            <motion.button
              key={i}
              onClick={() => isCrypt ? onCryptChoice(option) : onLibraryChoice(option)}
              whileHover={!revealed ? { scale: 1.03, y: -2 } : {}}
              whileTap={!revealed ? { scale: 0.97, y: 0 } : {}}
              disabled={revealed}
              className={`py-2.5 px-3 rounded-xl ${textSize} font-semibold transition-all duration-200 flex items-center justify-center text-center min-h-[56px] shadow-md hover:shadow-lg relative`}
              style={{
                ...getButtonStyle(option),
                color: 'var(--vtes-gold)',
                fontFamily: 'var(--vtes-font-display)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {option}
              {/* Selection indicator */}
              {showIndicator && isSelected && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: isCorrect ? '#22c55e' : '#ef4444',
                    color: 'white',
                  }}
                >
                  {isCorrect ? '✓' : '✗'}
                </span>
              )}
              {/* Show checkmark on correct answer if user picked wrong */}
              {showIndicator && isCorrect && !isSelected && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: '#22c55e',
                    color: 'white',
                  }}
                >
                  ✓
                </span>
              )}
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
