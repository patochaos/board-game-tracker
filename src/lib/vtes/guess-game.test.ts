import { describe, it, expect } from 'vitest';
import { normalizeString, isCorrectGuess, calculateScore, displayName } from './guess-game';

describe('normalizeString', () => {
  it('should convert to lowercase', () => {
    expect(normalizeString('HELLO')).toBe('hello');
  });

  it('should remove diacritical marks', () => {
    expect(normalizeString('café')).toBe('cafe');
  });
});

describe('isCorrectGuess', () => {
  it('should match exact names', () => {
    expect(isCorrectGuess('Anson', 'Anson')).toBe(true);
  });

  it('should match names with group notation stripped', () => {
    expect(isCorrectGuess('Anson', 'Anson (G1)')).toBe(true);
  });
});

describe('calculateScore', () => {
  it('should calculate base scores by difficulty', () => {
    expect(calculateScore(false, 0, 1)).toBe(20);
    expect(calculateScore(false, 0, 3)).toBe(100);
  });

  it('should reduce score when hints are used', () => {
    expect(calculateScore(true, 0, 1)).toBe(10);
  });
});

describe('displayName', () => {
  it('should strip group notation', () => {
    expect(displayName('Anson (G1)')).toBe('Anson');
  });

  it('should strip ADV notation', () => {
    expect(displayName('Ankha (ADV)')).toBe('Ankha');
  });
});
