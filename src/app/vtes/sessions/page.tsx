'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { Plus, Calendar, MapPin, Users, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';

interface Session {
    id: string;
    played_at: string;
    location: string | null;
    notes: string | null;
    players: {
        score: number;
        is_winner: boolean;
        deck_name: string | null;
        profile: {
            display_name: string;
            username: string;
        } | null;
        guest_name: string | null;
    }[];
}

export default function SessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchSessions = async () => {
            // Fetch sessions with players (both registered and guests)
            // Note: This query depends on your exact schema relation names.
            // Assuming 'session_players' -> users via profile? And 'guest_players'.
            // This can be complex in one query. Let's try basic session fetch first then enhance.

            /* 
               We need to fetch sessions and their players.
               Supabase: 
               sessions (id, played_at, location...)
               -> session_players (score, is_winner, deck_name, user_id -> profiles)
               -> guest_players (score, is_winner, deck_name, name)
            */

            const { data: sessionsData, error } = await supabase
                .from('sessions')
                .select(`
                    id, played_at, location, notes,
                    session_players (
                        score, is_winner, deck_name,
                        profile:profiles (display_name, username)
                    ),
                    guest_players (
                        score, is_winner, deck_name, name
                    )
                `)
                .eq('game_id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') // VTES Game ID
                .order('played_at', { ascending: false });

            if (error) {
                console.error('Error fetching sessions:', error);
            } else {
                // normalize players
                const formatted = sessionsData.map((s: any) => {
                    const registered = s.session_players.map((sp: any) => ({
                        score: sp.score,
                        is_winner: sp.is_winner,
                        deck_name: sp.deck_name,
                        profile: sp.profile,
                        guest_name: null
                    }));
                    const guests = s.guest_players.map((gp: any) => ({
                        score: gp.score,
                        is_winner: gp.is_winner,
                        deck_name: gp.deck_name,
                        profile: null,
                        guest_name: gp.name
                    }));
                    return {
                        ...s,
                        players: [...registered, ...guests]
                    };
                });
                setSessions(formatted);
            }
            setLoading(false);
        };

        fetchSessions();
    }, []);

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-red-100">Sessions</h1>
                        <p className="text-red-300">Chronicles of past struggles.</p>
                    </div>
                    <Link href="/vtes/sessions/new">
                        <Button className="bg-red-600 hover:bg-red-700" leftIcon={<Plus className="h-4 w-4" />}>
                            Log Session
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-slate-500">Loading chronicles...</div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <p>No sessions recorded yet.</p>
                        <Link href="/vtes/sessions/new" className="text-red-400 hover:underline mt-2 inline-block">
                            Record the first struggle
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => {
                            const winner = session.players.find(p => p.is_winner);
                            return (
                                <Card key={session.id} variant="glass" className="p-0 overflow-hidden hover:border-red-500/30 transition-colors">
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-xl bg-red-900/20 text-red-400">
                                                    <Calendar className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-100 mb-1">
                                                        {format(new Date(session.played_at), 'MMMM d, yyyy')}
                                                    </h3>
                                                    <div className="flex items-center gap-3 text-sm text-slate-400">
                                                        {session.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" /> {session.location}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" /> {session.players.length} Players
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Winner Badge */}
                                            {winner && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
                                                    <Trophy className="h-3 w-3 text-amber-500" />
                                                    <span className="font-semibold">
                                                        {winner.profile?.display_name || winner.profile?.username || winner.guest_name}
                                                    </span>
                                                    <span className="text-amber-500/50">({winner.score} VP)</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Players Table (Compact) */}
                                        <div className="bg-slate-900/40 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {session.players.map((p, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-800/50">
                                                    <div className="flex flex-col">
                                                        <span className={p.is_winner ? "text-amber-100 font-medium" : "text-slate-300"}>
                                                            {p.profile?.display_name || p.profile?.username || p.guest_name}
                                                        </span>
                                                        {p.deck_name && <span className="text-xs text-slate-500">{p.deck_name}</span>}
                                                    </div>
                                                    <span className="font-mono text-slate-400">{p.score} VP</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
