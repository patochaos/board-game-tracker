
import { describe, it, expect } from 'vitest';
import { calculateVtesLeaderboard, RawSessionData } from '@/lib/vtes/stats';

describe('calculateVtesLeaderboard', () => {
    const mockSessions: RawSessionData[] = [
        {
            id: 's1',
            played_at: '2024-01-15',
            game_type: 'casual',
            session_players: [
                { user_id: 'u1', score: 1.5, is_winner: false, profile: { display_name: 'Alice', username: 'alice' } },
                { user_id: 'u2', score: 3, is_winner: true, profile: { display_name: 'Bob', username: 'bob' } }, // Bob wins
                { user_id: 'u3', score: 0.5, is_winner: false, profile: { display_name: 'Charlie', username: 'charlie' } },
            ]
        },
        {
            id: 's2',
            played_at: '2024-02-10',
            game_type: 'league',
            session_players: [
                { user_id: 'u1', score: 0, is_winner: false, profile: { display_name: 'Alice', username: 'alice' } },
                { user_id: 'u2', score: 1, is_winner: false, profile: { display_name: 'Bob', username: 'bob' } },
                { user_id: 'u4', score: 3, is_winner: true, profile: { display_name: 'Dave', username: 'dave' } }, // Dave wins
            ]
        },
        {
            id: 's3',
            played_at: '2024-02-15',
            game_type: 'casual',
            session_players: [
                { user_id: 'u1', score: 4, is_winner: true, profile: { display_name: 'Alice', username: 'alice' } }, // Alice wins
                { user_id: 'u2', score: 0, is_winner: false, profile: { display_name: 'Bob', username: 'bob' } },
            ]
        }
    ];

    it('calculates basic stats correctly for all time', () => {
        const result = calculateVtesLeaderboard(mockSessions, 'all');

        // Alice: 3 games, 1 win, 5.5 VP
        const alice = result.find(p => p.userId === 'u1');
        expect(alice).toBeDefined();
        expect(alice?.gamesPlayed).toBe(3);
        expect(alice?.gamesWon).toBe(1);
        expect(alice?.totalVp).toBe(5.5);
        expect(alice?.winRate).toBeCloseTo(33.33);
        expect(alice?.vpPerGame).toBeCloseTo(1.83);

        // Bob: 3 games, 1 win, 4 VP
        const bob = result.find(p => p.userId === 'u2');
        expect(bob).toBeDefined();
        expect(bob?.gamesPlayed).toBe(3);
        expect(bob?.gamesWon).toBe(1);
        expect(bob?.totalVp).toBe(4);
    });

    it('filters by date period', () => {
        // Mock "current date" context if needed, but for 'month' assuming strictly matching month of reference or just filtering input.
        // Actually the function might need a reference date or we just test filtering logic if exposed.
        // Let's assume we pass "month" and a reference date, or simpler: filter the input before passing? 
        // Better: The function handles filtering if we pass a "from" date.

        // Let's test with a Date filter manually passed to simulating the hook's job, 
        // OR if the function takes params. The plan said filters.period.
        // Let's implement the function to take a `dateFrom` string filter.

        const result = calculateVtesLeaderboard(mockSessions, 'all', '2024-02-01');

        // Should only include s2 and s3 (Feb games)
        // Alice: 2 games (s2, s3), 1 win, 4 VP
        const alice = result.find(p => p.userId === 'u1');
        expect(alice?.gamesPlayed).toBe(2);
        expect(alice?.totalVp).toBe(4);

        // Bob: 2 games (s2, s3), 0 wins, 1 VP
        const bob = result.find(p => p.userId === 'u2');
        expect(bob?.gamesPlayed).toBe(2);
        expect(bob?.gamesWon).toBe(0);
        expect(bob?.totalVp).toBe(1);
    });

    it('sorts by VP (desc) then Win Rate then Games Played', () => {
        // Alice: 5.5 VP
        // Bob: 4 VP
        // Dave: 3 VP
        // Charlie: 0.5 VP

        const result = calculateVtesLeaderboard(mockSessions, 'all');
        expect(result[0].userId).toBe('u1'); // Alice
        expect(result[1].userId).toBe('u2'); // Bob
        expect(result[2].userId).toBe('u4'); // Dave
        expect(result[3].userId).toBe('u3'); // Charlie
    });
});
