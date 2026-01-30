'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, EmptyState, SessionListSkeleton } from '@/components/ui';
import { CalendarDays, Plus, Trophy, Clock, Dice5, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import { format } from 'date-fns';

interface Game {
  id: string;
  name: string;
  thumbnail_url: string | null;
}

interface GuestPlayer {
  id: string;
  name: string;
  score: number | null;
  is_winner: boolean;
}

interface SessionWithDetails {
  id: string;
  played_at: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  game: Game;
  session_players: {
    id: string;
    score: number | null;
    is_winner: boolean;
    user_id: string;
    profile: {
      display_name: string | null;
      username: string;
    };
  }[];
  guest_players: GuestPlayer[];
  isNewToGroup?: boolean;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [allSessions, setAllSessions] = useState<SessionWithDetails[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterGame, setFilterGame] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      // Check auth and group membership
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

      // Fetch sessions (excluding VTES sessions which have their own tracker)
      const VTES_GAME_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const { data: sessionsData, error } = await supabase
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

      if (error) {
        console.error('Error fetching sessions:', error);
      }

      if (sessionsData) {
        const typedSessions = sessionsData as unknown as SessionWithDetails[];

        // Calculate "New to Group" status
        // 1. Sort by date ascending to process history chronologically
        const chronological = [...typedSessions].sort((a, b) =>
          new Date(a.played_at).getTime() - new Date(b.played_at).getTime()
        );

        const seenGameIds = new Set<string>();
        const sessionsWithBadges = chronological.map(session => {
          const isNew = !seenGameIds.has(session.game?.id);
          if (session.game?.id) {
            seenGameIds.add(session.game.id);
          }
          return { ...session, isNewToGroup: isNew };
        });

        // 2. Sort back to descending for display
        const displaySessions = sessionsWithBadges.sort((a, b) =>
          new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
        );

        setAllSessions(displaySessions);
        setSessions(displaySessions);

        // Extract unique games for filter
        const uniqueGames = displaySessions
          .map(s => s.game)
          .filter((g, i, arr) => g && arr.findIndex(x => x?.id === g?.id) === i) as Game[];
        setGames(uniqueGames);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...allSessions];

    if (filterGame) {
      filtered = filtered.filter(s => s.game?.id === filterGame);
    }

    if (filterDateFrom) {
      filtered = filtered.filter(s => s.played_at >= filterDateFrom);
    }

    if (filterDateTo) {
      filtered = filtered.filter(s => s.played_at <= filterDateTo);
    }

    setSessions(filtered);
  }, [filterGame, filterDateFrom, filterDateTo, allSessions]);

  const clearFilters = () => {
    setFilterGame('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilters = filterGame || filterDateFrom || filterDateTo;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Sessions</h1>
            <p className="mt-1 text-slate-400">
              Your game session history
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
              className={hasActiveFilters ? 'border-emerald-500' : ''}
            >
              Filters {hasActiveFilters && `(${[filterGame, filterDateFrom, filterDateTo].filter(Boolean).length})`}
            </Button>
            <Link href="/bg-tracker/sessions/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                Log New Session
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card variant="glass">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Game</label>
                <select
                  value={filterGame}
                  onChange={(e) => setFilterGame(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-slate-600"
                >
                  <option value="">All games</option>
                  {games.map(game => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">From</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-slate-600"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">To</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-slate-600"
                />
              </div>
              {hasActiveFilters && (
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={clearFilters}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {loading ? (
          <SessionListSkeleton />
        ) : sessions.length === 0 ? (
          <Card variant="glass">
            <EmptyState
              icon={<CalendarDays className="h-20 w-20" />}
              title={hasActiveFilters ? "No matching sessions" : "No sessions logged"}
              description={hasActiveFilters
                ? "Try adjusting your filters to find sessions."
                : "Start tracking your game nights! Log your first session to see your history here."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Link href="/bg-tracker/sessions/new">
                    <Button leftIcon={<Plus className="h-4 w-4" />}>
                      Log First Session
                    </Button>
                  </Link>
                )
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                variant="glass"
                className="hover:border-emerald-500/50 transition-colors cursor-pointer"
                data-testid={`session-card-${session.id}`}
                onClick={() => {
                  console.log(`[DEBUG] Clicked session ${session.id}, pushing router...`);
                  router.push(`/bg-tracker/sessions/${session.id}`);
                }}
              >
                <div className="flex gap-4">
                  {/* Game Thumbnail */}
                  {session.game?.thumbnail_url ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                      <Image
                        src={session.game.thumbnail_url}
                        alt={session.game.name}
                        fill
                        className="object-cover"

                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Dice5 className="h-6 w-6 text-slate-600" />
                    </div>
                  )}

                  {/* Session Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-100">
                          {session.game?.name || 'Unknown Game'}
                        </h3>
                        {session.isNewToGroup && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            New to Group!
                          </span>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(session.played_at)}
                          </span>
                          {session.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {session.duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Players */}
                    {(session.session_players?.length > 0 || session.guest_players?.length > 0) && (
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {session.session_players?.map((sp) => (
                          <div
                            key={sp.id}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm ${sp.is_winner
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-800 text-slate-300'
                              }`}
                          >
                            {sp.is_winner && <Trophy className="h-3 w-3" />}
                            <span>{sp.profile?.display_name || sp.profile?.username}</span>
                            {sp.score !== null && (
                              <span className="text-slate-500">({sp.score})</span>
                            )}
                          </div>
                        ))}
                        {session.guest_players?.map((gp) => (
                          <div
                            key={gp.id}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm ${gp.is_winner
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-800 text-slate-300'
                              }`}
                          >
                            {gp.is_winner && <Trophy className="h-3 w-3" />}
                            <span>{gp.name}</span>
                            {gp.score !== null && (
                              <span className="text-slate-500">({gp.score})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes preview */}
                    {session.notes && (
                      <p className="mt-2 text-sm text-slate-500 line-clamp-1">
                        {session.notes}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
