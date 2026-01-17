'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Expansion {
  id: string;
  name: string;
  thumbnail_url: string | null;
}

interface UseExpansionsResult {
  expansions: Expansion[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useExpansions(baseGameName: string | null): UseExpansionsResult {
  const [expansions, setExpansions] = useState<Expansion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchExpansions = useCallback(async () => {
    if (!baseGameName) {
      setExpansions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('games')
        .select('id, name, thumbnail_url')
        .eq('type', 'expansion')
        .ilike('name', `${baseGameName}%`)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setExpansions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch expansions'));
    } finally {
      setLoading(false);
    }
  }, [baseGameName]);

  useEffect(() => {
    fetchExpansions();
  }, [fetchExpansions]);

  return {
    expansions,
    loading,
    error,
    refresh: fetchExpansions,
  };
}
