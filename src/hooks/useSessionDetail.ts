'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { PreviousSessionQuery } from '@/types';

interface Game {
  id: string;
  name: string;
  thumbnail_url: string | null;
}

interface SessionPlayer {
  id: string;
  user_id: string;
  score: number | null;
  is_winner: boolean;
  profile: {
    display_name: string | null;
    username: string;
  };
  isNewToMe?: boolean;
}

interface GuestPlayer {
  id: string;
  name: string;
  score: number | null;
  is_winner: boolean;
}

interface SessionExpansion {
  expansion: {
    id: string;
    name: string;
    thumbnail_url: string | null;
  };
}

interface SessionDetail {
  id: string;
  played_at: string;
  duration_minutes: number | null;
  location: string | null;
  notes: string | null;
  created_by: string;
  game: Game;
  session_players: SessionPlayer[];
  guest_players: GuestPlayer[];
  session_expansions: SessionExpansion[];
}

interface UseSessionDetailResult {
  session: SessionDetail | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useSessionDetail(sessionId: string): UseSessionDetailResult {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select(`
          id,
          played_at,
          duration_minutes,
          notes,
          created_by,
          location,
          game:games!sessions_game_id_fkey(id, name, thumbnail_url),
          session_players(
            id,
            user_id,
            score,
            is_winner,
            profile:profiles(display_name, username)
          ),
          guest_players(
            id,
            name,
            score,
            is_winner
          ),
          session_expansions(
            expansion:games(id, name, thumbnail_url)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        throw new Error('Session not found');
      }

      const sessionData = data as unknown as SessionDetail;

      // Calculate "New to Me" for each player
      if (sessionData.game?.id) {
        const { data: previousSessions } = await supabase
          .from('sessions')
          .select('session_players(user_id)')
          .eq('game_id', sessionData.game.id)
          .lt('played_at', sessionData.played_at);

        const priorPlayers = new Set<string>();
        (previousSessions as PreviousSessionQuery[] | null)?.forEach((s) => {
          s.session_players.forEach((sp) => priorPlayers.add(sp.user_id));
        });

        sessionData.session_players = sessionData.session_players.map(sp => ({
          ...sp,
          isNewToMe: !priorPlayers.has(sp.user_id)
        }));
      }

      setSession(sessionData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch session'));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    loading,
    error,
    refresh: fetchSession,
  };
}
