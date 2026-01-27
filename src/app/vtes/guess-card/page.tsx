'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import { VtesIcon } from '@/components/vtes/VtesIcon';
import { MaskedCard } from '@/components/vtes/MaskedCard';
import { Droplet } from 'lucide-react';

// Card data from JSON
interface CardData {
  id: number;
  name: string;
  slug: string;
  types: string[];
  disciplines?: string[];
  clan?: string;
  capacity?: number;
  group?: string;
  count: number;
  difficulty: number;
}

interface GameData {
  metadata: {
    total_decks_analyzed: number;
    total_crypt_cards: number;
    total_library_cards: number;
    difficulty_levels: Record<string, string>;
  };
  crypt: CardData[];
  library: CardData[];
}

// Card details from API
interface CardDetails {
  name: string;
  slug: string;
  type?: string;
  disciplines?: string[];
  clan?: string;
  sect?: string;
  title?: string;
  firstSet?: string;
  requirements?: string;
  poolCost?: string;
  bloodCost?: string;
  convictionCost?: string;
  artists?: string[];
  flavorText?: string;
}

const difficultyLabels: Record<number, { name: string; color: string; description: string }> = {
  1: { name: 'Staple', color: 'bg-green-600', description: 'Top 10%' },
  2: { name: 'Common', color: 'bg-blue-600', description: 'Next 15%' },
  3: { name: 'Uncommon', color: 'bg-cyan-600', description: 'Next 25%' },
  4: { name: 'Rare', color: 'bg-yellow-600', description: 'Next 35%' },
  5: { name: 'Obscure', color: 'bg-orange-600', description: 'Bottom 15%' },
  6: { name: 'Unknown', color: 'bg-red-600', description: 'Never Used' },
};

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
    // Remove common stop words and all spaces
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

// Score calculation (adjusted for hints used)
function calculateScore(hintsUsed: number, initialsUsed: boolean, currentStreak: number, difficulty: number): number {
  const baseByDifficulty: Record<number, number> = {
    1: 20, 2: 50, 3: 100, 4: 150, 5: 250, 6: 400
  };
  let base = baseByDifficulty[difficulty] || 100;

  // Reduce score based on hints used
  base = base - (hintsUsed * 10);
  if (initialsUsed) base = base - 25; // More severe penalty for initials

  base = Math.max(base, 10);

  let multiplier = 1;
  if (currentStreak >= 10) multiplier = 3;
  else if (currentStreak >= 5) multiplier = 2;
  else if (currentStreak >= 3) multiplier = 1.5;

  return Math.round(base * multiplier);
}

const AUTO_ADVANCE_DELAY = 2000;
const HOVER_DELAY = 1000;
const MAX_HINTS = 4;

export default function GuessCardPage() {
  // Game data
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(1);
  const [cardType, setCardType] = useState<'library' | 'crypt' | 'all'>('library');

  // Current card
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [cardDetails, setCardDetails] = useState<CardDetails | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | 'skipped' | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState(0); // 0-4 hints revealed
  const [showLargeCard, setShowLargeCard] = useState(false);
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const [showInitials, setShowInitials] = useState(false);

  // Helper to generate initials hint
  const generateInitialsHint = useCallback((name: string) => {
    if (!name) return '';
    // Strip group notation like (G1), (G2), etc. and Advanced notation (ADV)
    const cleanName = name.replace(/\s*\([Gg]\d+\)\s*$/, '').replace(/\s*\(.*[Aa][Dd][Vv].*\)\s*$/, '').trim();
    const prepositions = ['the', 'of', 'and', 'a', 'an', 'in', 'on', 'at', 'by', 'for', 'with', 'to'];
    return cleanName.split(' ').map(word => {
      if (!word) return '';
      // Clean word for check (ignore punctuation)
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (prepositions.includes(cleanWord)) {
        return '.'.repeat(word.length);
      }
      return word[0] + '.'.repeat(Math.max(0, word.length - 1));
    }).join(' ');
  }, []);

  // Stats
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [lastPoints, setLastPoints] = useState(0);

  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create Fuse instance for fuzzy search
  // TEMPORARILY DISABLED TO DEBUG HANG
  const fuse = null;
  // const fuse = useMemo(() => {
  //   if (!gameData) return null;
  //   const allCards = [...gameData.crypt, ...gameData.library];
  //   return new Fuse(allCards, {
  //     keys: ['name'],
  //     threshold: 0.4,
  //     includeScore: true,
  //   });
  // }, [gameData]);

  // Load game data
  useEffect(() => {
    async function loadGameData() {
      console.log('Fetching game data...');
      try {
        const response = await fetch('/vtes_guess_data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: GameData = await response.json();
        console.log('Game data loaded:', data.metadata);
        setGameData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading game data:', error);
        setLoading(false);
      }
    }
    loadGameData();
  }, []);

  // Get filtered cards
  const getFilteredCards = useCallback((): CardData[] => {
    if (!gameData) return [];
    let cards: CardData[] = [];
    if (cardType === 'crypt' || cardType === 'all') {
      cards = [...cards, ...gameData.crypt.filter(c => c.difficulty === selectedDifficulty)];
    }
    if (cardType === 'library' || cardType === 'all') {
      cards = [...cards, ...gameData.library.filter(c => c.difficulty === selectedDifficulty)];
    }
    return cards;
  }, [gameData, selectedDifficulty, cardType]);

  // Pick random card
  const pickRandomCard = useCallback(() => {
    const cards = getFilteredCards();
    if (cards.length === 0) return null;
    return cards[Math.floor(Math.random() * cards.length)];
  }, [getFilteredCards]);

  // Fetch card details
  const fetchCardDetails = useCallback(async (cardName: string, card: CardData) => {
    try {
      const response = await fetch(`https://api.krcg.org/card/${encodeURIComponent(cardName)}`);
      if (response.ok) {
        const data = await response.json();

        // Extract sect from card_text for crypt cards
        let sect = undefined;
        if (data.card_text && card.capacity !== undefined) {
          const knownSects = ['Camarilla', 'Sabbat', 'Laibon', 'Independent', 'Anarch'];
          const firstWord = data.card_text.split(/[\s:]/)[0];
          if (knownSects.includes(firstWord)) {
            sect = firstWord;
          }
        }

        const details: CardDetails = {
          name: data.name || cardName,
          slug: data.id ? String(data.id) : card.slug,
          type: data.types?.join(', '),
          disciplines: data.disciplines || card.disciplines || [],
          clan: data.clans?.[0] || card.clan,
          sect: sect,
          title: data.title,
          firstSet: data.ordered_sets?.[0],
          poolCost: data.pool_cost,
          bloodCost: data.blood_cost,
          convictionCost: data.conviction_cost,
          artists: data.artists || [],
          flavorText: data.flavor_text,
        };
        setCardDetails(details);
      }
    } catch (error) {
      console.error('Error fetching card details:', error);
      setCardDetails({
        name: card.name,
        slug: card.slug,
        type: card.types?.join(', '),
        disciplines: card.disciplines,
        clan: card.clan,
      });
    }
  }, []);

  // Start game
  useEffect(() => {
    if (gameData && !currentCard) {
      const card = pickRandomCard();
      if (card) {
        setCurrentCard(card);
        fetchCardDetails(card.name, card);
      }
    }
  }, [gameData, currentCard, pickRandomCard, fetchCardDetails]);

  // Auto-advance timer
  useEffect(() => {
    if (revealed) {
      const startTime = Date.now();
      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setAutoAdvanceProgress(Math.min((elapsed / AUTO_ADVANCE_DELAY) * 100, 100));
      }, 30);

      autoAdvanceRef.current = setTimeout(() => nextCard(), AUTO_ADVANCE_DELAY);

      return () => {
        if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
        if (progressRef.current) clearInterval(progressRef.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  useEffect(() => {
    return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); };
  }, []);


  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => setShowLargeCard(true), HOVER_DELAY);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowLargeCard(false);
  };

  const nextCard = useCallback(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    const card = pickRandomCard();
    if (card) {
      setCurrentCard(card);
      setCardDetails(null);
      fetchCardDetails(card.name, card);
    }
    setRevealed(false);
    setGuess('');
    setResult(null);
    setHintsRevealed(0);
    setLastPoints(0);
    setAutoAdvanceProgress(0);
    setShowLargeCard(false);
    setShowInitials(false);
  }, [pickRandomCard, fetchCardDetails]);

  const revealNextHint = () => {
    if (hintsRevealed < MAX_HINTS) {
      setHintsRevealed(prev => prev + 1);
    }
  };

  const checkGuess = () => {
    if (!currentCard) return;

    setTotalPlayed(prev => prev + 1);

    if (isCorrectGuess(guess, currentCard.name)) {
      const newStreak = streak + 1;
      const points = calculateScore(hintsRevealed, showInitials, newStreak, selectedDifficulty);

      setResult('correct');
      setRevealed(true);
      setStreak(newStreak);
      setBestStreak(prev => Math.max(prev, newStreak));
      setTotalCorrect(prev => prev + 1);
      setScore(prev => prev + points);
      setLastPoints(points);
    } else {
      setResult('incorrect');
      setRevealed(true);
      setStreak(0);
    }
  };

  const skipCard = () => {
    setResult('skipped');
    setRevealed(true);
    setStreak(0);
    setTotalPlayed(prev => prev + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && guess.trim()) {
      checkGuess();
    }
  };

  const changeDifficulty = (diff: number) => {
    setSelectedDifficulty(diff);
    setCurrentCard(null);
    setCardDetails(null);
    setRevealed(false);
    setGuess('');
    setResult(null);
    setHintsRevealed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading card database...</div>
      </div>
    );
  }

  if (!gameData || !currentCard) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">No cards found for this difficulty level.</div>
      </div>
    );
  }

  const imageUrl = `https://static.krcg.org/card/${currentCard.slug}.jpg`;
  const filteredCardsCount = getFilteredCards().length;
  const diffInfo = difficultyLabels[selectedDifficulty];

  const isCrypt = currentCard.capacity !== undefined;

  // Dimensions
  // Crypt: Full card vertical (Ratio ~0.71)
  // Library: Cropped box (Current logic)
  const displayWidth = 300;
  const displayHeight = isCrypt ? 420 : 260;

  // Logic for Library Crop (Legacy)
  const scaledCardWidth = displayWidth / 0.72;
  const scaledCardHeight = scaledCardWidth * 1.4;
  const offsetX = scaledCardWidth * 0.21;
  const offsetY = scaledCardHeight * 0.115;

  // Hint content
  const hintContent = [
    // Hint 1: Artist
    cardDetails?.artists && cardDetails.artists.length > 0
      ? { label: 'Artist', value: cardDetails.artists.join(', '), icon: '🎨' }
      : null,
    // Hint 2: Expansion
    cardDetails?.firstSet
      ? { label: 'First Set', value: cardDetails.firstSet, icon: '📦' }
      : null,
    // Hint 3: Disciplines
    cardDetails?.disciplines && cardDetails.disciplines.length > 0
      ? { label: 'Disciplines', value: cardDetails.disciplines.map(d => d.toUpperCase()).join(', '), icon: '🔮' }
      : currentCard.disciplines && currentCard.disciplines.length > 0
        ? { label: 'Disciplines', value: currentCard.disciplines.map(d => d.toUpperCase()).join(', '), icon: '🔮' }
        : null,
    // Hint 4: Clan/Type
    cardDetails?.clan
      ? { label: 'Clan', value: cardDetails.clan, icon: '🏰' }
      : currentCard.clan
        ? { label: 'Clan', value: currentCard.clan, icon: '🏰' }
        : null,
  ].filter(Boolean);

  const hasMoreHints = hintsRevealed < hintContent.length;

  return (
    <div className="min-h-screen p-4 sm:p-8 relative" style={{
      background: 'linear-gradient(to bottom, var(--vtes-bg-primary) 0%, var(--vtes-bg-secondary) 100%)',
      fontFamily: 'var(--vtes-font-body)'
    }}>
      {/* Grain texture overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }} />

      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 15, 0.4) 100%)'
      }} />

      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="relative">
            <h1 className="text-3xl font-bold mb-1" style={{
              fontFamily: 'var(--vtes-font-display)',
              color: 'var(--vtes-text-primary)',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>
              Guess the Card
            </h1>
            <div className="h-0.5 w-16 bg-gradient-to-r from-[var(--vtes-gold)] to-transparent" />
            <p className="text-xs mt-1" style={{ color: 'var(--vtes-text-muted)' }}>VTES Edition</p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="px-3 py-2 rounded-lg border" style={{
              backgroundColor: 'var(--vtes-bg-tertiary)',
              borderColor: 'var(--vtes-burgundy-dark)'
            }}>
              <p className="text-lg font-bold" style={{ color: 'var(--vtes-gold)' }}>{streak}</p>
              <p className="text-[10px]" style={{ color: 'var(--vtes-text-dim)' }}>Streak</p>
            </div>
            <div className="px-3 py-2 rounded-lg border" style={{
              backgroundColor: 'var(--vtes-bg-tertiary)',
              borderColor: 'var(--vtes-burgundy-dark)'
            }}>
              <p className="text-lg font-bold" style={{ color: 'var(--vtes-blood)' }}>{score}</p>
              <p className="text-[10px]" style={{ color: 'var(--vtes-text-dim)' }}>Score</p>
            </div>
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="mb-5">
          <div className="flex gap-2 justify-center flex-wrap">
            {[1, 2, 3, 4, 5, 6].map(diff => {
              const info = difficultyLabels[diff];
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => changeDifficulty(diff)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: isSelected ? 'var(--vtes-burgundy)' : 'var(--vtes-bg-tertiary)',
                    color: isSelected ? 'var(--vtes-gold)' : 'var(--vtes-text-muted)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: isSelected ? 'var(--vtes-gold)' : 'var(--vtes-burgundy-dark)',
                    boxShadow: isSelected ? 'var(--glow-gold)' : 'none',
                    fontFamily: 'var(--vtes-font-body)'
                  }}
                >
                  {info.name}
                </button>
              );
            })}
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: 'var(--vtes-text-dim)' }}>
            {diffInfo.description} • {filteredCardsCount} cards
          </p>
        </div>

        {/* Card type selector */}
        <div className="flex gap-2 justify-center mb-6">
          {(['library', 'crypt', 'all'] as const).map(type => {
            const isSelected = cardType === type;
            return (
              <button
                key={type}
                onClick={() => { setCardType(type); setCurrentCard(null); setShowInitials(false); }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? 'var(--vtes-blood)' : 'var(--vtes-bg-secondary)',
                  color: isSelected ? 'var(--vtes-text-primary)' : 'var(--vtes-text-muted)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: isSelected ? 'var(--vtes-blood)' : 'transparent',
                  fontFamily: 'var(--vtes-font-body)'
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            );
          })}
        </div>



        {/* Progress bar */}
        {revealed && (
          <div className="mb-2 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${result === 'correct' ? 'bg-green-500' :
                result === 'incorrect' ? 'bg-red-500' : 'bg-slate-500'
                }`}
              style={{ width: `${autoAdvanceProgress}%` }}
            />
          </div>
        )}

        {/* Art display */}
        <div className="flex justify-center mb-4">
          <div
            className={`relative overflow-hidden rounded-xl shadow-2xl transition-all duration-300 ${result === 'correct' ? 'ring-4 ring-green-500' :
              result === 'incorrect' ? 'ring-4 ring-red-500' :
                result === 'skipped' ? 'ring-4 ring-slate-500' :
                  'ring-2 ring-slate-700'
              }`}
            style={{ width: displayWidth, height: displayHeight }}
          >
            {isCrypt ? (
              <MaskedCard
                imageUrl={imageUrl}
                name={currentCard.name}
                isCrypt={true}
                isRevealed={revealed}
              />
            ) : (
              /* Legacy crop for Library */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="VTES Card Art"
                style={{
                  position: 'absolute',
                  width: scaledCardWidth,
                  height: scaledCardHeight,
                  left: -offsetX,
                  top: -offsetY,
                  maxWidth: 'none',
                }}
              />
            )}
          </div>
        </div>

        {/* Card Info Line */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-4 bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-full shadow-lg">

            {!isCrypt ? (
              // Library: [Cost] / [Req] / [Type]
              <>
                {/* Cost */}
                {(cardDetails?.bloodCost || cardDetails?.poolCost || cardDetails?.convictionCost) && (
                  <div className="flex items-center gap-3">
                    {cardDetails.bloodCost && (
                      <div className="flex items-center gap-1 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50">
                        <Droplet className="w-5 h-5 fill-red-500 text-red-500" />
                        <span className="text-white font-bold text-lg">{cardDetails.bloodCost}</span>
                      </div>
                    )}
                    {cardDetails.poolCost && (
                      <div className="flex items-center gap-1 bg-slate-700/40 px-2 py-0.5 rounded border border-slate-600/50">
                        <div className="w-4 h-4 bg-white rotate-45" />
                        <span className="text-white font-bold text-lg ml-1">{cardDetails.poolCost}</span>
                      </div>
                    )}
                    {cardDetails.convictionCost && (
                      <div className="flex items-center gap-1">
                        <VtesIcon name="conviction" type="cost" size="sm" />
                        <span className="text-white font-bold text-lg">{cardDetails.convictionCost}</span>
                      </div>
                    )}
                    <span className="text-slate-600 text-xl mx-1">/</span>
                  </div>
                )}

                {/* Requirement (Clan or Discipline) */}
                {((cardDetails?.clan && !isCrypt) || (cardDetails?.disciplines && cardDetails.disciplines.length > 0)) && (
                  <div className="flex items-center gap-1">
                    {cardDetails?.clan && (
                      <VtesIcon name={cardDetails.clan} type="clan" size="md" />
                    )}
                    {cardDetails?.disciplines?.map(d => (
                      <VtesIcon key={d} name={d} type="discipline" size="md" />
                    ))}
                    <span className="text-slate-600 text-xl mx-2">/</span>
                  </div>
                )}

                {/* Type (Text THEN Icon, Hiding Master/Vampire/Imbued Icons) */}
                <div className="flex items-center gap-3">
                  <span className="text-amber-500 font-vtes text-xl tracking-widest capitalize drop-shadow-md">
                    {currentCard.types.join(' / ')}
                  </span>
                  <div className="flex -space-x-1">
                    {currentCard.types
                      .filter(t => !['master', 'vampire', 'imbued'].includes(t.toLowerCase()))
                      .map(t => (
                        <VtesIcon key={t} name={t} type="type" size="md" />
                      ))}
                  </div>
                </div>
              </>
            ) : (
              // Crypt: Type + Sect + Title
              <>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-amber-500 font-vtes text-xl tracking-widest capitalize drop-shadow-md">
                    {currentCard.types.join(' / ')}
                  </span>
                  {(cardDetails?.sect || cardDetails?.title) && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--vtes-text-muted)', fontFamily: 'var(--vtes-font-body)' }}>
                      {cardDetails.sect && (
                        <span className="uppercase tracking-wider">{cardDetails.sect}</span>
                      )}
                      {cardDetails.sect && cardDetails.title && (
                        <span style={{ color: 'var(--vtes-burgundy)' }}>•</span>
                      )}
                      {cardDetails.title && (
                        <span className="uppercase tracking-wider">{cardDetails.title}</span>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>

        {/* Card Metadata: Flavor Text, Artist, Set */}
        {(cardDetails?.artists?.length || cardDetails?.firstSet || cardDetails?.flavorText) && (
          <div className="flex flex-col items-center mb-6 -mt-4 space-y-2">
            {cardDetails?.flavorText && (
              <div className="text-slate-400 italic text-sm md:text-base max-w-lg text-center px-6 font-serif opacity-90 leading-relaxed">
                &quot;{cardDetails.flavorText.replace(/\n/g, ' ')}&quot;
              </div>
            )}
            <div className="text-slate-500 text-sm flex gap-4 opacity-80">
              {cardDetails.artists && cardDetails.artists.length > 0 && (
                <span>Art by <span className="text-slate-400 font-medium">{cardDetails.artists.join(', ')}</span></span>
              )}
              {cardDetails.firstSet && (
                <span>Set: <span className="text-slate-400 font-medium">{cardDetails.firstSet}</span></span>
              )}
            </div>
          </div>
        )}

        {/* Game area */}
        {!revealed ? (
          <div className="space-y-4">
            <p className="text-center text-slate-300 text-lg">What card is this?</p>

            {/* Multi-step hints (DEPRECATED: User requested removal 2026-01-26)
            {hintContent.length > 0 && (
              <div className="space-y-2">
                 ... hints code ...
              </div>
            )}
            */}

            {/* Hint Section */}
            {!revealed && (
              <div className="flex flex-col items-center gap-3 mb-4">
                {showInitials ? (
                  <div className="px-5 py-3 rounded-lg border" style={{
                    backgroundColor: 'var(--vtes-bg-tertiary)',
                    borderColor: 'var(--vtes-gold)',
                    boxShadow: 'var(--glow-gold)'
                  }}>
                    <p className="font-mono text-lg tracking-[0.2em] font-bold" style={{
                      color: 'var(--vtes-gold)',
                      fontFamily: 'var(--vtes-font-display)'
                    }}>
                      {generateInitialsHint(currentCard.name)}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowInitials(true)}
                    className="text-xs uppercase tracking-wider flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--vtes-bg-secondary)',
                      color: 'var(--vtes-text-muted)',
                      borderColor: 'var(--vtes-gold-dark)',
                      fontFamily: 'var(--vtes-font-body)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--vtes-gold)';
                      e.currentTarget.style.color = 'var(--vtes-gold)';
                      e.currentTarget.style.boxShadow = 'var(--glow-gold)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--vtes-gold-dark)';
                      e.currentTarget.style.color = 'var(--vtes-text-muted)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span>💡</span>
                    <span>Show Initials <span style={{ color: 'var(--vtes-gold-dark)' }}>(-25 pts)</span></span>
                  </button>
                )}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type the card name..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                autoFocus
                className="flex-1 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: 'var(--vtes-bg-tertiary)',
                  color: 'var(--vtes-text-primary)',
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: 'var(--vtes-burgundy-dark)',
                  fontFamily: 'var(--vtes-font-body)',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--vtes-gold)';
                  e.currentTarget.style.boxShadow = 'var(--glow-gold)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--vtes-burgundy-dark)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={skipCard}
                className="px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: 'var(--vtes-bg-secondary)',
                  color: 'var(--vtes-text-muted)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--vtes-burgundy-dark)',
                  fontFamily: 'var(--vtes-font-body)',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--vtes-bg-tertiary)';
                  e.currentTarget.style.color = 'var(--vtes-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--vtes-bg-secondary)';
                  e.currentTarget.style.color = 'var(--vtes-text-muted)';
                }}
              >
                Skip
              </button>
            </div>

            <button
              onClick={checkGuess}
              disabled={!guess.trim()}
              className="w-full py-3 font-semibold rounded-xl transition-all duration-200"
              style={{
                backgroundColor: guess.trim() ? 'var(--vtes-burgundy)' : 'var(--vtes-bg-tertiary)',
                color: guess.trim() ? 'var(--vtes-gold)' : 'var(--vtes-text-dim)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: guess.trim() ? 'var(--vtes-gold)' : 'var(--vtes-burgundy-dark)',
                boxShadow: guess.trim() ? 'var(--glow-gold)' : 'none',
                cursor: guess.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--vtes-font-display)',
                fontSize: '16px',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={(e) => {
                if (guess.trim()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                if (guess.trim()) {
                  e.currentTarget.style.boxShadow = 'var(--glow-gold)';
                }
              }}
            >
              Submit Answer
            </button>
          </div>
        ) : (
          /* Revealed state */
          <div className="text-center space-y-4">
            {result === 'correct' ? (
              <div className="space-y-1">
                <p className="text-green-400 font-bold text-xl">✓ Correct!</p>
                <p className="text-green-500 text-sm">+{lastPoints} points</p>
                {hintsRevealed === 0 && <p className="text-amber-400 text-xs">No hints bonus!</p>}
              </div>
            ) : result === 'incorrect' ? (
              <div className="space-y-1">
                <p className="text-red-400 font-bold text-xl">✗ Incorrect</p>
                <p className="text-slate-400 text-sm">Streak lost</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-slate-400 font-bold text-xl">Skipped</p>
                <p className="text-slate-500 text-sm">Streak lost</p>
              </div>
            )}

            <p className="text-2xl text-white font-bold">{currentCard.name}</p>

            <div className="flex justify-center">
              <div
                className="relative cursor-pointer"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={currentCard.name}
                  className="rounded-lg shadow-lg transition-transform duration-200 hover:scale-105"
                  style={{ width: 160 }}
                />
                <p className="text-slate-600 text-[10px] mt-1">Hover to enlarge</p>
              </div>
            </div>

            {cardDetails && (
              <div className="text-slate-500 text-sm space-y-0.5">
                {cardDetails.type && <p>{cardDetails.type}</p>}
                {cardDetails.artists && cardDetails.artists.length > 0 && (
                  <p className="text-slate-600 text-xs">Art by {cardDetails.artists.join(', ')}</p>
                )}
                {currentCard.count > 0 && (
                  <p className="text-slate-600 text-xs">Used in {currentCard.count} TWDA decks</p>
                )}
              </div>
            )}

            <button
              onClick={nextCard}
              className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-xl transition"
            >
              Next Card →
            </button>
          </div>
        )}

        {/* Stats footer */}
        <div className="mt-8 p-3 bg-slate-800/30 rounded-lg">
          <div className="flex justify-around text-center text-xs">
            <div>
              <p className="text-slate-300 font-bold">{totalPlayed}</p>
              <p className="text-slate-500">Played</p>
            </div>
            <div>
              <p className="text-slate-300 font-bold">{totalCorrect}</p>
              <p className="text-slate-500">Correct</p>
            </div>
            <div>
              <p className="text-slate-300 font-bold">
                {totalPlayed > 0 ? Math.round((totalCorrect / totalPlayed) * 100) : 0}%
              </p>
              <p className="text-slate-500">Accuracy</p>
            </div>
            <div>
              <p className="text-amber-500 font-bold">{bestStreak}</p>
              <p className="text-slate-500">Best</p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-slate-600 text-[10px]">
          <p>Artwork only • Fuzzy matching enabled • Images: KRCG.org</p>
        </div>
      </div>

      {showLargeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={currentCard.name} className="max-h-[80vh] rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
