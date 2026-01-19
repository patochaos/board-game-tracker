import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { calculateVtesLeaderboard, LeaderboardEntry, RawSessionData } from '@/lib/vtes/stats';

export function useVtesLeaderboard(
    period: 'all' | 'month' | 'year' = 'all',
    gameType: 'all' | 'casual' | 'tournament_prelim' | 'tournament_final' | 'league' = 'all'
) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchSessions = async () => {
            setLoading(true);
            let query = supabase
                .from('sessions')
                .select(`
                    id, played_at, game_type,
                    session_players (
                        user_id, score, is_winner,
                        profile:profiles (display_name, username, avatar_url)
                    )
                `)
                .eq('game_id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'); // VTES

            if (gameType !== 'all') {
                query = query.eq('game_type', gameType);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching leaderboard data:', error);
            } else if (data) {
                // Transform data and calculate
                const formattedSessions = data.map((s: any) => ({
                    ...s,
                    session_players: s.session_players
                })) as RawSessionData[];

                const stats = calculateVtesLeaderboard(formattedSessions, period);
                setLeaderboard(stats);
            }
            setLoading(false);
        };

        fetchSessions();
    }, [period, gameType]);

    return { leaderboard, loading };
}
