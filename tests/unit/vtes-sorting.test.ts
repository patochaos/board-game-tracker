import { describe, it, expect } from 'vitest';
import { sortDisciplines } from '../../src/lib/vtes/utils';

// RED Phase: This test will fail/error because sortDisciplines doesn't exist yet
describe('sortDisciplines', () => {
    it('should sort disciplines alphabetically case-insensitive', () => {
        const input = ['ser', 'CEL', 'OBF', 'qui'];
        const expected = ['CEL', 'OBF', 'qui', 'ser'];
        expect(sortDisciplines(input)).toEqual(expected);
    });

    it('should handle empty array', () => {
        expect(sortDisciplines([])).toEqual([]);
    });

    it('should handle null or undefined safely', () => {
        expect(sortDisciplines(null as any)).toEqual([]);
        expect(sortDisciplines(undefined as any)).toEqual([]);
    });

    it('should not mutate the original array', () => {
        const input = ['b', 'a'];
        const output = sortDisciplines(input);
        expect(output).toEqual(['a', 'b']);
        expect(input).toEqual(['b', 'a']);
    });
});
