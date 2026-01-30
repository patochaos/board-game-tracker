'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Game {
  id: string;
  name: string;
  thumbnail_url: string | null;
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

interface GuestPlayer {
  id: string;
  name: string;
  score: number | null;
  is_winner: boolean;
}

interface SessionWithBadges {
  id: string;
  played_at: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  game: Game;
  session_players: SessionPlayer[];
  guest_players: GuestPlayer[];
  isNewToGroup: boolean;
}

interface UseSessionsResult {
  sessions: SessionWithBadges[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useSessions(): UseSessionsResult {
  const [sessions, setSessions] = useState<SessionWithBadges[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Exclude VTES sessions (they have their own tracker)
      const VTES_GAME_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select(`
          id,
          played_at,
          duration_minutes,
          notes,
          created_at,
          game:games!sessions_game_id_fkey(id, name, thumbnail_url),
          session_players(
            id,
            score,
            is_winner,
            user_id,
            profile:profiles(display_name, username)
          ),
          guest_players(
            id,
            name,
            score,
            is_winner
          )
        `)
        .neq('game_id', VTES_GAME_ID)
        .order('played_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Calculate "New to Group" status
        const chronological = [...data].sort((a, b) =>
          new Date(a.played_at).getTime() - new Date(b.played_at).getTime()
        );

        const seenGameIds = new Set<string>();
        const sessionsWithBadges = chronological.map(session => {
          const gameId = (session.game as unknown as Game)?.id;
          const isNew = !seenGameIds.has(gameId);
          if (gameId) {
            seenGameIds.add(gameId);
          }
          return { ...session, game: session.game as unknown as Game, isNewToGroup: isNew };
        }) as unknown as SessionWithBadges[];

        // Sort back to descending for display
        const displaySessions = sessionsWithBadges.sort((a, b) =>
          new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
        );

        setSessions(displaySessions);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sessions'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refresh: fetchSessions,
  };
}
