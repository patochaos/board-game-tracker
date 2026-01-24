'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, EmptyState, Input } from '@/components/ui';
import { Dice5, Search, Plus, Loader2, X, Check } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Game {
  id: string;
  bgg_id: number;
  name: string;
  year_published: number | null;
  thumbnail_url: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  bgg_rating: number | null;
}

interface BGGSearchResult {
  id: number;
  name: string;
  yearPublished: number | null;
}

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Search modal state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BGGSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingGameId, setAddingGameId] = useState<number | null>(null);
  const [addedGameIds, setAddedGameIds] = useState<Set<number>>(new Set());
  const [searchError, setSearchError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchGames = useCallback(async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .neq('type', 'expansion')
      .order('name');

    if (!error && data) {
      setGames(data);
      // Track which BGG IDs are already in the library
      const bggIds = new Set(data.map((g: Game) => g.bgg_id));
      setAddedGameIds(bggIds);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .limit(1);

      if (!membership || membership.length === 0) {
        router.push('/onboard');
        return;
      }

      fetchGames();
    };

    checkAuthAndFetch();
  }, [router, supabase, fetchGames]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    setSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const response = await fetch(`/api/bgg/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        setSearchError(data.error || 'Search failed');
        return;
      }

      setSearchResults(data.results || []);
    } catch {
      setSearchError('Failed to search BGG');
    } finally {
      setSearching(false);
    }
  };

  const handleAddGame = async (bggId: number) => {
    setAddingGameId(bggId);

    try {
      const response = await fetch('/api/bgg/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bggId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to add game:', data.error);
        return;
      }

      // Refresh games list and mark as added
      await fetchGames();
      setAddedGameIds(prev => new Set([...prev, bggId]));
    } catch (error) {
      console.error('Error adding game:', error);
    } finally {
      setAddingGameId(null);
    }
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Games</h1>
            <p className="mt-1 text-slate-400">
              Your board game library
            </p>
          </div>
          <Button
            leftIcon={<Search className="h-4 w-4" />}
            onClick={() => setShowSearch(true)}
          >
            Add Game from BGG
          </Button>
        </div>

        {loading ? (
          <Card variant="glass" className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </Card>
        ) : games.length === 0 ? (
          <Card variant="glass">
            <EmptyState
              icon={<Dice5 className="h-20 w-20" />}
              title="No games yet"
              description="Search BoardGameGeek to add games to your library."
              action={
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowSearch(true)}
                >
                  Add Your First Game
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <Card variant="glass" className="overflow-hidden hover:border-emerald-500/50 transition-colors cursor-pointer h-full">
                  <div className="flex gap-4 p-4">
                    {game.thumbnail_url ? (
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800">
                        <Image
                          src={game.thumbnail_url}
                          alt={game.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Dice5 className="h-8 w-8 text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-100 truncate">{game.name}</h3>
                      {game.year_published && (
                        <p className="text-sm text-slate-400">{game.year_published}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        {game.min_players && game.max_players && (
                          <span>{game.min_players}-{game.max_players} players</span>
                        )}
                        {game.playing_time && (
                          <span>~{game.playing_time} min</span>
                        )}
                      </div>
                      {game.bgg_rating && (
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-xs text-emerald-400 font-medium">
                            BGG: {game.bgg_rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeSearch}
          />

          {/* Modal */}
          <Card variant="glass" className="relative z-10 w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Search BoardGameGeek</h2>
              <button
                onClick={closeSearch}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-700">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                className="flex gap-3"
              >
                <Input
                  placeholder="Search for a game..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  leftIcon={<Search className="h-5 w-5" />}
                />
                <Button
                  type="submit"
                  disabled={searching || searchQuery.length < 2}
                  leftIcon={searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                >
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </form>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {searchError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center">
                  {searchError}
                </div>
              )}

              {!searchError && searchResults.length === 0 && !searching && searchQuery && (
                <div className="text-center py-8 text-slate-500">
                  No results found. Try a different search term.
                </div>
              )}

              {!searchError && searchResults.length === 0 && !searching && !searchQuery && (
                <div className="text-center py-8 text-slate-500">
                  Enter a game name to search BoardGameGeek.
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result) => {
                    const isAdded = addedGameIds.has(result.id);
                    const isAdding = addingGameId === result.id;

                    return (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-200 truncate">
                            {result.name}
                          </p>
                          {result.yearPublished && (
                            <p className="text-sm text-slate-500">{result.yearPublished}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={isAdded ? 'ghost' : 'secondary'}
                          disabled={isAdded || isAdding}
                          onClick={() => handleAddGame(result.id)}
                          leftIcon={
                            isAdding ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isAdded ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )
                          }
                        >
                          {isAdding ? 'Adding...' : isAdded ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
