'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Hud, CardStage, GameControls, SettingsModal } from '@/components/vtes/guess';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useVtesGuessLeaderboard } from '@/hooks/useVtesGuessLeaderboard';
import {
  calculateScore,
  displayName,
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

const AUTO_ADVANCE_DELAY = 1500; // 1500ms for correct answers (slower auto-advance)
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
  const [, setShowUnblurred] = useState(false); // For incorrect/skipped - shows full HD card
  const [, setGuess] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | 'skipped' | null>(null);
  const [showLargeCard, setShowLargeCard] = useState(false);
  const [, setAutoAdvanceProgress] = useState(0);
  const [showInitials, setShowInitials] = useState(false);

  // Mobile detection - for tap to preview (kept for useEffect compatibility)
  const [, setIsMobile] = useState(false);

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

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Animation state
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [cardKey, setCardKey] = useState(0); // For AnimatePresence transitions
  const [, setStreakMilestone] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stats
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [, setLastPoints] = useState(0);

  // Ranked Mode State
  const [gameMode, setGameMode] = useState<'normal' | 'ranked' | null>('normal');
  const [rankedPlaylist, setRankedPlaylist] = useState<GameCardData[]>([]);
  const [rankedCardIndex, setRankedCardIndex] = useState(0);
  const [rankedScore, setRankedScore] = useState(0);
  const [showFinalScore, setShowFinalScore] = useState(false);
  
  // Ranked stats tracking
  const [rankedStats, setRankedStats] = useState({ correct: 0, total: 0, bestStreak: 0 });
  
  // Leaderboard state
  const { user } = useCurrentUser();
  const { submitScore } = useVtesGuessLeaderboard();
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

  // Handler for game mode change from settings modal
  const handleGameModeChange = useCallback((mode: 'normal' | 'ranked') => {
    if (mode === 'ranked') {
      startRankedGame();
    } else {
      startNormalGame();
      const card = pickRandomCard();
      if (card) {
        setCurrentCard(card);
        fetchCardDetails(card.name, card);
      }
    }
    setIsSettingsOpen(false);
  }, [startRankedGame, startNormalGame, pickRandomCard, fetchCardDetails]);

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
      fetchCardDetailsForPreload(card.name);
    });
  }, [gameData, cardType, selectedDifficulty, currentCard, getImageUrl]);
  
  // Fetch card details for preloading (without setting state)
  const fetchCardDetailsForPreload = useCallback(async (cardName: string) => {
    try {
      const response = await fetch(`https://api.krcg.org/card/${encodeURIComponent(cardName)}`);
      if (response.ok) {
        await response.json(); // Just cache this data, don't update state
      }
    } catch {
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
        fetchCardDetailsForPreload(card.name);
      }, index * 100); // 100ms delay between each card
    });
  }, [preFetchCardImage, fetchCardDetailsForPreload]);

  // Trigger preloading when card is revealed (normal mode only)
  useEffect(() => {
    if (revealed && gameMode === 'normal') {
      preloadNextCards(2);
    }
  }, [revealed, gameMode, preloadNextCards]);

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

    setRevealed(true); // Must set revealed for GameControls to show skipped screen
    setResult('skipped');
    setShowUnblurred(true); // REVEAL card in full HD
    setStreak(0);
    setTotalPlayed(prev => prev + 1);
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

  const isCrypt = currentCard.capacity !== undefined;

  // For revealed state, use the KRCG direct URL from API (correct slug)
  const imageUrl = getImageUrl(currentCard);
  const revealedImageUrl = cardDetails?.imageUrl || imageUrl;

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

      {/* HUD - Top bar with score/streak/settings */}
      {gameMode && (
        <Hud
          score={score}
          streak={streak}
          gameMode={gameMode}
          rankedCardIndex={rankedCardIndex}
          rankedScore={rankedScore}
          rankedStreak={rankedStats.correct}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Card Stage - Main card display area */}
      <CardStage
        card={currentCard}
        cardDetails={cardDetails}
        revealed={revealed}
        feedback={feedback}
        cardKey={cardKey}
        getImageUrl={getImageUrl}
      />

      {/* Game Controls - Answer buttons and result display */}
      <GameControls
        isCrypt={isCrypt}
        cryptOptions={cryptOptions}
        libraryOptions={libraryOptions}
        gameMode={gameMode || 'normal'}
        onCryptChoice={handleCryptChoice}
        onLibraryChoice={handleLibraryChoice}
        onSkip={skipCard}
        revealed={revealed}
        result={result}
        currentCardName={currentCard?.name || ''}
        cardDetailsType={cardDetails?.type}
        onNextCard={nextCard}
        showDetails={showDetails}
        toggleDetails={() => setShowDetails(!showDetails)}
        cardDetails={cardDetails ? { artists: cardDetails.artists } : undefined}
        cardCount={currentCard?.count}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={changeDifficulty}
        cardType={cardType}
        onCardTypeChange={setCardType}
        gameMode={gameMode || 'normal'}
        onGameModeChange={handleGameModeChange}
        totalCards={getFilteredCards().length}
      />

      {/* KRCG Credit */}
      <div className="text-center py-2 flex-shrink-0">
        <p className="text-[9px]" style={{ color: 'var(--vtes-text-dim)' }}>Images: KRCG.org</p>
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
