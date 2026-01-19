import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export interface SessionPlayer {
    score: number;
    is_winner: boolean;
    deck_name: string | null;
    seat_position: number | null;
    user_id: string | null;
    deck_id: string | null;
    profile: {
        display_name: string;
        username: string;
    } | null;
    guest_name: string | null;
}

export interface Session {
    id: string;
    played_at: string;
    location: string | null;
    notes: string | null;
    game_type: 'casual' | 'tournament_prelim' | 'tournament_final' | 'league' | null;
    table_swept: boolean | null;
    players: SessionPlayer[];
}

export interface VtesSessionFilters {
    playerId: string;
    deckId: string;
    gameType: 'all' | 'casual' | 'tournament_prelim' | 'tournament_final' | 'league';
    dateFrom: string;
    dateTo: string;
    onlyMyGames: boolean;
}

export function useVtesSessions() {
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [filters, setFilters] = useState<VtesSessionFilters>({
        playerId: 'all',
        deckId: 'all',
        gameType: 'all',
        dateFrom: '',
        dateTo: '',
        onlyMyGames: false
    });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchSessions = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            const { data: sessionsData, error } = await supabase
                .from('sessions')
                .select(`
                    id, played_at, location, notes, game_type, table_swept,
                    session_players (
                        score, is_winner, deck_name, seat_position, user_id, deck_id,
                        profile:profiles (display_name, username)
                    ),
                    guest_players (
                        score, is_winner, deck_name, seat_position, name, deck_id
                    )
                `)
                .eq('game_id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') // VTES Game ID
                .order('played_at', { ascending: false });

            if (error) {
                console.error('Error fetching sessions:', error);
            } else {
                const formatted = sessionsData.map((s: any) => {
                    const registered = s.session_players.map((sp: any) => ({
                        score: sp.score,
                        is_winner: sp.is_winner,
                        deck_name: sp.deck_name,
                        seat_position: sp.seat_position,
                        user_id: sp.user_id,
                        deck_id: sp.deck_id,
                        profile: sp.profile,
                        guest_name: null
                    }));
                    const guests = s.guest_players.map((gp: any) => ({
                        score: gp.score,
                        is_winner: gp.is_winner,
                        deck_name: gp.deck_name,
                        seat_position: gp.seat_position,
                        user_id: null,
                        deck_id: gp.deck_id,
                        profile: null,
                        guest_name: gp.name
                    }));
                    const allPlayers = [...registered, ...guests].sort((a, b) =>
                        (a.seat_position || 99) - (b.seat_position || 99)
                    );
                    return { ...s, players: allPlayers };
                });
                setAllSessions(formatted);
            }
            setLoading(false);
        };

        fetchSessions();
    }, []);

    const filteredSessions = useMemo(() => {
        let result = [...allSessions];

        // Filter: My Games
        if (filters.onlyMyGames && currentUserId) {
            result = result.filter(s =>
                s.players.some(p => p.user_id === currentUserId)
            );
        }

        // Filter: Game Type
        if (filters.gameType !== 'all') {
            result = result.filter(s => s.game_type === filters.gameType);
        }

        // Filter: Date Range
        if (filters.dateFrom) {
            result = result.filter(s => s.played_at >= filters.dateFrom);
        }
        if (filters.dateTo) {
            result = result.filter(s => s.played_at <= filters.dateTo);
        }

        // Filter: Player
        if (filters.playerId && filters.playerId !== 'all') {
            result = result.filter(s =>
                s.players.some(p => p.user_id === filters.playerId)
            );
        }

        // Filter: Deck
        if (filters.deckId && filters.deckId !== 'all') {
            result = result.filter(s =>
                s.players.some(p => p.deck_id === filters.deckId)
            );
        }

        return result;
    }, [allSessions, filters, currentUserId]);

    // Extract unique players and decks for filter dropdowns
    const availablePlayers = useMemo(() => {
        const playersMap = new Map();
        allSessions.forEach(session => {
            session.players.forEach(p => {
                if (p.user_id && p.profile) {
                    playersMap.set(p.user_id, p.profile.display_name || p.profile.username);
                }
            });
        });
        return Array.from(playersMap.entries()).map(([id, name]) => ({ id, name }));
    }, [allSessions]);

    // Extract unique decks for filter dropdowns
    const availableDecks = useMemo(() => {
        const decksMap = new Map();
        allSessions.forEach(session => {
            session.players.forEach(p => {
                if (p.deck_id && p.deck_name) {
                    decksMap.set(p.deck_id, p.deck_name);
                }
            });
        });
        return Array.from(decksMap.entries()).map(([id, name]) => ({ id, name }));
    }, [allSessions]);

    return {
        sessions: filteredSessions,
        loading,
        filters,
        setFilters,
        currentUserId,
        availablePlayers,
        availableDecks,
        totalSessions: allSessions.length
    };
}
