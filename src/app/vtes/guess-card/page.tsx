'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { VtesIcon } from '@/components/vtes/VtesIcon';
import { MaskedCard } from '@/components/vtes/MaskedCard';
import { Droplet, Send, SkipForward, Lightbulb, ArrowRight } from 'lucide-react';

// Blood burst effect for correct guesses
const triggerBloodBurst = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#8a0303', '#ff0000', '#2b0000'],
    shapes: ['circle'],
    disableForReducedMotion: true
  });
};

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
  gender?: string;
  count: number;
  difficulty: number;
  poolCost?: string;
  bloodCost?: string;
  convictionCost?: string;
  requirements?: string;
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
  imageUrl: string; // actual KRCG image URL from API
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
  1: { name: 'Staple', color: 'bg-green-600', description: 'Top 20%' },
  2: { name: 'Common', color: 'bg-blue-600', description: '20-50%' },
  3: { name: 'Uncommon', color: 'bg-yellow-600', description: '50-80%' },
  4: { name: 'Rare', color: 'bg-orange-600', description: 'Bottom 20%' },
  5: { name: 'Never Used', color: 'bg-red-600', description: '0 TWDA' },
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

// Score calculation: hints = 50% points
function calculateScore(hintsUsed: boolean, currentStreak: number, difficulty: number): number {
  const baseByDifficulty: Record<number, number> = {
    1: 20, 2: 50, 3: 100, 4: 200, 5: 400
  };
  let base = baseByDifficulty[difficulty] || 100;

  // Hints = 50% points
  if (hintsUsed) {
    base = Math.round(base * 0.5);
  }

  let multiplier = 1;
  if (currentStreak >= 10) multiplier = 3;
  else if (currentStreak >= 5) multiplier = 2;
  else if (currentStreak >= 3) multiplier = 1.5;

  return Math.round(base * multiplier);
}

const AUTO_ADVANCE_DELAY = 2000; // 2000ms for all results (show full card before auto-advance)
const HOVER_DELAY = 1000;

// Check if two clans are related (same clan or antitribu variant)
function areClanRelated(clan1?: string, clan2?: string): boolean {
  if (!clan1 || !clan2) return false;
  if (clan1 === clan2) return true;
  const base1 = clan1.replace(' antitribu', '');
  const base2 = clan2.replace(' antitribu', '');
  return base1 === base2;
}

// Generate 2 wrong options for crypt multiple choice (3 total with correct)
function generateCryptOptions(
  correctCard: CardData,
  allCrypt: CardData[]
): CardData[] {
  const clan = correctCard.clan;
  const cap = correctCard.capacity ?? 5;
  const gender = correctCard.gender;
  const difficulty = correctCard.difficulty;

  // Helper to check if card name is too similar (avoid obvious answers)
  const isNameTooSimilar = (card1: CardData, card2: CardData): boolean => {
    const name1 = displayName(card1.name).toLowerCase();
    const name2 = displayName(card2.name).toLowerCase();
    
    // Exact match (already filtered)
    if (name1 === name2) return true;
    
    // One name contains the other
    if (name1.includes(name2) || name2.includes(name1)) return true;
    
    // Check for shared significant words (3+ characters)
    const words1 = name1.split(/\s+/).filter(w => w.length >= 3);
    const words2 = name2.split(/\s+/).filter(w => w.length >= 3);
    
    for (const w1 of words1) {
      for (const w2 of words2) {
        if (w1 === w2) return true;
        if (w1.includes(w2) || w2.includes(w1)) return true;
      }
    }
    
    return false;
  };

  // Base filter: different card, same gender, similar capacity (+/- 2)
  const baseFilter = (c: CardData) =>
    c.id !== correctCard.id &&
    c.capacity !== undefined &&
    Math.abs((c.capacity ?? 0) - cap) <= 2 &&
    (!gender || gender === '?' || c.gender === gender) &&
    !isNameTooSimilar(correctCard, c);

  // Priority 1: Same gender + same difficulty + same/antitribu clan + similar capacity
  let candidates = allCrypt.filter(c =>
    baseFilter(c) &&
    c.difficulty === difficulty &&
    areClanRelated(c.clan, clan)
  );

  // Priority 2: Same gender + same difficulty + similar capacity (any clan)
  if (candidates.length < 2) {
    const moreCandidates = allCrypt.filter(c =>
      baseFilter(c) &&
      c.difficulty === difficulty &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Priority 3: Same gender + same difficulty, any capacity
  if (candidates.length < 2) {
    const moreCandidates = allCrypt.filter(c =>
      c.id !== correctCard.id &&
      c.difficulty === difficulty &&
      (!gender || gender === '?' || c.gender === gender) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Priority 4: Same gender + any difficulty + similar capacity
  if (candidates.length < 2) {
    const moreCandidates = allCrypt.filter(c =>
      baseFilter(c) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Priority 5: Same gender, any difficulty, any capacity
  if (candidates.length < 2) {
    const moreCandidates = allCrypt.filter(c =>
      c.id !== correctCard.id &&
      (!gender || gender === '?' || c.gender === gender) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Fallback: any crypt card
  if (candidates.length < 2) {
    const moreCandidates = allCrypt.filter(c =>
      c.id !== correctCard.id &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Shuffle and pick 2
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

// Generate 2 wrong options for library multiple choice (3 total with correct)
function generateLibraryOptions(
  correctCard: CardData,
  allLibrary: CardData[],
  details?: CardDetails
): CardData[] {
  const targetTypes = correctCard.types;
  const targetDifficulty = correctCard.difficulty;
  
  // Get discipline requirement from details (API) or fallback to card data
  const targetDisciplines = details?.disciplines?.map(d => d.toLowerCase()) || 
                           correctCard.disciplines?.map(d => d.toLowerCase()) || 
                           [];
  
  // Get cost from details (API) - this is the key missing piece
  const targetBloodCost = details?.bloodCost || correctCard.bloodCost;
  const targetPoolCost = details?.poolCost || correctCard.poolCost;
  const targetConvictionCost = details?.convictionCost || correctCard.convictionCost;
  
  // Check if card is indiscriminate (no discipline requirement)
  const isIndiscriminate = targetDisciplines.length === 0;

  // Helper to check if indiscriminate
  const isCardIndiscriminate = (c: CardData): boolean => {
    return !c.disciplines || c.disciplines.length === 0;
  };

  // Helper to check cost similarity
  const hasSimilarCost = (c: CardData, cDetails?: CardDetails): boolean => {
    const bloodCost = cDetails?.bloodCost || c.bloodCost;
    const poolCost = cDetails?.poolCost || c.poolCost;
    const convictionCost = cDetails?.convictionCost || c.convictionCost;
    
    // If target costs blood, prefer blood cards
    if (targetBloodCost && bloodCost === targetBloodCost) return true;
    // If target costs pool, prefer pool cards
    if (targetPoolCost && poolCost === targetPoolCost) return true;
    // If target costs conviction, prefer conviction cards
    if (targetConvictionCost && convictionCost === targetConvictionCost) return true;
    // Free cards (no cost) should match other free cards
    if (!targetBloodCost && !targetPoolCost && !targetConvictionCost &&
        !bloodCost && !poolCost && !convictionCost) return true;
    return false;
  };

  // Helper to check if card name is too similar (avoid obvious answers)
  const isNameTooSimilar = (card1: CardData, card2: CardData): boolean => {
    const name1 = displayName(card1.name).toLowerCase();
    const name2 = displayName(card2.name).toLowerCase();
    
    // Exact match (already filtered)
    if (name1 === name2) return true;
    
    // One name contains the other
    if (name1.includes(name2) || name2.includes(name1)) return true;
    
    // Check for shared significant words (3+ characters)
    const words1 = name1.split(/\s+/).filter(w => w.length >= 3);
    const words2 = name2.split(/\s+/).filter(w => w.length >= 3);
    
    for (const w1 of words1) {
      for (const w2 of words2) {
        // Exact word match
        if (w1 === w2) return true;
        // Partial match (one word contains the other)
        if (w1.includes(w2) || w2.includes(w1)) return true;
      }
    }
    
    return false;
  };

  // Base filter: different card, same type
  const baseFilter = (c: CardData) =>
    c.id !== correctCard.id &&
    c.types.length === targetTypes.length &&
    c.types.every(t => targetTypes.includes(t)) &&
    !isNameTooSimilar(correctCard, c);

  // Priority 1: Same type + same difficulty + same discipline + same cost type
  let candidates = allLibrary.filter(c =>
    baseFilter(c) &&
    c.difficulty === targetDifficulty &&
    (isIndiscriminate ? isCardIndiscriminate(c) :
      (c.disciplines && c.disciplines.length > 0 &&
       targetDisciplines.length > 0 &&
       c.disciplines.some(d => targetDisciplines.includes(d)))) &&
    hasSimilarCost(c)
  );

  // Priority 2: Same type + same difficulty + same discipline (any cost)
  if (candidates.length < 2) {
    const moreCandidates = allLibrary.filter(c =>
      baseFilter(c) &&
      c.difficulty === targetDifficulty &&
      (isIndiscriminate ? isCardIndiscriminate(c) :
        (c.disciplines && c.disciplines.length > 0 &&
         targetDisciplines.length > 0 &&
         c.disciplines.some(d => targetDisciplines.includes(d)))) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Priority 3: Same type + same difficulty + same discipline requirement status
  if (candidates.length < 2) {
    const moreCandidates = allLibrary.filter(c =>
      baseFilter(c) &&
      c.difficulty === targetDifficulty &&
      isIndiscriminate === isCardIndiscriminate(c) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Priority 4: Same type + same difficulty (any discipline)
  if (candidates.length < 2) {
    const moreCandidates = allLibrary.filter(c =>
      baseFilter(c) &&
      c.difficulty === targetDifficulty &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Priority 5: Same type (any difficulty) - fallback
  if (candidates.length < 2) {
    const moreCandidates = allLibrary.filter(c =>
      baseFilter(c) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Fallback: any library card with same types count
  if (candidates.length < 2) {
    const moreCandidates = allLibrary.filter(c =>
      c.id !== correctCard.id &&
      c.types.length === targetTypes.length &&
      c.types.every(t => targetTypes.includes(t)) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Last resort: any library card
  if (candidates.length < 2) {
    const moreCandidates = allLibrary.filter(c =>
      c.id !== correctCard.id &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Shuffle and pick 2
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

// Strip group/adv notation for display: "Anson (G1)" -> "Anson"
function displayName(name: string): string {
  return name
    .replace(/\s*\([Gg]\d+\)\s*$/, '')
    .replace(/\s*\(.*[Aa][Dd][Vv].*\)\s*$/, '')
    .trim();
}

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
  const [showUnblurred, setShowUnblurred] = useState(false); // For incorrect/skipped - shows full HD card
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | 'skipped' | null>(null);
  const [showLargeCard, setShowLargeCard] = useState(false);
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const [showInitials, setShowInitials] = useState(false);

  // Multiple choice for crypt
  const [cryptOptions, setCryptOptions] = useState<string[]>([]);
  
  // Multiple choice for library
  const [libraryOptions, setLibraryOptions] = useState<string[]>([]);

  // Choice tracking - prevents multiple selections
  const [choiceMade, setChoiceMade] = useState(false);

  // Animation state
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [cardKey, setCardKey] = useState(0); // For AnimatePresence transitions
  const [streakMilestone, setStreakMilestone] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to generate initials hint
  const generateInitialsHint = useCallback((name: string) => {
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
  }, []);

  // Stats
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [lastPoints, setLastPoints] = useState(0);

  // Ranked Mode State
  const [gameMode, setGameMode] = useState<'normal' | 'ranked' | null>('normal');
  const [rankedPlaylist, setRankedPlaylist] = useState<CardData[]>([]);
  const [rankedCardIndex, setRankedCardIndex] = useState(0);
  const [rankedScore, setRankedScore] = useState(0);
  const [showFinalScore, setShowFinalScore] = useState(false);

  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Obfuscated image URL: uses proxy API with card ID
  const getImageUrl = useCallback((card: CardData) => {
    return `/api/vtes/card-image?id=${card.id}`;
  }, []);

  // Load game data
  useEffect(() => {
    async function loadGameData() {
      try {
        const response = await fetch('/vtes_guess_data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

  // Setup multiple choice options for crypt cards
  const setupCryptOptions = useCallback((card: CardData) => {
    if (!gameData || card.capacity === undefined) {
      setCryptOptions([]);
      return;
    }
    const wrongOptions = generateCryptOptions(card, gameData.crypt);
    const allOptions = [
      displayName(card.name),
      ...wrongOptions.map(c => displayName(c.name))
    ];
    // Shuffle options
    const shuffled = allOptions.sort(() => Math.random() - 0.5);
    setCryptOptions(shuffled);
  }, [gameData]);

  // Setup multiple choice options for library cards
  const setupLibraryOptions = useCallback((card: CardData, details?: CardDetails) => {
    if (!gameData) {
      setLibraryOptions([]);
      return;
    }
    const wrongOptions = generateLibraryOptions(card, gameData.library, details);
    const allOptions = [
      displayName(card.name),
      ...wrongOptions.map(c => displayName(c.name))
    ];
    // Shuffle options
    const shuffled = allOptions.sort(() => Math.random() - 0.5);
    setLibraryOptions(shuffled);
  }, [gameData]);

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
          imageUrl: data.url || `https://static.krcg.org/card/${card.slug}.jpg`,
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
        // Setup options after getting card details
        setupCryptOptions(card);
        setupLibraryOptions(card, details);
      }
    } catch (error) {
      console.error('Error fetching card details:', error);
      setCardDetails({
        name: card.name,
        imageUrl: `/api/vtes/card-image?id=${card.id}`,
        type: card.types?.join(', '),
        disciplines: card.disciplines,
        clan: card.clan,
      });
      setupCryptOptions(card);
      setupLibraryOptions(card);
    }
  }, [setupCryptOptions, setupLibraryOptions]);

  // Ranked Mode Helper Functions
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const generatePhaseCards = useCallback((difficulty: number, count: number, data: GameData): CardData[] => {
    const libraryCount = Math.round(count * 0.8);
    const cryptCount = count - libraryCount;

    const libraryPool = data.library.filter(c => c.difficulty === difficulty);
    const cryptPool = data.crypt.filter(c => c.difficulty === difficulty);

    const selectedLibrary = shuffleArray(libraryPool).slice(0, libraryCount);
    const selectedCrypt = shuffleArray(cryptPool).slice(0, cryptCount);

    return shuffleArray([...selectedLibrary, ...selectedCrypt]);
  }, [shuffleArray]);

  const generateRankedPlaylist = useCallback((data: GameData): CardData[] => {
    const playlist: CardData[] = [];
    playlist.push(...generatePhaseCards(1, 8, data));
    playlist.push(...generatePhaseCards(2, 7, data));
    playlist.push(...generatePhaseCards(3, 4, data));
    playlist.push(...generatePhaseCards(4, 1, data));
    return playlist;
  }, [generatePhaseCards]);

  const getRankedCardValue = useCallback((difficulty: number): number => {
    const values: Record<number, number> = { 1: 2, 2: 5, 3: 10, 4: 20 };
    return values[difficulty] || 0;
  }, []);

  const startRankedGame = useCallback(() => {
    if (!gameData) return;
    const playlist = generateRankedPlaylist(gameData);
    setRankedPlaylist(playlist);
    setRankedCardIndex(0);
    setRankedScore(0);
    setShowFinalScore(false);
    setGameMode('ranked');

    if (playlist[0]) {
      setCurrentCard(playlist[0]);
      fetchCardDetails(playlist[0].name, playlist[0]);
      // Note: setupLibraryOptions will be called after cardDetails is set
    }
  }, [gameData, generateRankedPlaylist, fetchCardDetails]);

  const resetRankedGame = useCallback(() => {
    startRankedGame();
    setRevealed(false);
    setGuess('');
    setResult(null);
    setShowInitials(false);
  }, [startRankedGame]);

  const startNormalGame = useCallback(() => {
    setGameMode('normal');
    setShowFinalScore(false);
    setSelectedDifficulty(1);
    setCardType('library');
  }, []);

  // Start game
  useEffect(() => {
    if (gameData && !currentCard) {
      const card = pickRandomCard();
      if (card) {
        setCurrentCard(card);
        fetchCardDetails(card.name, card);
        // Note: setupLibraryOptions will be called after cardDetails is set
      }
    }
  }, [gameData, currentCard, pickRandomCard, fetchCardDetails]);

  // Auto-advance timer - only for CORRECT guesses (not incorrect/skipped)
  useEffect(() => {
    if (revealed && result === 'correct') {
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
  }, [revealed, result]);

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

    if (gameMode === 'ranked') {
      const nextIndex = rankedCardIndex + 1;
      if (nextIndex < rankedPlaylist.length) {
        const card = rankedPlaylist[nextIndex];
        setRankedCardIndex(nextIndex);
        setCurrentCard(card);
        setCardDetails(null);
        fetchCardDetails(card.name, card);
        // Note: setupLibraryOptions will be called after cardDetails is set
      } else if (nextIndex === rankedPlaylist.length) {
        setShowFinalScore(true);
      }
    } else {
      const card = pickRandomCard();
      if (card) {
        setCurrentCard(card);
        setCardDetails(null);
        fetchCardDetails(card.name, card);
        // Note: setupLibraryOptions will be called after cardDetails is set
      }
    }

    setRevealed(false);
    setShowUnblurred(false);
    setGuess('');
    setResult(null);
    setLastPoints(0);
    setAutoAdvanceProgress(0);
    setShowLargeCard(false);
    setShowInitials(false);
    setFeedback(null);
    setChoiceMade(false);
    setCardKey(prev => prev + 1);

    // Auto-focus input after transition
    setTimeout(() => inputRef.current?.focus(), 400);
  }, [gameMode, rankedCardIndex, rankedPlaylist, pickRandomCard, fetchCardDetails, setupCryptOptions]);

  // Handle scoring for correct/incorrect
  const handleAnswer = useCallback((correct: boolean) => {
    if (!currentCard) return;

    setTotalPlayed(prev => prev + 1);

    if (correct) {
      setResult('correct');
      setFeedback('correct');
      setRevealed(true);
      setShowUnblurred(true); // Show full card for 1 second before auto-advance
      setTotalCorrect(prev => prev + 1);
      
      // Trigger blood burst effect
      triggerBloodBurst();

      if (gameMode === 'ranked') {
        const cardValue = getRankedCardValue(currentCard.difficulty);
        const points = showInitials ? Math.round(cardValue * 0.5) : cardValue;
        setRankedScore(prev => prev + points);
        setLastPoints(points);
      } else {
        const newStreak = streak + 1;
        const points = calculateScore(showInitials, newStreak, selectedDifficulty);
        setStreak(newStreak);
        setBestStreak(prev => Math.max(prev, newStreak));
        setScore(prev => prev + points);
        setLastPoints(points);

        // Streak milestones
        if (newStreak === 5) setStreakMilestone('On Fire!');
        else if (newStreak === 10) setStreakMilestone('Unstoppable!');
        else if (newStreak === 20) setStreakMilestone('VTES Master!');
      }
    } else {
      setResult('incorrect');
      setFeedback('incorrect');
      setRevealed(true);
      setShowUnblurred(true); // Show full card for 2 seconds before auto-advance
      setShowInitials(false);
      if (gameMode !== 'ranked') {
        setStreak(0);
      }
    }

    // Clear feedback after animation
    setTimeout(() => setFeedback(null), 600);
    // Clear streak milestone
    setTimeout(() => setStreakMilestone(null), 2500);
  }, [currentCard, gameMode, getRankedCardValue, showInitials, streak, selectedDifficulty]);

  const checkGuess = () => {
    if (!currentCard) return;
    handleAnswer(isCorrectGuess(guess, currentCard.name));
  };

  const handleCryptChoice = (chosenName: string) => {
    if (!currentCard || choiceMade) return;
    setChoiceMade(true);
    const correct = chosenName === displayName(currentCard.name);
    handleAnswer(correct);
  };

  const handleLibraryChoice = (chosenName: string) => {
    if (!currentCard || choiceMade) return;
    setChoiceMade(true);
    const correct = chosenName === displayName(currentCard.name);
    handleAnswer(correct);
  };

  const skipCard = () => {
    setResult('skipped');
    setShowUnblurred(true); // REVEAL card in full HD
    setStreak(0);
    setTotalPlayed(prev => prev + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // When card is revealed and incorrect/skipped, Enter goes to next card
    if (e.key === 'Enter' && revealed && (result === 'incorrect' || result === 'skipped')) {
      nextCard();
      return;
    }
    // Normal guess submission
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(to bottom, var(--vtes-bg-primary) 0%, var(--vtes-bg-secondary) 100%)'
      }}>
        <div className="text-white text-xl">Loading card database...</div>
      </div>
    );
  }

  if (!gameData || !currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(to bottom, var(--vtes-bg-primary) 0%, var(--vtes-bg-secondary) 100%)'
      }}>
        <div className="text-white text-xl">No cards found for this difficulty level.</div>
      </div>
    );
  }

  // Use obfuscated proxy URL (hides card name, fixes THE slugs)
  const imageUrl = getImageUrl(currentCard);
  // For revealed state, use the KRCG direct URL from API (correct slug)
  const revealedImageUrl = cardDetails?.imageUrl || imageUrl;
  const filteredCardsCount = getFilteredCards().length;
  const diffInfo = difficultyLabels[selectedDifficulty];

  const isCrypt = currentCard.capacity !== undefined;

  // For library cards: show art crop (obfuscated) until revealed, then show full card
  const showArtCrop = !isCrypt && !revealed;
  
  // Dimensions - larger when revealed for better visibility
  const displayWidth = revealed ? 340 : 280;
  const displayHeight = isCrypt ? (revealed ? 470 : 390) : (revealed ? 320 : 240);
  
  // Library crop dimensions (for art-only view)
  const scaledCardWidth = displayWidth / 0.72;
  const scaledCardHeight = scaledCardWidth * 1.4;
  const offsetX = scaledCardWidth * 0.21;
  const offsetY = scaledCardHeight * 0.115;

  return (
    <div className="min-h-screen min-h-[100dvh] p-3 sm:p-6 relative overflow-hidden" style={{
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

      {/* Ranked Game Completion */}
      {showFinalScore && gameMode === 'ranked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)' }}>
          <div className="max-w-md w-full p-8 rounded-2xl border-2 text-center" style={{
            backgroundColor: 'var(--vtes-bg-secondary)',
            borderColor: 'var(--vtes-gold)',
            boxShadow: 'var(--glow-gold)'
          }}>
            <h2 className="text-3xl font-bold mb-2" style={{
              fontFamily: 'var(--vtes-font-display)',
              color: 'var(--vtes-gold)'
            }}>
              Ranked Complete!
            </h2>
            <p className="text-5xl font-bold my-6" style={{ color: 'var(--vtes-blood)' }}>
              {rankedScore}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--vtes-text-muted)' }}>
              Final Score
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={resetRankedGame}
                className="px-5 py-3 rounded-xl font-semibold transition-all duration-200"
                style={{
                  backgroundColor: 'var(--vtes-burgundy)',
                  color: 'var(--vtes-gold)',
                  border: '2px solid var(--vtes-gold)',
                  fontFamily: 'var(--vtes-font-display)'
                }}
              >
                Play Again
              </button>
              <button
                onClick={() => {
                  startNormalGame();
                  setShowFinalScore(false);
                  const card = pickRandomCard();
                  if (card) {
                    setCurrentCard(card);
                    fetchCardDetails(card.name, card);
                    setupCryptOptions(card);
                  }
                }}
                className="px-5 py-3 rounded-xl font-semibold transition-all duration-200"
                style={{
                  backgroundColor: 'var(--vtes-bg-tertiary)',
                  color: 'var(--vtes-text-muted)',
                  border: '1px solid var(--vtes-burgundy-dark)',
                  fontFamily: 'var(--vtes-font-body)'
                }}
              >
                Normal Mode
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto relative z-10 flex flex-col" style={{ minHeight: 'calc(100dvh - 2rem)' }}>
        {/* Header - Fixed height */}
        <div className="flex justify-between items-start mb-3 flex-shrink-0">
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{
              fontFamily: 'var(--vtes-font-display)',
              color: 'var(--vtes-text-primary)',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>
              Guess the Card
            </h1>
            <div className="h-0.5 w-12 bg-gradient-to-r from-[var(--vtes-gold)] to-transparent mt-0.5" />
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px]" style={{ color: 'var(--vtes-text-muted)' }}>VTES Edition</p>
              {gameMode && (
                <button
                  onClick={() => {
                    if (gameMode === 'normal') {
                      startRankedGame();
                    } else {
                      startNormalGame();
                      const card = pickRandomCard();
                      if (card) {
                        setCurrentCard(card);
                        fetchCardDetails(card.name, card);
                        setupCryptOptions(card);
                      }
                    }
                  }}
                  className="text-[10px] px-2 py-0.5 rounded transition-all duration-200"
                  style={{
                    backgroundColor: gameMode === 'ranked' ? 'var(--vtes-blood)' : 'var(--vtes-bg-tertiary)',
                    color: gameMode === 'ranked' ? 'var(--vtes-text-primary)' : 'var(--vtes-text-muted)',
                    border: `1px solid ${gameMode === 'ranked' ? 'var(--vtes-blood)' : 'var(--vtes-burgundy-dark)'}`,
                    fontFamily: 'var(--vtes-font-body)'
                  }}
                >
                  {gameMode === 'ranked' ? 'RANKED' : 'Normal'}
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2 text-center">
            {gameMode === 'ranked' ? (
              <>
                <div className="px-2.5 py-1.5 rounded-lg" style={{
                  backgroundColor: 'var(--vtes-bg-tertiary)',
                  border: '1px solid var(--vtes-blood)'
                }}>
                  <p className="text-base font-bold" style={{ color: 'var(--vtes-blood)' }}>{rankedCardIndex + 1}/20</p>
                  <p className="text-[9px]" style={{ color: 'var(--vtes-text-dim)' }}>Progress</p>
                </div>
                <div className="px-2.5 py-1.5 rounded-lg" style={{
                  backgroundColor: 'var(--vtes-bg-tertiary)',
                  border: '1px solid var(--vtes-gold)'
                }}>
                  <motion.p
                    key={`ranked-${rankedScore}`}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="text-base font-bold"
                    style={{ color: 'var(--vtes-gold)' }}
                  >{rankedScore}</motion.p>
                  <p className="text-[9px]" style={{ color: 'var(--vtes-text-dim)' }}>Score</p>
                </div>
              </>
            ) : (
              <>
                <div className="px-2.5 py-1.5 rounded-lg" style={{
                  backgroundColor: 'var(--vtes-bg-tertiary)',
                  border: '1px solid var(--vtes-burgundy-dark)'
                }}>
                  <motion.p
                    key={`streak-${streak}`}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="text-base font-bold"
                    style={{ color: 'var(--vtes-gold)' }}
                  >{streak}</motion.p>
                  <p className="text-[9px]" style={{ color: 'var(--vtes-text-dim)' }}>Streak</p>
                </div>
                <div className="px-2.5 py-1.5 rounded-lg" style={{
                  backgroundColor: 'var(--vtes-bg-tertiary)',
                  border: '1px solid var(--vtes-burgundy-dark)'
                }}>
                  <motion.p
                    key={`score-${score}`}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="text-base font-bold"
                    style={{ color: 'var(--vtes-blood)' }}
                  >{score}</motion.p>
                  <p className="text-[9px]" style={{ color: 'var(--vtes-text-dim)' }}>Score</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Difficulty selector - Normal mode only */}
        {gameMode === 'normal' && (
          <div className="mb-3 flex-shrink-0">
            <div className="flex gap-1.5 justify-center overflow-x-auto pb-1 scrollbar-hide">
              {[1, 2, 3, 4, 5].map(diff => {
                const info = difficultyLabels[diff];
                const isSelected = selectedDifficulty === diff;
                return (
                  <button
                    key={diff}
                    onClick={() => changeDifficulty(diff)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0"
                    style={{
                      backgroundColor: isSelected ? 'var(--vtes-burgundy)' : 'var(--vtes-bg-tertiary)',
                      color: isSelected ? 'var(--vtes-gold)' : 'var(--vtes-text-muted)',
                      border: `1px solid ${isSelected ? 'var(--vtes-gold)' : 'var(--vtes-burgundy-dark)'}`,
                      boxShadow: isSelected ? 'var(--glow-gold)' : 'none',
                      fontFamily: 'var(--vtes-font-body)'
                    }}
                  >
                    {info.name}
                  </button>
                );
              })}
            </div>
            <p className="text-center text-[10px] mt-1" style={{ color: 'var(--vtes-text-dim)' }}>
              {diffInfo.description} &middot; {filteredCardsCount} cards
            </p>
          </div>
        )}

        {/* Card type selector - Normal mode only */}
        {gameMode === 'normal' && (
          <div className="flex gap-1.5 justify-center mb-3 flex-shrink-0">
            {(['library', 'crypt', 'all'] as const).map(type => {
              const isSelected = cardType === type;
              return (
                <button
                  key={type}
                  onClick={() => { setCardType(type); setCurrentCard(null); setShowInitials(false); }}
                  className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
                  style={{
                    backgroundColor: isSelected ? 'var(--vtes-blood)' : 'var(--vtes-bg-secondary)',
                    color: isSelected ? 'var(--vtes-text-primary)' : 'var(--vtes-text-muted)',
                    border: `1px solid ${isSelected ? 'var(--vtes-blood)' : 'transparent'}`,
                    fontFamily: 'var(--vtes-font-body)'
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              );
            })}
          </div>
        )}

        {/* Progress bar - only for CORRECT guesses (auto-advance) */}
        {revealed && result === 'correct' && (
          <div className="mb-2 h-1 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--vtes-bg-tertiary)' }}>
            <div
              className="h-full transition-all duration-75 bg-green-500"
              style={{ width: `${autoAdvanceProgress}%` }}
            />
          </div>
        )}

        {/* Streak milestone toast */}
        <AnimatePresence>
          {streakMilestone && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full font-bold text-lg shadow-lg"
              style={{
                backgroundColor: 'var(--vtes-gold)',
                color: 'var(--vtes-bg-primary)',
                fontFamily: 'var(--vtes-font-display)',
                boxShadow: '0 0 30px rgba(212, 175, 55, 0.6)'
              }}
            >
              {streakMilestone}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Art display with transition */}
        <div className="flex justify-center mb-3 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={cardKey}
              initial={{ opacity: 0, x: 60 }}
              animate={{
                opacity: 1,
                x: 0,
                ...(feedback === 'incorrect' ? { x: [0, -8, 8, -8, 8, 0] } : {}),
                ...(feedback === 'correct' ? { scale: [1, 1.04, 1] } : {}),
              }}
              exit={{ opacity: 0, x: -60 }}
              transition={{
                duration: feedback ? 0.4 : 0.3,
                ease: 'easeOut'
              }}
              className="relative"
            >
              <div
                className={`relative overflow-hidden rounded-xl shadow-2xl transition-all duration-300 ${
                  result === 'correct' ? 'ring-4 ring-green-500' :
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
                  // Library card - show art only when blurred, full card when revealed
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={showArtCrop ? imageUrl : revealedImageUrl}
                    alt="VTES Card"
                    style={{
                      // For art-only: crop to show only the art (no blur needed)
                      ...(showArtCrop ? {
                        position: 'absolute',
                        width: scaledCardWidth,
                        height: scaledCardHeight,
                        left: -offsetX,
                        top: -offsetY,
                        maxWidth: 'none',
                      } : {
                        // For revealed: show full card at natural size
                        width: '100%',
                        height: '100%',
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
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Card details - shown below card when revealed (for crypt cards that need the info) */}
        {revealed && isCrypt && cardDetails && (
          <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: 'var(--vtes-bg-tertiary)' }}>
            <div className="flex flex-col items-center gap-1">
              {cardDetails.type && (
                <p className="text-xs font-medium" style={{ color: 'var(--vtes-gold)' }}>{cardDetails.type}</p>
              )}
              {cardDetails.artists && cardDetails.artists.length > 0 && (
                <p className="text-[10px]" style={{ color: 'var(--vtes-text-dim)' }}>Art by {cardDetails.artists.join(', ')}</p>
              )}
              {currentCard.count > 0 && (
                <p className="text-[10px] font-medium" style={{ color: 'var(--vtes-blood)' }}>Used in {currentCard.count.toLocaleString()} TWDA decks</p>
              )}
            </div>
          </div>
        )}

        {/* Card Info Line */}
        <div className="flex justify-center mb-3 flex-shrink-0">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full shadow-lg" style={{
            backgroundColor: 'var(--vtes-bg-tertiary)',
            border: '1px solid var(--vtes-burgundy-dark)'
          }}>
            {!isCrypt ? (
              <>
                {(cardDetails?.bloodCost || cardDetails?.poolCost || cardDetails?.convictionCost) && (
                  <div className="flex items-center gap-2">
                    {cardDetails.bloodCost && (
                      <div className="flex items-center gap-1 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/50">
                        <Droplet className="w-4 h-4 fill-red-500 text-red-500" />
                        <span className="text-white font-bold text-sm">{cardDetails.bloodCost}</span>
                      </div>
                    )}
                    {cardDetails.poolCost && (
                      <div className="flex items-center gap-1 bg-slate-700/40 px-1.5 py-0.5 rounded border border-slate-600/50">
                        <div className="w-3 h-3 bg-white rotate-45" />
                        <span className="text-white font-bold text-sm ml-0.5">{cardDetails.poolCost}</span>
                      </div>
                    )}
                    {cardDetails.convictionCost && (
                      <div className="flex items-center gap-1">
                        <VtesIcon name="conviction" type="cost" size="sm" />
                        <span className="text-white font-bold text-sm">{cardDetails.convictionCost}</span>
                      </div>
                    )}
                    <span className="text-slate-600 text-lg">/</span>
                  </div>
                )}
                {((cardDetails?.clan && !isCrypt) || (cardDetails?.disciplines && cardDetails.disciplines.length > 0)) && (
                  <div className="flex items-center gap-1">
                    {cardDetails?.clan && <VtesIcon name={cardDetails.clan} type="clan" size="md" />}
                    {cardDetails?.disciplines?.map(d => (
                      <VtesIcon key={d} name={d} type="discipline" size="md" />
                    ))}
                    <span className="text-slate-600 text-lg mx-1">/</span>
                  </div>
                )}
                <span className="text-sm font-semibold tracking-wider capitalize" style={{
                  color: 'var(--vtes-gold)',
                  fontFamily: 'var(--vtes-font-display)'
                }}>
                  {currentCard.types.join(' / ')}
                </span>
              </>
            ) : (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-semibold tracking-wider capitalize" style={{
                  color: 'var(--vtes-gold)',
                  fontFamily: 'var(--vtes-font-display)'
                }}>
                  {currentCard.types.join(' / ')}
                </span>
                {(cardDetails?.sect || cardDetails?.title) && (
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--vtes-text-muted)' }}>
                    {cardDetails.sect && <span className="uppercase tracking-wider">{cardDetails.sect}</span>}
                    {cardDetails.sect && cardDetails.title && <span style={{ color: 'var(--vtes-burgundy)' }}>&bull;</span>}
                    {cardDetails.title && <span className="uppercase tracking-wider">{cardDetails.title}</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Game area - flexible grow */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Before choice - show options */}
          {!revealed && !choiceMade && (
            <div className="space-y-3">
              {/* Hint Section - only for library text input mode */}
              {!isCrypt && libraryOptions.length === 0 && (
                <div className="flex flex-col items-center gap-2">
                  {showInitials ? (
                    <div className="px-4 py-2 rounded-lg" style={{
                      backgroundColor: 'var(--vtes-bg-tertiary)',
                      border: '1px solid var(--vtes-gold)',
                      boxShadow: 'var(--glow-gold)'
                    }}>
                      <p className="font-mono text-base tracking-[0.15em] font-bold" style={{
                        color: 'var(--vtes-gold)',
                        fontFamily: 'var(--vtes-font-display)'
                      }}>
                        {generateInitialsHint(currentCard.name)}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowInitials(true)}
                      className="text-[11px] uppercase tracking-wider flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-80"
                      style={{
                        backgroundColor: 'var(--vtes-bg-secondary)',
                        color: 'var(--vtes-text-muted)',
                        border: '1px solid var(--vtes-gold-dark)',
                        fontFamily: 'var(--vtes-font-body)'
                      }}
                    >
                      <Lightbulb className="w-3.5 h-3.5" style={{ color: 'var(--vtes-gold-dark)' }} />
                      Show Initials <span style={{ color: 'var(--vtes-gold-dark)' }}>(50% pts)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Crypt: Multiple choice buttons */}
              {isCrypt && cryptOptions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-center text-sm" style={{ color: 'var(--vtes-text-muted)' }}>Who is this vampire?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {cryptOptions.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleCryptChoice(option)}
                        className="px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left"
                        style={{
                          backgroundColor: 'var(--vtes-bg-tertiary)',
                          color: 'var(--vtes-text-primary)',
                          border: '2px solid var(--vtes-burgundy-dark)',
                          fontFamily: 'var(--vtes-font-body)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--vtes-gold)';
                          e.currentTarget.style.boxShadow = 'var(--glow-gold)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--vtes-burgundy-dark)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={skipCard}
                      className="text-[11px] px-3 py-1 rounded transition-all duration-200 flex items-center gap-1 hover:opacity-80"
                      style={{
                        color: 'var(--vtes-text-dim)',
                        fontFamily: 'var(--vtes-font-body)'
                      }}
                    >
                      <SkipForward className="w-3 h-3" />
                      Skip
                    </button>
                  </div>
                </div>
              ) : !isCrypt && libraryOptions.length > 0 ? (
                /* Library: Multiple choice buttons */
                <div className="space-y-2">
                  <p className="text-center text-sm" style={{ color: 'var(--vtes-text-secondary, #c0bfb8)' }}>What card is this?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {libraryOptions.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleLibraryChoice(option)}
                        className="px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left"
                        style={{
                          backgroundColor: 'var(--vtes-bg-tertiary)',
                          color: 'var(--vtes-text-primary)',
                          border: '2px solid var(--vtes-burgundy-dark)',
                          fontFamily: 'var(--vtes-font-body)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--vtes-gold)';
                          e.currentTarget.style.boxShadow = 'var(--glow-gold)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--vtes-burgundy-dark)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={skipCard}
                      className="text-[11px] px-3 py-1 rounded transition-all duration-200 flex items-center gap-1 hover:opacity-80"
                      style={{
                        color: 'var(--vtes-text-dim)',
                        fontFamily: 'var(--vtes-font-body)'
                      }}
                    >
                      <SkipForward className="w-3 h-3" />
                      Skip
                    </button>
                  </div>
                </div>
              ) : (
                /* Library: Text input (fallback) */
                <div className="space-y-2">
                  <p className="text-center text-sm" style={{ color: 'var(--vtes-text-secondary, #c0bfb8)' }}>What card is this?</p>
                  <input
                    ref={inputRef}
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
                    className="w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--vtes-bg-tertiary)',
                      color: 'var(--vtes-text-primary)',
                      border: '2px solid var(--vtes-burgundy-dark)',
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
                  <div className="flex gap-2">
                    <button
                      onClick={checkGuess}
                      disabled={!guess.trim()}
                      className="flex-1 py-2.5 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: guess.trim() ? 'var(--vtes-burgundy)' : 'var(--vtes-bg-tertiary)',
                        color: guess.trim() ? 'var(--vtes-gold)' : 'var(--vtes-text-dim)',
                        border: `2px solid ${guess.trim() ? 'var(--vtes-gold)' : 'var(--vtes-burgundy-dark)'}`,
                        boxShadow: guess.trim() ? 'var(--glow-gold)' : 'none',
                        cursor: guess.trim() ? 'pointer' : 'not-allowed',
                        fontFamily: 'var(--vtes-font-display)',
                        fontSize: '14px',
                        letterSpacing: '0.05em'
                      }}
                    >
                      <Send className="w-4 h-4" />
                      Submit
                    </button>
                    <button
                      onClick={skipCard}
                      className="px-4 py-2.5 rounded-xl text-xs transition-all duration-200 flex items-center gap-1.5"
                      style={{
                        backgroundColor: 'var(--vtes-bg-secondary)',
                        color: 'var(--vtes-text-muted)',
                        border: '1px solid var(--vtes-burgundy-dark)',
                        fontFamily: 'var(--vtes-font-body)'
                      }}
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      Skip
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* After choice made - show result */}
          {(revealed || choiceMade) && result === 'incorrect' ? (
            /* INCORRECT: Show large SKIP button, keep blur */
            <div className="text-center space-y-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="space-y-0.5"
              >
                <p className="font-bold text-lg" style={{ color: '#ef4444' }}>Incorrect</p>
                <p className="text-sm" style={{ color: 'var(--vtes-text-muted)' }}>Streak lost</p>
              </motion.div>

              <p className="text-xl font-bold" style={{ color: 'var(--vtes-text-primary)' }}>{currentCard.name}</p>

              {cardDetails && (
                <div className="text-sm space-y-0.5" style={{ color: 'var(--vtes-text-muted)' }}>
                  {cardDetails.type && <p>{cardDetails.type}</p>}
                  {cardDetails.artists && cardDetails.artists.length > 0 && (
                    <p className="text-[11px]" style={{ color: 'var(--vtes-text-dim)' }}>Art by {cardDetails.artists.join(', ')}</p>
                  )}
                  {currentCard.count > 0 && (
                    <p className="text-[11px]" style={{ color: 'var(--vtes-text-dim)' }}>Used in {currentCard.count} TWDA decks</p>
                  )}
                </div>
              )}

              <button
                onClick={nextCard}
                className="w-full py-4 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--vtes-burgundy)',
                  color: 'var(--vtes-gold)',
                  border: '2px solid var(--vtes-gold)',
                  fontFamily: 'var(--vtes-font-display)',
                  fontSize: '16px'
                }}
              >
                <SkipForward className="w-5 h-5" />
                Skip / Next Card
              </button>
            </div>
          ) : result === 'skipped' ? (
            /* SKIPPED: Same as incorrect but different message */
            <div className="text-center space-y-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-0.5"
              >
                <p className="font-bold text-lg" style={{ color: 'var(--vtes-text-muted)' }}>Skipped</p>
                <p className="text-sm" style={{ color: 'var(--vtes-text-dim)' }}>Streak lost</p>
              </motion.div>

              <p className="text-xl font-bold" style={{ color: 'var(--vtes-text-primary)' }}>{currentCard.name}</p>

              {cardDetails && (
                <div className="text-sm space-y-0.5" style={{ color: 'var(--vtes-text-muted)' }}>
                  {cardDetails.type && <p>{cardDetails.type}</p>}
                  {cardDetails.artists && cardDetails.artists.length > 0 && (
                    <p className="text-[11px]" style={{ color: 'var(--vtes-text-dim)' }}>Art by {cardDetails.artists.join(', ')}</p>
                  )}
                  {currentCard.count > 0 && (
                    <p className="text-[11px]" style={{ color: 'var(--vtes-text-dim)' }}>Used in {currentCard.count} TWDA decks</p>
                  )}
                </div>
              )}

              <button
                onClick={nextCard}
                className="w-full py-4 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--vtes-burgundy)',
                  color: 'var(--vtes-gold)',
                  border: '2px solid var(--vtes-gold)',
                  fontFamily: 'var(--vtes-font-display)',
                  fontSize: '16px'
                }}
              >
                <SkipForward className="w-5 h-5" />
                Next Card
              </button>
            </div>
          ) : null
          /* Note: Correct answer auto-advances, no additional UI needed */
          }
        </div>

        {/* Stats footer - Fixed at bottom */}
        <div className="mt-4 p-2.5 rounded-lg flex-shrink-0" style={{
          backgroundColor: 'rgba(30, 30, 40, 0.5)',
          border: '1px solid var(--vtes-burgundy-dark)'
        }}>
          <div className="flex justify-around text-center text-[11px]">
            <div>
              <p className="font-bold" style={{ color: 'var(--vtes-text-primary)' }}>{totalPlayed}</p>
              <p style={{ color: 'var(--vtes-text-dim)' }}>Played</p>
            </div>
            <div>
              <p className="font-bold" style={{ color: 'var(--vtes-text-primary)' }}>{totalCorrect}</p>
              <p style={{ color: 'var(--vtes-text-dim)' }}>Correct</p>
            </div>
            <div>
              <p className="font-bold" style={{ color: 'var(--vtes-text-primary)' }}>
                {totalPlayed > 0 ? Math.round((totalCorrect / totalPlayed) * 100) : 0}%
              </p>
              <p style={{ color: 'var(--vtes-text-dim)' }}>Accuracy</p>
            </div>
            <div>
              <p className="font-bold" style={{ color: 'var(--vtes-gold)' }}>{bestStreak}</p>
              <p style={{ color: 'var(--vtes-text-dim)' }}>Best</p>
            </div>
          </div>
        </div>

        <div className="mt-2 text-center flex-shrink-0">
          <p className="text-[9px]" style={{ color: 'var(--vtes-text-dim)' }}>Images: KRCG.org</p>
        </div>
      </div>

      {showLargeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={revealedImageUrl} alt={currentCard.name} className="max-h-[80vh] rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
