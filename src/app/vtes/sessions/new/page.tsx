'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { ArrowLeft, Swords, Trophy, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface PlayerEntry {
    id: string;
    name: string;
    deckId: string | null;    // Link to deck table
    deckName: string;         // Fallback text name
    vp: string;               // Victory Points (0-5 typically)
    seatPosition: number;     // 1-6
    isCurrentUser: boolean;
    userId: string | null;
}

type GameType = 'casual' | 'tournament_prelim' | 'tournament_final' | 'league';

const VTES_GAME_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

export default function NewVTESSessionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [playedAt, setPlayedAt] = useState(new Date().toISOString().split('T')[0]);
    const [durationMinutes, setDurationMinutes] = useState<string>('120'); // Standard VTES time limit
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [gameType, setGameType] = useState<GameType>('casual');
    const [tableSwept, setTableSwept] = useState(false);
    const [players, setPlayers] = useState<PlayerEntry[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [availableDecks, setAvailableDecks] = useState<{ id: string; name: string }[]>([]);

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

            // Get user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, username')
                .eq('id', user.id)
                .single();

            const userName = profile?.display_name || profile?.username || 'You';

            // Fetch user's decks
            const { data: decks } = await supabase
                .from('decks')
                .select('id, name')
                .eq('user_id', user.id)
                .order('name');

            if (decks) setAvailableDecks(decks);

            // Initialize with 5 players (standard VTES table)
            const initialPlayers: PlayerEntry[] = Array.from({ length: 5 }).map((_, i) => ({
                id: crypto.randomUUID(),
                name: i === 0 ? userName : '',
                deckId: null,
                deckName: '',
                vp: '',
                seatPosition: i + 1,
                isCurrentUser: i === 0,
                userId: i === 0 ? user.id : null,
            }));

            setPlayers(initialPlayers);
            setLoading(false);
        };

        init();
    }, []);

    const updatePlayer = (id: string, field: keyof PlayerEntry, value: string) => {
        setPlayers(players.map(p => {
            if (p.id === id) {
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    const removePlayer = (id: string) => {
        if (players.length <= 3) return; // Min 3 players for VTES
        setPlayers(players.filter(p => p.id !== id));
    };

    const addPlayer = () => {
        if (players.length >= 6) return; // Rare to have >6
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
        setSaving(true);

        try {
            const validPlayers = players.filter(p => p.name.trim() || p.isCurrentUser);

            // Calculate winner(s) based on VP
            const maxVP = Math.max(...validPlayers.map(p => parseFloat(p.vp || '0')));
            const winners = validPlayers.filter(p => parseFloat(p.vp || '0') === maxVP && maxVP > 0);
            const winnerIds = new Set(winners.map(p => p.id));

            // Get or create group (reuse logic or simplify to default group)
            const { data: memberships } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', currentUserId)
                .limit(1);

            const groupId = memberships?.[0]?.group_id;

            if (!groupId) {
                // Fallback create group if none exists (simplified)
                throw new Error("No group found. Please create a group first.");
            }

            // Create Session with VTES-specific fields
            const { data: session, error: sessionError } = await supabase
                .from('sessions')
                .insert({
                    group_id: groupId,
                    game_id: VTES_GAME_ID,
                    played_at: playedAt,
                    duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
                    location: location || null,
                    notes: notes || null,
                    created_by: currentUserId,
                    game_type: gameType,
                    time_limit_minutes: durationMinutes ? parseInt(durationMinutes) : 120,
                    table_swept: tableSwept,
                })
                .select('id')
                .single();

            if (sessionError) throw sessionError;

            // Insert Players with deck_id and seat_position
            const currentUserPlayer = validPlayers.find(p => p.isCurrentUser);
            if (currentUserPlayer) {
                await supabase.from('session_players').insert({
                    session_id: session.id,
                    user_id: currentUserId,
                    score: parseFloat(currentUserPlayer.vp || '0'),
                    is_winner: winnerIds.has(currentUserPlayer.id),
                    deck_id: currentUserPlayer.deckId || null,
                    deck_name: currentUserPlayer.deckName || null,
                    seat_position: currentUserPlayer.seatPosition,
                });
            }

            const guestPlayers = validPlayers.filter(p => !p.isCurrentUser && p.name.trim());
            if (guestPlayers.length > 0) {
                await supabase.from('guest_players').insert(guestPlayers.map(p => ({
                    session_id: session.id,
                    name: p.name,
                    score: parseFloat(p.vp || '0'),
                    is_winner: winnerIds.has(p.id),
                    deck_id: p.deckId || null,
                    deck_name: p.deckName || null,
                    seat_position: p.seatPosition,
                })));
            }

            router.push('/vtes');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to save session');
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

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/vtes">
                        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                            Back to Domain
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-red-100 flex items-center gap-2">
                            <Swords className="h-6 w-6 text-red-500" />
                            Log Struggle
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
                                                <input
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                                    placeholder="Name"
                                                    value={player.name}
                                                    onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                                                />
                                            )}
                                        </div>

                                        {/* Deck */}
                                        <div className="md:col-span-4">
                                            <label className="text-xs text-slate-500 mb-1 block">Deck Played</label>
                                            {player.isCurrentUser && availableDecks.length > 0 ? (
                                                <div className="space-y-2">
                                                    <select
                                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                                        value={player.deckId || ''}
                                                        onChange={(e) => {
                                                            const selectedDeck = availableDecks.find(d => d.id === e.target.value);
                                                            setPlayers(players.map(p => {
                                                                if (p.id === player.id) {
                                                                    return {
                                                                        ...p,
                                                                        deckId: e.target.value || null,
                                                                        deckName: selectedDeck?.name || p.deckName
                                                                    };
                                                                }
                                                                return p;
                                                            }));
                                                        }}
                                                    >
                                                        <option value="">-- Select Deck --</option>
                                                        {availableDecks.map(d => (
                                                            <option key={d.id} value={d.id}>{d.name}</option>
                                                        ))}
                                                    </select>
                                                    {!player.deckId && (
                                                        <input
                                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                                            placeholder="Or enter deck name"
                                                            value={player.deckName}
                                                            onChange={(e) => updatePlayer(player.id, 'deckName', e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <input
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                                    placeholder="Deck Name"
                                                    value={player.deckName}
                                                    onChange={(e) => updatePlayer(player.id, 'deckName', e.target.value)}
                                                />
                                            )}
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

                    {error && <div className="text-red-400 text-center">{error}</div>}

                    <div className="flex justify-end gap-3">
                        <Link href="/vtes">
                            <Button variant="ghost" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={saving}>
                            {saving ? 'Recording Struggle...' : 'Record Struggle'}
                        </Button>
                    </div>

                </form>
            </div>
        </AppLayout>
    );
}
