'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { VtesIcon } from '@/components/vtes/VtesIcon';
import { MaskedCard } from '@/components/vtes/MaskedCard';
import { Droplet, Send, SkipForward, Lightbulb, ArrowRight, ChevronLeft, ChevronRight, Flame, Star, Info, Trophy, Zap, Target, Shield, Crown, BookOpen, Skull, Sparkles, Play } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useVtesGuessLeaderboard } from '@/hooks/useVtesGuessLeaderboard';
import {
  normalizeString,
  isCorrectGuess,
  calculateScore,
  displayName,
  areClanRelated,
  isNameTooSimilar,
  generateCryptOptions,
  generateLibraryOptions,
  type GameCardData,
  type GameCardDetails,
  type PremiumDistractors
} from '@/lib/vtes/guess-game';

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

const difficultyLabels: Record<number, { name: string; color: string; description: string; icon: string; bgColor: string; borderColor: string }> = {
  1: { name: 'Staple', color: 'text-emerald-400', description: 'Top 20%', icon: '🌟', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/50' },
  2: { name: 'Common', color: 'text-blue-400', description: '20-50%', icon: '📦', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/50' },
  3: { name: 'Uncommon', color: 'text-yellow-400', description: '50-80%', icon: '🔶', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/50' },
  4: { name: 'Rare', color: 'text-orange-400', description: 'Bottom 20%', icon: '🔴', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/50' },
  5: { name: 'Never Used', color: 'text-red-400', description: '0 TWDA', icon: '💀', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/50' },
};

const AUTO_ADVANCE_DELAY = 1500; // 1500ms for correct answers (slower auto-advance)
const HOVER_DELAY = 1000;
const STATS_STORAGE_KEY = 'vtes-guess-stats';

// Game data interface
interface GameData {
  metadata: {
    total_decks_analyzed: number;
    total_crypt_cards: number;
    total_library_cards: number;
    difficulty_levels: Record<string, string>;
  };
  crypt: GameCardData[];
  library: GameCardData[];
}

// Stats interface for localStorage
interface GameStats {
  score: number;
  bestStreak: number;
  totalPlayed: number;
  totalCorrect: number;
}

// Load stats from localStorage
function loadStats(): GameStats {
  try {
    const stored = localStorage.getItem(STATS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading stats from localStorage:', e);
  }
  return { score: 0, bestStreak: 0, totalPlayed: 0, totalCorrect: 0 };
}

// Save stats to localStorage
function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving stats to localStorage:', e);
  }
}

export default function GuessCardPage() {
  // Game data
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(1);
  const [cardType, setCardType] = useState<'library' | 'crypt' | 'all'>('library');

  // Current card
  const [currentCard, setCurrentCard] = useState<GameCardData | null>(null);
  const [cardDetails, setCardDetails] = useState<GameCardDetails | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showUnblurred, setShowUnblurred] = useState(false); // For incorrect/skipped - shows full HD card
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | 'skipped' | null>(null);
  const [showLargeCard, setShowLargeCard] = useState(false);
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const [showInitials, setShowInitials] = useState(false);
  
  // Mobile detection - for tap to preview
  const [isMobile, setIsMobile] = useState(false);

  // Multiple choice for crypt
  const [cryptOptions, setCryptOptions] = useState<string[]>([]);
  
  // Multiple choice for library
  const [libraryOptions, setLibraryOptions] = useState<string[]>([]);

  // Premium distractors loaded from JSON
  const [premiumDistractors, setPremiumDistractors] = useState<PremiumDistractors>({});

  // Choice tracking - prevents multiple selections
  const [choiceMade, setChoiceMade] = useState(false);

  // Details expandable (for incorrect/skipped screens)
  const [showDetails, setShowDetails] = useState(false);

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

  // Clean up unused preloadedImages state since we're doing silent preloading
  const [_, setPreloadedImages] = useState<string[]>([]); // Keep for compatibility

  // Ranked Mode State
  const [gameMode, setGameMode] = useState<'normal' | 'ranked' | null>('normal');
  const [rankedPlaylist, setRankedPlaylist] = useState<GameCardData[]>([]);
  const [rankedCardIndex, setRankedCardIndex] = useState(0);
  const [rankedScore, setRankedScore] = useState(0);
  const [showFinalScore, setShowFinalScore] = useState(false);
  
  // Ranked stats tracking
  const [rankedStats, setRankedStats] = useState({ correct: 0, total: 0, bestStreak: 0 });
  
  // Leaderboard state
  const { user, profile } = useCurrentUser();
  const { submitScore, loading: submittingScore } = useVtesGuessLeaderboard();
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Obfuscated image URL: uses proxy API with card ID
  const getImageUrl = useCallback((card: GameCardData) => {
    return `/api/vtes/card-image?id=${card.id}`;
  }, []);

  // Load game data and initialize stats
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
    
    // Load stats from localStorage
    const savedStats = loadStats();
    setScore(savedStats.score);
    setBestStreak(savedStats.bestStreak);
    setTotalPlayed(savedStats.totalPlayed);
    setTotalCorrect(savedStats.totalCorrect);
    
    // Detect mobile device
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // Load premium distractors
    async function loadPremiumDistractors() {
      try {
        const response = await fetch('/premium_distractors.json');
        if (response.ok) {
          const data = await response.json();
          setPremiumDistractors(data);
        }
      } catch (error) {
        console.log('No premium distractors loaded, using semantic algorithm');
      }
    }
    loadPremiumDistractors();
  }, []);

  // Get filtered cards
  const getFilteredCards = useCallback((): GameCardData[] => {
    if (!gameData) return [];
    let cards: GameCardData[] = [];
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
  const setupCryptOptions = useCallback((card: GameCardData) => {
    if (!gameData || card.capacity === undefined) {
      setCryptOptions([]);
      return;
    }
    const wrongOptions = generateCryptOptions(card, gameData.crypt);
    const allOptions = [
      displayName(card.name),
      ...wrongOptions.map(c => displayName(c.name))
    ];
    // Shuffle options using Fisher-Yates algorithm (truly random)
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }
    setCryptOptions(allOptions);
  }, [gameData]);

  // Setup multiple choice options for library cards
  const setupLibraryOptions = useCallback((card: GameCardData, details?: GameCardDetails) => {
    if (!gameData) {
      setLibraryOptions([]);
      return;
    }
    const wrongOptions = generateLibraryOptions(card, gameData.library, details, premiumDistractors);
    const allOptions = [
      displayName(card.name),
      ...wrongOptions.map(c => displayName(c.name))
    ];
    // Shuffle options using Fisher-Yates algorithm (truly random)
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }
    setLibraryOptions(allOptions);
  }, [gameData, premiumDistractors]);

  // Fetch card details
  const fetchCardDetails = useCallback(async (cardName: string, card: GameCardData) => {
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

        const details: GameCardDetails = {
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

  const generatePhaseCards = useCallback((difficulty: number, count: number, data: GameData): GameCardData[] => {
    const libraryCount = Math.round(count * 0.8);
    const cryptCount = count - libraryCount;

    const libraryPool = data.library.filter(c => c.difficulty === difficulty);
    const cryptPool = data.crypt.filter(c => c.difficulty === difficulty);

    const selectedLibrary = shuffleArray(libraryPool).slice(0, libraryCount);
    const selectedCrypt = shuffleArray(cryptPool).slice(0, cryptCount);

    return shuffleArray([...selectedLibrary, ...selectedCrypt]);
  }, [shuffleArray]);

  const generateRankedPlaylist = useCallback((data: GameData): GameCardData[] => {
    // Ranked mode: 20 cards total - strictly sorted by difficulty for "Ramp-up" experience
    // Cards 1-6: Level 1 (6 cards, 10 pts) - Staples, very common
    // Cards 7-11: Level 2 (5 cards, 20 pts) - Common tournament cards
    // Cards 12-15: Level 3 (4 cards, 30 pts) - Archetype-specific cards
    // Cards 16-18: Level 4 (3 cards, 50 pts) - Niche/old cards
    // Cards 19-20: Level 5 (2 cards, 80 pts) - "Boss Cards" - rare/bad/very obscure
    const playlist: GameCardData[] = [];
    
    // Generate cards for each level and concatenate (already sorted by difficulty)
    playlist.push(...generatePhaseCards(1, 6, data));  // 6 cards - 10 pts
    playlist.push(...generatePhaseCards(2, 5, data));  // 5 cards - 20 pts
    playlist.push(...generatePhaseCards(3, 4, data));  // 4 cards - 30 pts
    playlist.push(...generatePhaseCards(4, 3, data));  // 3 cards - 50 pts
    playlist.push(...generatePhaseCards(5, 2, data));  // 2 cards - 80 pts
    
    // Cards are already in difficulty order (1 -> 5) due to phase generation order
    return playlist;
  }, [generatePhaseCards]);

  const getRankedCardValue = useCallback((difficulty: number): number => {
    // Base points by difficulty level for Ranked Mode
    // Cards 1-6: 10 pts (Level 1 - Staples)
    // Cards 7-11: 20 pts (Level 2 - Common)
    // Cards 12-15: 30 pts (Level 3 - Archetype)
    // Cards 16-18: 50 pts (Level 4 - Niche)
    // Cards 19-20: 80 pts (Level 5 - Boss)
    const values: Record<number, number> = { 1: 10, 2: 20, 3: 30, 4: 50, 5: 80 };
    return values[difficulty] || 0;
  }, []);

  // Calculate streak multiplier for ranked mode
  const getStreakMultiplier = useCallback((streak: number): { multiplier: number; icon: string; color: string; label: string } => {
    if (streak >= 15) return { multiplier: 1.3, icon: '🔥', color: 'text-yellow-400', label: 'INFERNO' };
    if (streak >= 10) return { multiplier: 1.2, icon: '🔥', color: 'text-slate-300', label: 'FLAME' };
    if (streak >= 5) return { multiplier: 1.1, icon: '✨', color: 'text-orange-400', label: 'SPARK' };
    return { multiplier: 1.0, icon: '', color: '', label: '' };
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
    
    // Pre-fetch all 20 card images for smooth ranked gameplay
    preFetchRankedImages(playlist);
  }, [gameData, generateRankedPlaylist, fetchCardDetails]);

  const resetRankedGame = useCallback(() => {
    startRankedGame();
    setRevealed(false);
    setGuess('');
    setResult(null);
    setShowInitials(false);
    setSubmittedRank(null);
    setIsSubmitting(false);
  }, [startRankedGame]);

  // Submit score to leaderboard
  const handleSubmitScore = useCallback(async () => {
    if (!user || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const result = await submitScore({
      score: rankedScore,
      mode: 'ranked',
      cardsPlayed: rankedStats.total,
      cardsCorrect: rankedStats.correct,
      bestStreak: rankedStats.bestStreak,
    });
    
    if (result) {
      setSubmittedRank(result.rank);
      if (result.updated) {
        toast.success(`Score saved! You're now ranked #${result.rank}`);
      } else {
        toast.info(`Score submitted. Your best rank is #${result.rank}`);
      }
    } else {
      toast.error('Failed to submit score. Please try again.');
    }
    
    setIsSubmitting(false);
  }, [user, isSubmitting, rankedScore, rankedStats, submitScore]);

  // Skip submission and continue
  const handleSkipSubmission = useCallback(() => {
    setShowFinalScore(false);
    resetRankedGame();
  }, [resetRankedGame]);

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

  // Save stats to localStorage whenever they change (only in normal mode)
  useEffect(() => {
    if (gameMode === 'normal') {
      saveStats({ score, bestStreak, totalPlayed, totalCorrect });
    }
  }, [score, bestStreak, totalPlayed, totalCorrect, gameMode]);

  useEffect(() => {
    return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); };
  }, []);

  // Preload next cards (images and details) for instant transitions
  const preloadNextCards = useCallback((count = 2) => {
    if (!gameData) return;
    
    // Get filtered cards for normal mode
    const getFiltered = (): GameCardData[] => {
      let cards: GameCardData[] = [];
      if (cardType === 'crypt' || cardType === 'all') {
        cards = [...cards, ...gameData.crypt.filter(c => c.difficulty === selectedDifficulty)];
      }
      if (cardType === 'library' || cardType === 'all') {
        cards = [...cards, ...gameData.library.filter(c => c.difficulty === selectedDifficulty)];
      }
      return cards;
    };
    
    const filtered = getFiltered();
    const usedIds = new Set([currentCard?.id].filter(Boolean));
    
    // Pick random cards that aren't the current card
    const available = filtered.filter(c => !usedIds.has(c.id));
    const shuffled = available.sort(() => Math.random() - 0.5);
    const toLoad = shuffled.slice(0, count);
    
    toLoad.forEach(card => {
      // Preload image
      const img = new Image();
      img.src = getImageUrl(card);
      
      // Preload card details
      fetchCardDetailsForPreload(card.name, card);
    });
  }, [gameData, cardType, selectedDifficulty, currentCard, getImageUrl]);
  
  // Fetch card details for preloading (without setting state)
  const fetchCardDetailsForPreload = useCallback(async (cardName: string, card: GameCardData) => {
    try {
      const response = await fetch(`https://api.krcg.org/card/${encodeURIComponent(cardName)}`);
      if (response.ok) {
        const data = await response.json();
        // Just cache this data, don't update state
      }
    } catch (error) {
      // Silent fail for preloading
    }
  }, []);

  // Pre-fetch card image (silent, no state)
  const preFetchCardImage = useCallback((card: GameCardData) => {
    const img = new Image();
    img.src = getImageUrl(card);
  }, [getImageUrl]);

  // Pre-fetch all ranked playlist images for smooth gameplay
  const preFetchRankedImages = useCallback((playlist: GameCardData[]) => {
    playlist.forEach((card, index) => {
      // Stagger preloading to avoid overwhelming the browser
      setTimeout(() => {
        preFetchCardImage(card);
        // Also pre-fetch card details in background
        fetchCardDetailsForPreload(card.name, card);
      }, index * 100); // 100ms delay between each card
    });
  }, [preFetchCardImage, fetchCardDetailsForPreload]);

  // Trigger preloading when card is revealed (normal mode only)
  useEffect(() => {
    if (revealed && gameMode === 'normal') {
      preloadNextCards(2);
    }
  }, [revealed, gameMode, preloadNextCards]);

  const handleMouseEnter = () => {
    // Mouse hover disabled to prevent cheating
    // The card should only be revealed through correct guessing
  };

  const handleMouseLeave = () => {
    // Mouse hover disabled
  };

  // Mobile tap handler - disabled to prevent cheating
  const handleCardTap = () => {
    // Tap to preview disabled to prevent cheating
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
    setShowDetails(false);
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
        // Calculate streak multiplier
        const streakInfo = getStreakMultiplier(rankedStats.correct);
        const points = Math.round(cardValue * streakInfo.multiplier);
        setRankedScore(prev => prev + points);
        setLastPoints(points);
        setRankedStats(prev => ({
          ...prev,
          correct: prev.correct + 1,
          total: prev.total + 1,
          bestStreak: Math.max(prev.bestStreak, prev.correct + 1),
        }));
      } else {
        const newStreak = streak + 1;
        const points = calculateScore(showInitials, newStreak, selectedDifficulty);
        setStreak(newStreak);
        setBestStreak(prev => Math.max(prev, newStreak));
        setScore(prev => prev + points);
        setLastPoints(points);

        // Streak milestones removed
      }
    } else {
      setResult('incorrect');
      setFeedback('incorrect');
      setRevealed(true);
      setShowUnblurred(true); // Show full card for 2 seconds before auto-advance
      setShowInitials(false);
      if (gameMode === 'ranked') {
        setRankedStats(prev => ({
          ...prev,
          total: prev.total + 1,
          bestStreak: Math.max(prev.bestStreak, prev.correct),
        }));
      } else {
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
    // SKIP is disabled in Ranked mode - player must answer
    if (gameMode === 'ranked') {
      toast.error('No puedes saltar cartas en modo Ranked');
      return;
    }
    
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

  const prevDifficulty = () => {
    const newDiff = selectedDifficulty > 1 ? selectedDifficulty - 1 : 5;
    changeDifficulty(newDiff);
  };

  const nextDifficulty = () => {
    const newDiff = selectedDifficulty < 5 ? selectedDifficulty + 1 : 1;
    changeDifficulty(newDiff);
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
  
  // Dimensions - consistent size for both revealed and unrevealed states
  const displayWidth = 340;
  const displayHeight = isCrypt ? 470 : 320;
  
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
            
            <p className="text-5xl font-bold my-4" style={{ color: 'var(--vtes-blood)' }}>
              {rankedScore}
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--vtes-text-muted)' }}>
              Final Score
            </p>
            
            {/* Stats row */}
            <div className="flex justify-center gap-6 mb-6 text-sm">
              <div className="text-center">
                <p className="font-bold text-lg" style={{ color: 'var(--vtes-text-primary)' }}>
                  {rankedStats.correct}/{rankedStats.total}
                </p>
                <p style={{ color: 'var(--vtes-text-muted)' }}>Correct</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-orange-400">
                  {rankedStats.bestStreak}
                </p>
                <p style={{ color: 'var(--vtes-text-muted)' }}>Best Streak</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg" style={{ color: 'var(--vtes-text-primary)' }}>
                  {rankedStats.total > 0 ? Math.round((rankedStats.correct / rankedStats.total) * 100) : 0}%
                </p>
                <p style={{ color: 'var(--vtes-text-muted)' }}>Accuracy</p>
              </div>
            </div>
            
            {/* Submitted rank display */}
            {submittedRank !== null && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--vtes-bg-tertiary)] border border-[var(--vtes-gold)]">
                <p className="text-sm" style={{ color: 'var(--vtes-text-muted)' }}>Your Rank</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--vtes-gold)' }}>
                  #{submittedRank}
                </p>
              </div>
            )}
            
            {user ? (
              <div className="space-y-3">
                {!submittedRank ? (
                  <>
                    <button
                      onClick={handleSubmitScore}
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--vtes-gold)',
                        color: 'var(--vtes-bg-primary)',
                        border: '2px solid var(--vtes-gold)',
                        fontFamily: 'var(--vtes-font-display)'
                      }}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Score'}
                    </button>
                    <button
                      onClick={handleSkipSubmission}
                      className="w-full py-3 rounded-xl font-semibold transition-all duration-200"
                      style={{
                        backgroundColor: 'var(--vtes-bg-tertiary)',
                        color: 'var(--vtes-text-muted)',
                        border: '1px solid var(--vtes-burgundy-dark)',
                        fontFamily: 'var(--vtes-font-body)'
                      }}
                    >
                      Skip
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/vtes/leaderboard/guess"
                      className="block w-full py-3 rounded-xl font-semibold transition-all duration-200 text-center"
                      style={{
                        backgroundColor: 'var(--vtes-gold)',
                        color: 'var(--vtes-bg-primary)',
                        border: '2px solid var(--vtes-gold)',
                        fontFamily: 'var(--vtes-font-display)'
                      }}
                    >
                      View Leaderboard
                    </Link>
                    <button
                      onClick={resetRankedGame}
                      className="w-full py-3 rounded-xl font-semibold transition-all duration-200"
                      style={{
                        backgroundColor: 'var(--vtes-burgundy)',
                        color: 'var(--vtes-gold)',
                        border: '2px solid var(--vtes-gold)',
                        fontFamily: 'var(--vtes-font-display)'
                      }}
                    >
                      Play Again
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: 'var(--vtes-text-muted)' }}>
                  Sign in to save your score to the leaderboard
                </p>
                <Link
                  href="/login"
                  className="block w-full py-3 rounded-xl font-semibold transition-all duration-200 text-center"
                  style={{
                    backgroundColor: 'var(--vtes-gold)',
                    color: 'var(--vtes-bg-primary)',
                    border: '2px solid var(--vtes-gold)',
                    fontFamily: 'var(--vtes-font-display)'
                  }}
                >
                  Sign In
                </Link>
                <div className="flex gap-3">
                  <button
                    onClick={resetRankedGame}
                    className="flex-1 py-3 rounded-xl font-semibold transition-all duration-200"
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
                    className="flex-1 py-3 rounded-xl font-semibold transition-all duration-200"
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
            )}
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto relative z-10 flex flex-col" style={{ minHeight: 'calc(100dvh - 2rem)' }}>
        {/* Header - Title with Leaderboard button */}
        <div className="text-center mb-2 flex-shrink-0 flex items-center justify-center gap-3">
          <Link
            href="/vtes/leaderboard/guess"
            className="p-2 rounded-lg transition-all duration-200 hover:bg-[var(--vtes-bg-tertiary)]"
            style={{ color: 'var(--vtes-text-muted)' }}
            aria-label="View Leaderboard"
          >
            <Trophy size={20} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{
              fontFamily: 'var(--vtes-font-display)',
              color: 'var(--vtes-text-primary)',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>
              Guess the Card
            </h1>
            <div className="h-0.5 w-12 mx-auto bg-gradient-to-r from-transparent via-[var(--vtes-gold)] to-transparent mt-0.5" />
          </div>
          <div className="w-9" /> {/* Spacer to balance the leaderboard button */}
        </div>

        {/* Segmented Mode Toggle */}
        {gameMode && (
          <div className="flex w-full rounded-xl overflow-hidden mb-3 flex-shrink-0 shadow-lg" style={{ border: '1px solid var(--vtes-burgundy-dark)' }}>
            <button
              onClick={() => {
                if (gameMode !== 'normal') {
                  startNormalGame();
                  const card = pickRandomCard();
                  if (card) {
                    setCurrentCard(card);
                    fetchCardDetails(card.name, card);
                    setupCryptOptions(card);
                  }
                }
              }}
              className={`flex-1 py-3 px-4 text-sm font-bold transition-all duration-300 min-h-[48px] flex items-center justify-center gap-2 ${
                gameMode === 'normal' 
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg' 
                  : 'bg-[var(--vtes-bg-tertiary)] text-slate-400 hover:text-slate-200 hover:bg-[var(--vtes-bg-secondary)]'
              }`}
              style={{
                fontFamily: 'var(--vtes-font-display)',
                boxShadow: gameMode === 'normal' ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              <Play className={`w-4 h-4 ${gameMode === 'normal' ? 'fill-current' : ''}`} />
              CASUAL
            </button>
            <button
              onClick={() => {
                if (gameMode !== 'ranked') {
                  startRankedGame();
                }
              }}
              className={`flex-1 py-3 px-4 text-sm font-bold transition-all duration-300 min-h-[48px] flex items-center justify-center gap-2 ${
                gameMode === 'ranked'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-lg'
                  : 'bg-[var(--vtes-bg-tertiary)] text-slate-400 hover:text-slate-200 hover:bg-[var(--vtes-bg-secondary)]'
              }`}
              style={{
                fontFamily: 'var(--vtes-font-display)',
                boxShadow: gameMode === 'ranked' ? '0 0 20px rgba(245, 158, 11, 0.4)' : 'none'
              }}
            >
              <Trophy className={`w-4 h-4 ${gameMode === 'ranked' ? 'fill-current' : ''}`} />
              RANKED
            </button>
          </div>
        )}

        {/* Score/Streak Display - Enhanced for Ranked with Streak Multiplier */}
        <div className="flex justify-center gap-4 py-2 mb-3 flex-shrink-0">
          {gameMode === 'ranked' ? (
            <>
              <div className="relative group">
                <motion.div 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--vtes-bg-tertiary)] border border-[var(--vtes-gold)]/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="p-1.5 rounded-lg bg-[var(--vtes-gold)]/20">
                    <Target className="w-5 h-5" style={{ color: 'var(--vtes-gold)' }} />
                  </div>
                  <div>
                    <motion.span 
                      key={`ranked-idx-${rankedCardIndex}`}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="text-xl font-bold block"
                      style={{ color: 'var(--vtes-text-primary)' }}
                    >
                      {rankedCardIndex + 1}/20
                    </motion.span>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vtes-text-muted)' }}>Card</span>
                  </div>
                </motion.div>
              </div>
              
              {/* Streak display with multiplier feedback */}
              <div className="relative group">
                <motion.div 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--vtes-gold)]/20 to-[var(--vtes-gold)]/10 border border-[var(--vtes-gold)]/50`}
                  whileHover={{ scale: 1.05 }}
                  style={{ boxShadow: 'var(--glow-gold)' }}
                >
                  <div className="p-1.5 rounded-lg bg-[var(--vtes-gold)]/30">
                    <Sparkles className="w-5 h-5" style={{ color: 'var(--vtes-gold)' }} />
                  </div>
                  <div>
                    <motion.span
                      key={`ranked-streak-${rankedStats.correct}`}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="text-xl font-bold block"
                      style={{ color: 'var(--vtes-text-primary)' }}
                    >
                      {rankedStats.correct}
                    </motion.span>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vtes-text-muted)' }}>Streak</span>
                  </div>
                  
                  {/* Streak multiplier indicator */}
                  {(() => {
                    const streakInfo = getStreakMultiplier(rankedStats.correct);
                    if (streakInfo.multiplier > 1.0) {
                      return (
                        <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${streakInfo.color} bg-[var(--vtes-bg-secondary)] border border-[var(--vtes-gold)]`}>
                          {streakInfo.icon} x{streakInfo.multiplier.toFixed(1)}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </motion.div>
              </div>
              
              <div className="relative group">
                <motion.div 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--vtes-blood)]/20 to-transparent border border-[var(--vtes-blood)]/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="p-1.5 rounded-lg bg-[var(--vtes-blood)]/20">
                    <Crown className="w-5 h-5" style={{ color: 'var(--vtes-blood)' }} />
                  </div>
                  <div>
                    <motion.span
                      key={`ranked-score-${rankedScore}`}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="text-xl font-bold block"
                      style={{ color: 'var(--vtes-gold)' }}
                    >
                      {rankedScore}
                    </motion.span>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vtes-text-muted)' }}>Points</span>
                  </div>
                </motion.div>
              </div>
            </>
          ) : (
            <>
              <motion.div 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--vtes-bg-tertiary)] border border-orange-500/30 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="p-1.5 rounded-lg bg-orange-500/20">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <motion.span
                    key={`streak-${streak}`}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="text-xl font-bold block"
                    style={{ color: 'var(--vtes-text-primary)' }}
                  >
                    {streak}
                  </motion.span>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vtes-text-muted)' }}>Streak</span>
                </div>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--vtes-blood)]/20 to-transparent border border-[var(--vtes-blood)]/30 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="p-1.5 rounded-lg bg-[var(--vtes-blood)]/20">
                  <Crown className="w-5 h-5" style={{ color: 'var(--vtes-blood)' }} />
                </div>
                <div>
                  <motion.span
                    key={`score-${score}`}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="text-xl font-bold block"
                    style={{ color: 'var(--vtes-text-primary)' }}
                  >
                    {score}
                  </motion.span>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vtes-text-muted)' }}>Score</span>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Difficulty selector - Collapsible on mobile */}
        {gameMode === 'normal' && (
          <div className="mb-3 flex-shrink-0">
            {/* Compact difficulty pills */}
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map(d => {
                const info = difficultyLabels[d];
                const isSelected = d === selectedDifficulty;
                return (
                  <button
                    key={d}
                    onClick={() => changeDifficulty(d)}
                    className={`relative px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 min-w-[60px] ${
                      isSelected 
                        ? info.bgColor + ' ' + info.borderColor + ' border' 
                        : 'bg-[var(--vtes-bg-tertiary)] border border-transparent hover:bg-[var(--vtes-bg-secondary)]'
                    }`}
                    style={{
                      color: isSelected ? info.color : 'var(--vtes-text-muted)',
                      fontFamily: 'var(--vtes-font-display)',
                      boxShadow: isSelected ? `0 0 12px var(--vtes-${info.name === 'Staple' ? 'emerald' : info.name === 'Common' ? 'blue' : info.name === 'Uncommon' ? 'yellow' : info.name === 'Rare' ? 'orange' : 'red'}-500/30)` : 'none'
                    }}
                  >
                    <span className="mr-1">{info.icon}</span>
                    {info.name}
                    {isSelected && (
                      <motion.div
                        layoutId="activeDiff"
                        className="absolute inset-0 rounded-full border-2"
                        style={{ borderColor: info.color }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Selected difficulty info */}
            <div className="text-center mt-2">
              <motion.div 
                key={selectedDifficulty}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{ backgroundColor: 'var(--vtes-bg-tertiary)' }}
              >
                <span className="text-sm" style={{ color: diffInfo.color }}>{diffInfo.icon}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--vtes-gold)', fontFamily: 'var(--vtes-font-display)' }}>{diffInfo.name}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs" style={{ color: 'var(--vtes-text-muted)' }}>{diffInfo.description}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-medium" style={{ color: 'var(--vtes-blood)' }}>{filteredCardsCount} cards</span>
              </motion.div>
            </div>
          </div>
        )}

        {/* Card type selector - Normal mode only */}
        {gameMode === 'normal' && (
          <div className="flex gap-2 justify-center mb-3 flex-shrink-0">
            {[
              { type: 'library', icon: <BookOpen className="w-4 h-4" />, label: 'Library' },
              { type: 'crypt', icon: <Skull className="w-4 h-4" />, label: 'Crypt' },
              { type: 'all', icon: <Target className="w-4 h-4" />, label: 'All' }
            ].map(({ type, icon, label }) => {
              const isSelected = cardType === type;
              return (
                <button
                  key={type}
                  onClick={() => { setCardType(type as any); setCurrentCard(null); setShowInitials(false); }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 min-w-[80px] justify-center ${
                    isSelected
                      ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg transform scale-105'
                      : 'bg-[var(--vtes-bg-tertiary)] text-slate-400 hover:text-slate-200 hover:bg-[var(--vtes-bg-secondary)]'
                  }`}
                  style={{
                    fontFamily: 'var(--vtes-font-body)',
                    boxShadow: isSelected ? '0 0 15px rgba(185, 28, 28, 0.4)' : 'none'
                  }}
                >
                  {icon}
                  {label}
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

        {/* Streak milestone toast - Removed */}

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
                className={`relative overflow-hidden rounded-xl shadow-2xl transition-all duration-300 cursor-pointer ${
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

        {/* Card details - shown below card when revealed (REMOVED - no extra info) */}

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
                    {gameMode !== 'ranked' && (
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
                    )}
                  </div>
                </div>
              ) : !isCrypt && libraryOptions.length > 0 ? (
                /* Library: Multiple choice buttons */
                <div className="space-y-3">
                  <p className="text-center text-sm font-medium" style={{ color: 'var(--vtes-text-secondary, #c0bfb8)' }}>What card is this?</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {libraryOptions.map((option, i) => (
                      <motion.button
                        key={i}
                        onClick={() => handleLibraryChoice(option)}
                        whileHover={{ scale: 1.03, borderColor: 'var(--vtes-gold)' }}
                        whileTap={{ scale: 0.97 }}
                        className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left"
                        style={{
                          backgroundColor: 'var(--vtes-bg-tertiary)',
                          color: 'var(--vtes-text-primary)',
                          border: '2px solid var(--vtes-burgundy-dark)',
                          fontFamily: 'var(--vtes-font-body)',
                          boxShadow: 'none'
                        }}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex justify-center mt-3">
                    {gameMode !== 'ranked' && (
                      <motion.button
                        onClick={skipCard}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-xs px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 hover:opacity-80"
                        style={{
                          backgroundColor: 'var(--vtes-bg-tertiary)',
                          color: 'var(--vtes-text-dim)',
                          border: '1px solid var(--vtes-burgundy-dark)',
                          fontFamily: 'var(--vtes-font-body)'
                        }}
                      >
                        <SkipForward className="w-3 h-3" />
                        SKIP
                      </motion.button>
                    )}
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
                    <motion.button
                      onClick={checkGuess}
                      disabled={!guess.trim()}
                      whileHover={guess.trim() ? { scale: 1.02 } : {}}
                      whileTap={guess.trim() ? { scale: 0.98 } : {}}
                      className="flex-1 py-3 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                      style={{
                        backgroundColor: guess.trim() ? 'var(--vtes-burgundy)' : 'var(--vtes-bg-tertiary)',
                        color: guess.trim() ? 'var(--vtes-gold)' : 'var(--vtes-text-dim)',
                        border: `2px solid ${guess.trim() ? 'var(--vtes-gold)' : 'var(--vtes-burgundy-dark)'}`,
                        boxShadow: guess.trim() ? '0 0 20px rgba(212, 175, 55, 0.3)' : 'none',
                        cursor: guess.trim() ? 'pointer' : 'not-allowed',
                        fontFamily: 'var(--vtes-font-display)',
                        fontSize: '14px',
                        letterSpacing: '0.05em'
                      }}
                    >
                      <Send className="w-4 h-4" />
                      SEND
                    </motion.button>
                    {gameMode !== 'ranked' && (
                      <motion.button
                        onClick={skipCard}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5"
                        style={{
                          backgroundColor: 'var(--vtes-bg-secondary)',
                          color: 'var(--vtes-text-muted)',
                          border: '1px solid var(--vtes-burgundy-dark)',
                          fontFamily: 'var(--vtes-font-body)'
                        }}
                      >
                        <SkipForward className="w-4 h-4" />
                        SKIP
                      </motion.button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* After choice made - show result */}
          {(revealed || choiceMade) && result === 'incorrect' ? (
            /* INCORRECT: Simplified with expandable details */
            <div className="flex flex-col items-center gap-3 w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-lg font-bold flex items-center gap-2"
                style={{ color: '#ef4444' }}
              >
                <span className="text-xl">✗</span> INCORRECT
              </motion.div>

              <p className="text-xl font-semibold" style={{ color: 'var(--vtes-text-primary)' }}>{currentCard.name}</p>

              {cardDetails?.type && (
                <p className="text-sm" style={{ color: 'var(--vtes-text-muted)' }}>{cardDetails.type}</p>
              )}

              <motion.button
                onClick={nextCard}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 mt-2 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg shadow-lg"
                style={{
                  backgroundColor: 'var(--vtes-burgundy)',
                  color: 'var(--vtes-gold)',
                  border: '2px solid var(--vtes-gold)',
                  fontFamily: 'var(--vtes-font-display)',
                  boxShadow: '0 0 25px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <SkipForward className="w-5 h-5" />
                NEXT
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              {cardDetails && (cardDetails.artists?.length || currentCard.count > 0) && (
                <>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs flex items-center gap-1 mt-1 transition-all duration-200 hover:opacity-80"
                    style={{ color: 'var(--vtes-text-muted)' }}
                  >
                    <Info size={14} />
                    {showDetails ? 'Hide' : 'Show'} Details
                  </button>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-center space-y-0.5"
                      style={{ color: 'var(--vtes-text-dim)' }}
                    >
                      {cardDetails.artists && cardDetails.artists.length > 0 && (
                        <p>Art by {cardDetails.artists.join(', ')}</p>
                      )}
                      {currentCard.count > 0 && (
                        <p>Used in {currentCard.count.toLocaleString()} TWDA decks</p>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </div>
          ) : result === 'skipped' ? (
            /* SKIPPED: Same simplified structure */
            <div className="flex flex-col items-center gap-3 w-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold flex items-center gap-2"
                style={{ color: 'var(--vtes-text-muted)' }}
              >
                <SkipForward className="w-4 h-4" /> SKIPPED
              </motion.div>

              <p className="text-xl font-semibold" style={{ color: 'var(--vtes-text-primary)' }}>{currentCard.name}</p>

              {cardDetails?.type && (
                <p className="text-sm" style={{ color: 'var(--vtes-text-muted)' }}>{cardDetails.type}</p>
              )}

              <motion.button
                onClick={nextCard}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 mt-2 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg shadow-lg"
                style={{
                  backgroundColor: 'var(--vtes-burgundy)',
                  color: 'var(--vtes-gold)',
                  border: '2px solid var(--vtes-gold)',
                  fontFamily: 'var(--vtes-font-display)',
                  boxShadow: '0 0 25px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <SkipForward className="w-5 h-5" />
                NEXT
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              {cardDetails && (cardDetails.artists?.length || currentCard.count > 0) && (
                <>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs flex items-center gap-1 mt-1 transition-all duration-200 hover:opacity-80"
                    style={{ color: 'var(--vtes-text-muted)' }}
                  >
                    <Info size={14} />
                    {showDetails ? 'Hide' : 'Show'} Details
                  </button>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-center space-y-0.5"
                      style={{ color: 'var(--vtes-text-dim)' }}
                    >
                      {cardDetails.artists && cardDetails.artists.length > 0 && (
                        <p>Art by {cardDetails.artists.join(', ')}</p>
                      )}
                      {currentCard.count > 0 && (
                        <p>Used in {currentCard.count.toLocaleString()} TWDA decks</p>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </div>
          ) : null
          /* Note: Correct answer auto-advances, no additional UI needed */
          }
        </div>

        {/* Stats footer - Enhanced card styling */}
        <motion.div 
          className="mt-4 p-3 rounded-xl flex-shrink-0 border"
          style={{
            backgroundColor: 'rgba(30, 30, 40, 0.7)',
            borderColor: 'var(--vtes-burgundy-dark)',
            backdropFilter: 'blur(10px)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-around text-center">
            <div className="flex flex-col items-center">
              <div className="p-1.5 rounded-lg bg-slate-800/50 mb-1">
                <span className="text-sm font-bold" style={{ color: 'var(--vtes-text-primary)' }}>{totalPlayed}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vtes-text-dim)' }}>Played</span>
            </div>
            <div className="w-px bg-slate-700/50" />
            <div className="flex flex-col items-center">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 mb-1">
                <span className="text-sm font-bold" style={{ color: 'var(--vtes-emerald-400)' }}>{totalCorrect}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vtes-text-dim)' }}>Correct</span>
            </div>
            <div className="w-px bg-slate-700/50" />
            <div className="flex flex-col items-center">
              <div className="p-1.5 rounded-lg bg-[var(--vtes-gold)]/10 mb-1">
                <span className="text-sm font-bold" style={{ color: 'var(--vtes-gold)' }}>
                  {totalPlayed > 0 ? Math.round((totalCorrect / totalPlayed) * 100) : 0}%
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vtes-text-dim)' }}>Accuracy</span>
            </div>
            <div className="w-px bg-slate-700/50" />
            <div className="flex flex-col items-center">
              <div className="p-1.5 rounded-lg bg-orange-500/10 mb-1">
                <span className="text-sm font-bold" style={{ color: 'var(--vtes-orange-400)' }}>{bestStreak}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vtes-text-dim)' }}>Best</span>
            </div>
          </div>
        </motion.div>

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
