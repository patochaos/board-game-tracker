'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Trophy, Medal, Star, LayoutList, Calendar } from 'lucide-react';
import Image from 'next/image';

interface PlayerStat {
    userId: string;
    name: string;
    avatarUrl: string | null;
    plays: number;
    wins: number;
    winRate: number;
    lastPlayed: string;
}

export default function LeaderboardPage() {
    const [stats, setStats] = useState<PlayerStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'month'>('all');

    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);

            // Fetch all session players with expanded profile and session data
            let query = supabase
                .from('session_players')
                .select(`
          is_winner,
          user_id,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          ),
          sessions:session_id (
            played_at
          )
        `);

            if (filter === 'month') {
                const date = new Date();
                date.setDate(1); // First day of current month
                const dateStr = date.toISOString().split('T')[0];
                // We can't easily filter deep nested session date in one go with standard query unless we use inner joins or separate calls.
                // For simplicity with small data, we'll fetch all and filter in JS.
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching stats:', error);
                setLoading(false);
                return;
            }

            if (!data) return;

            // Aggregation Logic
            const playerMap = new Map<string, PlayerStat>();

            data.forEach((row: any) => {
                const userId = row.user_id;
                const profile = row.profiles; // Single object or array depending on relation? Usually object for One-to-One
                // Note: supabase-js returns array if multiple, object if single. profiles is joined on ID, so unique.

                // Handle potential missing profile (e.g. deleted user)
                if (!profile) return;

                const name = profile.display_name || profile.username || 'Unknown';
                const avatarUrl = profile.avatar_url;
                const isWinner = row.is_winner;
                const playedAt = row.sessions?.played_at;

                // Skip if date filter applies
                if (filter === 'month') {
                    const firstOfMonth = new Date();
                    firstOfMonth.setDate(1);
                    firstOfMonth.setHours(0, 0, 0, 0);
                    const playDate = new Date(playedAt);
                    if (playDate < firstOfMonth) return;
                }

                if (!playerMap.has(userId)) {
                    playerMap.set(userId, {
                        userId,
                        name,
                        avatarUrl,
                        plays: 0,
                        wins: 0,
                        winRate: 0,
                        lastPlayed: playedAt
                    });
                }

                const stat = playerMap.get(userId)!;
                stat.plays += 1;
                if (isWinner) stat.wins += 1;
                if (playedAt > stat.lastPlayed) stat.lastPlayed = playedAt;
            });

            // Calculate Win Rates & Sort
            const sortedStats = Array.from(playerMap.values())
                .map(stat => ({
                    ...stat,
                    winRate: stat.plays > 0 ? (stat.wins / stat.plays) * 100 : 0
                }))
                .sort((a, b) => {
                    // Sort by Wins primarily, then Win Rate, then Plays
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
                    return b.plays - a.plays;
                });

            setStats(sortedStats);
            setLoading(false);
        };

        fetchStats();
    }, [filter]);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
        if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
        if (index === 2) return <Medal className="h-6 w-6 text-amber-700" />;
        return <span className="text-slate-500 font-bold w-6 text-center">{index + 1}</span>;
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">Leaderboard</h1>
                        <p className="text-slate-400">Hall of Fame</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={filter === 'all' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('all')}
                            leftIcon={<LayoutList className="h-4 w-4" />}
                        >
                            All Time
                        </Button>
                        <Button
                            variant={filter === 'month' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('month')}
                            leftIcon={<Calendar className="h-4 w-4" />}
                        >
                            This Month
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4">
                    {/* Top 3 Cards for Mobile/Highlight */}
                    {stats.length >= 3 && (
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {/* 2nd Place */}
                            <Card variant="glass" className="flex flex-col items-center justify-end pb-4 pt-8 transform translate-y-4 border-gray-500/30">
                                <div className="relative w-16 h-16 rounded-full overflow-hidden mb-3 border-4 border-gray-400">
                                    {stats[1].avatarUrl ? (
                                        <Image src={stats[1].avatarUrl} alt={stats[1].name} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-400">
                                            {stats[1].name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-slate-100 text-sm md:text-base">{stats[1].name}</h3>
                                    <p className="text-gray-400 font-bold">{stats[1].wins} Wins</p>
                                    <p className="text-xs text-slate-500">{stats[1].winRate.toFixed(1)}%</p>
                                </div>
                            </Card>

                            {/* 1st Place */}
                            <Card variant="glass" className="flex flex-col items-center justify-end pb-4 pt-8 border-yellow-500/50 bg-yellow-500/5">
                                <div className="relative -mt-12 mb-3">
                                    <Trophy className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-500 animate-bounce" />
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-500 relative">
                                        {stats[0].avatarUrl ? (
                                            <Image src={stats[0].avatarUrl} alt={stats[0].name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-400">
                                                {stats[0].name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-yellow-500 text-base md:text-lg">{stats[0].name}</h3>
                                    <p className="text-white font-bold text-xl">{stats[0].wins} Wins</p>
                                    <p className="text-sm text-yellow-500/70">{stats[0].winRate.toFixed(1)}% Win Rate</p>
                                </div>
                            </Card>

                            {/* 3rd Place */}
                            <Card variant="glass" className="flex flex-col items-center justify-end pb-4 pt-8 transform translate-y-8 border-amber-700/30">
                                <div className="relative w-16 h-16 rounded-full overflow-hidden mb-3 border-4 border-amber-700">
                                    {stats[2].avatarUrl ? (
                                        <Image src={stats[2].avatarUrl} alt={stats[2].name} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-400">
                                            {stats[2].name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-slate-100 text-sm md:text-base">{stats[2].name}</h3>
                                    <p className="text-amber-700 font-bold">{stats[2].wins} Wins</p>
                                    <p className="text-xs text-slate-500">{stats[2].winRate.toFixed(1)}%</p>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* List View */}
                    <Card variant="glass" className="overflow-hidden p-0">
                        <table className="w-full">
                            <thead className="bg-slate-800/50 text-xs text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Rank</th>
                                    <th className="px-6 py-4 text-left">Player</th>
                                    <th className="px-6 py-4 text-center">Wins</th>
                                    <th className="px-6 py-4 text-center">Plays</th>
                                    <th className="px-6 py-4 text-right">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {stats.map((stat, index) => (
                                    <tr key={stat.userId} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-800/50">
                                                {getRankIcon(index)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {stat.avatarUrl ? (
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                                        <Image src={stat.avatarUrl} alt={stat.name} fill className="object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                                                        {stat.name.substring(0, 1).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="font-medium text-slate-200">{stat.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-emerald-400">{stat.wins}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-400">
                                            {stat.plays}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm text-slate-300">{stat.winRate.toFixed(1)}%</span>
                                        </td>
                                    </tr>
                                ))}
                                {stats.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No stats found. Log some games to see the leaderboard!
                                        </td>
                                    </tr>
                                )}
                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 animate-pulse">
                                            Loading stats...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
