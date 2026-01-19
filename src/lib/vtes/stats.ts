
export interface RawSessionPlayer {
    user_id: string | null;
    score: number;
    is_winner: boolean;
    deck_name?: string | null;
    deck_id?: string | null;
    profile: {
        display_name: string;
        username: string;
        avatar_url?: string;
    } | null;
}

export interface RawSessionData {
    id: string;
    played_at: string;
    game_type: string | null;
    session_players: RawSessionPlayer[];
}

export interface LeaderboardEntry {
    userId: string;
    name: string;
    totalVp: number;
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    vpPerGame: number;
}

export function calculateVtesLeaderboard(
    sessions: RawSessionData[],
    period: 'all' | 'month' | 'year' = 'all',
    dateFrom?: string
): LeaderboardEntry[] {
    const playerMap = new Map<string, LeaderboardEntry>();

    sessions.forEach(session => {
        // Date Filtering
        if (dateFrom && session.played_at < dateFrom) return;

        if (period !== 'all') {
            const date = new Date(session.played_at);
            const now = new Date();

            if (period === 'month') {
                if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return;
            } else if (period === 'year') {
                if (date.getFullYear() !== now.getFullYear()) return;
            }
        }

        // Process Players
        session.session_players.forEach(player => {
            if (!player.user_id) return; // Skip guests for now or handle them separately if needed

            if (!playerMap.has(player.user_id)) {
                const name = player.profile?.display_name || player.profile?.username || 'Unknown';
                playerMap.set(player.user_id, {
                    userId: player.user_id,
                    name,
                    totalVp: 0,
                    gamesPlayed: 0,
                    gamesWon: 0,
                    winRate: 0,
                    vpPerGame: 0
                });
            }

            const stats = playerMap.get(player.user_id)!;
            stats.gamesPlayed += 1;
            stats.totalVp += player.score;
            if (player.is_winner) {
                stats.gamesWon += 1;
            }
        });
    });

    // Calculate derived stats and sort
    return Array.from(playerMap.values())
        .map(entry => ({
            ...entry,
            winRate: entry.gamesPlayed > 0 ? (entry.gamesWon / entry.gamesPlayed) * 100 : 0,
            vpPerGame: entry.gamesPlayed > 0 ? entry.totalVp / entry.gamesPlayed : 0
        }))
        .sort((a, b) => {
            if (b.totalVp !== a.totalVp) return b.totalVp - a.totalVp;
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            return b.gamesPlayed - a.gamesPlayed;
        });
}

export interface DeckStat {
    deckId: string;
    deckName: string;
    gamesPlayed: number;
    gamesWon: number;
    totalVp: number;
    averageVp: number;
    winRate: number;
}

export interface PlayerStats {
    userId: string;
    name: string;
    gamesPlayed: number;
    gamesWon: number;
    totalVp: number;
    winRate: number;
    favoriteDeck?: DeckStat;
    bestDeck?: DeckStat;
    worstDeck?: DeckStat;
    decks: DeckStat[];
}

export function calculatePlayerStats(
    sessions: RawSessionData[],
    userId: string
): PlayerStats | null {
    // Filter sessions where the user played
    const userSessions = sessions.filter(s =>
        s.session_players.some(p => p.user_id === userId)
    );

    if (userSessions.length === 0) return null;

    let totalVp = 0;
    let gamesWon = 0;
    let playerName = '';
    const deckStatsMap = new Map<string, DeckStat>();

    userSessions.forEach(session => {
        const player = session.session_players.find(p => p.user_id === userId);
        if (!player) return;

        // Basic Stats
        totalVp += player.score;
        if (player.is_winner) gamesWon++;
        if (!playerName && player.profile) {
            playerName = player.profile.display_name || player.profile.username;
        }

        // Deck Stats
        if (player.deck_id && player.deck_name) {
            if (!deckStatsMap.has(player.deck_id)) {
                deckStatsMap.set(player.deck_id, {
                    deckId: player.deck_id,
                    deckName: player.deck_name,
                    gamesPlayed: 0,
                    gamesWon: 0,
                    totalVp: 0,
                    averageVp: 0,
                    winRate: 0
                });
            }
            const deckStat = deckStatsMap.get(player.deck_id)!;
            deckStat.gamesPlayed++;
            deckStat.totalVp += player.score;
            if (player.is_winner) deckStat.gamesWon++;
        }
    });

    // Calculate averages for decks
    const decks = Array.from(deckStatsMap.values()).map(d => ({
        ...d,
        averageVp: d.totalVp / d.gamesPlayed,
        winRate: d.gamesPlayed > 0 ? (d.gamesWon / d.gamesPlayed) * 100 : 0
    }));

    // Sort to find Best and Worst (min 3 games played)
    const significantDecks = decks.filter(d => d.gamesPlayed >= 3);
    const sortedByPerformance = significantDecks.length > 0
        ? [...significantDecks].sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed)
        : [...decks].sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed);

    const bestDeck = sortedByPerformance.length > 0 ? sortedByPerformance[0] : undefined;
    const worstDeck = sortedByPerformance.length > 0 ? sortedByPerformance[sortedByPerformance.length - 1] : undefined;

    // Original favorite deck logic preserved
    // Find Favorite Deck (most played)
    const favoriteDeck = decks.length > 0
        ? decks.sort((a, b) => b.gamesPlayed - a.gamesPlayed)[0]
        : undefined;

    return {
        userId,
        name: playerName || 'Unknown',
        gamesPlayed: userSessions.length,
        gamesWon,
        totalVp,
        winRate: (gamesWon / userSessions.length) * 100,
        favoriteDeck,
        bestDeck,
        worstDeck,
        decks
    };
}

export interface DeckPilot {
    userId: string;
    name: string;
    gamesPlayed: number;
    gamesWon: number;
    totalVp: number;
}

export interface GlobalDeckStats extends DeckStat {
    pilots: DeckPilot[];
}

export function calculateDeckStats(
    sessions: RawSessionData[],
    deckId: string
): GlobalDeckStats | null {
    let gamesPlayed = 0;
    let gamesWon = 0;
    let totalVp = 0;
    let deckName = '';
    const pilotsMap = new Map<string, DeckPilot>();

    sessions.forEach(session => {
        // Handle potential mirror matches or shared decks by finding ALL plays of this deck
        const players = session.session_players.filter(p => p.deck_id === deckId);

        players.forEach(player => {
            // Basic Stats
            gamesPlayed++;
            totalVp += player.score;
            if (player.is_winner) gamesWon++;

            if (!deckName && player.deck_name) {
                deckName = player.deck_name;
            }

            // Pilot Stats
            if (player.user_id) {
                if (!pilotsMap.has(player.user_id)) {
                    const name = player.profile?.display_name || player.profile?.username || 'Unknown';
                    pilotsMap.set(player.user_id, {
                        userId: player.user_id,
                        name,
                        gamesPlayed: 0,
                        gamesWon: 0,
                        totalVp: 0
                    });
                }
                const pilotStat = pilotsMap.get(player.user_id)!;
                pilotStat.gamesPlayed++;
                pilotStat.totalVp += player.score;
                if (player.is_winner) pilotStat.gamesWon++;
            }
        });
    });

    if (gamesPlayed === 0) return null;

    return {
        deckId,
        deckName: deckName || 'Unknown Deck',
        gamesPlayed,
        gamesWon,
        totalVp,
        averageVp: totalVp / gamesPlayed,
        winRate: (gamesWon / gamesPlayed) * 100,
        pilots: Array.from(pilotsMap.values()).sort((a, b) => b.gamesPlayed - a.gamesPlayed)
    };
}
