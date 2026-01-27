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
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// Check if guess matches the card (with fuzzy tolerance)
function isCorrectGuess(guess: string, cardName: string): boolean {
  const normalizedGuess = normalizeString(guess);
  const normalizedAnswer = normalizeString(cardName);

  // Exact match (normalized)
  if (normalizedGuess === normalizedAnswer) return true;

  // For pattern matching, use lowercase original (keeps parentheses intact)
  const lowerCardName = cardName.toLowerCase();

  // Match without group notation: "Anson" should match "Anson (G1)"
  const baseNameMatch = lowerCardName.match(/^(.+?)\s*\(g\d+\)$/i);
  if (baseNameMatch) {
    const baseName = normalizeString(baseNameMatch[1]);
    if (normalizedGuess === baseName) return true;
  }

  // Match without "The" prefix: "Unmasking" should match "The Unmasking"
  const withoutThe = normalizedAnswer.replace(/^the\s+/, '');
  if (normalizedGuess === withoutThe) return true;

  const guessWithoutThe = normalizedGuess.replace(/^the\s+/, '');
  if (guessWithoutThe === normalizedAnswer) return true;

  // Match Advanced vampires: "Ankha" should match "Ankha (ADV)"
  const advMatch = lowerCardName.match(/^(.+?)\s*\(.*adv.*\)$/i);
  if (advMatch) {
    const baseName = normalizeString(advMatch[1]);
    if (normalizedGuess === baseName) return true;
  }

  return false;
}

// Score calculation (adjusted for hints used)
function calculateScore(hintsUsed: number, currentStreak: number, difficulty: number): number {
  const baseByDifficulty: Record<number, number> = {
    1: 20, 2: 50, 3: 100, 4: 150, 5: 250, 6: 400
  };
  let base = baseByDifficulty[difficulty] || 100;

  // Reduce score based on hints used
  base = Math.max(base - (hintsUsed * 10), 10);

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
  const fuse = useMemo(() => {
    if (!gameData) return null;
    const allCards = [...gameData.crypt, ...gameData.library];
    return new Fuse(allCards, {
      keys: ['name'],
      threshold: 0.4,
      includeScore: true,
    });
  }, [gameData]);

  // Load game data
  useEffect(() => {
    async function loadGameData() {
      try {
        const response = await fetch('/vtes_guess_data.json');
        const data: GameData = await response.json();
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
        const details: CardDetails = {
          name: data.name || cardName,
          slug: data.id ? String(data.id) : card.slug,
          type: data.types?.join(', '),
          disciplines: data.disciplines || card.disciplines || [],
          clan: data.clans?.[0] || card.clan,
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
      const points = calculateScore(hintsRevealed, newStreak, selectedDifficulty);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4 sm:p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Guess the Card</h1>
            <p className="text-slate-500 text-xs">VTES Edition</p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="bg-slate-800/50 px-2 py-1 rounded-lg">
              <p className="text-lg font-bold text-amber-500">{streak}</p>
              <p className="text-[10px] text-slate-500">Streak</p>
            </div>
            <div className="bg-slate-800/50 px-2 py-1 rounded-lg">
              <p className="text-lg font-bold text-green-500">{score}</p>
              <p className="text-[10px] text-slate-500">Score</p>
            </div>
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="mb-4">
          <div className="flex gap-1 justify-center flex-wrap">
            {[1, 2, 3, 4, 5, 6].map(diff => {
              const info = difficultyLabels[diff];
              return (
                <button
                  key={diff}
                  onClick={() => changeDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedDifficulty === diff
                    ? `${info.color} text-white`
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                  {info.name}
                </button>
              );
            })}
          </div>
          <p className="text-center text-slate-500 text-[10px] mt-1">
            {diffInfo.description} • {filteredCardsCount} cards
          </p>
        </div>

        {/* Card type selector */}
        <div className="flex gap-1 justify-center mb-4">
          {(['library', 'crypt', 'all'] as const).map(type => (
            <button
              key={type}
              onClick={() => { setCardType(type); setCurrentCard(null); }}
              className={`px-3 py-1 rounded text-xs transition ${cardType === type
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
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
                      <div className="flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                        <div className="w-4 h-4 bg-amber-500 rotate-45" />
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
              // Crypt: Just Type
              <>
                <div className="flex -space-x-1">
                  {currentCard.types.map(t => (
                    <VtesIcon key={t} name={t} type="type" size="md" />
                  ))}
                </div>
                <span className="text-amber-500 font-vtes text-xl tracking-widest capitalize drop-shadow-md">
                  {currentCard.types.join(' / ')}
                </span>
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
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-white
                  border-2 border-slate-700 focus:border-amber-500
                  focus:outline-none placeholder:text-slate-600"
              />
              <button
                onClick={skipCard}
                className="px-3 py-3 bg-slate-700 hover:bg-slate-600 text-slate-400
                  rounded-xl transition text-sm"
              >
                Skip
              </button>
            </div>

            <button
              onClick={checkGuess}
              disabled={!guess.trim()}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700
                disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
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
