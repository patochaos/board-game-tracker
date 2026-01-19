
import { describe, it, expect } from 'vitest';
import { detectArchetype } from '../../src/lib/vtes/archetypes';

// Mock Card Data Helper
const card = (name: string, text: string, types: string[], disciplines: string[] = [], clans: string[] = [], capacity: number = 0) => ({
    count: 1,
    data: {
        id: 1,
        name,
        card_text: text,
        types,
        disciplines,
        clans, // Array support
        capacity // Capacity support
    }
});

describe('detectArchetype', () => {
    it('detects Stealth & Bleed', () => {
        // >30% Stealth/Bleed Modifiers required
        // Total Library: 20 cards. 7 Stealth/Bleed = 35%
        const deck = [
            ...Array(4).fill(card('Stealth', 'stealth', ['Action Modifier'], ['obf'])),
            ...Array(3).fill(card('Bleed', 'bleed', ['Action Modifier'], ['dom'])),
            ...Array(13).fill(card('Other', 'other', ['Master'])),
        ];
        expect(detectArchetype(deck)).toBe('Stealth & Bleed');
    });

    it('detects Wall', () => {
        // >40% Reaction required
        // Total Library: 20 cards. 9 Reactions = 45%
        const deck = [
            ...Array(9).fill(card('Intercept', 'intercept', ['Reaction'], ['aus'])),
            ...Array(11).fill(card('Other', 'other', ['Master'])),
        ];
        expect(detectArchetype(deck)).toBe('Wall');
    });

    it('detects Vote', () => {
        // >15% Political Actions + Titles
        const deck = [
            ...Array(4).fill(card('Vote', 'political action', ['Political Action'])), // 20% of 20
            ...Array(16).fill(card('Other', 'other', ['Master'])),
            ...Array(4).fill(card('Prince', 'Prince of Paris', ['Vampire'])),
        ];
        expect(detectArchetype(deck)).toBe('Vote');
    });

    it('detects Rush', () => {
        // >40% Combat OR "Enter Combat" heavy
        const deck = [
            ...Array(5).fill(card('Rush', 'enter combat', ['Action'])), // Specific keyword
            ...Array(5).fill(card('Combat', 'strike', ['Combat'])),
            ...Array(10).fill(card('Other', 'other', ['Master'])),
        ];
        expect(detectArchetype(deck)).toBe('Rush');
    });

    it('detects Swarm', () => {
        // Avg Cap < 3.5
        const deck = [
            card('Weenie 1', '', ['Vampire'], [], undefined, 1),
            card('Weenie 2', '', ['Vampire'], [], undefined, 2),
            card('Weenie 3', '', ['Vampire'], [], undefined, 1),
            ...Array(10).fill(card('Computer Hacking', 'computer hacking', ['Action'])), // Signature
        ];
        expect(detectArchetype(deck)).toBe('Swarm');
    });

    it('detects Allies', () => {
        const deck = [
            ...Array(5).fill(card('War Ghoul', 'recruit ally', ['Action'])), // Signature-ish
            ...Array(5).fill(card('Unmasking', 'ally', ['Event'])),
        ];
        expect(detectArchetype(deck)).toBe('Allies');
    });


    it('returns Unknown for generic cards', () => {
        const deck = [
            card('Villein', 'gain pool', ['Master']),
            card('Vessel', 'transfer blood', ['Master']),
        ];
        expect(detectArchetype(deck)).toBe('Unknown');
    });
});
