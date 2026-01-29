'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MaskedCard } from '@/components/vtes/MaskedCard';
import CardAttributesStrip from './CardAttributesStrip';
import type { GameCardData, GameCardDetails } from '@/lib/vtes/guess-game';

interface CardStageProps {
  card: GameCardData;
  cardDetails: GameCardDetails | null;
  revealed: boolean;
  feedback: 'correct' | 'incorrect' | 'timeout' | 'skipped' | null;
  cardKey: number;
  getImageUrl: (card: GameCardData) => string;
}

// Note: `revealed` is already in props and used internally

function CardStage({
  card,
  cardDetails,
  revealed,
  feedback,
  cardKey,
  getImageUrl,
}: CardStageProps) {
  const isCrypt = card.capacity !== undefined;
  const imageUrl = getImageUrl(card);
  const revealedImageUrl = cardDetails?.imageUrl || imageUrl;
  const showArtCrop = !isCrypt && !revealed;

  // Calculate responsive card dimensions using CSS clamp
  // When revealed: bigger card that fills more of the screen
  // When playing: smaller to leave room for options
  const displayWidth = revealed
    ? 'clamp(270px, 83vw, 324px)'  // Bigger when revealed (~10% smaller than before)
    : 'clamp(260px, 85vw, 320px)'; // Normal when playing

  // Card aspect ratio is ~1.4:1 (height:width)
  const displayHeight = revealed
    ? (isCrypt ? 'clamp(378px, 115vw, 454px)' : 'clamp(378px, 115vw, 454px)')  // Full card when revealed
    : (isCrypt ? 'clamp(355px, 116vw, 437px)' : 'clamp(250px, 81vw, 315px)');   // Cropped when playing

  // Library crop dimensions (tuned via /vtes-guess/crop-test)
  const scaledCardWidth = 'calc(clamp(260px, 85vw, 320px) / 0.710)';
  const scaledCardHeight = 'calc(' + scaledCardWidth + ' * 1.560)';
  const offsetX = 'calc(' + scaledCardWidth + ' * 0.2050)';
  const offsetY = 'calc(' + scaledCardHeight + ' * 0.1150)';

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-2 px-2 min-h-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={cardKey}
          initial={{ opacity: 0, x: 60 }}
          animate={{
            opacity: 1,
            x: 0,
            ...(feedback === 'incorrect' ? { x: [0, -8, 8, -8, 8, 0] } : {}),
            ...(feedback === 'correct' ? { scale: [1, 1.02, 1] } : {}),
          }}
          exit={{ opacity: 0, x: -60 }}
          transition={{
            duration: feedback ? 0.4 : 0.3,
            ease: 'easeOut'
          }}
          className="relative flex flex-col items-center"
        >
          {/* Card Container */}
          <div
            className="relative overflow-hidden rounded-xl shadow-2xl"
            style={{
              width: displayWidth,
              height: displayHeight,
              backgroundColor: 'var(--vtes-bg-primary)',
            }}
            onContextMenu={(e) => e.preventDefault()}
            role="img"
            aria-label={revealed ? `VTES card: ${card.name}` : 'Hidden VTES card'}
          >
            {/* Animated feedback ring */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-xl pointer-events-none z-20"
                  style={{
                    boxShadow: feedback === 'correct'
                      ? '0 0 0 4px #22c55e, 0 0 20px rgba(34, 197, 94, 0.5)'
                      : feedback === 'timeout'
                      ? '0 0 0 4px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.5)'
                      : feedback === 'skipped'
                      ? '0 0 0 4px #64748b, 0 0 20px rgba(100, 116, 139, 0.3)'
                      : '0 0 0 4px #ef4444, 0 0 20px rgba(239, 68, 68, 0.5)',
                  }}
                  aria-hidden="true"
                />
              )}
            </AnimatePresence>
            {isCrypt ? (
              <MaskedCard
                imageUrl={imageUrl}
                name={card.name}
                isCrypt={true}
                isRevealed={revealed}
              />
            ) : (
              <img
                src={showArtCrop ? imageUrl : revealedImageUrl}
                alt="VTES Card"
                className="w-full h-full select-none"
                draggable={false}
                style={{
                  ...(showArtCrop ? {
                    position: 'absolute',
                    width: scaledCardWidth,
                    height: scaledCardHeight,
                    left: `calc(0px - ${offsetX})`,
                    top: `calc(0px - ${offsetY})`,
                    maxWidth: 'none',
                    objectFit: 'cover',
                  } : {
                    objectFit: 'contain',
                  }),
                }}
              />
            )}

            {/* Feedback flash overlay */}
            <AnimatePresence>
              {feedback && feedback !== 'skipped' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    backgroundColor: feedback === 'correct'
                      ? 'rgba(34, 197, 94, 0.2)'
                      : feedback === 'timeout'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                  }}
                  aria-hidden="true"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Card Info Strip - Show attributes when playing, TWDA count when revealed */}
          {revealed ? (
            <div className="flex flex-col items-center mt-1 flex-shrink-0">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg shadow-sm" style={{
                backgroundColor: 'var(--vtes-bg-tertiary)',
                border: '1px solid var(--vtes-burgundy-dark)'
              }}>
                <span className="text-sm font-bold" style={{ color: 'var(--vtes-gold)' }}>
                  {card.count.toLocaleString()}
                </span>
                <span className="text-xs" style={{ color: 'var(--vtes-text-muted)' }}>
                  copies in TWDA
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <CardAttributesStrip
                cardDetails={cardDetails}
                isCrypt={isCrypt}
                cardTypes={card.types}
              />

              {/* Flavor text - shown before guess too */}
              {cardDetails?.flavorText && (
                <div
                  className="max-w-[320px] px-4 text-center"
                  style={{
                    color: 'var(--vtes-text-muted)',
                  }}
                >
                  <p className="text-sm italic leading-relaxed">
                    &ldquo;{cardDetails.flavorText}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default memo(CardStage);
