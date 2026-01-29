'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MaskedCard } from '@/components/vtes/MaskedCard';
import CardAttributesStrip from './CardAttributesStrip';
import type { GameCardData, GameCardDetails } from '@/lib/vtes/guess-game';

interface CardStageProps {
  card: GameCardData;
  cardDetails: GameCardDetails | null;
  revealed: boolean;
  feedback: 'correct' | 'incorrect' | null;
  cardKey: number;
  getImageUrl: (card: GameCardData) => string;
}

// Note: `revealed` is already in props and used internally

export default function CardStage({
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
  // Small screens: 260px wide, Normal: 300px, Large: 320px
  const displayWidth = 'clamp(260px, 85vw, 320px)';
  const displayHeight = isCrypt ? 'clamp(355px, 116vw, 437px)' : 'clamp(250px, 81vw, 315px)';

  // Library crop dimensions
  const scaledCardWidth = 'calc(clamp(260px, 85vw, 320px) / 0.72)';
  const scaledCardHeight = 'calc(' + scaledCardWidth + ' * 1.4)';
  const offsetX = 'calc(' + scaledCardWidth + ' * 0.21)';
  const offsetY = 'calc(' + scaledCardHeight + ' * 0.115)';

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-2 min-h-0 overflow-hidden">
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
            className={`relative overflow-hidden rounded-xl shadow-2xl transition-all duration-300 ${
              feedback === 'correct' ? 'ring-4 ring-green-500' :
              feedback === 'incorrect' ? 'ring-4 ring-red-500' :
              feedback === 'skipped' ? 'ring-4 ring-slate-500' :
              'ring-2 ring-slate-700'
            }`}
            style={{ 
              width: displayWidth, 
              height: displayHeight 
            }}
          >
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
                className="w-full h-full"
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
              {feedback && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute inset-0 rounded-xl pointer-events-none ${
                    feedback === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Card Info Strip - Show attributes when playing, TWDA count when revealed */}
          {revealed ? (
            <div className="flex justify-center mt-1 flex-shrink-0">
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
            <CardAttributesStrip
              cardDetails={cardDetails}
              isCrypt={isCrypt}
              cardTypes={card.types}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
