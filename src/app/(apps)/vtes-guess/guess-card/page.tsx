'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Hud, CardStage, GameControls, SettingsModal } from '@/components/vtes/guess';
import DifficultyTabs from '@/components/vtes/guess/DifficultyTabs';
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
import {
  trackGameStart,
  trackModeSelect,
} from '@/lib/analytics';

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
const RANKED_TIMER_DURATION = 10000; // 10 seconds for ranked mode timer
const PENDING_RANKED_RESULTS_KEY = 'vtes-guess-pending-ranked';

// Interface for pending ranked results (saved before login)
interface PendingRankedResults {
  score: number;
  stats: { correct: number; total: number; currentStreak: number; bestStreak: number };
  results: ('correct' | 'incorrect' | 'timeout')[];
}

// Save pending ranked results to sessionStorage before login
function savePendingRankedResults(data: PendingRankedResults): void {
  try {
    sessionStorage.setItem(PENDING_RANKED_RESULTS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving pending ranked results:', e);
  }
}

// Load pending ranked results (optionally clear after reading)
function loadPendingRankedResults(clear: boolean = false): PendingRankedResults | null {
  try {
    const stored = sessionStorage.getItem(PENDING_RANKED_RESULTS_KEY);
    if (stored) {
      if (clear) {
        sessionStorage.removeItem(PENDING_RANKED_RESULTS_KEY);
      }
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading pending ranked results:', e);
  }
  return null;
}

// Clear pending ranked results (call after successful submission)
function clearPendingRankedResults(): void {
  try {
    sessionStorage.removeItem(PENDING_RANKED_RESULTS_KEY);
  } catch (e) {
    console.error('Error clearing pending ranked results:', e);
  }
}

// Generate share text for ranked results
const generateShareText = (
  score: number,
  bestStreak: number,
  results: ('correct' | 'incorrect' | 'timeout')[]
): string => {
  // Convert results to emojis: 🟩 = correct, 🟥 = incorrect, 🟨 = timeout
  const emojiMap = {
    correct: '🟩',
    incorrect: '🟥',
    timeout: '🟨',
  };
  const emojiGrid = results.map(r => emojiMap[r]).join('');

  return `🧛 CRUSADE - Ranked Score: ${score}
🔥 Max Streak: ${bestStreak}
${emojiGrid}
Play at: https://praxis-seizure.vercel.app/vtes-guess`;
};

// Smart share: native share on mobile, clipboard on desktop
const handleShare = async (shareText: string): Promise<void> => {
  // Check if Web Share API is available AND we're on HTTPS (required for share)
  const canUseWebShare = typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && typeof window !== 'undefined'
    && window.location.protocol === 'https:';

  if (canUseWebShare) {
    try {
      await navigator.share({
        title: 'CRUSADE Results',
        text: shareText,
      });
      // If share succeeds, we're done (no toast needed - OS shows feedback)
      return;
    } catch (err) {
      const error = err as Error;
      // User cancelled share - that's fine, no fallback needed
      if (error.name === 'AbortError') return;
      // NotAllowedError = not triggered by user gesture, fall through to clipboard
      // Other errors = also fall through to clipboard
      console.log('Web Share failed, falling back to clipboard:', error.message);
    }
  }

  // Fallback: copy to clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareText);
    } else {
      // Legacy fallback for HTTP or older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    toast.success('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    toast.error('Failed to copy to clipboard');
  }
};

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

function GuessCardContent() {
  // Read mode from URL query parameter
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlMode = searchParams.get('mode') as 'normal' | 'ranked' | null;

  // Game data
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(1);
  const [cardType, setCardType] = useState<'library' | 'crypt' | 'all'>('library');
  const [includeImbued, setIncludeImbued] = useState<boolean>(true);

  // Load includeImbued from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vtes-guess-include-imbued');
    if (saved !== null) {
      setIncludeImbued(saved === 'true');
    }
  }, []);

  // Current card
  const [currentCard, setCurrentCard] = useState<GameCardData | null>(null);
  const [cardDetails, setCardDetails] = useState<GameCardDetails | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [, setShowUnblurred] = useState(false); // For incorrect/skipped - shows full HD card

  // Casual mode: preloaded queue of upcoming cards (5 cards ahead)
  const [casualQueue, setCasualQueue] = useState<GameCardData[]>([]);
  const [, setGuess] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | 'skipped' | 'timeout' | null>(null);
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
  const [lastPoints, setLastPoints] = useState(0);

  // Ranked Mode State - initialize from URL param if present
  const [gameMode, setGameMode] = useState<'normal' | 'ranked' | null>(urlMode || 'normal');
  const [initialModeApplied, setInitialModeApplied] = useState(false);
  const [rankedPlaylist, setRankedPlaylist] = useState<GameCardData[]>([]);
  const [rankedCardIndex, setRankedCardIndex] = useState(0);
  const [rankedScore, setRankedScore] = useState(0);
  const [showFinalScore, setShowFinalScore] = useState(false);
  
  // Ranked stats tracking
  const [rankedStats, setRankedStats] = useState({ correct: 0, total: 0, currentStreak: 0, bestStreak: 0 });

  // Track per-card results for share feature
  const [rankedResults, setRankedResults] = useState<('correct' | 'incorrect' | 'timeout')[]>([]);
  
  // Leaderboard state
  const { user } = useCurrentUser();
  const { submitScore } = useVtesGuessLeaderboard();
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userHighScore, setUserHighScore] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [leaderboardChecked, setLeaderboardChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ranked mode timer
  const [timerProgress, setTimerProgress] = useState(100); // 100% = full, 0% = timeout
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartRef = useRef<number | null>(null);

  // First card loading state for ranked mode
  const [firstCardLoading, setFirstCardLoading] = useState(false);

  // Ranked mode ready state - shows "Enter Gehenna" overlay until clicked
  const [rankedReady, setRankedReady] = useState(false);

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

  // Check for pending ranked results after OAuth login redirect
  // Also handle debug mode: ?debug=endgame&score=500&streak=10 to skip to final score
  useEffect(() => {
    const debugMode = searchParams.get('debug');
    if (debugMode === 'endgame') {
      // Parse optional params: score, streak, correct
      const customScore = parseInt(searchParams.get('score') || '280', 10);
      const customStreak = parseInt(searchParams.get('streak') || '6', 10);
      const customCorrect = parseInt(searchParams.get('correct') || '15', 10);

      // Generate mock results based on correct count
      const mockResults: ('correct' | 'incorrect' | 'timeout')[] = [];
      for (let i = 0; i < 20; i++) {
        if (i < customCorrect) {
          mockResults.push('correct');
        } else if (i < customCorrect + 2) {
          mockResults.push('timeout');
        } else {
          mockResults.push('incorrect');
        }
      }
      // Shuffle to make it look realistic
      for (let i = mockResults.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mockResults[i], mockResults[j]] = [mockResults[j], mockResults[i]];
      }

      setRankedScore(customScore);
      setRankedStats({ correct: customCorrect, total: 20, currentStreak: 0, bestStreak: customStreak });
      setRankedResults(mockResults);
      setGameMode('ranked');
      setShowFinalScore(true);
      return;
    }

    const pendingResults = loadPendingRankedResults();
    if (pendingResults) {
      // Restore the saved ranked game state
      setRankedScore(pendingResults.score);
      setRankedStats(pendingResults.stats);
      setRankedResults(pendingResults.results);
      setGameMode('ranked');
      setShowFinalScore(true);
    }
  }, [searchParams]);

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

  const startRankedGame = useCallback(async () => {
    if (!gameData) return;

    // Track game start
    trackGameStart({ mode: 'ranked' });

    // Reset game state from previous mode (casual)
    setRevealed(false);
    setResult(null);
    setChoiceMade(false);
    setFeedback(null);
    setGuess('');
    setCardDetails(null);

    // Show loading state
    setFirstCardLoading(true);

    const playlist = generateRankedPlaylist(gameData);
    setRankedPlaylist(playlist);
    setRankedCardIndex(0);
    setRankedScore(0);
    setRankedStats({ correct: 0, total: 0, currentStreak: 0, bestStreak: 0 }); // Reset stats
    setRankedResults([]); // Reset per-card results
    setShowFinalScore(false);
    setRankedReady(false); // Show "Enter Gehenna" overlay
    setGameMode('ranked');

    if (playlist[0]) {
      // Preload first card image before showing
      const firstCardImageUrl = `/api/vtes/card-image?id=${playlist[0].id}`;
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve even on error to not block
        img.src = firstCardImageUrl;
      });

      setCurrentCard(playlist[0]);
      fetchCardDetails(playlist[0].name, playlist[0]);
    }

    setFirstCardLoading(false);

    // Pre-fetch remaining card images for smooth ranked gameplay
    preFetchRankedImages(playlist);
  }, [gameData, generateRankedPlaylist, fetchCardDetails]);

  // Apply URL mode parameter when game data is loaded
  useEffect(() => {
    if (gameData && urlMode === 'ranked' && !initialModeApplied) {
      setInitialModeApplied(true);
      startRankedGame();
    }
  }, [gameData, urlMode, initialModeApplied, startRankedGame]);

  const resetRankedGame = useCallback(() => {
    startRankedGame();
    setRevealed(false);
    setGuess('');
    setResult(null);
    setShowInitials(false);
    setUserRank(null);
    setUserHighScore(null);
    setIsNewRecord(false);
    setLeaderboardChecked(false);
    setIsSubmitting(false);
  }, [startRankedGame]);

  // Auto-check and submit score when game ends
  useEffect(() => {
    if (!showFinalScore || !user || leaderboardChecked || isSubmitting) return;

    const checkAndSubmitScore = async () => {
      setIsSubmitting(true);

      const result = await submitScore({
        score: rankedScore,
        mode: 'ranked',
        cardsPlayed: rankedStats.total,
        cardsCorrect: rankedStats.correct,
        bestStreak: rankedStats.bestStreak,
      });

      if (result) {
        setUserRank(result.rank);
        setUserHighScore(result.highScore);
        setIsNewRecord(result.isNewRecord);
        setLeaderboardChecked(true);

        // Clear pending results after successful submission
        clearPendingRankedResults();

        if (result.isNewRecord) {
          // New personal best - trigger confetti!
          triggerBloodBurst();
          toast.success(`New Personal Best!`);
        }
      }

      setIsSubmitting(false);
    };

    checkAndSubmitScore();
  }, [showFinalScore, user, leaderboardChecked, isSubmitting, rankedScore, rankedStats, submitScore]);


  const startNormalGame = useCallback(() => {
    // Track game start
    trackGameStart({ mode: 'normal', difficulty: 1, cardType: 'library' });

    // Reset game state from previous mode (ranked)
    setRevealed(false);
    setResult(null);
    setChoiceMade(false);
    setFeedback(null);
    setGuess('');
    setCardDetails(null);
    setCurrentCard(null); // Will trigger the effect to pick a new card

    setGameMode('normal');
    setShowFinalScore(false);
    setSelectedDifficulty(1);
    setCardType('library');
  }, []);

  // Handler for game mode change from settings modal
  const handleGameModeChange = useCallback((mode: 'normal' | 'ranked') => {
    // Track mode selection
    trackModeSelect({ mode, source: 'settings' });

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

  // Ranked mode timer - starts when card is shown, stops on answer/timeout
  useEffect(() => {
    // Only run timer in ranked mode when actively playing (not on final score screen, and player is ready)
    if (gameMode !== 'ranked' || revealed || !currentCard || choiceMade || showFinalScore || !rankedReady) {
      // Clear timer when not needed
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start the timer
    timerStartRef.current = Date.now();
    setTimerProgress(100);

    timerRef.current = setInterval(() => {
      if (!timerStartRef.current) return;

      const elapsed = Date.now() - timerStartRef.current;
      const remaining = Math.max(0, 100 - (elapsed / RANKED_TIMER_DURATION) * 100);
      setTimerProgress(remaining);

      // Time's up!
      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Trigger timeout
        setChoiceMade(true);
        setResult('timeout');
        setFeedback('incorrect');
        setRevealed(true);
        setShowUnblurred(true);
        setRankedStats(prev => ({
          ...prev,
          total: prev.total + 1,
          currentStreak: 0, // Reset streak on timeout
          bestStreak: Math.max(prev.bestStreak, prev.currentStreak),
        }));
        setRankedResults(prev => [...prev, 'timeout']);
        setTotalPlayed(prev => prev + 1);
        // Clear feedback after animation
        setTimeout(() => setFeedback(null), 600);
      }
    }, 50); // Update every 50ms for smooth animation

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameMode, revealed, currentCard, choiceMade, showFinalScore, rankedReady]);

  // Helper: get cards for specific difficulty/type settings
  const getCardsForSettings = useCallback((difficulty: number, type: 'library' | 'crypt' | 'all'): GameCardData[] => {
    if (!gameData) return [];
    let cards: GameCardData[] = [];
    if (type === 'crypt' || type === 'all') {
      let cryptCards = gameData.crypt.filter(c => c.difficulty === difficulty);
      // Filter out Imbued if disabled
      if (!includeImbued) {
        cryptCards = cryptCards.filter(c => !c.types?.includes('Imbued'));
      }
      cards = [...cards, ...cryptCards];
    }
    if (type === 'library' || type === 'all') {
      let libraryCards = gameData.library.filter(c => c.difficulty === difficulty);
      // Filter out Imbued-only cards (Conviction, Power) if disabled
      if (!includeImbued) {
        libraryCards = libraryCards.filter(c =>
          !c.types?.includes('Conviction') && !c.types?.includes('Power')
        );
      }
      cards = [...cards, ...libraryCards];
    }
    return cards;
  }, [gameData, includeImbued]);

  // Helper: pick N random cards from pool, excluding certain IDs
  const pickRandomCards = useCallback((pool: GameCardData[], count: number, excludeIds: Set<number>): GameCardData[] => {
    const available = pool.filter(c => !excludeIds.has(c.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }, []);

  // Fill casual queue with preloaded cards
  const fillCasualQueue = useCallback((difficulty: number, type: 'library' | 'crypt' | 'all', currentCardId?: number) => {
    const pool = getCardsForSettings(difficulty, type);
    const excludeIds = new Set(currentCardId ? [currentCardId] : []);
    const newCards = pickRandomCards(pool, 5, excludeIds);

    // Preload all images
    newCards.forEach(card => {
      const img = new Image();
      img.src = getImageUrl(card);
    });

    setCasualQueue(newCards);
  }, [getCardsForSettings, pickRandomCards, getImageUrl]);

  // Add one card to the end of casual queue
  const addToCasualQueue = useCallback(() => {
    const pool = getCardsForSettings(selectedDifficulty, cardType);
    const usedIds = new Set([currentCard?.id, ...casualQueue.map(c => c.id)].filter((id): id is number => id !== undefined));
    const newCards = pickRandomCards(pool, 1, usedIds);

    if (newCards.length > 0) {
      // Preload image
      const img = new Image();
      img.src = getImageUrl(newCards[0]);
      setCasualQueue(prev => [...prev, newCards[0]]);
    }
  }, [getCardsForSettings, selectedDifficulty, cardType, currentCard, casualQueue, pickRandomCards, getImageUrl]);

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
      }, index * 100); // 100ms delay between each card
    });
  }, [preFetchCardImage]);

  // Add card to queue when current card is revealed (normal mode only)
  useEffect(() => {
    if (revealed && gameMode === 'normal') {
      addToCasualQueue();
    }
  }, [revealed, gameMode, addToCasualQueue]);

  // Start game - pick first card and fill queue
  useEffect(() => {
    if (gameData && !currentCard && gameMode === 'normal') {
      const card = pickRandomCard();
      if (card) {
        setCurrentCard(card);
        fetchCardDetails(card.name, card);
        // Fill queue with preloaded cards
        fillCasualQueue(selectedDifficulty, cardType, card.id);
      }
    }
  }, [gameData, currentCard, gameMode, pickRandomCard, fetchCardDetails, fillCasualQueue, selectedDifficulty, cardType]);

  const nextCard = useCallback(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerProgress(100); // Reset timer for next card

    if (gameMode === 'ranked') {
      const nextIndex = rankedCardIndex + 1;
      if (nextIndex < rankedPlaylist.length) {
        const card = rankedPlaylist[nextIndex];
        setRankedCardIndex(nextIndex);
        setCurrentCard(card);
        setCardDetails(null);
        fetchCardDetails(card.name, card);
      } else if (nextIndex === rankedPlaylist.length) {
        setShowFinalScore(true);
      }
    } else {
      // Use card from queue if available (instant transition), otherwise pick random
      if (casualQueue.length > 0) {
        const [nextCard, ...rest] = casualQueue;
        setCasualQueue(rest);
        setCurrentCard(nextCard);
        setCardDetails(null);
        fetchCardDetails(nextCard.name, nextCard);
      } else {
        // Fallback to random pick if queue is empty
        const card = pickRandomCard();
        if (card) {
          setCurrentCard(card);
          setCardDetails(null);
          fetchCardDetails(card.name, card);
        }
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
  }, [gameMode, rankedCardIndex, rankedPlaylist, pickRandomCard, fetchCardDetails, casualQueue]);

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
        // Calculate streak multiplier based on current streak
        const streakInfo = getStreakMultiplier(rankedStats.currentStreak);
        const points = Math.round(cardValue * streakInfo.multiplier);
        setRankedScore(prev => prev + points);
        setLastPoints(points);
        const newStreak = rankedStats.currentStreak + 1;
        setRankedStats(prev => ({
          ...prev,
          correct: prev.correct + 1,
          total: prev.total + 1,
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
        }));
        setRankedResults(prev => [...prev, 'correct']);
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
          currentStreak: 0, // Reset streak on incorrect
          bestStreak: Math.max(prev.bestStreak, prev.currentStreak),
        }));
        setRankedResults(prev => [...prev, 'incorrect']);
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

    setRevealed(true);
    setResult('skipped');
    setShowUnblurred(true); // REVEAL card in full HD
    setStreak(0);
    setTotalPlayed(prev => prev + 1);

    // Start preloading next card immediately
    addToCasualQueue();

    // Auto-advance after brief delay to show the skipped card
    setTimeout(() => {
      nextCard();
    }, 800);
  };

  const changeDifficulty = useCallback((diff: number) => {
    if (!gameData) return;

    // Clear any pending auto-advance timers
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    // Get cards for the new difficulty
    const cards = getCardsForSettings(diff, cardType);
    if (cards.length === 0) return;

    // Pick a random card and preload its image
    const newCard = cards[Math.floor(Math.random() * cards.length)];
    const img = new Image();
    img.src = getImageUrl(newCard);

    // Update state with new card directly (no null transition)
    setSelectedDifficulty(diff);
    setCurrentCard(newCard);
    setCardDetails(null);
    fetchCardDetails(newCard.name, newCard);
    setRevealed(false);
    setGuess('');
    setResult(null);
    setChoiceMade(false);
    setFeedback(null);
    setCardKey(prev => prev + 1);

    // Fill queue with preloaded cards for the new difficulty
    fillCasualQueue(diff, cardType, newCard.id);
  }, [gameData, cardType, getImageUrl, fetchCardDetails, getCardsForSettings, fillCasualQueue]);

  // Handler for card type change from settings modal
  const handleCardTypeChange = useCallback((newType: 'library' | 'crypt' | 'all') => {
    if (!gameData) return;

    // Clear any pending auto-advance timers
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    // Get cards for the new card type
    const cards = getCardsForSettings(selectedDifficulty, newType);
    if (cards.length === 0) return;

    // Pick a random card and preload its image
    const newCard = cards[Math.floor(Math.random() * cards.length)];
    const img = new Image();
    img.src = getImageUrl(newCard);

    // Update state with new card directly (no null transition)
    setCardType(newType);
    setCurrentCard(newCard);
    setCardDetails(null);
    fetchCardDetails(newCard.name, newCard);
    setRevealed(false);
    setGuess('');
    setResult(null);
    setChoiceMade(false);
    setFeedback(null);
    setCardKey(prev => prev + 1);

    // Fill queue with preloaded cards for the new card type
    fillCasualQueue(selectedDifficulty, newType, newCard.id);
  }, [gameData, selectedDifficulty, getImageUrl, fetchCardDetails, getCardsForSettings, fillCasualQueue]);

  if (loading || firstCardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(to bottom, var(--vtes-bg-primary) 0%, var(--vtes-bg-secondary) 100%)'
      }}>
        <div className="text-white text-xl">{firstCardLoading ? 'Preparing ranked game...' : 'Loading card database...'}</div>
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
    <div className="h-dvh w-full flex flex-col relative overflow-hidden overscroll-none" style={{
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

      {/* Ranked Mode - Enter Gehenna Overlay */}
      {gameMode === 'ranked' && !rankedReady && !showFinalScore && currentCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom, var(--vtes-bg-primary) 0%, var(--vtes-bg-secondary) 100%)' }}>
          <div className="text-center">
            <div className="text-6xl mb-6">🔥</div>
            <h2 className="text-2xl font-bold mb-2" style={{
              fontFamily: 'var(--vtes-font-display)',
              color: 'var(--vtes-gold)'
            }}>
              GEHENNA
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--vtes-text-muted)' }}>
              20 cards • 10 seconds each • Ramping difficulty
            </p>
            <button
              onClick={() => setRankedReady(true)}
              className="px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--vtes-gold)',
                color: 'var(--vtes-bg-primary)',
                fontFamily: 'var(--vtes-font-display)',
                boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
              }}
            >
              Enter Gehenna
            </button>

            {/* Debug: Skip to end with random score */}
            <button
              onClick={() => {
                const randomScore = Math.floor(Math.random() * 300) + 100;
                const randomCorrect = Math.floor(Math.random() * 15) + 5;
                const randomStreak = Math.floor(Math.random() * 10) + 1;
                const mockResults: ('correct' | 'incorrect' | 'timeout')[] = [];
                for (let i = 0; i < 20; i++) {
                  if (i < randomCorrect) mockResults.push('correct');
                  else if (i < randomCorrect + 2) mockResults.push('timeout');
                  else mockResults.push('incorrect');
                }
                // Shuffle
                for (let i = mockResults.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [mockResults[i], mockResults[j]] = [mockResults[j], mockResults[i]];
                }
                setRankedScore(randomScore);
                setRankedStats({ correct: randomCorrect, total: 20, currentStreak: 0, bestStreak: randomStreak });
                setRankedResults(mockResults);
                setShowFinalScore(true);
              }}
              className="mt-6 text-xs opacity-30 hover:opacity-60 transition-opacity"
              style={{ color: 'var(--vtes-text-muted)' }}
            >
              [Debug: Skip to End]
            </button>
          </div>
        </div>
      )}

      {/* Ranked Game Completion */}
      {showFinalScore && gameMode === 'ranked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)' }}>
          <div className="max-w-md w-full p-8 rounded-2xl border-2 text-center" style={{
            backgroundColor: 'var(--vtes-bg-secondary)',
            borderColor: isNewRecord ? '#22c55e' : 'var(--vtes-gold)',
            boxShadow: isNewRecord ? '0 0 30px rgba(34, 197, 94, 0.3)' : 'var(--glow-gold)'
          }}>
            {/* Title - changes based on new record */}
            <h2 className="text-3xl font-bold mb-2" style={{
              fontFamily: 'var(--vtes-font-display)',
              color: isNewRecord ? '#22c55e' : 'var(--vtes-gold)'
            }}>
              {isNewRecord ? '🎉 NEW RECORD!' : 'Ranked Complete!'}
            </h2>

            <p className="text-5xl font-bold my-4" style={{ color: isNewRecord ? '#22c55e' : 'var(--vtes-blood)' }}>
              {rankedScore}
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--vtes-text-muted)' }}>
              {isNewRecord ? 'New Personal Best!' : `High Score: ${userHighScore ?? '...'}`}
            </p>

            {/* Stats row */}
            <div className="flex justify-center gap-6 mb-4 text-sm">
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

            {/* Results grid */}
            <div className="flex justify-center gap-0.5 mb-4 flex-wrap max-w-[280px] mx-auto">
              {rankedResults.map((result, i) => (
                <span key={i} className="text-lg">
                  {result === 'correct' ? '🟩' : result === 'timeout' ? '🟨' : '🟥'}
                </span>
              ))}
            </div>

            {/* Rank display - always show if logged in and checked */}
            {user && leaderboardChecked && userRank !== null && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--vtes-bg-tertiary)] border" style={{
                borderColor: isNewRecord ? '#22c55e' : 'var(--vtes-gold)'
              }}>
                <p className="text-sm" style={{ color: 'var(--vtes-text-muted)' }}>Your Rank</p>
                <p className="text-2xl font-bold" style={{ color: isNewRecord ? '#22c55e' : 'var(--vtes-gold)' }}>
                  #{userRank}
                </p>
              </div>
            )}

            {/* Loading state while checking leaderboard */}
            {user && isSubmitting && (
              <div className="mb-4 py-2 text-sm" style={{ color: 'var(--vtes-text-muted)' }}>
                Updating leaderboard...
              </div>
            )}

            {/* Share button */}
            <button
              onClick={() => {
                const shareText = generateShareText(rankedScore, rankedStats.bestStreak, rankedResults);
                handleShare(shareText);
              }}
              className="w-full py-2.5 mb-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--vtes-bg-tertiary)',
                color: 'var(--vtes-text-primary)',
                border: '1px solid var(--vtes-burgundy-dark)',
              }}
            >
              <span>📋</span> Share Results
            </button>

            {/* Action buttons - same for logged in and not */}
            <div className="space-y-3">
              {!user && (
                <p className="text-sm mb-2" style={{ color: 'var(--vtes-text-muted)' }}>
                  Sign in to save your score to the leaderboard
                </p>
              )}

              {!user ? (
                <button
                  onClick={() => {
                    savePendingRankedResults({
                      score: rankedScore,
                      stats: rankedStats,
                      results: rankedResults,
                    });
                    router.push('/login?next=/vtes-guess/guess-card');
                  }}
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-200 text-center"
                  style={{
                    backgroundColor: 'var(--vtes-gold)',
                    color: 'var(--vtes-bg-primary)',
                    border: '2px solid var(--vtes-gold)',
                    fontFamily: 'var(--vtes-font-display)'
                  }}
                >
                  Sign In to Save
                </button>
              ) : (
                <Link
                  href="/vtes-guess/leaderboard/guess"
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
              )}

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
            </div>
          </div>
        </div>
      )}

      {/* ===== HEADER SECTION (pinned to top) ===== */}
      <header className="flex-shrink-0 z-10">
        {/* HUD - Top bar with score/streak/settings */}
        {gameMode && (
          <Hud
            score={score}
            streak={streak}
            gameMode={gameMode}
            rankedCardIndex={rankedCardIndex}
            rankedScore={rankedScore}
            rankedStreak={rankedStats.currentStreak}
            lastPoints={lastPoints}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Ranked Mode Timer Bar */}
        {gameMode === 'ranked' && !revealed && currentCard && (
          <div className="w-full px-4 py-1">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--vtes-bg-tertiary)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-75 ease-linear"
                style={{
                  width: `${timerProgress}%`,
                  backgroundColor: timerProgress > 30
                    ? timerProgress > 60
                      ? '#34d399' // Green when > 60%
                      : '#fbbf24' // Yellow when 30-60%
                    : '#ef4444', // Red when < 30%
                  boxShadow: timerProgress <= 30 ? '0 0 8px #ef4444' : 'none',
                }}
              />
            </div>
          </div>
        )}
      </header>

      {/* ===== MAIN SECTION (grows to fill space, centers card) ===== */}
      <main className="flex-1 flex flex-col justify-center items-center min-h-0 px-3 py-2 overflow-hidden">
        <CardStage
          card={currentCard}
          cardDetails={cardDetails}
          revealed={revealed}
          feedback={feedback}
          cardKey={cardKey}
          getImageUrl={getImageUrl}
        />
      </main>

      {/* ===== FOOTER SECTION (pinned to bottom) ===== */}
      <footer className="flex-shrink-0 z-10 px-3 pb-3 pb-safe">
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
          onNextCard={nextCard}
          showDetails={showDetails}
          toggleDetails={() => setShowDetails(!showDetails)}
          cardDetails={cardDetails ? { artists: cardDetails.artists } : undefined}
          cardCount={currentCard?.count}
        />

        {/* Difficulty Tabs - Only in casual mode */}
        {gameMode === 'normal' && (
          <div className="py-2">
            <DifficultyTabs
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={changeDifficulty}
            />
          </div>
        )}

      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cardType={cardType}
        onCardTypeChange={handleCardTypeChange}
        gameMode={gameMode || 'normal'}
        onGameModeChange={handleGameModeChange}
        user={user}
        includeImbued={includeImbued}
        onIncludeImbuedChange={(value) => {
          setIncludeImbued(value);
          localStorage.setItem('vtes-guess-include-imbued', String(value));
        }}
      />

      {showLargeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={revealedImageUrl} alt={currentCard.name} className="max-h-[80vh] rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

export default function GuessCardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(to bottom, var(--vtes-bg-primary) 0%, var(--vtes-bg-secondary) 100%)'
      }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <GuessCardContent />
    </Suspense>
  );
}
