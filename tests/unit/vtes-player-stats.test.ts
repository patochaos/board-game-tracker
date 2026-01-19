
import { describe, it, expect } from 'vitest';
import { calculatePlayerStats, RawSessionData } from '@/lib/vtes/stats';

describe('calculatePlayerStats', () => {
    const mockSessions: RawSessionData[] = [
        {
            id: 's1',
            played_at: '2024-01-01',
            game_type: 'casual',
            session_players: [
                { user_id: 'u1', score: 1, is_winner: false, deck_name: 'Malkavian Stealth', deck_id: 'd1', profile: { display_name: 'Alice', username: 'alice' } },
                { user_id: 'u2', score: 1, is_winner: true, deck_name: 'Brujah combat', deck_id: 'd2', profile: { display_name: 'Bob', username: 'bob' } }
            ]
        },
        {
            id: 's2',
            played_at: '2024-01-10',
            game_type: 'league',
            session_players: [
                { user_id: 'u1', score: 3, is_winner: true, deck_name: 'Malkavian Stealth', deck_id: 'd1', profile: { display_name: 'Alice', username: 'alice' } },
                { user_id: 'u3', score: 0, is_winner: false, deck_name: 'Tremere', deck_id: 'd3', profile: { display_name: 'Charlie', username: 'charlie' } }
            ]
        },
        {
            id: 's3',
            played_at: '2024-02-01',
            game_type: 'casual',
            session_players: [
                { user_id: 'u1', score: 0, is_winner: false, deck_name: 'Ventrue Vote', deck_id: 'd4', profile: { display_name: 'Alice', username: 'alice' } },
                { user_id: 'u2', score: 1, is_winner: true, deck_name: 'Brujah combat', deck_id: 'd2', profile: { display_name: 'Bob', username: 'bob' } }
            ]
        }
    ];

    it('calculates correct aggregate stats for a specific player', () => {
        const stats = calculatePlayerStats(mockSessions, 'u1');

        expect(stats).toBeDefined();
        expect(stats?.userId).toBe('u1');
        expect(stats?.gamesPlayed).toBe(3);
        expect(stats?.gamesWon).toBe(1); // Won s2
        expect(stats?.totalVp).toBe(4); // 1 + 3 + 0
        expect(stats?.winRate).toBeCloseTo(33.33);
    });

    it('identifies favorite deck (most played)', () => {
        const stats = calculatePlayerStats(mockSessions, 'u1');
        expect(stats?.favoriteDeck).toBeDefined();
        expect(stats?.favoriteDeck?.deckId).toBe('d1'); // Played twice
        expect(stats?.favoriteDeck?.deckName).toBe('Malkavian Stealth');
        expect(stats?.favoriteDeck?.gamesPlayed).toBe(2);
    });

    it('calculates deck performance correctly', () => {
        const stats = calculatePlayerStats(mockSessions, 'u1');
        const decks = stats?.decks;

        const malkavian = decks?.find(d => d.deckId === 'd1');
        expect(malkavian).toBeDefined();
        expect(malkavian?.gamesPlayed).toBe(2);
        expect(malkavian?.gamesWon).toBe(1); // Won s2
        expect(malkavian?.averageVp).toBe(2); // (1+3)/2

        const ventrue = decks?.find(d => d.deckId === 'd4');
        expect(ventrue).toBeDefined();
        expect(ventrue?.gamesPlayed).toBe(1);
        expect(ventrue?.gamesWon).toBe(0);
        expect(ventrue?.averageVp).toBe(0);
    });

    it('returns null for unknown player', () => {
        const stats = calculatePlayerStats(mockSessions, 'unknown');
        expect(stats).toBeNull();
    });
});
