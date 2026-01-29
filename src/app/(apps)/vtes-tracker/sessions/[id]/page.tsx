'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { ArrowLeft, Calendar, MapPin, Trophy, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';

interface VtesSessionPlayer {
    id: string;
    user_id: string | null;
    score: number | null;
    is_winner: boolean;
    deck_name: string | null;
    deck_id: string | null;
    seat_position: number;
    profile: { display_name: string | null; username: string } | null;
    deck: { name: string } | null;
}

interface VtesGuestPlayer {
    id: string;
    name: string;
    score: number | null;
    is_winner: boolean;
    seat_position: number;
}

interface VtesSession {
    id: string;
    played_at: string;
    location: string | null;
    game_type: string | null;
    notes: string | null;
    created_by: string;
    session_players: VtesSessionPlayer[];
    guest_players: VtesGuestPlayer[];
}

export default function SessionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [session, setSession] = useState<VtesSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            const { data, error } = await supabase
                .from('sessions')
                .select(`
                    *,
                    session_players (
                        *,
                        profile:profiles(display_name, username),
                        deck:decks(name)
                    ),
                    guest_players (*)
                `)
                .eq('id', params.id)
                .single();

            if (error) {
                console.error('Error fetching session:', error);
            } else {
                setSession(data);
            }
            setLoading(false);
        };

        if (params.id) fetchSession();
    }, [params.id]);

    const handleDelete = async () => {
        if (deleteConfirmText !== 'DELETE') return;

        setIsDeleting(true);
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', params.id);

        if (error) {
            alert('Error deleting session');
            console.error(error);
            setIsDeleting(false);
        } else {
            router.push('/vtes-tracker/sessions');
        }
    };

    const openDeleteModal = () => {
        setDeleteConfirmText('');
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteConfirmText('');
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-20 text-slate-500">Loading details...</div>
            </AppLayout>
        );
    }

    if (!session) {
        return (
            <AppLayout>
                <div className="flex justify-center py-20 text-slate-500">Session not found.</div>
            </AppLayout>
        );
    }

    const isCreator = currentUserId === session.created_by;
    const isPlayer = session.session_players?.some(p => p.user_id === currentUserId);
    const canEdit = isCreator || isPlayer;

    // Sort and merge registered and guest players
    const registered = (session.session_players || []).map((p) => ({
        ...p,
        isGuest: false as const
    }));

    const guests = (session.guest_players || []).map((p) => ({
        ...p,
        profile: null,
        user_id: null,
        isGuest: true as const,
        guest_name: p.name
    }));

    const sortedPlayers = [...registered, ...guests].sort((a, b) => a.seat_position - b.seat_position);

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/vtes-tracker/sessions">
                            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-100">Session Details</h1>
                            <div className="text-slate-400 text-sm flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(session.played_at), 'MMMM d, yyyy, h:mm a')}
                            </div>
                        </div>
                    </div>

                    {(canEdit || isCreator) && (
                        <div className="flex gap-2">
                            {canEdit && (
                                <Link href={`/vtes-tracker/sessions/${params.id}/edit`}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        leftIcon={<Edit className="h-4 w-4" />}
                                    >
                                        Edit
                                    </Button>
                                </Link>
                            )}
                            {isCreator && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    leftIcon={<Trash2 className="h-4 w-4" />}
                                    onClick={openDeleteModal}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Info Card */}
                <Card variant="glass" className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Game Type</span>
                            <span className="text-lg font-medium text-slate-200 capitalize">{session.game_type || 'Casual'}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Location</span>
                            <div className="flex items-center gap-2 text-slate-200">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                {session.location || 'Unknown Location'}
                            </div>
                        </div>
                        {session.notes && (
                            <div className="md:col-span-2">
                                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Notes</span>
                                <p className="text-slate-300 bg-slate-900/40 p-3 rounded-lg text-sm">
                                    {session.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Players Table */}
                    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
                        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider">Methuselahs</h3>
                            <span className="text-xs text-slate-500">{sortedPlayers.length} Players</span>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-center w-12">Seat</th>
                                    <th className="px-4 py-3">Player</th>
                                    <th className="px-4 py-3">Deck</th>
                                    <th className="px-4 py-3 text-center">Score</th>
                                    <th className="px-4 py-3 text-center w-24">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {sortedPlayers.map((player) => (
                                    <tr key={player.id} className={player.is_winner ? "bg-amber-500/5" : ""}>
                                        <td className="px-4 py-3 text-center">
                                            {player.seat_position ? (
                                                <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 mx-auto flex items-center justify-center text-xs font-bold">
                                                    {player.seat_position}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-200">
                                            {player.isGuest
                                                ? player.guest_name
                                                : (player.profile?.display_name || player.profile?.username || 'Unknown')}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400">
                                            {!player.isGuest && player.deck ? (
                                                <Link href={`/vtes-tracker/decks/${player.deck_id}`} className="hover:text-red-400 underline decoration-slate-600 underline-offset-2">
                                                    {player.deck.name}
                                                </Link>
                                            ) : (
                                                (!player.isGuest ? player.deck_name : null) || '-'
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono text-slate-300">
                                            {player.score}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {player.is_winner && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                                                    <Trophy className="h-3 w-3" /> GW
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-red-900/50 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h2 className="text-xl font-bold text-red-400 mb-2">Delete Session</h2>
                        <p className="text-slate-300 mb-4">
                            Are you sure you want to delete this session from <strong className="text-red-200">{session.played_at ? format(new Date(session.played_at), 'MMMM d, yyyy') : 'unknown date'}</strong>? This action cannot be undone.
                        </p>
                        <p className="text-sm text-slate-400 mb-4">
                            Type <span className="font-mono text-red-400 bg-red-950/30 px-1 rounded">DELETE</span> to confirm:
                        </p>
                        <input
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:border-red-500 outline-none mb-4 font-mono"
                            placeholder="DELETE"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={closeDeleteModal} disabled={isDeleting}>
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                leftIcon={<Trash2 className="h-4 w-4" />}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Forever'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
