'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';

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
  artists?: string[];
  flavorText?: string;
}

// Card type icons
const cardTypeIcons: Record<string, string> = {
  'Master': '👑',
  'Action': '⚔️',
  'Action Modifier': '🎯',
  'Reaction': '🛡️',
  'Combat': '💥',
  'Retainer': '🧛',
  'Equipment': '🗡️',
  'Political Action': '🏛️',
  'Ally': '🤝',
  'Event': '⚡',
  'Power': '✨',
  'Conviction': '✝️',
  'Vampire': '🧛',
  'Imbued': '✝️',
};

const difficultyLabels: Record<number, { name: string; color: string; description: string }> = {
  1: { name: 'Tutorial', color: 'bg-green-600', description: 'Top 1% staples' },
  2: { name: 'Easy', color: 'bg-blue-600', description: 'Top 2-20%' },
  3: { name: 'Medium', color: 'bg-yellow-600', description: 'Top 21-60%' },
  4: { name: 'Hard', color: 'bg-orange-600', description: 'Rarely used' },
  5: { name: 'Impossible', color: 'bg-red-600', description: 'Never in TWDA' },
};

function getCardTypeIcon(types: string[]): string {
  for (const type of types) {
    for (const [key, icon] of Object.entries(cardTypeIcons)) {
      if (type.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
  }
  return '🎴';
}

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

  // Exact match
  if (normalizedGuess === normalizedAnswer) return true;

  // Match without group notation: "Anson" should match "Anson (G1)"
  const baseNameMatch = normalizedAnswer.match(/^(.+?)\s*\(g\d+\)$/i);
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
  const advMatch = normalizedAnswer.match(/^(.+?)\s*\(.*adv.*\)$/i);
  if (advMatch) {
    const baseName = normalizeString(advMatch[1]);
    if (normalizedGuess === baseName) return true;
  }

  return false;
}

// Score calculation (adjusted for hints used)
function calculateScore(hintsUsed: number, currentStreak: number, difficulty: number): number {
  const baseByDifficulty: Record<number, number> = {
    1: 50, 2: 100, 3: 150, 4: 200, 5: 300,
  };
  let base = baseByDifficulty[difficulty] || 100;

  // Reduce score based on hints used
  base = Math.max(base - (hintsUsed * 25), 10);

  let multiplier = 1;
  if (currentStreak >= 10) multiplier = 3;
  else if (currentStreak >= 5) multiplier = 2;
  else if (currentStreak >= 3) multiplier = 1.5;

  return Math.round(base * multiplier);
}

const AUTO_ADVANCE_DELAY = 3000;
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
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
          slug: card.slug,
          type: data.types?.join(', '),
          disciplines: data.disciplines || card.disciplines || [],
          clan: data.clans?.[0] || card.clan,
          firstSet: data.ordered_sets?.[0],
          poolCost: data.pool_cost,
          bloodCost: data.blood_cost,
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

  // Update suggestions as user types
  useEffect(() => {
    if (!fuse || guess.length < 2) {
      setSuggestions([]);
      return;
    }
    const results = fuse.search(guess).slice(0, 5);
    setSuggestions(results.map(r => r.item.name));
  }, [guess, fuse]);

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
    setSuggestions([]);
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
    setSuggestions([]);
  };

  const skipCard = () => {
    setResult('skipped');
    setRevealed(true);
    setStreak(0);
    setTotalPlayed(prev => prev + 1);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && guess.trim()) {
      checkGuess();
    }
  };

  const selectSuggestion = (name: string) => {
    setGuess(name);
    setSuggestions([]);
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

  const displayWidth = 300;
  const displayHeight = 260;
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
            {[1, 2, 3, 4, 5].map(diff => {
              const info = difficultyLabels[diff];
              return (
                <button
                  key={diff}
                  onClick={() => changeDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    selectedDifficulty === diff
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
              className={`px-3 py-1 rounded text-xs transition ${
                cardType === type
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Card type badge */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
            <span className="text-lg">{getCardTypeIcon(currentCard.types)}</span>
            <span className="text-slate-300 font-medium uppercase tracking-wider text-xs">
              {currentCard.types.join(', ')}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {revealed && (
          <div className="mb-2 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                result === 'correct' ? 'bg-green-500' :
                result === 'incorrect' ? 'bg-red-500' : 'bg-slate-500'
              }`}
              style={{ width: `${autoAdvanceProgress}%` }}
            />
          </div>
        )}

        {/* Art display */}
        <div className="flex justify-center mb-4">
          <div
            className={`relative overflow-hidden rounded-xl shadow-2xl transition-all duration-300 ${
              result === 'correct' ? 'ring-4 ring-green-500' :
              result === 'incorrect' ? 'ring-4 ring-red-500' :
              result === 'skipped' ? 'ring-4 ring-slate-500' :
              'ring-2 ring-slate-700'
            }`}
            style={{ width: displayWidth, height: displayHeight }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
          </div>
        </div>

        {/* Game area */}
        {!revealed ? (
          <div className="space-y-4">
            <p className="text-center text-slate-300 text-lg">What card is this?</p>

            {/* Multi-step hints */}
            {hintContent.length > 0 && (
              <div className="space-y-2">
                {/* Revealed hints */}
                {hintsRevealed > 0 && (
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-amber-600/30 space-y-1.5">
                    {hintContent.slice(0, hintsRevealed).map((hint, i) => hint && (
                      <p key={i} className="text-sm">
                        <span className="mr-1">{hint.icon}</span>
                        <span className="text-slate-500">{hint.label}:</span>{' '}
                        <span className="text-amber-400 font-medium">{hint.value}</span>
                      </p>
                    ))}
                  </div>
                )}

                {/* Hint button */}
                {hasMoreHints && (
                  <div className="flex justify-center">
                    <button
                      onClick={revealNextHint}
                      className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
                    >
                      <span>▼</span>
                      <span>
                        Reveal hint {hintsRevealed + 1}/{hintContent.length}
                        <span className="text-amber-600 ml-1">(-25 pts)</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Input with suggestions */}
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type the card name..."
                  autoComplete="off"
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

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                  {suggestions.map((name, i) => (
                    <button
                      key={i}
                      onClick={() => selectSuggestion(name)}
                      className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition text-sm"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
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
