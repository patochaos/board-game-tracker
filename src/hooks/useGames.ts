'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Game {
  id: string;
  name: string;
  thumbnail_url: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  bgg_rating: number | null;
  year_published: number | null;
}

interface UseGamesResult {
  games: Game[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useGames(): UseGamesResult {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('games')
        .select('id, name, thumbnail_url, min_players, max_players, playing_time, bgg_rating, year_published')
        .neq('type', 'expansion')
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setGames(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch games'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return {
    games,
    loading,
    error,
    refresh: fetchGames,
  };
}
