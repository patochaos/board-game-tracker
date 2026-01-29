'use client';

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
  result: 'correct' | 'incorrect' | 'skipped' | null;
  onNextCard: () => void;
  showDetails: boolean;
  toggleDetails: () => void;
  cardDetails?: {
    artists?: string[];
  };
  cardCount?: number;
}

export default function GameControls({
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

  // Handle result states (incorrect/skipped)
  if (revealed && result === 'incorrect') {
    return (
      <div className="flex-shrink-0 flex flex-col items-center justify-end pb-2 min-h-[140px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-lg font-bold flex items-center gap-2 mb-2"
          style={{ color: '#ef4444' }}
        >
          <span className="text-xl">✗</span> INCORRECT
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

        {/* Expandable details */}
        {(artists.length > 0 || (cardCount && cardCount > 0)) && (
          <>
            <button
              onClick={toggleDetails}
              className="text-xs flex items-center gap-1 mt-2 transition-all duration-200 hover:opacity-80"
              style={{ color: 'var(--vtes-text-muted)' }}
            >
              <span>{showDetails ? 'Hide' : 'Show'} Details</span>
            </button>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-center mt-1"
                style={{ color: 'var(--vtes-text-dim)' }}
              >
                {artists.length > 0 && <p>Art by {artists.join(', ')}</p>}
                {cardCount && cardCount > 0 && <p>Used in {cardCount.toLocaleString()} TWDA decks</p>}
              </motion.div>
            )}
          </>
        )}
      </div>
    );
  }

  if (revealed && result === 'skipped') {
    return (
      <div className="flex-shrink-0 flex flex-col items-center justify-end pb-2 min-h-[140px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg font-bold flex items-center gap-2 mb-2"
          style={{ color: 'var(--vtes-text-muted)' }}
        >
          <SkipForward className="w-4 h-4" /> SKIPPED
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

        {/* Expandable details */}
        {(artists.length > 0 || (cardCount && cardCount > 0)) && (
          <>
            <button
              onClick={toggleDetails}
              className="text-xs flex items-center gap-1 mt-2 transition-all duration-200 hover:opacity-80"
              style={{ color: 'var(--vtes-text-muted)' }}
            >
              <span>{showDetails ? 'Hide' : 'Show'} Details</span>
            </button>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-center mt-1"
                style={{ color: 'var(--vtes-text-dim)' }}
              >
                {artists.length > 0 && <p>Art by {artists.join(', ')}</p>}
                {cardCount && cardCount > 0 && <p>Used in {cardCount.toLocaleString()} TWDA decks</p>}
              </motion.div>
            )}
          </>
        )}
      </div>
    );
  }

  // Normal gameplay - show answer options
  const options = isCrypt ? cryptOptions : libraryOptions;

  return (
    <div className="flex-shrink-0 flex flex-col items-center justify-end pb-2 min-h-[140px]">
      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-[320px]">
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
                borderBottom: '3px solid rgba(0,0,0,0.3)',
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
