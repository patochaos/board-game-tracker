'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const difficulties = [
  { id: 1, name: 'Staple', desc: 'Top 20%', color: '#34d399', icon: '🌟' },
  { id: 2, name: 'Common', desc: '20-50%', color: '#60a5fa', icon: '📦' },
  { id: 3, name: 'Uncommon', desc: '50-80%', color: '#fbbf24', icon: '🔶' },
  { id: 4, name: 'Rare', desc: 'Bottom 20%', color: '#fb923c', icon: '🔴' },
  { id: 5, name: 'Never Used', desc: '0 TWDA', color: '#f87171', icon: '💀' },
];

interface DifficultyPrototypesProps {
  selectedDifficulty: number;
  onDifficultyChange: (d: number) => void;
  variant: 'carousel' | 'tabs';
}

export default function DifficultyPrototypes({
  selectedDifficulty,
  onDifficultyChange,
  variant,
}: DifficultyPrototypesProps) {
  const [direction, setDirection] = useState(0);

  const currentIndex = selectedDifficulty - 1;
  const current = difficulties[currentIndex];

  const goNext = () => {
    if (currentIndex < difficulties.length - 1) {
      setDirection(1);
      onDifficultyChange(selectedDifficulty + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      onDifficultyChange(selectedDifficulty - 1);
    }
  };

  // ============ OPTION A: CAROUSEL ============
  if (variant === 'carousel') {
    return (
      <div className="w-full max-w-[320px] mx-auto">
        <div className="flex items-center justify-between gap-2">
          {/* Left Arrow */}
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className={`p-2 rounded-full transition-all ${
              currentIndex === 0 ? 'opacity-30' : 'opacity-100 hover:bg-white/10'
            }`}
            style={{ color: 'var(--vtes-gold)' }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Carousel Container */}
          <div className="flex-1 relative h-[70px] overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selectedDifficulty}
                initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${current.color}20 0%, ${current.color}10 100%)`,
                  border: `2px solid ${current.color}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{current.icon}</span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: current.color, fontFamily: 'var(--vtes-font-display)' }}
                  >
                    {current.name}
                  </span>
                </div>
                <span className="text-xs mt-1" style={{ color: 'var(--vtes-text-muted)' }}>
                  {current.desc} cards
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Arrow */}
          <button
            onClick={goNext}
            disabled={currentIndex === difficulties.length - 1}
            className={`p-2 rounded-full transition-all ${
              currentIndex === difficulties.length - 1 ? 'opacity-30' : 'opacity-100 hover:bg-white/10'
            }`}
            style={{ color: 'var(--vtes-gold)' }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {difficulties.map((d, i) => (
            <button
              key={d.id}
              onClick={() => {
                setDirection(i > currentIndex ? 1 : -1);
                onDifficultyChange(d.id);
              }}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                backgroundColor: i === currentIndex ? current.color : 'var(--vtes-bg-tertiary)',
                transform: i === currentIndex ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ============ OPTION C: TABS ============
  return (
    <div className="w-full max-w-[360px] mx-auto">
      <div
        className="flex rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--vtes-bg-tertiary)',
          border: '1px solid var(--vtes-burgundy-dark)',
        }}
      >
        {difficulties.map((d) => {
          const isSelected = d.id === selectedDifficulty;
          return (
            <button
              key={d.id}
              onClick={() => onDifficultyChange(d.id)}
              className="flex-1 py-2.5 px-1 flex flex-col items-center justify-center transition-all relative"
              style={{
                backgroundColor: isSelected ? `${d.color}20` : 'transparent',
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0"
                  style={{
                    borderBottom: `3px solid ${d.color}`,
                    backgroundColor: `${d.color}15`,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <span className="text-lg relative z-10">{d.icon}</span>
              <span
                className="text-[9px] font-bold uppercase tracking-wider relative z-10 mt-0.5"
                style={{
                  color: isSelected ? d.color : 'var(--vtes-text-muted)',
                  fontFamily: 'var(--vtes-font-display)',
                }}
              >
                {d.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Description below */}
      <motion.p
        key={selectedDifficulty}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-xs mt-2"
        style={{ color: current.color }}
      >
        {current.name} • {current.desc}
      </motion.p>
    </div>
  );
}
