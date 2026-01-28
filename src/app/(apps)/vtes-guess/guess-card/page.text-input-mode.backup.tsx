'use client';

/**
 * TEXT INPUT MODE BACKUP
 * 
 * This file contains the original text input mode functionality that was used
 * before switching to multiple-choice only mode.
 * 
 * To restore text input mode:
 * 1. Copy the relevant code sections from this file back into page.tsx
 * 2. Re-enable the text input form in the JSX (look for the "Library: Text input (fallback)" section)
 * 3. Restore the "Show Initials" hint functionality
 * 
 * Features included:
 * - Text input for guessing card names
 * - Fuzzy matching (handles typos, group notation, advanced variants)
 * - Show Initials hint button (50% points penalty)
 * - Enter key submission
 * 
 * Date archived: 2024-01-28
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { VtesIcon } from '@/components/vtes/VtesIcon';
import { MaskedCard } from '@/components/vtes/MaskedCard';
import { Droplet, Send, SkipForward, Lightbulb, ArrowRight, ChevronLeft, ChevronRight, Flame, Star, Info, Trophy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useVtesGuessLeaderboard } from '@/hooks/useVtesGuessLeaderboard';

// ... [interface definitions same as main file]

// Normalize string for comparison
function normalizeString(str: string, aggressive = false): string {
  if (!str) return '';
  let normalized = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  if (aggressive) {
    normalized = normalized
      .replace(/\b(the|and|of|a|an)\b/g, '')
      .replace(/\s+/g, '');
  }
  return normalized;
}

// Check if guess matches the card (with fuzzy tolerance)
function isCorrectGuess(guess: string, cardName: string): boolean {
  if (!guess || !cardName) return false;

  const normalizedGuess = normalizeString(guess);
  const normalizedAnswer = normalizeString(cardName);

  // 1. Exact match (normalized)
  if (normalizedGuess === normalizedAnswer) return true;

  // 2. Super aggressive match (ignore stop words and spaces)
  if (normalizeString(guess, true) === normalizeString(cardName, true)) return true;

  const lowerCardName = cardName.toLowerCase();

  // 3. Match without group notation: "Anson" should match "Anson (G1)"
  const baseNameMatch = lowerCardName.match(/^(.+?)\s*\(g\d+\)$/i);
  if (baseNameMatch) {
    const baseName = baseNameMatch[1];
    if (normalizedGuess === normalizeString(baseName)) return true;
    if (normalizeString(guess, true) === normalizeString(baseName, true)) return true;
  }

  // 4. Match Advanced vampires: "Ankha" should match "Ankha (ADV)"
  const advMatch = lowerCardName.match(/^(.+?)\s*\(.*adv.*\)$/i);
  if (advMatch) {
    const baseName = advMatch[1];
    if (normalizedGuess === normalizeString(baseName)) return true;
    if (normalizeString(guess, true) === normalizeString(baseName, true)) return true;
  }

  return false;
}

// Helper to generate initials hint
function generateInitialsHint(name: string): string {
  if (!name) return '';
  const cleanName = name.replace(/\s*\([Gg]\d+\)\s*$/, '').replace(/\s*\(.*[Aa][Dd][Vv].*\)\s*$/, '').trim();
  const prepositions = ['the', 'of', 'and', 'a', 'an', 'in', 'on', 'at', 'by', 'for', 'with', 'to'];
  return cleanName.split(' ').map(word => {
    if (!word) return '';
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (prepositions.includes(cleanWord)) {
      return '.'.repeat(word.length);
    }
    return word[0] + '.'.repeat(Math.max(0, word.length - 1));
  }).join(' ');
}

// ... [rest of the functions and component same as main file, but with text input form]

/*
 * TEXT INPUT FORM JSX (to restore):
 * 
 * {!isCrypt && libraryOptions.length === 0 && (
 *   <div className="flex flex-col items-center gap-2">
 *     {showInitials ? (
 *       <div className="px-4 py-2 rounded-lg" style={{
 *         backgroundColor: 'var(--vtes-bg-tertiary)',
 *         border: '1px solid var(--vtes-gold)',
 *         boxShadow: 'var(--glow-gold)'
 *       }}>
 *         <p className="font-mono text-base tracking-[0.15em] font-bold" style={{
 *           color: 'var(--vtes-gold)',
 *           fontFamily: 'var(--vtes-font-display)'
 *         }}>
 *           {generateInitialsHint(currentCard.name)}
 *         </p>
 *       </div>
 *     ) : (
 *       <button
 *         onClick={() => setShowInitials(true)}
 *         className="text-[11px] uppercase tracking-wider flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-80"
 *         style={{
 *           backgroundColor: 'var(--vtes-bg-secondary)',
 *           color: 'var(--vtes-text-muted)',
 *           border: '1px solid var(--vtes-gold-dark)',
 *           fontFamily: 'var(--vtes-font-body)'
 *         }}
 *       >
 *         <Lightbulb className="w-3.5 h-3.5" style={{ color: 'var(--vtes-gold-dark)' }} />
 *         Show Initials <span style={{ color: 'var(--vtes-gold-dark)' }}>(50% pts)</span>
 *       </button>
 *     )}
 *   </div>
 * )}
 * 
 * {/* Library: Text input (fallback) *}
 * <div className="space-y-2">
 *   <p className="text-center text-sm" style={{ color: 'var(--vtes-text-secondary, #c0bfb8)' }}>What card is this?</p>
 *   <input
 *     ref={inputRef}
 *     type="text"
 *     value={guess}
 *     onChange={(e) => setGuess(e.target.value)}
 *     onKeyDown={handleKeyDown}
 *     placeholder="Type the card name..."
 *     autoComplete="off"
 *     autoCorrect="off"
 *     autoCapitalize="off"
 *     spellCheck="false"
 *     autoFocus
 *     className="w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
 *     style={{
 *       backgroundColor: 'var(--vtes-bg-tertiary)',
 *       color: 'var(--vtes-text-primary)',
 *       border: '2px solid var(--vtes-burgundy-dark)',
 *       fontFamily: 'var(--vtes-font-body)',
 *       outline: 'none'
 *     }}
 *     onFocus={(e) => {
 *       e.currentTarget.style.borderColor = 'var(--vtes-gold)';
 *       e.currentTarget.style.boxShadow = 'var(--glow-gold)';
 *     }}
 *     onBlur={(e) => {
 *       e.currentTarget.style.borderColor = 'var(--vtes-burgundy-dark)';
 *       e.currentTarget.style.boxShadow = 'none';
 *     }}
 *   />
 *   <div className="flex gap-2">
 *     <button
 *       onClick={checkGuess}
 *       disabled={!guess.trim()}
 *       className="flex-1 py-2.5 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
 *       style={{
 *         backgroundColor: guess.trim() ? 'var(--vtes-burgundy)' : 'var(--vtes-bg-tertiary)',
 *         color: guess.trim() ? 'var(--vtes-gold)' : 'var(--vtes-text-dim)',
 *         border: `2px solid ${guess.trim() ? 'var(--vtes-gold)' : 'var(--vtes-burgundy-dark)'}`,
 *         boxShadow: guess.trim() ? 'var(--glow-gold)' : 'none',
 *         cursor: guess.trim() ? 'pointer' : 'not-allowed',
 *         fontFamily: 'var(--vtes-font-display)',
 *         fontSize: '14px',
 *         letterSpacing: '0.05em'
 *       }}
 *     >
 *       <Send className="w-4 h-4" />
 *       Submit
 *     </button>
 *     <button
 *       onClick={skipCard}
 *       className="px-4 py-2.5 rounded-xl text-xs transition-all duration-200 flex items-center gap-1.5"
 *       style={{
 *         backgroundColor: 'var(--vtes-bg-secondary)',
 *         color: 'var(--vtes-text-muted)',
 *         border: '1px solid var(--vtes-burgundy-dark)',
 *         fontFamily: 'var(--vtes-font-body)'
 *       }}
 *     >
 *       <SkipForward className="w-3.5 h-3.5" />
 *       Skip
 *     </button>
 *   </div>
 * </div>
 */
