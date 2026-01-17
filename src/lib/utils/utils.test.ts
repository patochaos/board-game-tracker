import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDuration,
  calculateWinRate,
  calculateHIndex,
  generateInviteCode,
  getInitials,
  getPlayerColor,
  getOrdinal,
} from './index';

describe('calculateWinRate', () => {
  it('returns 0 when total is 0', () => {
    expect(calculateWinRate(0, 0)).toBe(0);
  });

  it('returns 0 when wins is 0', () => {
    expect(calculateWinRate(0, 10)).toBe(0);
  });

  it('returns 100 when all games are wins', () => {
    expect(calculateWinRate(10, 10)).toBe(100);
  });

  it('returns correct percentage for partial wins', () => {
    expect(calculateWinRate(3, 10)).toBe(30);
    expect(calculateWinRate(7, 10)).toBe(70);
    expect(calculateWinRate(1, 3)).toBe(33); // Rounded down
  });

  it('rounds to nearest integer', () => {
    expect(calculateWinRate(2, 3)).toBe(67); // 66.67 rounded
    expect(calculateWinRate(1, 6)).toBe(17); // 16.67 rounded
  });
});

describe('calculateHIndex', () => {
  it('returns 0 for empty array', () => {
    expect(calculateHIndex([])).toBe(0);
  });

  it('returns 0 when no game has plays', () => {
    expect(calculateHIndex([0, 0, 0])).toBe(0);
  });

  it('returns 1 when only one game has 1 play', () => {
    expect(calculateHIndex([1])).toBe(1);
  });

  it('calculates correct H-index for simple cases', () => {
    // 3 games with 3+ plays each = H-index 3
    expect(calculateHIndex([5, 4, 3])).toBe(3);
    // 2 games with 2+ plays = H-index 2
    expect(calculateHIndex([5, 2, 1])).toBe(2);
  });

  it('handles unsorted input', () => {
    expect(calculateHIndex([1, 5, 3, 2, 4])).toBe(3);
  });

  it('handles large H-index values', () => {
    expect(calculateHIndex([10, 9, 8, 7, 6, 5, 4, 3, 2, 1])).toBe(5);
  });

  it('handles all games with same play count', () => {
    expect(calculateHIndex([3, 3, 3])).toBe(3);
    expect(calculateHIndex([2, 2, 2, 2, 2])).toBe(2);
  });
});

describe('generateInviteCode', () => {
  it('generates a 6 character code', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(6);
  });

  it('only contains valid characters (uppercase letters and digits, no ambiguous chars)', () => {
    const code = generateInviteCode();
    // Should not contain: I, O, 0, 1 (ambiguous characters)
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it('generates different codes on multiple calls', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateInviteCode());
    }
    // Should have generated at least 90 unique codes (allowing for rare collisions)
    expect(codes.size).toBeGreaterThan(90);
  });
});

describe('formatDate', () => {
  it('formats a date string and includes the year', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('2024');
  });

  it('formats a Date object and includes the year', () => {
    const date = new Date(2024, 0, 15); // January 15, 2024
    const result = formatDate(date);
    expect(result).toContain('2024');
  });

  it('returns a non-empty string', () => {
    const result = formatDate('2024-06-20');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDuration', () => {
  it('formats minutes less than 60', () => {
    expect(formatDuration(30)).toBe('30min');
    expect(formatDuration(45)).toBe('45min');
    expect(formatDuration(1)).toBe('1min');
  });

  it('formats exactly 60 minutes as 1h', () => {
    expect(formatDuration(60)).toBe('1h');
  });

  it('formats hours with remaining minutes', () => {
    expect(formatDuration(90)).toBe('1h 30min');
    expect(formatDuration(150)).toBe('2h 30min');
  });

  it('formats exact hours without minutes', () => {
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(180)).toBe('3h');
  });
});

describe('getInitials', () => {
  it('gets initials from single word', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('gets initials from two words', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('limits to 2 characters for multiple words', () => {
    expect(getInitials('John William Doe')).toBe('JW');
  });

  it('handles uppercase input', () => {
    expect(getInitials('JOHN DOE')).toBe('JD');
  });
});

describe('getPlayerColor', () => {
  it('returns a color class', () => {
    expect(getPlayerColor(0)).toMatch(/^bg-/);
  });

  it('cycles through colors for higher indices', () => {
    const colors = new Set<string>();
    for (let i = 0; i < 8; i++) {
      colors.add(getPlayerColor(i));
    }
    expect(colors.size).toBe(8);

    // Index 8 should be same as index 0 (cycling)
    expect(getPlayerColor(8)).toBe(getPlayerColor(0));
  });
});

describe('getOrdinal', () => {
  it('handles 1st, 2nd, 3rd', () => {
    expect(getOrdinal(1)).toBe('1st');
    expect(getOrdinal(2)).toBe('2nd');
    expect(getOrdinal(3)).toBe('3rd');
  });

  it('handles 4th through 10th', () => {
    expect(getOrdinal(4)).toBe('4th');
    expect(getOrdinal(5)).toBe('5th');
    expect(getOrdinal(10)).toBe('10th');
  });

  it('handles 11th, 12th, 13th (special cases)', () => {
    expect(getOrdinal(11)).toBe('11th');
    expect(getOrdinal(12)).toBe('12th');
    expect(getOrdinal(13)).toBe('13th');
  });

  it('handles 21st, 22nd, 23rd', () => {
    expect(getOrdinal(21)).toBe('21st');
    expect(getOrdinal(22)).toBe('22nd');
    expect(getOrdinal(23)).toBe('23rd');
  });
});
