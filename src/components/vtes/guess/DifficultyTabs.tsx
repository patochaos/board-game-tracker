'use client';

import { motion } from 'framer-motion';

const difficulties = [
  { id: 1, name: 'Staple', color: '#34d399', icon: '🌟' },
  { id: 2, name: 'Core', color: '#60a5fa', icon: '📦' },
  { id: 3, name: 'Fringe', color: '#fbbf24', icon: '🔶' },
  { id: 4, name: 'Niche', color: '#fb923c', icon: '🔴' },
  { id: 5, name: 'Obscure', color: '#f87171', icon: '💀' },
];

interface DifficultyTabsProps {
  selectedDifficulty: number;
  onDifficultyChange: (d: number) => void;
  disabled?: boolean;
}

export default function DifficultyTabs({
  selectedDifficulty,
  onDifficultyChange,
  disabled = false,
}: DifficultyTabsProps) {
  const current = difficulties.find(d => d.id === selectedDifficulty) || difficulties[0];

  return (
    <div className="w-full max-w-[360px] mx-auto">
      <div
        className="flex rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--vtes-bg-tertiary)',
          border: '1px solid var(--vtes-burgundy-dark)',
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        {difficulties.map((d) => {
          const isSelected = d.id === selectedDifficulty;
          return (
            <button
              key={d.id}
              onClick={() => onDifficultyChange(d.id)}
              disabled={disabled}
              className="flex-1 py-2 px-1 flex flex-col items-center justify-center transition-all relative"
              style={{
                backgroundColor: isSelected ? `${d.color}20` : 'transparent',
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  layoutId="difficulty-tab-indicator"
                  className="absolute inset-0"
                  style={{
                    borderBottom: `3px solid ${d.color}`,
                    backgroundColor: `${d.color}15`,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <span className="text-base relative z-10">{d.icon}</span>
              <span
                className="text-[8px] font-bold uppercase tracking-wider relative z-10 mt-0.5"
                style={{
                  color: isSelected ? d.color : 'var(--vtes-text-muted)',
                  fontFamily: 'var(--vtes-font-display)',
                }}
              >
                {d.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
