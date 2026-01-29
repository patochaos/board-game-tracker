'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Crown, Flame } from 'lucide-react';
import { useVtesGuessLeaderboard } from '@/hooks/useVtesGuessLeaderboard';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function GuessLeaderboard() {
  const { leaderboard, loading, fetchLeaderboard } = useVtesGuessLeaderboard();
  const { user } = useCurrentUser();

  useEffect(() => {
    // Always fetch ranked mode only
    fetchLeaderboard('ranked');
  }, [fetchLeaderboard]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-300" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="font-mono text-slate-500 text-sm">#{index + 1}</span>;
  };

  // Find user's position
  const userId = user?.id;
  const userPosition = userId
    ? leaderboard.findIndex(e => e.user_id === userId) + 1
    : null;

  return (
    <div className="space-y-4">
      {/* User's rank banner */}
      {user && userPosition && userPosition > 0 && (
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

      {/* Leaderboard - Mobile-first card layout */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            Loading leaderboard...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No players yet. Be the first!
          </div>
        ) : (
          leaderboard.map((entry, idx) => (
            <div
              key={entry.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg transition-colors
                ${idx < 3 ? 'bg-slate-800/50' : 'bg-slate-900/30'}
                ${user && entry.user_id === user.id ? 'ring-2 ring-red-500/50 bg-red-900/20' : ''}
              `}
            >
              {/* Rank */}
              <div className="w-8 flex justify-center shrink-0">
                {getRankIcon(idx)}
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                  ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    idx === 1 ? 'bg-slate-500/20 text-slate-300' :
                      idx === 2 ? 'bg-amber-600/20 text-amber-500' :
                        'bg-slate-800 text-slate-400'}
                `}>
                  {entry.display_name.substring(0, 2).toUpperCase()}
                </div>
                <span className={`font-medium truncate ${idx < 3 ? 'text-white' : 'text-slate-300'}`}>
                  {entry.display_name}
                  {user && entry.user_id === user.id && (
                    <span className="text-xs text-red-400 ml-1">(You)</span>
                  )}
                </span>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <div className="font-bold text-red-200 text-lg">
                  {entry.score.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">pts</div>
              </div>

              {/* Best Streak */}
              <div className="flex items-center gap-1 text-orange-400 shrink-0 w-12 justify-end">
                <Flame className="w-4 h-4" />
                <span className="font-bold">{entry.best_streak}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Play CTA */}
      {!user && (
        <div className="text-center pt-4">
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
