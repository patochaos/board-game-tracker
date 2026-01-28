/**
 * VTES Guess Card Game - Unit Tests
 * Test-driven development tests for game logic functions
 */

import { describe, it, expect, vi } from 'vitest';
import {
  normalizeString,
  isCorrectGuess,
  calculateScore,
  displayName,
  areClanRelated,
  isNameTooSimilar,
  generateCryptOptions,
  generateLibraryOptions,
  GameCardData,
  GameCardDetails,
  PremiumDistractors
} from '@/lib/vtes/guess-game';

describe('normalizeString', () => {
  it('should return empty string for null or undefined input', () => {
    expect(normalizeString('')).toBe('');
    expect(normalizeString(null as unknown as string)).toBe('');
    expect(normalizeString(undefined as unknown as string)).toBe('');
  });

  it('should convert to lowercase', () => {
    expect(normalizeString('HELLO')).toBe('hello');
    expect(normalizeString('Hello World')).toBe('hello world');
  });

  it('should remove diacritical marks', () => {
    expect(normalizeString('café')).toBe('cafe');
    expect(normalizeString('naïve')).toBe('naive');
    expect(normalizeString('résumé')).toBe('resume');
  });

  it('should remove special characters except spaces', () => {
    expect(normalizeString('Hello, World!')).toBe('hello world');
    expect(normalizeString('Anson (G1)')).toBe('anson g1');
  });

  it('should aggressively remove stop words when aggressive=true', () => {
    expect(normalizeString('The Anson', true)).toBe('anson');
    expect(normalizeString('The Prince of Darkness', true)).toBe('princedarkness');
  });
});

describe('isCorrectGuess', () => {
  it('should return false for empty inputs', () => {
    expect(isCorrectGuess('', 'Anson')).toBe(false);
    expect(isCorrectGuess('Anson', '')).toBe(false);
    expect(isCorrectGuess(null as unknown as string, 'Anson')).toBe(false);
  });

  it('should match exact normalized names', () => {
    expect(isCorrectGuess('Anson', 'Anson')).toBe(true);
    expect(isCorrectGuess('anson', 'Anson')).toBe(true);
  });

  it('should match names with group notation stripped', () => {
    expect(isCorrectGuess('Anson', 'Anson (G1)')).toBe(true);
    expect(isCorrectGuess('Anson', 'Anson (G2)')).toBe(true);
  });

  it('should match ADV vampires', () => {
    expect(isCorrectGuess('Ankha', 'Ankha (ADV)')).toBe(true);
    expect(isCorrectGuess('Ankha', 'Ankha (Advanced)')).toBe(true);
  });

  it('should match with aggressive normalization', () => {
    expect(isCorrectGuess('The Anson', 'Anson (G1)')).toBe(true);
  });

  it('should not match completely different cards', () => {
    expect(isCorrectGuess('Anson', 'Menele')).toBe(false);
    expect(isCorrectGuess('Crypt', 'Library')).toBe(false);
  });
});

describe('calculateScore', () => {
  it('should calculate base scores by difficulty', () => {
    expect(calculateScore(false, 0, 1)).toBe(20);
    expect(calculateScore(false, 0, 2)).toBe(50);
    expect(calculateScore(false, 0, 3)).toBe(100);
    expect(calculateScore(false, 0, 4)).toBe(200);
    expect(calculateScore(false, 0, 5)).toBe(400);
  });

  it('should reduce score by 50% when hints are used', () => {
    expect(calculateScore(true, 0, 1)).toBe(10); // 20 * 0.5
    expect(calculateScore(true, 0, 3)).toBe(50); // 100 * 0.5
  });

  it('should apply streak multipliers', () => {
    // No streak
    expect(calculateScore(false, 0, 3)).toBe(100);
    expect(calculateScore(false, 2, 3)).toBe(100);
    
    // 3+ streak = 1.5x
    expect(calculateScore(false, 3, 3)).toBe(150);
    expect(calculateScore(false, 4, 3)).toBe(150);
    
    // 5+ streak = 2x
    expect(calculateScore(false, 5, 3)).toBe(200);
    expect(calculateScore(false, 9, 3)).toBe(200);
    
    // 10+ streak = 3x
    expect(calculateScore(false, 10, 3)).toBe(300);
    expect(calculateScore(false, 20, 3)).toBe(300);
  });

  it('should combine hints penalty with streak multiplier', () => {
    // Base 100 * 0.5 (hints) * 2 (streak 5+) = 100
    expect(calculateScore(true, 5, 3)).toBe(100);
  });
});

describe('displayName', () => {
  it('should strip group notation', () => {
    expect(displayName('Anson (G1)')).toBe('Anson');
    expect(displayName('Menele (G2)')).toBe('Menele');
  });

  it('should strip ADV notation', () => {
    expect(displayName('Ankha (ADV)')).toBe('Ankha');
    expect(displayName('Ankha (Advanced)')).toBe('Ankha');
  });

  it('should strip both group and ADV notation', () => {
    expect(displayName('Anson (G1) (ADV)')).toBe('Anson');
  });

  it('should return name unchanged if no notation', () => {
    expect(displayName('Anson')).toBe('Anson');
    expect(displayName('The Anson')).toBe('The Anson');
  });
});

describe('areClanRelated', () => {
  it('should return false for undefined or null inputs', () => {
    expect(areClanRelated(undefined, 'Toreador')).toBe(false);
    expect(areClanRelated('Toreador', undefined)).toBe(false);
  });

  it('should match exact same clan', () => {
    expect(areClanRelated('Toreador', 'Toreador')).toBe(true);
  });

  shouldMatchAntitribuClans('Toreador antitribu', 'Toreador');
  shouldMatchAntitribuClans('Toreador', 'Toreador antitribu');
  shouldMatchAntitribuClans('Toreador antitribu', 'Toreador antitribu');

  function shouldMatchAntitribuClans(clan1: string, clan2: string) {
    expect(areClanRelated(clan1, clan2)).toBe(true);
  }

  it('should not match different clans', () => {
    expect(areClanRelated('Toreador', 'Ventrue')).toBe(false);
    expect(areClanRelated('Brujah', 'Gangrel')).toBe(false);
  });
});

describe('isNameTooSimilar', () => {
  const createCard = (id: number, name: string): GameCardData => ({
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    types: ['Vampire'],
    count: 0,
    difficulty: 1,
  });

  it('should return true for exact same name', () => {
    const card1 = createCard(1, 'Anson');
    const card2 = createCard(2, 'Anson');
    expect(isNameTooSimilar(card1, card2)).toBe(true);
  });

  it('should return true when one name contains the other', () => {
    const card1 = createCard(1, 'Anson');
    const card2 = createCard(2, 'Anson Carter');
    expect(isNameTooSimilar(card1, card2)).toBe(true);
  });

  it('should return true for shared significant words', () => {
    const card1 = createCard(1, 'Prince Anson');
    const card2 = createCard(2, 'Anson The Prince');
    expect(isNameTooSimilar(card1, card2)).toBe(true);
  });

  it('should return false for different cards', () => {
    const card1 = createCard(1, 'Anson');
    const card2 = createCard(2, 'Menele');
    expect(isNameTooSimilar(card1, card2)).toBe(false);
  });
});

describe('generateCryptOptions', () => {
  const createCryptCard = (id: number, name: string, options: {
    clan?: string;
    capacity?: number;
    gender?: string;
    difficulty?: number;
  }): GameCardData => ({
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    types: ['Vampire'],
    count: 0,
    difficulty: options.difficulty || 1,
    clan: options.clan,
    capacity: options.capacity,
    gender: options.gender,
  });

  it('should return empty array if insufficient cards', () => {
    const correctCard = createCryptCard(1, 'Anson', { clan: 'Toreador', capacity: 5, difficulty: 1 });
    const allCrypt = [correctCard];
    const options = generateCryptOptions(correctCard, allCrypt);
    expect(options).toHaveLength(0);
  });

  it('should return 2 different cards when available', () => {
    const correctCard = createCryptCard(1, 'Anson', { clan: 'Toreador', capacity: 5, gender: 'Male', difficulty: 1 });
    const allCrypt = [
      correctCard,
      createCryptCard(2, 'Menele', { clan: 'Toreador', capacity: 6, gender: 'Male', difficulty: 1 }),
      createCryptCard(3, 'Lucinde', { clan: 'Toreador', capacity: 5, gender: 'Female', difficulty: 1 }),
    ];
    const options = generateCryptOptions(correctCard, allCrypt);
    expect(options).toHaveLength(2);
    expect(options.map(c => c.name)).not.toContain('Anson');
  });

  it('should prioritize same clan and difficulty', () => {
    const correctCard = createCryptCard(1, 'Anson', { clan: 'Toreador', capacity: 5, difficulty: 1 });
    const allCrypt = [
      correctCard,
      createCryptCard(2, 'Menele', { clan: 'Toreador', capacity: 5, difficulty: 1 }),
      createCryptCard(3, 'Random', { clan: 'Ventrue', capacity: 5, difficulty: 1 }),
    ];
    const options = generateCryptOptions(correctCard, allCrypt);
    // Should prefer Toreador over Ventrue
    expect(options.some(c => c.clan === 'Toreador')).toBe(true);
  });

  it('should exclude cards with similar names', () => {
    const correctCard = createCryptCard(1, 'Anson Carter', { clan: 'Toreador', capacity: 5, difficulty: 1 });
    const allCrypt = [
      correctCard,
      createCryptCard(2, 'Anson', { clan: 'Toreador', capacity: 5, difficulty: 1 }),
      createCryptCard(3, 'Menele', { clan: 'Toreador', capacity: 5, difficulty: 1 }),
    ];
    const options = generateCryptOptions(correctCard, allCrypt);
    // "Anson" should be excluded because it's contained in "Anson Carter"
    expect(options.map(c => c.name)).not.toContain('Anson');
  });
});

describe('generateLibraryOptions', () => {
  const createLibraryCard = (id: number, name: string, options: {
    types?: string[];
    disciplines?: string[];
    difficulty?: number;
    bloodCost?: string;
    poolCost?: string;
  }): GameCardData => ({
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    types: options.types || ['Action'],
    count: 0,
    difficulty: options.difficulty || 1,
    disciplines: options.disciplines,
    bloodCost: options.bloodCost,
    poolCost: options.poolCost,
  });

  it('should use premium distractors when available', () => {
    const correctCard = createLibraryCard(1, 'The Anson', { types: ['Action'] });
    const premiumDistractors: PremiumDistractors = {
      '1': ['Card One', 'Card Two', 'Card Three']
    };
    const allLibrary = [
      correctCard,
      createLibraryCard(2, 'Card One', { types: ['Action'] }),
      createLibraryCard(3, 'Card Two', { types: ['Action'] }),
      createLibraryCard(4, 'Card Three', { types: ['Action'] }),
    ];
    const options = generateLibraryOptions(correctCard, allLibrary, undefined, premiumDistractors);
    expect(options).toHaveLength(3);
    expect(options.map(c => c.name)).toEqual(['Card One', 'Card Two', 'Card Three']);
  });

  it('should return 3 different cards when using algorithm', () => {
    const correctCard = createLibraryCard(1, 'Anson', { 
      types: ['Action'], 
      disciplines: ['AUS'],
      difficulty: 1 
    });
    const allLibrary = [
      correctCard,
      createLibraryCard(2, 'Menele', { types: ['Action'], disciplines: ['AUS'], difficulty: 1 }),
      createLibraryCard(3, 'Card1', { types: ['Action'], disciplines: ['AUS'], difficulty: 1 }),
      createLibraryCard(4, 'Card2', { types: ['Action'], disciplines: ['AUS'], difficulty: 1 }),
    ];
    const options = generateLibraryOptions(correctCard, allLibrary);
    expect(options).toHaveLength(3);
    expect(options.map(c => c.name)).not.toContain('Anson');
  });

  it('should prioritize same type and difficulty', () => {
    const correctCard = createLibraryCard(1, 'Anson', { 
      types: ['Action'], 
      difficulty: 1 
    });
    const allLibrary = [
      correctCard,
      createLibraryCard(2, 'Correct', { types: ['Action'], difficulty: 1 }),
      createLibraryCard(3, 'Wrong Diff', { types: ['Action'], difficulty: 2 }),
      createLibraryCard(4, 'Wrong Type', { types: ['Action Modifier'], difficulty: 1 }),
    ];
    const options = generateLibraryOptions(correctCard, allLibrary);
    // Should have some cards from priority matches
    expect(options.length).toBeGreaterThan(0);
  });

  it('should exclude cards with similar names', () => {
    const correctCard = createLibraryCard(1, 'Anson Carter', { types: ['Action'] });
    const allLibrary = [
      correctCard,
      createLibraryCard(2, 'Anson', { types: ['Action'] }),
      createLibraryCard(3, 'Menele', { types: ['Action'] }),
      createLibraryCard(4, 'Lucinde', { types: ['Action'] }),
    ];
    const options = generateLibraryOptions(correctCard, allLibrary);
    expect(options.map(c => c.name)).not.toContain('Anson');
  });
});
