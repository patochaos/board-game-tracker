import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { calculatePlayerStats, PlayerStats, RawSessionData } from '@/lib/vtes/stats';

export function useVtesPlayerStats(userId: string) {
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentSessions, setRecentSessions] = useState<any[]>([]);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (!userId) return;

        const fetchStats = async () => {
            setLoading(true);

            // We fetch all sessions to ensure we validly calculate stats using the shared logic
            // Optimization: In a real app with thousands of sessions, we would filter by player at the DB level
            // but for now this reuses our robust client-side logic.
            const { data, error } = await supabase
                .from('sessions')
                .select(`
                    id, played_at, game_type, notes, location,
                    session_players (
                        user_id, score, is_winner, deck_name, deck_id, seat_position,
                        profile:profiles (display_name, username, avatar_url)
                    )
                `)
                .eq('game_id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
                .order('played_at', { ascending: false });

            if (error) {
                console.error('Error fetching player stats:', error);
            } else if (data) {
                const formattedSessions = data.map((s: any) => ({
                    ...s,
                    session_players: s.session_players
                })) as RawSessionData[];

                const calculatedStats = calculatePlayerStats(formattedSessions, userId);
                setStats(calculatedStats);

                // Identify recent sessions for this user
                const userGames = formattedSessions.filter(s =>
                    s.session_players.some(p => p.user_id === userId)
                ).slice(0, 5); // Last 5 games
                setRecentSessions(userGames);
            }
            setLoading(false);
        };

        fetchStats();
    }, [userId]);

    return { stats, loading, recentSessions };
}
