import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { calculateDeckStats, GlobalDeckStats, RawSessionData } from '@/lib/vtes/stats';

export function useVtesDeckStats(deckId: string) {
    const [stats, setStats] = useState<GlobalDeckStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentSessions, setRecentSessions] = useState<any[]>([]);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (!deckId) return;

        const fetchStats = async () => {
            setLoading(true);

            // Optimization: Fetch only sessions where this deck was played would be better,
            // but our current DB schema links sessions -> players -> decks.
            // Filtering on joined tables in Supabase can be tricky depending on the connector.
            // For now, reuse the pattern of fetching sessions and filtering in JS for consistency with other hooks,
            // but we can optimize query to only get relevant sessions if possible.
            // Actually, we can filter by containing the deck_id in session_players

            const { data, error } = await supabase
                .from('sessions')
                .select(`
                    id, played_at, game_type, notes, location,
                    session_players!inner (
                        user_id, score, is_winner, deck_name, deck_id, seat_position,
                        profile:profiles (display_name, username, avatar_url)
                    )
                `)
                .eq('game_id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
                .eq('session_players.deck_id', deckId) // Filter by deck ID in nested table
                .order('played_at', { ascending: false });

            if (error) {
                console.error('Error fetching deck stats:', error);
            } else if (data) {
                // Formatting data structure to match expected RawSessionData
                // Note: when using !inner join, only matching rows are returned.
                // However, we need ALL players in the session to calculate context if needed,
                // but for Deck Stats we mostly care about the deck's performance itself.
                // BUT `calculateDeckStats` iterates session.session_players to find the deck.
                // If we filter !inner, we might get partial sessions if only one player used the deck?
                // Wait, `!inner` on `session_players` means "return sessions that have AT LEAST ONE player with this deck".
                // AND it filters the nested `session_players` array to only show matching rows?
                // Supabase/Postgrest behavior: filtering on nested resource usually filters the top level resource, 
                // but depending on client version it might also filter the nested collection.
                // Re-safing: let's fetch the sessions first by ID if needed, or assume the data structure is fine.
                // Actually to be safe and accurate about "wins" (did I win vs others?), we technically need the whole session?
                // But `calculateDeckStats` only looks at the player who played the deck to see if `is_winner` is true.
                // It doesn't compare vs others scores (yet). So fetching only the specific player row in the session is "okay" 
                // BUT `calculateDeckStats` expects `session.session_players` array.
                // If Supabase returns only the specific player in that array, `find(p => p.deck_id === deckId)` will still work.

                // Let's check if we need full context.
                // The current `calculateDeckStats` logic:
                // `const player = session.session_players.find(p => p.deck_id === deckId);`
                // So as long as that player is in the list, it works.

                const formattedSessions = data.map((s: any) => ({
                    ...s,
                    session_players: s.session_players
                })) as RawSessionData[];

                const calculatedStats = calculateDeckStats(formattedSessions, deckId);
                setStats(calculatedStats);
                setRecentSessions(formattedSessions.slice(0, 5));
            }
            setLoading(false);
        };

        fetchStats();
    }, [deckId]);

    return { stats, loading, recentSessions };
}
