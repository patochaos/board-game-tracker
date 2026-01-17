'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { LeaderboardRow } from '@/types';

interface PlayerStat {
  userId: string;
  name: string;
  avatarUrl: string | null;
  plays: number;
  wins: number;
  winRate: number;
  lastPlayed: string;
}

interface UseLeaderboardResult {
  stats: PlayerStat[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useLeaderboard(filter: 'all' | 'month' = 'all'): UseLeaderboardResult {
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
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

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        setStats([]);
        return;
      }

      // Aggregation Logic
      const playerMap = new Map<string, PlayerStat>();

      (data as unknown as LeaderboardRow[]).forEach((row) => {
        const userId = row.user_id;
        const profile = row.profiles;

        if (!profile) return;

        const name = profile.display_name || profile.username || 'Unknown';
        const avatarUrl = profile.avatar_url;
        const isWinner = row.is_winner;
        const playedAt = row.sessions?.played_at;

        // Skip if date filter applies
        if (filter === 'month' && playedAt) {
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
            lastPlayed: playedAt || ''
          });
        }

        const stat = playerMap.get(userId)!;
        stat.plays += 1;
        if (isWinner) stat.wins += 1;
        if (playedAt && playedAt > stat.lastPlayed) stat.lastPlayed = playedAt;
      });

      // Calculate Win Rates & Sort
      const sortedStats = Array.from(playerMap.values())
        .map(stat => ({
          ...stat,
          winRate: stat.plays > 0 ? (stat.wins / stat.plays) * 100 : 0
        }))
        .sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          return b.plays - a.plays;
        });

      setStats(sortedStats);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch leaderboard'));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
