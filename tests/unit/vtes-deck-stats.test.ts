
import { describe, it, expect } from 'vitest';
import { calculateDeckStats, RawSessionData } from '@/lib/vtes/stats';

describe('calculateDeckStats', () => {
    const mockSessions: RawSessionData[] = [
        {
            id: 's1',
            played_at: '2024-01-01',
            game_type: 'casual',
            session_players: [
                { user_id: 'u1', score: 1, is_winner: false, deck_name: 'My Deck', deck_id: 'd1', profile: { display_name: 'Alice', username: 'alice' } },
                { user_id: 'u2', score: 1, is_winner: true, deck_name: 'Enemy', deck_id: 'd2', profile: { display_name: 'Bob', username: 'bob' } }
            ]
        },
        {
            id: 's2',
            played_at: '2024-01-10',
            game_type: 'league',
            session_players: [
                { user_id: 'u1', score: 3, is_winner: true, deck_name: 'My Deck', deck_id: 'd1', profile: { display_name: 'Alice', username: 'alice' } },
                { user_id: 'u3', score: 0, is_winner: false, deck_name: 'Other', deck_id: 'd3', profile: { display_name: 'Charlie', username: 'charlie' } }
            ]
        },
        {
            id: 's3',
            played_at: '2024-02-01',
            game_type: 'casual',
            session_players: [
                { user_id: 'u4', score: 0, is_winner: false, deck_name: 'My Deck', deck_id: 'd1', profile: { display_name: 'Dave', username: 'dave' } }, // Played by someone else? (Unlikely for ID matching but possible if shared)
                { user_id: 'u2', score: 1, is_winner: true, deck_name: 'Enemy', deck_id: 'd2', profile: { display_name: 'Bob', username: 'bob' } }
            ]
        }
    ];

    it('calculates global stats for a specific deck id', () => {
        const stats = calculateDeckStats(mockSessions, 'd1');

        expect(stats).toBeDefined();
        expect(stats?.deckId).toBe('d1');
        expect(stats?.gamesPlayed).toBe(3); // Played in s1, s2, s3
        expect(stats?.gamesWon).toBe(1); // Won s2
        expect(stats?.totalVp).toBe(4); // 1 + 3 + 0
        expect(stats?.winRate).toBeCloseTo(33.33);
        expect(stats?.averageVp).toBeCloseTo(1.33);
    });

    it('identifies players who played this deck', () => {
        const stats = calculateDeckStats(mockSessions, 'd1');
        expect(stats?.pilots).toBeDefined();
        expect(stats?.pilots).toHaveLength(2); // Alice and Dave

        const alice = stats?.pilots.find(p => p.userId === 'u1');
        expect(alice?.gamesPlayed).toBe(2);

        const dave = stats?.pilots.find(p => p.userId === 'u4');
        expect(dave?.gamesPlayed).toBe(1);
    });

    it('returns null for unknown deck', () => {
        const stats = calculateDeckStats(mockSessions, 'unknown');
        expect(stats).toBeNull();
    });
});
