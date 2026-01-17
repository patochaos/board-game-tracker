'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Game {
  id: string;
  name: string;
  year_published: number | null;
  image_url: string | null;
  thumbnail_url: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  bgg_rating: number | null;
}

interface SessionPlayer {
  id: string;
  score: number | null;
  is_winner: boolean;
  user_id: string;
  profile: {
    display_name: string | null;
    username: string;
  };
}

interface SessionWithPlayers {
  id: string;
  played_at: string;
  duration_minutes: number | null;
  session_players: SessionPlayer[];
}

interface PersonalStats {
  plays: number;
  wins: number;
  winRate: number;
  avgScore: number | null;
  bestScore: number | null;
  totalTime: number;
}

interface UseGameDetailResult {
  game: Game | null;
  sessions: SessionWithPlayers[];
  personalStats: PersonalStats | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useGameDetail(gameId: string, userId?: string | null): UseGameDetailResult {
  const [game, setGame] = useState<Game | null>(null);
  const [sessions, setSessions] = useState<SessionWithPlayers[]>([]);
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = useCallback(async () => {
    if (!gameId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) {
        throw gameError;
      }

      setGame(gameData);

      // Fetch sessions for this game
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          played_at,
          duration_minutes,
          session_players(
            id,
            score,
            is_winner,
            user_id,
            profile:profiles(display_name, username)
          )
        `)
        .eq('game_id', gameId)
        .order('played_at', { ascending: false });

      if (sessionsError) {
        throw sessionsError;
      }

      setSessions(sessionsData as unknown as SessionWithPlayers[]);

      // Calculate personal stats if userId provided
      if (userId && sessionsData) {
        let plays = 0;
        let wins = 0;
        let totalScore = 0;
        let scoreCount = 0;
        let bestScore: number | null = null;
        let totalTime = 0;

        (sessionsData as unknown as SessionWithPlayers[]).forEach((session) => {
          const myPlay = session.session_players?.find(
            (sp) => sp.user_id === userId
          );

          if (myPlay) {
            plays++;
            if (myPlay.is_winner) wins++;
            if (myPlay.score !== null) {
              totalScore += myPlay.score;
              scoreCount++;
              if (bestScore === null || myPlay.score > bestScore) {
                bestScore = myPlay.score;
              }
            }
            if (session.duration_minutes) {
              totalTime += session.duration_minutes;
            }
          }
        });

        setPersonalStats({
          plays,
          wins,
          winRate: plays > 0 ? Math.round((wins / plays) * 100) : 0,
          avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : null,
          bestScore,
          totalTime,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch game details'));
    } finally {
      setLoading(false);
    }
  }, [gameId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    game,
    sessions,
    personalStats,
    loading,
    error,
    refresh: fetchData,
  };
}
