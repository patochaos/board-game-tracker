'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useVtesPlayerStats } from '@/hooks/useVtesPlayerStats';
import { Trophy, Calendar, Crosshair, Crown, ArrowRight, Layout } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

export default function PlayerProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const { stats, loading, recentSessions } = useVtesPlayerStats(userId);

    if (loading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-64">
                    <p className="text-slate-500">Loading methuselah data...</p>
                </div>
            </AppLayout>
        );
    }

    if (!stats) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-64">
                    <p className="text-slate-500">Methuselah not found or has no recorded struggles.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-red-900/20 text-red-500 border border-red-500/30 flex items-center justify-center text-2xl font-bold">
                        {stats.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">{stats.name}</h1>
                        <p className="text-slate-400">Methuselah Profile</p>
                    </div>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card variant="glass" className="p-4 flex flex-col items-center justify-center text-center hover:border-red-500/30 transition-colors">
                        <div className="p-2 rounded-full bg-slate-800/50 mb-2 text-slate-400">
                            <Layout className="h-5 w-5" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stats.gamesPlayed}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Games Played</div>
                    </Card>
                    <Card variant="glass" className="p-4 flex flex-col items-center justify-center text-center hover:border-amber-500/30 transition-colors">
                        <div className="p-2 rounded-full bg-amber-900/20 mb-2 text-amber-500">
                            <Trophy className="h-5 w-5" />
                        </div>
                        <div className="text-2xl font-bold text-amber-100">{stats.gamesWon}</div>
                        <div className="text-xs text-amber-500/70 uppercase tracking-wider">Victories</div>
                    </Card>
                    <Card variant="glass" className="p-4 flex flex-col items-center justify-center text-center hover:border-red-500/30 transition-colors">
                        <div className="p-2 rounded-full bg-red-900/20 mb-2 text-red-500">
                            <Crosshair className="h-5 w-5" />
                        </div>
                        <div className="text-2xl font-bold text-red-200">{stats.winRate.toFixed(1)}%</div>
                        <div className="text-xs text-red-500/70 uppercase tracking-wider">Win Rate</div>
                    </Card>
                    <Card variant="glass" className="p-4 flex flex-col items-center justify-center text-center hover:border-purple-500/30 transition-colors">
                        <div className="p-2 rounded-full bg-purple-900/20 mb-2 text-purple-400">
                            <Crown className="h-5 w-5" />
                        </div>
                        <div className="text-2xl font-bold text-purple-200">{stats.totalVp}</div>
                        <div className="text-xs text-purple-400/70 uppercase tracking-wider">Total VP</div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Decks */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Favorite Deck */}
                        {stats.favoriteDeck && (
                            <section>
                                <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-yellow-500" />
                                    Signature Deck
                                </h2>
                                <Link href={`/vtes/decks/${stats.favoriteDeck.deckId}`}>
                                    <Card variant="glass" className="p-6 group hover:border-yellow-500/40 transition-all cursor-pointer relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Crown className="w-32 h-32" />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                                                {stats.favoriteDeck.deckName}
                                            </h3>
                                            <div className="flex gap-6 text-sm">
                                                <div>
                                                    <span className="block text-slate-400 text-xs">Games</span>
                                                    <span className="font-mono text-lg text-slate-200">{stats.favoriteDeck.gamesPlayed}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-slate-400 text-xs">Wins</span>
                                                    <span className="font-mono text-lg text-green-400">{stats.favoriteDeck.gamesWon}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-slate-400 text-xs">Avg VP</span>
                                                    <span className="font-mono text-lg text-purple-400">{stats.favoriteDeck.averageVp.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            </section>
                        )}

                        {/* Deck Performance Table */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-200 mb-4">Deck Performance</h2>
                            <div className="bg-slate-900/40 rounded-xl overflow-hidden border border-slate-800">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900/80 text-xs text-slate-400 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Deck</th>
                                            <th className="px-4 py-3 text-center">Games</th>
                                            <th className="px-4 py-3 text-center">Wins</th>
                                            <th className="px-4 py-3 text-center">Win %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {stats.decks.map((deck) => (
                                            <tr key={deck.deckId} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-200">
                                                    <Link href={`/vtes/decks/${deck.deckId}`} className="hover:text-red-400">
                                                        {deck.deckName}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-400">{deck.gamesPlayed}</td>
                                                <td className="px-4 py-3 text-center text-green-400/80">{deck.gamesWon}</td>
                                                <td className="px-4 py-3 text-center text-slate-300">
                                                    {deck.gamesPlayed > 0
                                                        ? ((deck.gamesWon / deck.gamesPlayed) * 100).toFixed(0) + '%'
                                                        : '0%'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Recent History */}
                    <div className="lg:col-span-1 space-y-6">
                        <section>
                            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-slate-400" />
                                Recent Struggles
                            </h2>
                            <div className="space-y-3">
                                {recentSessions.map((session) => {
                                    const player = session.session_players.find((p: any) => p.user_id === userId);
                                    return (
                                        <Card key={session.id} variant="glass" className="p-3 hover:bg-slate-800/50 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-xs text-slate-400">
                                                    {format(new Date(session.played_at), 'MMM d, yyyy')}
                                                </div>
                                                {player?.is_winner && (
                                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wide border border-amber-500/30">
                                                        Victory
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-sm font-medium text-slate-200">
                                                        {player?.deck_name || 'Unknown Deck'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {session.location || 'Unknown Location'}
                                                    </div>
                                                </div>
                                                <div className="text-lg font-bold text-red-400/80 font-mono">
                                                    {player?.score} VP
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                                {recentSessions.length === 0 && (
                                    <p className="text-sm text-slate-500 italic">No recent games found.</p>
                                )}
                            </div>
                            <div className="mt-4 text-center">
                                <Link href="/vtes/sessions" className="text-sm text-red-400 hover:text-red-300 flex items-center justify-center gap-1 group">
                                    View full history
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
