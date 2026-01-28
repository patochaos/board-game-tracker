'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useVtesLeaderboard } from '@/hooks/useVtesLeaderboard';
import { useState } from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
    const [period, setPeriod] = useState<'all' | 'month' | 'year'>('all');
    const [gameType, setGameType] = useState<'all' | 'casual' | 'league' | 'tournament_prelim' | 'tournament_final'>('all');

    const { leaderboard, loading } = useVtesLeaderboard(period, gameType);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown className="h-6 w-6 text-yellow-400" />;
        if (index === 1) return <Medal className="h-6 w-6 text-slate-300" />;
        if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;
        return <span className="font-mono text-slate-500 font-bold ml-2">#{index + 1}</span>;
    };

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-red-100 flex items-center gap-3">
                            <Trophy className="text-red-500" />
                            Leaderboard
                        </h1>
                        <p className="text-red-300">The eternal struggle for dominance.</p>
                    </div>
                </div>

                {/* Filters */}
                <Card variant="glass" className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-slate-400 mb-1 block">Period</label>
                            <div className="flex p-1 bg-slate-800/50 rounded-lg">
                                {(['all', 'year', 'month'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${period === p
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        {p === 'all' ? 'All Time' : `This ${p}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="text-xs text-slate-400 mb-1 block">Game Type</label>
                            <select
                                value={gameType}
                                onChange={(e) => setGameType(e.target.value as any)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-red-500 outline-none h-[36px]"
                            >
                                <option value="all">All Types</option>
                                <option value="casual">Casual</option>
                                <option value="league">League</option>
                                <option value="tournament_prelim">Tournament</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Leaderboard Table */}
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/80 text-xs text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-20 text-center">Rank</th>
                                <th className="px-6 py-4">Methuselah</th>
                                <th className="px-6 py-4 text-center">VP</th>
                                <th className="px-6 py-4 text-center">Wins</th>
                                <th className="px-6 py-4 text-center">Played</th>
                                <th className="px-6 py-4 text-center">Win Rate</th>
                                <th className="px-6 py-4 text-center">VP/Game</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        Calculating prestige...
                                    </td>
                                </tr>
                            ) : leaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        No players found for this period.
                                    </td>
                                </tr>
                            ) : (
                                leaderboard.map((entry, idx) => (
                                    <tr key={entry.userId} className={`
                                        group transition-colors
                                        ${idx < 3 ? 'bg-slate-900/30' : 'hover:bg-slate-800/30'}
                                    `}>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center">
                                                {getRankIcon(idx)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/vtes/players/${entry.userId}`} className="group/player flex items-center gap-3 hover:opacity-80 transition-opacity">
                                                {/* Avatar Placeholder */}
                                                <div className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                                                    ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                                                        idx === 1 ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' :
                                                            idx === 2 ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30' :
                                                                'bg-slate-800 text-slate-400'}
                                                `}>
                                                    {entry.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className={`font-medium group-hover/player:underline ${idx < 3 ? 'text-white' : 'text-slate-300'}`}>
                                                    {entry.name}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-red-200 text-lg">
                                            {entry.totalVp}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-300">
                                            {entry.gamesWon}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-400">
                                            {entry.gamesPlayed}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-400">
                                            {entry.winRate.toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-400">
                                            {entry.vpPerGame.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
