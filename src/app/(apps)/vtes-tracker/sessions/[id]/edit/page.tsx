'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { ArrowLeft, Swords, Trophy, Loader2, User, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';

interface PlayerEntry {
    id: string;
    name: string;
    deckId: string | null;
    deckName: string;
    vp: string;
    seatPosition: number;
    isCurrentUser: boolean;
    userId: string | null;
}

interface DbSessionPlayer {
    user_id: string;
    score: number;
    deck_id: string | null;
    deck_name: string | null;
    seat_position: number;
    profile: { display_name: string | null; username: string } | null;
}

interface DbGuestPlayer {
    name: string;
    score: number;
    deck_id: string | null;
    deck_name: string | null;
    seat_position: number;
}

interface SessionPlayerInsert {
    session_id: string;
    user_id: string;
    score: number;
    is_winner: boolean;
    deck_id: string | null;
    deck_name: string | null;
    seat_position: number;
}

interface GuestPlayerInsert {
    session_id: string;
    name: string;
    score: number;
    is_winner: boolean;
    deck_id: string | null;
    deck_name: string | null;
    seat_position: number;
}

type GameType = 'casual' | 'tournament_prelim' | 'tournament_final' | 'league';

export default function EditVTESSessionPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [playedAt, setPlayedAt] = useState('');
    const [durationMinutes, setDurationMinutes] = useState<string>('120');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [gameType, setGameType] = useState<GameType>('casual');
    const [tableSwept, setTableSwept] = useState(false);
    const [players, setPlayers] = useState<PlayerEntry[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [availableDecks, setAvailableDecks] = useState<{
        id: string;
        name: string;
        is_public: boolean;
        user_id: string;
        owner_name: string;
    }[]>([]);
    const [registeredUsers, setRegisteredUsers] = useState<{
        id: string;
        name: string;
    }[]>([]);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUserId(user.id);

            // Fetch all decks with owner info
            const { data: decks } = await supabase
                .from('decks')
                .select(`
                    id, name, is_public, user_id,
                    profile:profiles (display_name, username)
                `)
                .order('name');

            if (decks) {
                const formattedDecks = decks.map(d => {
                    const profile = d.profile as unknown as { display_name: string | null; username: string } | null;
                    return {
                        id: d.id,
                        name: d.name,
                        is_public: d.is_public ?? true,
                        user_id: d.user_id,
                        owner_name: profile?.display_name || profile?.username || 'Unknown',
                    };
                });
                setAvailableDecks(formattedDecks);
            }

            // Fetch registered users for player dropdown
            const { data: users } = await supabase
                .from('profiles')
                .select('id, display_name, username')
                .neq('id', user.id) // Exclude current user
                .order('display_name');

            if (users) {
                setRegisteredUsers(users.map(u => ({
                    id: u.id,
                    name: u.display_name || u.username || 'Unknown',
                })));
            }

            // Fetch Session Data
            const { data: session, error: sessionError } = await supabase
                .from('sessions')
                .select(`
                    *,
                    session_players (
                        *,
                        profile:profiles(display_name, username)
                    ),
                    guest_players (*)
                `)
                .eq('id', params.id)
                .single();

            if (sessionError || !session) {
                console.error('Error fetching session:', sessionError);
                setError('Session not found or you do not have permission.');
                setLoading(false);
                return;
            }

            // Check ownership
            if (session.created_by !== user.id) {
                setError('You can only edit sessions you created.');
                setLoading(false);
                return;
            }

            // Populate Form
            setPlayedAt(session.played_at.split('T')[0]);
            setDurationMinutes(session.duration_minutes?.toString() || '120');
            setLocation(session.location || '');
            setNotes(session.notes || '');
            setGameType(session.game_type as GameType || 'casual');
            setTableSwept(session.table_swept || false);

            // Populate Players - Merge registered and guest
            const registered: PlayerEntry[] = ((session.session_players || []) as DbSessionPlayer[]).map((p) => ({
                id: crypto.randomUUID(),
                name: p.profile?.display_name || p.profile?.username || 'Unknown',
                deckId: p.deck_id,
                deckName: p.deck_name || '',
                vp: p.score.toString(),
                seatPosition: p.seat_position,
                isCurrentUser: p.user_id === user.id,
                userId: p.user_id,
            }));

            const guests: PlayerEntry[] = ((session.guest_players || []) as DbGuestPlayer[]).map((p) => ({
                id: crypto.randomUUID(),
                name: p.name,
                deckId: p.deck_id,
                deckName: p.deck_name || '',
                vp: p.score.toString(),
                seatPosition: p.seat_position,
                isCurrentUser: false,
                userId: null,
            }));

            const allPlayers = [...registered, ...guests].sort((a, b) => a.seatPosition - b.seatPosition);
            setPlayers(allPlayers);
            setLoading(false);
        };

        if (params.id) init();
    }, [params.id]);

    const updatePlayer = (id: string, field: keyof PlayerEntry, value: string) => {
        setPlayers(players.map(p => {
            if (p.id === id) {
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    const removePlayer = (id: string) => {
        if (players.length <= 3) return;
        setPlayers(players.filter(p => p.id !== id));
    };

    const addPlayer = () => {
        if (players.length >= 6) return;
        setPlayers([...players, {
            id: crypto.randomUUID(),
            name: '',
            deckId: null,
            deckName: '',
            vp: '',
            seatPosition: players.length + 1,
            isCurrentUser: false,
            userId: null,
        }]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation: ALL player seats must have a player assigned
        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            if (!p.isCurrentUser && !p.userId && !p.name.trim()) {
                setError(`Seat ${i + 1} needs a player. Select a registered player or enter a guest name.`);
                return;
            }
        }

        // Validate decks
        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            if (!p.deckId && !p.deckName.trim()) {
                const playerName = p.isCurrentUser ? 'You' : (p.name || `Seat ${i + 1}`);
                setError(`${playerName} needs a deck selected. Choose a deck or select "Unknown".`);
                return;
            }
        }

        setSaving(true);

        try {
            const validPlayers = players;

            // Calculate winner(s)
            const maxVP = Math.max(...validPlayers.map(p => parseFloat(p.vp || '0')));

            // Update Session
            const { error: sessionError } = await supabase
                .from('sessions')
                .update({
                    played_at: playedAt,
                    duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
                    location: location || null,
                    notes: notes || null,
                    game_type: gameType,
                    time_limit_minutes: durationMinutes ? parseInt(durationMinutes) : 120,
                    table_swept: tableSwept,
                })
                .eq('id', params.id);

            if (sessionError) throw sessionError;

            // Update Players: Simplest strategy is Delete All & Re-insert to handle seat changes/removals easily
            // Note: This loses 'session_players.id' stability but simplifies logic significantly
            const { error: deleteError } = await supabase
                .from('session_players')
                .delete()
                .eq('session_id', params.id);

            if (deleteError) throw deleteError;

            // Also delete guest players if separate table used (but current logic seems to mix them?)
            // Checking the migration, guest_players exists. We should clear both.
            await supabase.from('guest_players').delete().eq('session_id', params.id);

            // Re-insert Players
            const playersToInsert: SessionPlayerInsert[] = [];
            const guestPlayersToInsert: GuestPlayerInsert[] = [];

            const sessionId = params.id as string;
            validPlayers.forEach((p, index) => {
                const isWinner = parseFloat(p.vp || '0') === maxVP && maxVP > 0;

                if (p.userId) {
                    playersToInsert.push({
                        session_id: sessionId,
                        user_id: p.userId,
                        score: parseFloat(p.vp || '0'),
                        is_winner: isWinner,
                        deck_id: p.deckId || null,
                        deck_name: p.deckName || null,
                        seat_position: index + 1,
                    });
                } else {
                    guestPlayersToInsert.push({
                        session_id: sessionId,
                        name: p.name,
                        score: parseFloat(p.vp || '0'),
                        is_winner: isWinner,
                        deck_id: p.deckId || null,
                        deck_name: p.deckName || null,
                        seat_position: index + 1,
                    });
                }
            });

            if (playersToInsert.length > 0) {
                await supabase.from('session_players').insert(playersToInsert);
            }
            if (guestPlayersToInsert.length > 0) {
                await supabase.from('guest_players').insert(guestPlayersToInsert);
            }

            router.push(`/vtes-tracker/sessions/${params.id}`);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to update session');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-500" /></div>
            </AppLayout>
        );
    }

    if (error && !saving) {
        return (
            <AppLayout>
                <div className="max-w-2xl mx-auto py-10 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <Link href={`/vtes-tracker/sessions/${params.id}`}>
                        <Button>Back to Session</Button>
                    </Link>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={`/vtes-tracker/sessions/${params.id}`}>
                        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                            Cancel Edit
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-red-100 flex items-center gap-2">
                            <Swords className="h-6 w-6 text-red-500" />
                            Edit Struggle
                        </h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Game Info */}
                    <Card variant="glass" className="border-red-500/20 bg-red-900/10">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Date"
                                type="date"
                                value={playedAt}
                                onChange={(e) => setPlayedAt(e.target.value)}
                            />
                            <Input
                                label="Time Limit (min)"
                                type="number"
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(e.target.value)}
                            />
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">Game Type</label>
                                <select
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                    value={gameType}
                                    onChange={(e) => setGameType(e.target.value as GameType)}
                                >
                                    <option value="casual">Casual</option>
                                    <option value="league">League</option>
                                    <option value="tournament_prelim">Tournament Prelim</option>
                                    <option value="tournament_final">Tournament Final</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer px-3 py-2">
                                    <input
                                        type="checkbox"
                                        checked={tableSwept}
                                        onChange={(e) => setTableSwept(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-red-500 focus:ring-red-500"
                                    />
                                    <span className="text-slate-300">Table Sweep</span>
                                </label>
                            </div>
                            <div className="col-span-2">
                                <Input
                                    label="Location"
                                    placeholder="Elysium / Prince's Haven"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Table Seating & Decks */}
                    <Card variant="glass">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-100">Seating (Order of Play)</h2>
                            <div className="text-sm text-slate-400">
                                {players.length} Methuselahs
                                {players.length < 5 && <button type="button" onClick={addPlayer} className="ml-2 text-red-400 hover:underline">+ Add Seat</button>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {players.map((player, index) => (
                                <div key={player.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 relative group">
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-400">
                                        {index + 1}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 ml-2">
                                        {/* Name */}
                                        <div className="md:col-span-4">
                                            <label className="text-xs text-slate-500 mb-1 block">Methuselah</label>
                                            {player.isCurrentUser ? (
                                                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-300">
                                                    <User className="h-4 w-4" />
                                                    {player.name} (You)
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <select
                                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                                        value={player.userId || '__GUEST__'}
                                                        onChange={(e) => {
                                                            const selectedUser = registeredUsers.find(u => u.id === e.target.value);
                                                            setPlayers(players.map(p => {
                                                                if (p.id === player.id) {
                                                                    if (e.target.value === '__GUEST__') {
                                                                        return { ...p, userId: null, name: '' };
                                                                    }
                                                                    return {
                                                                        ...p,
                                                                        userId: e.target.value,
                                                                        name: selectedUser?.name || ''
                                                                    };
                                                                }
                                                                return p;
                                                            }));
                                                        }}
                                                    >
                                                        <option value="__GUEST__">Guest (type name below)</option>
                                                        {registeredUsers
                                                            .filter(u => {
                                                                // Keep this user if they're the current player's selection
                                                                if (u.id === player.userId) return true;
                                                                // Filter out users already selected by other players
                                                                const usedByOther = players.some(p => p.id !== player.id && p.userId === u.id);
                                                                return !usedByOther;
                                                            })
                                                            .map(u => (
                                                            <option key={u.id} value={u.id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                    {!player.userId && (
                                                        <input
                                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                                            placeholder="Guest name"
                                                            value={player.name}
                                                            onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Deck */}
                                        <div className="md:col-span-4">
                                            <label className="text-xs text-slate-500 mb-1 block">Deck Played</label>
                                            <div className="space-y-2">
                                                <select
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                                    value={player.deckId || (player.deckName === 'Unknown' ? '__UNKNOWN__' : '')}
                                                    onChange={(e) => {
                                                        if (e.target.value === '__UNKNOWN__') {
                                                            setPlayers(players.map(p => {
                                                                if (p.id === player.id) {
                                                                    return { ...p, deckId: null, deckName: 'Unknown' };
                                                                }
                                                                return p;
                                                            }));
                                                            return;
                                                        }
                                                        const selectedDeck = availableDecks.find(d => d.id === e.target.value);
                                                        setPlayers(players.map(p => {
                                                            if (p.id === player.id) {
                                                                return {
                                                                    ...p,
                                                                    deckId: e.target.value || null,
                                                                    deckName: selectedDeck?.name || ''
                                                                };
                                                            }
                                                            return p;
                                                        }));
                                                    }}
                                                >
                                                    <option value="">-- Select Deck --</option>
                                                    <option value="__UNKNOWN__">❓ Unknown deck</option>
                                                    {availableDecks
                                                        .filter(d => {
                                                            // Keep this deck if it's the current player's selection
                                                            if (d.id === player.deckId) return true;
                                                            // Filter out decks already selected by other players
                                                            const usedByOther = players.some(p => p.id !== player.id && p.deckId === d.id);
                                                            return !usedByOther;
                                                        })
                                                        .map(d => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.is_public ? '' : '🔒 '}{d.name} ({d.owner_name})
                                                        </option>
                                                    ))}
                                                </select>
                                                {!player.deckId && player.deckName !== 'Unknown' && (
                                                    <input
                                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                                        placeholder="Or enter deck name manually"
                                                        value={player.deckName}
                                                        onChange={(e) => updatePlayer(player.id, 'deckName', e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* VP */}
                                        <div className="md:col-span-3">
                                            <label className="text-xs text-slate-500 mb-1 block">Victory Points</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                                    placeholder="0"
                                                    value={player.vp}
                                                    onChange={(e) => updatePlayer(player.id, 'vp', e.target.value)}
                                                />
                                                {parseFloat(player.vp || '0') >= 1.5 && <Trophy className="h-5 w-5 text-amber-500" />}
                                            </div>
                                        </div>

                                        {/* Remove */}
                                        <div className="md:col-span-1 flex items-end justify-center pb-2">
                                            {!player.isCurrentUser && players.length > 3 && (
                                                <button type="button" onClick={() => removePlayer(player.id)} className="text-slate-600 hover:text-red-400">
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Notes */}
                    <Card variant="glass">
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">Chronicle Notes</h2>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any notable plays, table talk, or events?"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                        />
                    </Card>

                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200">
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <Link href={`/vtes-tracker/sessions/${params.id}`}>
                            <Button variant="ghost" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={saving} leftIcon={<Save className="h-4 w-4" />}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>

                </form>
            </div>
        </AppLayout>
    );
}
