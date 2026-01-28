'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Crown, Flame } from 'lucide-react';
import { useVtesGuessLeaderboard, GuessLeaderboardEntry } from '@/hooks/useVtesGuessLeaderboard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card } from '@/components/ui';

interface GuessLeaderboardProps {
  initialMode?: 'all' | 'normal' | 'ranked';
}

export function GuessLeaderboard({ initialMode = 'all' }: GuessLeaderboardProps) {
  const [mode, setMode] = useState<'all' | 'normal' | 'ranked'>(initialMode);
  const [period, setPeriod] = useState<'all' | 'year' | 'month'>('all');
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<GuessLeaderboardEntry[]>([]);
  
  const { leaderboard, loading, fetchLeaderboard } = useVtesGuessLeaderboard();
  const { user } = useCurrentUser();

  useEffect(() => {
    const modeParam = mode === 'all' ? undefined : mode;
    fetchLeaderboard(modeParam);
  }, [mode, fetchLeaderboard]);

  useEffect(() => {
    // Filter by period
    const now = new Date();
    let filtered = leaderboard;

    if (period === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filtered = leaderboard.filter(e => new Date(e.created_at) >= monthAgo);
    } else if (period === 'year') {
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      filtered = leaderboard.filter(e => new Date(e.created_at) >= yearAgo);
    }

    setFilteredLeaderboard(filtered);
  }, [leaderboard, period]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-400" />;
    if (index === 1) return <Medal className="h-6 w-6 text-slate-300" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="font-mono text-slate-500 font-bold ml-2">#{index + 1}</span>;
  };

  const getAccuracy = (played: number, correct: number) => {
    if (played === 0) return '0%';
    return Math.round((correct / played) * 100) + '%';
  };

  // Find user's position in filtered list
  const userId = user?.id;
  const userEntry = userId
    ? filteredLeaderboard.find(e => e.user_id === userId)
    : null;
  const userPosition = userEntry && userId
    ? filteredLeaderboard.findIndex(e => e.user_id === userId) + 1
    : null;

  return (
    <div className="space-y-6">
      {/* User's rank banner */}
      {user && userPosition && (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/50 flex items-center justify-between">
          <span className="text-red-300 text-sm font-medium">Your Rank</span>
          <span className="text-xl font-bold text-red-200">
            #{userPosition}
            {userPosition === 1 && <Crown className="inline h-5 w-5 ml-1 text-yellow-400" />}
            {userPosition === 2 && <Medal className="inline h-5 w-5 ml-1 text-slate-300" />}
            {userPosition === 3 && <Medal className="inline h-5 w-5 ml-1 text-amber-600" />}
          </span>
        </div>
      )}

      {/* Filters */}
      <Card variant="glass" className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">Mode</label>
            <div className="flex p-1 bg-slate-800/50 rounded-lg">
              {(['all', 'ranked', 'normal'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                    mode === m
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m === 'all' ? 'All Modes' : m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">Period</label>
            <div className="flex p-1 bg-slate-800/50 rounded-lg">
              {(['all', 'year', 'month'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                    period === p
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p === 'all' ? 'All Time' : `This ${p}`}
                </button>
              ))}
            </div>
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
              <th className="px-6 py-4 text-center">Score</th>
              <th className="px-6 py-4 text-center">Cards</th>
              <th className="px-6 py-4 text-center">Accuracy</th>
              <th className="px-6 py-4 text-center">Best Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  Calculating prestige...
                </td>
              </tr>
            ) : filteredLeaderboard.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No players found. Be the first to claim glory!
                </td>
              </tr>
            ) : (
              filteredLeaderboard.map((entry, idx) => (
                <tr 
                  key={entry.id} 
                  className={`
                    group transition-colors
                    ${idx < 3 ? 'bg-slate-900/30' : 'hover:bg-slate-800/30'}
                    ${user && entry.user_id === user.id ? 'bg-red-900/10 border-l-2 border-l-red-500' : ''}
                  `}
                >
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      {getRankIcon(idx)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                        ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                          idx === 1 ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' :
                            idx === 2 ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30' :
                              'bg-slate-800 text-slate-400'}
                      `}>
                        {entry.display_name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={`font-medium ${idx < 3 ? 'text-white' : 'text-slate-300'}`}>
                        {entry.display_name}
                      </span>
                      {user && entry.user_id === user.id && (
                        <span className="text-xs text-red-400">(You)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-red-200 text-lg">
                    {entry.score.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-300">
                    {entry.cards_played}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-400">
                    {getAccuracy(entry.cards_played, entry.cards_correct)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1 text-orange-400">
                      <Flame className="w-4 h-4" />
                      <span className="font-bold">{entry.best_streak}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Play CTA */}
      {!user && (
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Trophy className="w-5 h-5" />
            Sign In to Compete
          </Link>
        </div>
      )}
    </div>
  );
}
