import { describe, it, expect } from 'vitest';
import { autoTagDeck } from '@/lib/vtes/autoTag';
import { VtesCard } from '@/lib/krcg';

const mockCard = (id: number, name: string, types: string[], text?: string, disciplines?: string[]): VtesCard => ({
    id, name, types, text, disciplines, url: ''
});

describe('autoTagDeck', () => {
    it('should tag generic bleed deck', () => {
        const deck = [
            { quantity: 10, card: mockCard(1, 'Gov', ['Action Modifier'], '+1 bleed') },
            { quantity: 10, card: mockCard(2, 'Conditioning', ['Action Modifier'], '+1 bleed') },
            { quantity: 10, card: mockCard(3, 'Action', ['Action'], 'Bleed') },
            { quantity: 30, card: mockCard(4, 'Vamp', ['Vampire'], '', ['dom']) }, // Vampire
        ];
        // Total Lib: 30. Bleed cards: 20 (66%).
        expect(autoTagDeck(deck)).toContain('Bleed');
    });

    it('should tag combat deck', () => {
        const deck = [
            { quantity: 10, card: mockCard(1, 'Strike', ['Combat'], 'Strike: 1R') },
            { quantity: 5, card: mockCard(2, 'Manuever', ['Combat'], 'Maneuver') },
            { quantity: 30, card: mockCard(3, 'Vamp', ['Vampire'], '', ['pot', 'cel']) }, // Vampire
        ];
        // Total Lib: 15. Combat: 15 (100%).
        expect(autoTagDeck(deck)).toContain('Combat');
    });

    it('should tag stealth bleed deck', () => {
        const deck = [
            { quantity: 10, card: mockCard(1, 'Spying', ['Action Modifier'], '+1 stealth') },
            { quantity: 10, card: mockCard(2, 'Cloak', ['Action Modifier'], '+1 stealth') },
            { quantity: 10, card: mockCard(3, 'Conditioning', ['Action Modifier'], '+1 bleed') },
            { quantity: 30, card: mockCard(4, 'Vamp', ['Vampire'], '', ['obf', 'dom']) },
        ];
        // Total Lib: 30. Bleed: 10. Stealth: 20.
        // 20 > 5 stealth.
        expect(autoTagDeck(deck)).toContain('Stealth Bleed');
    });

    it('should tag vote deck', () => {
        const deck = [
            { quantity: 10, card: mockCard(1, 'Kine', ['Political Action'], 'Vote') },
            { quantity: 5, card: mockCard(2, 'Con Boon', ['Political Action'], 'Vote') },
            { quantity: 20, card: mockCard(3, 'Vamp', ['Vampire'], '', ['pre'], ['Justicar']) },
        ];
        // Total Lib: 15. Vote: 15 (100%).
        expect(autoTagDeck(deck)).toContain('Vote');
    });

    it('should tag wall/block deck', () => {
        const deck = [
            { quantity: 15, card: mockCard(1, 'Wake', ['Reaction'], 'Wake') },
            { quantity: 15, card: mockCard(2, 'Intercept', ['Reaction'], '+1 intercept') },
            { quantity: 20, card: mockCard(3, 'Vamp', ['Vampire'], '', ['aus']) },
        ];
        // Total Lib: 30. Reaction: 30. Aus: lots.
        expect(autoTagDeck(deck)).toContain('Block');
        expect(autoTagDeck(deck)).toContain('Wall');
    });

    it('should return empty array for random deck', () => {
        const deck = [
            { quantity: 10, card: mockCard(1, 'Misc', ['Action'], 'Do something') },
            { quantity: 20, card: mockCard(2, 'Vamp', ['Vampire'], '') },
        ];
        expect(autoTagDeck(deck)).toEqual([]);
    });
});
