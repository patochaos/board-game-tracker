import { useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export interface GuessLeaderboardEntry {
  id: string;
  user_id: string;
  display_name: string;
  score: number;
  mode: 'normal' | 'ranked';
  cards_played: number;
  cards_correct: number;
  best_streak: number;
  created_at: string;
  updated_at: string;
}

interface SubmitScoreData {
  score: number;
  mode: 'normal' | 'ranked';
  cardsPlayed: number;
  cardsCorrect: number;
  bestStreak: number;
}

interface SubmitScoreResult {
  success: boolean;
  updated: boolean;
  rank: number;
  message?: string;
}

export function useVtesGuessLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<GuessLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchLeaderboard = useCallback(async (
    mode?: 'normal' | 'ranked',
    limit = 100,
    offset = 0
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (mode) params.set('mode', mode);
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const response = await fetch(`/api/vtes/leaderboard?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }

      setLeaderboard(data.leaderboard || []);
      setUserRank(data.userRank);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching guess leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitScore = useCallback(async (data: SubmitScoreData): Promise<SubmitScoreResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vtes/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit score');
      }

      return result as SubmitScoreResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error submitting score:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserRank = useCallback(async (userId: string, mode: 'normal' | 'ranked'): Promise<number | null> => {
    try {
      const { count } = await supabase
        .from('vtes_guess_leaderboard')
        .select('*', { count: 'exact', head: true })
        .eq('mode', mode)
        .eq('user_id', userId);

      if (count === null) return null;

      const { data: userEntry } = await supabase
        .from('vtes_guess_leaderboard')
        .select('score')
        .eq('mode', mode)
        .eq('user_id', userId)
        .single();

      if (!userEntry) return null;

      const { count: countAbove } = await supabase
        .from('vtes_guess_leaderboard')
        .select('*', { count: 'exact', head: true })
        .eq('mode', mode)
        .gt('score', userEntry.score);

      return (countAbove || 0) + 1;
    } catch (err) {
      console.error('Error getting user rank:', err);
      return null;
    }
  }, []);

  return {
    leaderboard,
    loading,
    error,
    userRank,
    fetchLeaderboard,
    submitScore,
    getUserRank,
  };
}
