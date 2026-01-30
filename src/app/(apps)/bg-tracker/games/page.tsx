'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, EmptyState, Input, GameListSkeleton } from '@/components/ui';
import { Dice5, Search, Plus, Loader2, X, Check, Package, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Owner {
  user_id: string;
  profile: {
    display_name: string | null;
    username: string;
  };
}

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
  type?: string;
  base_game_id?: string | null;
}

interface GameWithOwnership extends Game {
  owners: Owner[];
}

interface GameWithExpansions extends GameWithOwnership {
  expansions: GameWithOwnership[];
}

interface BGGSearchResult {
  id: number;
  name: string;
  yearPublished: number | null;
}

interface BGGExpansion {
  bggId: number;
  name: string;
  inLibrary: boolean;
}

export default function GamesPage() {
  const router = useRouter();
  const [gamesWithExpansions, setGamesWithExpansions] = useState<GameWithExpansions[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Search modal state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BGGSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingGameId, setAddingGameId] = useState<number | null>(null);
  const [addedGameIds, setAddedGameIds] = useState<Set<number>>(new Set());
  const [searchError, setSearchError] = useState<string | null>(null);

  // Expansion modal state
  const [showExpansions, setShowExpansions] = useState(false);
  const [pendingExpansions, setPendingExpansions] = useState<BGGExpansion[]>([]);
  const [selectedExpansions, setSelectedExpansions] = useState<Set<number>>(new Set());
  const [importingExpansions, setImportingExpansions] = useState(false);
  const [currentBaseGameId, setCurrentBaseGameId] = useState<string | null>(null);
  const [currentBaseGameName, setCurrentBaseGameName] = useState<string>('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchGames = useCallback(async () => {
    // Fetch all games (base games and expansions)
    const { data: allGames, error } = await supabase
      .from('games')
      .select('*')
      .order('name');

    // Fetch ownership data with profiles
    const { data: ownershipData } = await supabase
      .from('user_games')
      .select(`
        game_id,
        user_id,
        profile:profiles(display_name, username)
      `);

    if (!error && allGames) {
      // Create a map of game_id -> owners
      const ownershipMap = new Map<string, Owner[]>();
      if (ownershipData) {
        for (const ownership of ownershipData) {
          const gameId = ownership.game_id;
          if (!ownershipMap.has(gameId)) {
            ownershipMap.set(gameId, []);
          }
          const profile = Array.isArray(ownership.profile) ? ownership.profile[0] : ownership.profile;
          if (profile) {
            ownershipMap.get(gameId)!.push({
              user_id: ownership.user_id,
              profile: profile as { display_name: string | null; username: string }
            });
          }
        }
      }

      // Separate base games and expansions and add ownership
      const baseGames: GameWithOwnership[] = allGames
        .filter((g: Game) => g.type !== 'expansion')
        .map((g: Game) => ({
          ...g,
          owners: ownershipMap.get(g.id) || []
        }));

      const expansions: GameWithOwnership[] = allGames
        .filter((g: Game) => g.type === 'expansion')
        .map((g: Game) => ({
          ...g,
          owners: ownershipMap.get(g.id) || []
        }));

      // Group expansions under their base games
      const grouped: GameWithExpansions[] = baseGames.map((game) => {
        const gameExpansions = expansions.filter((exp) => exp.base_game_id === game.id);
        return { ...game, expansions: gameExpansions };
      });

      setGamesWithExpansions(grouped);

      // Track which BGG IDs are already in the library
      const bggIds = new Set(allGames.map((g: Game) => g.bgg_id));
      setAddedGameIds(bggIds);

      // Auto-expand games that have expansions
      const withExpansions = grouped
        .filter(g => g.expansions.length > 0)
        .map(g => g.id);
      setExpandedGames(new Set(withExpansions));
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

      setCurrentUserId(user.id);

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

  const toggleExpanded = (gameId: string) => {
    setExpandedGames(prev => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  };

  // Debounced search - searches automatically as user types
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);

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
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
      setAddedGameIds(prev => new Set(prev).add(bggId));

      // If game has expansions, show modal to import them
      if (data.expansions && data.expansions.length > 0) {
        const notImported = data.expansions.filter((e: BGGExpansion) => !e.inLibrary);
        if (notImported.length > 0) {
          setPendingExpansions(notImported);
          setCurrentBaseGameId(data.game.id);
          setCurrentBaseGameName(data.game.name);
          setSelectedExpansions(new Set());
          setShowExpansions(true);
        }
      }
    } catch (error) {
      console.error('Error adding game:', error);
    } finally {
      setAddingGameId(null);
    }
  };

  const handleImportExpansions = async () => {
    if (selectedExpansions.size === 0 || !currentBaseGameId) return;

    setImportingExpansions(true);

    for (const bggId of Array.from(selectedExpansions)) {
      try {
        await fetch('/api/bgg/expansions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bggId, baseGameId: currentBaseGameId }),
        });
      } catch (error) {
        console.error(`Error importing expansion ${bggId}:`, error);
      }
    }

    await fetchGames();
    setImportingExpansions(false);
    setShowExpansions(false);
    setPendingExpansions([]);
    setSelectedExpansions(new Set());
    setCurrentBaseGameId(null);
  };

  const toggleExpansionSelection = (bggId: number) => {
    setSelectedExpansions(prev => {
      const next = new Set(prev);
      if (next.has(bggId)) {
        next.delete(bggId);
      } else {
        next.add(bggId);
      }
      return next;
    });
  };

  const selectAllExpansions = () => {
    setSelectedExpansions(new Set(pendingExpansions.map(e => e.bggId)));
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  };

  // Get owner display info for a game (returns null if current user owns it)
  const getOtherOwner = (owners: Owner[]): string | null => {
    if (!currentUserId || owners.length === 0) return null;

    const isOwnedByMe = owners.some(o => o.user_id === currentUserId);
    if (isOwnedByMe) return null;

    // Return the first owner's display name
    const firstOwner = owners[0];
    return firstOwner.profile.display_name || firstOwner.profile.username;
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
          <div className="flex gap-3">
            <Link href="/bg-tracker/collection/import">
              <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>
                Import Collection
              </Button>
            </Link>
            <Button
              leftIcon={<Search className="h-4 w-4" />}
              onClick={() => setShowSearch(true)}
            >
              Add Game from BGG
            </Button>
          </div>
        </div>

        {loading ? (
          <GameListSkeleton />
        ) : gamesWithExpansions.length === 0 ? (
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
          <div className="space-y-2">
            {gamesWithExpansions.map((game) => {
              const hasExpansions = game.expansions.length > 0;
              const isExpanded = expandedGames.has(game.id);

              return (
                <div key={game.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
                  {/* Base Game Row */}
                  <div className="p-4 flex items-center gap-4 hover:bg-slate-800/80 transition-colors">
                    {/* Expand/Collapse Button */}
                    {hasExpansions ? (
                      <button
                        onClick={() => toggleExpanded(game.id)}
                        className="p-2.5 hover:bg-slate-700 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} expansions for ${game.name}`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    ) : (
                      <div className="w-[44px]" />
                    )}

                    {/* Thumbnail */}
                    <Link href={`/bg-tracker/games/${game.id}`} className="flex-shrink-0">
                      {game.thumbnail_url ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-800">
                          <Image
                            src={game.thumbnail_url}
                            alt={game.name}
                            fill
                            className="object-cover"

                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center">
                          <Dice5 className="h-6 w-6 text-slate-600" />
                        </div>
                      )}
                    </Link>

                    {/* Game Info */}
                    <Link href={`/bg-tracker/games/${game.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-slate-100">{game.name}</h3>
                        {hasExpansions && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                            <Package className="h-3 w-3" />
                            +{game.expansions.length}
                          </span>
                        )}
                        {(() => {
                          const otherOwner = getOtherOwner(game.owners);
                          return otherOwner ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                              {otherOwner}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                        {game.year_published && <span>{game.year_published}</span>}
                        {game.min_players && game.max_players && (
                          <span>{game.min_players}-{game.max_players} players</span>
                        )}
                        {game.playing_time && <span>~{game.playing_time} min</span>}
                        {game.bgg_rating && (
                          <span className="text-emerald-400">★ {game.bgg_rating.toFixed(1)}</span>
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Expansions List */}
                  {hasExpansions && isExpanded && (
                    <div className="border-t border-slate-700/50 bg-slate-900/30">
                      {game.expansions.map((expansion) => (
                        <Link
                          key={expansion.id}
                          href={`/bg-tracker/games/${expansion.id}`}
                          className="px-4 py-3 flex items-center gap-4 pl-16 border-b border-slate-800/50 last:border-b-0 hover:bg-slate-800/50 transition-colors"
                        >
                          {/* Expansion Thumbnail */}
                          {expansion.thumbnail_url ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden bg-slate-800 flex-shrink-0">
                              <Image
                                src={expansion.thumbnail_url}
                                alt={expansion.name}
                                fill
                                className="object-cover"
    
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-slate-600" />
                            </div>
                          )}

                          {/* Expansion Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Package className="w-3 h-3 text-purple-400 flex-shrink-0" />
                              <span className="text-sm text-slate-300">{expansion.name}</span>
                            </div>
                            {expansion.year_published && (
                              <span className="text-xs text-slate-500">{expansion.year_published}</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" role="dialog" aria-modal="true" aria-label="Search games">
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
              <div className="relative">
                <Input
                  placeholder="Search for a game..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  leftIcon={searching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  autoFocus
                />
                {searchQuery.length > 0 && searchQuery.length < 2 && (
                  <p className="text-xs text-slate-500 mt-2">Type at least 2 characters to search...</p>
                )}
              </div>
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
                  Start typing to search BoardGameGeek...
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

      {/* Expansions Modal */}
      {showExpansions && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" role="dialog" aria-modal="true" aria-label="Import expansions">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExpansions(false)}
          />

          <Card variant="glass" className="relative z-10 w-full max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Package className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Expansions Found</h2>
                  <p className="text-sm text-slate-400">{currentBaseGameName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowExpansions(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {pendingExpansions.length} expansion{pendingExpansions.length !== 1 ? 's' : ''} available
              </p>
              <button
                onClick={selectAllExpansions}
                className="text-sm text-emerald-400 hover:text-emerald-300"
              >
                Select all
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {pendingExpansions.map((expansion) => (
                <label
                  key={expansion.bggId}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedExpansions.has(expansion.bggId)
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedExpansions.has(expansion.bggId)}
                    onChange={() => toggleExpansionSelection(expansion.bggId)}
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                    selectedExpansions.has(expansion.bggId)
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-500'
                  }`}>
                    {selectedExpansions.has(expansion.bggId) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-slate-200 flex-1">{expansion.name}</span>
                </label>
              ))}
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowExpansions(false)}
              >
                Skip
              </Button>
              <Button
                className="flex-1"
                disabled={selectedExpansions.size === 0 || importingExpansions}
                onClick={handleImportExpansions}
                leftIcon={importingExpansions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              >
                {importingExpansions ? 'Importing...' : `Import ${selectedExpansions.size} expansion${selectedExpansions.size !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
