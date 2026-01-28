'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, StatCard } from '@/components/ui';
import { Swords, Plus, Search, Trophy, TrendingUp, BookOpen, Calendar, Crown } from 'lucide-react';
import Link from 'next/link';
import { useVtesPlayerStats } from '@/hooks/useVtesPlayerStats';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';

import { StatsPeriod } from '@/hooks/useVtesPlayerStats';

export default function VTESDashboard() {
    const [userId, setUserId] = useState<string | null>(null);
    const [period, setPeriod] = useState<StatsPeriod>(28); // Default 4 weeks
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id || null);
        });
    }, []);

    const { stats, loading } = useVtesPlayerStats(userId || '', period);

    return (
        <AppLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-red-100">VTES Dashboard</h1>
                        <p className="mt-1 text-red-300">
                            {userId ? `Welcome back.` : 'Sign in to track your struggle.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-slate-900/50 p-1 rounded-lg border border-slate-700/50 flex items-center">
                            {[
                                { label: '4 Weeks', value: 28 },
                                { label: '3 Months', value: 90 },
                                { label: 'All Time', value: 'all' },
                            ].map((opt) => (
                                <button
                                    key={opt.label}
                                    onClick={() => setPeriod(opt.value as StatsPeriod)}
                                    className={`
                                        px-3 py-1.5 text-xs font-medium rounded-md transition-all
                                        ${period === opt.value
                                            ? 'bg-red-900/80 text-red-100 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <Link href="/vtes/sessions/new">
                            <Button className="bg-red-600 hover:bg-red-700 text-white" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                                Log Struggle
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Overview Stats */}
                    <StatCard
                        label="Career VPs"
                        value={loading ? '-' : (stats?.totalVp || 0).toString()}
                        subValue="Influence gained"
                        icon={<Swords className="h-8 w-8 text-red-500" />}
                    />
                    <StatCard
                        label="Victories"
                        value={loading ? '-' : (stats?.gamesWon || 0).toString()}
                        subValue={stats ? `${stats.winRate.toFixed(1)}% Win Rate` : '-'}
                        icon={<Trophy className="h-8 w-8 text-amber-500" />}
                    />
                    <StatCard
                        label="Games Played"
                        value={loading ? '-' : (stats?.gamesPlayed || 0).toString()}
                        subValue="Total sessions"
                        icon={<BookOpen className="h-8 w-8 text-blue-500" />}
                    />

                    {/* Deck Highlights */}
                    <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group min-h-[160px]">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-slate-400">Favored Deck</p>
                            <div className="mt-2 text-slate-100">
                                {loading ? (
                                    <span className="text-3xl font-bold">-</span>
                                ) : stats?.favoriteDeck ? (
                                    <div>
                                        <div className="text-xl font-bold truncate" title={stats.favoriteDeck.deckName}>
                                            {stats.favoriteDeck.deckName}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {stats.favoriteDeck.gamesPlayed} games played
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-lg italic text-slate-500">No data yet</span>
                                )}
                            </div>
                        </div>
                        <Crown className="absolute right-4 bottom-4 h-12 w-12 text-slate-800/50 group-hover:text-amber-500/10 transition-colors" />
                    </div>

                    <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group min-h-[160px]">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-slate-400">Best Performing Deck</p>
                            <div className="mt-2 text-slate-100">
                                {loading ? (
                                    <span className="text-3xl font-bold">-</span>
                                ) : stats?.bestDeck ? (
                                    <div>
                                        <div className="text-xl font-bold truncate text-emerald-400" title={stats.bestDeck.deckName}>
                                            {stats.bestDeck.deckName}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {stats.bestDeck.winRate.toFixed(1)}% Win Rate ({stats.bestDeck.gamesWon} wins)
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-lg italic text-slate-500">No data yet</span>
                                )}
                            </div>
                        </div>
                        <TrendingUp className="absolute right-4 bottom-4 h-12 w-12 text-slate-800/50 group-hover:text-emerald-500/10 transition-colors" />
                    </div>

                    <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group min-h-[160px]">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-slate-400">Nemesis Deck</p>
                            <div className="mt-2 text-slate-100">
                                {loading ? (
                                    <span className="text-3xl font-bold">-</span>
                                ) : stats?.worstDeck ? (
                                    <div>
                                        <div className="text-xl font-bold truncate text-red-400" title={stats.worstDeck.deckName}>
                                            {stats.worstDeck.deckName}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {stats.worstDeck.winRate.toFixed(1)}% Win Rate ({stats.worstDeck.gamesPlayed} games)
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-lg italic text-slate-500">No data yet</span>
                                )}
                            </div>
                        </div>
                        <Swords className="absolute right-4 bottom-4 h-12 w-12 text-slate-800/50 group-hover:text-red-500/10 transition-colors" />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
