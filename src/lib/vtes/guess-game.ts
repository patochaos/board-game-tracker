/**
 * VTES Guess Card Game - Core Logic Utilities
 * These functions can be tested independently of the React component
 */

// Card data interfaces (matching the game component)
export interface GameCardData {
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

export interface GameCardDetails {
  name: string;
  imageUrl: string;
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

export interface PremiumDistractors {
  [cardId: string]: string[];
}

// Normalize string for comparison
export function normalizeString(str: string, aggressive = false): string {
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
export function isCorrectGuess(guess: string, cardName: string): boolean {
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
export function calculateScore(hintsUsed: boolean, currentStreak: number, difficulty: number): number {
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

// Strip group/adv notation for display: "Anson (G1)" -> "Anson"
export function displayName(name: string): string {
  return name
    .replace(/\s*\([Gg]\d+\)\s*$/, '')
    .replace(/\s*\(.*[Aa][Dd][Vv].*\)\s*$/, '')
    .trim();
}

// Check if two clans are related (same clan or antitribu variant)
export function areClanRelated(clan1?: string, clan2?: string): boolean {
  if (!clan1 || !clan2) return false;
  if (clan1 === clan2) return true;
  const base1 = clan1.replace(' antitribu', '');
  const base2 = clan2.replace(' antitribu', '');
  return base1 === base2;
}

// Check if card name is too similar (avoid obvious answers)
export function isNameTooSimilar(card1: GameCardData, card2: GameCardData): boolean {
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
}

// Generate 3 wrong options for crypt multiple choice (4 total with correct)
export function generateCryptOptions(
  correctCard: GameCardData,
  allCrypt: GameCardData[]
): GameCardData[] {
  const clan = correctCard.clan;
  const cap = correctCard.capacity ?? 5;
  const gender = correctCard.gender;
  const difficulty = correctCard.difficulty;
  const isCorrectImbued = correctCard.types?.includes('Imbued');

  // Helper: check if card is Imbued (they have obvious "nickname" format)
  const isImbued = (c: GameCardData) => c.types?.includes('Imbued');

  // Base filter: different card, same gender, similar capacity (+/- 2)
  // Also exclude Imbued as options unless the correct card is also Imbued
  const baseFilter = (c: GameCardData) =>
    c.id !== correctCard.id &&
    c.capacity !== undefined &&
    Math.abs((c.capacity ?? 0) - cap) <= 2 &&
    (!gender || gender === '?' || c.gender === gender) &&
    !isNameTooSimilar(correctCard, c) &&
    (isCorrectImbued || !isImbued(c));

  // Priority 1: Same gender + same difficulty + same/antitribu clan + similar capacity
  let candidates = allCrypt.filter(c =>
    baseFilter(c) &&
    c.difficulty === difficulty &&
    areClanRelated(c.clan, clan)
  );

  // Priority 2: Same gender + same difficulty + similar capacity (any clan)
  if (candidates.length < 3) {
    const moreCandidates = allCrypt.filter(c =>
      baseFilter(c) &&
      c.difficulty === difficulty &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Priority 3: Same gender + same difficulty, any capacity
  if (candidates.length < 3) {
    const moreCandidates = allCrypt.filter(c =>
      c.id !== correctCard.id &&
      c.difficulty === difficulty &&
      (!gender || gender === '?' || c.gender === gender) &&
      !isNameTooSimilar(correctCard, c) &&
      (isCorrectImbued || !isImbued(c)) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Priority 4: Same gender + any difficulty + similar capacity
  if (candidates.length < 3) {
    const moreCandidates = allCrypt.filter(c =>
      baseFilter(c) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Priority 5: Same gender, any difficulty, any capacity
  if (candidates.length < 3) {
    const moreCandidates = allCrypt.filter(c =>
      c.id !== correctCard.id &&
      (!gender || gender === '?' || c.gender === gender) &&
      !isNameTooSimilar(correctCard, c) &&
      (isCorrectImbued || !isImbued(c)) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Fallback: any crypt card (still exclude similar names and Imbued unless correct is Imbued)
  if (candidates.length < 3) {
    const moreCandidates = allCrypt.filter(c =>
      c.id !== correctCard.id &&
      !isNameTooSimilar(correctCard, c) &&
      (isCorrectImbued || !isImbued(c)) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Shuffle and pick 3
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// Generate 3 wrong options for library multiple choice (4 total with correct)
export function generateLibraryOptions(
  correctCard: GameCardData,
  allLibrary: GameCardData[],
  details?: GameCardDetails,
  premiumDistractors?: PremiumDistractors
): GameCardData[] {
  const cardId = correctCard.id.toString();
  
  // Check if we have premium distractors for this card
  if (premiumDistractors && premiumDistractors[cardId]) {
    const distractorNames = premiumDistractors[cardId];
    // Find the cards in allLibrary
    const distractors = allLibrary.filter(c => 
      distractorNames.some(d => normalizeString(d) === normalizeString(c.name))
    );
    if (distractors.length >= 3) {
      return distractors.slice(0, 3);
    }
  }
  
  // Fallback to semantic algorithm if no premium distractors or not enough found
  const targetTypes = correctCard.types;
  const targetDifficulty = correctCard.difficulty;
  
  // Get discipline requirement from details (API) or fallback to card data
  const targetDisciplines = details?.disciplines?.map(d => d.toLowerCase()) || 
                           correctCard.disciplines?.map(d => d.toLowerCase()) || 
                           [];
  
  // Get cost from details (API)
  const targetBloodCost = details?.bloodCost || correctCard.bloodCost;
  const targetPoolCost = details?.poolCost || correctCard.poolCost;
  const targetConvictionCost = details?.convictionCost || correctCard.convictionCost;
  
  // Check if card is indiscriminate (no discipline requirement)
  const isIndiscriminate = targetDisciplines.length === 0;

  // Helper to check if indiscriminate
  const isCardIndiscriminate = (c: GameCardData): boolean => {
    return !c.disciplines || c.disciplines.length === 0;
  };

  // Helper to check cost similarity
  const hasSimilarCost = (c: GameCardData, cDetails?: GameCardDetails): boolean => {
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

  // Base filter: different card, same type
  const baseFilter = (c: GameCardData) =>
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
  if (candidates.length < 3) {
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
  if (candidates.length < 3) {
    const moreCandidates = allLibrary.filter(c =>
      baseFilter(c) &&
      c.difficulty === targetDifficulty &&
      isIndiscriminate === isCardIndiscriminate(c) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Priority 4: Same type + same difficulty (any discipline)
  if (candidates.length < 3) {
    const moreCandidates = allLibrary.filter(c =>
      baseFilter(c) &&
      c.difficulty === targetDifficulty &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Priority 5: Same type (any difficulty) - fallback
  if (candidates.length < 3) {
    const moreCandidates = allLibrary.filter(c =>
      baseFilter(c) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Fallback: any library card with same types count (still exclude similar names)
  if (candidates.length < 3) {
    const moreCandidates = allLibrary.filter(c =>
      c.id !== correctCard.id &&
      c.types.length === targetTypes.length &&
      c.types.every(t => targetTypes.includes(t)) &&
      !isNameTooSimilar(correctCard, c) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Last resort: any library card (still exclude similar names)
  if (candidates.length < 3) {
    const moreCandidates = allLibrary.filter(c =>
      c.id !== correctCard.id &&
      !isNameTooSimilar(correctCard, c) &&
      !candidates.some(e => e.id === c.id)
    );
    candidates = [...candidates, ...moreCandidates];
  }

  // Shuffle and pick 3
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
