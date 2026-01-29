'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, StatCard, EmptyState } from '@/components/ui';
import { ArrowLeft, Loader2, Dice5, Trophy, TrendingUp, Clock, Users, CalendarDays, Target, Package } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';

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
  type?: string;
  base_game_id?: string | null;
}

interface Expansion {
  id: string;
  name: string;
  thumbnail_url: string | null;
  year_published: number | null;
}

interface SessionWithPlayers {
  id: string;
  played_at: string;
  duration_minutes: number | null;
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
}

interface PersonalStats {
  plays: number;
  wins: number;
  winRate: number;
  avgScore: number | null;
  bestScore: number | null;
  totalTime: number;
}

interface GameOwner {
  user_id: string;
  profile: {
    display_name: string | null;
    username: string;
  };
}

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [sessions, setSessions] = useState<SessionWithPlayers[]>([]);
  const [expansions, setExpansions] = useState<Expansion[]>([]);
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [owners, setOwners] = useState<GameOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Fetch game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError || !gameData) {
        setLoading(false);
        return;
      }

      setGame(gameData);

      // Fetch ownership data for this game
      const { data: ownershipData } = await supabase
        .from('user_games')
        .select(`
          user_id,
          profile:profiles(display_name, username)
        `)
        .eq('game_id', gameId);

      if (ownershipData) {
        setOwners(ownershipData
          .filter(o => o.profile && !Array.isArray(o.profile) || (Array.isArray(o.profile) && o.profile.length > 0))
          .map(o => {
            const profile = Array.isArray(o.profile) ? o.profile[0] : o.profile;
            return {
              user_id: o.user_id,
              profile: profile as { display_name: string | null; username: string }
            };
          }));
      }

      // Fetch expansions for this game (if it's a base game)
      if (gameData.type !== 'expansion') {
        const { data: expansionData } = await supabase
          .from('games')
          .select('id, name, thumbnail_url, year_published')
          .eq('base_game_id', gameId)
          .eq('type', 'expansion')
          .order('name');

        if (expansionData) {
          setExpansions(expansionData);
        }
      }

      // Fetch sessions for this game
      const { data: sessionsData } = await supabase
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

      if (sessionsData) {
        setSessions(sessionsData as unknown as SessionWithPlayers[]);

        // Calculate personal stats
        if (user) {
          let plays = 0;
          let wins = 0;
          let totalScore = 0;
          let scoreCount = 0;
          let bestScore: number | null = null;
          let totalTime = 0;

          (sessionsData as unknown as SessionWithPlayers[]).forEach((session) => {
            const myPlay = session.session_players?.find(
              (sp) => sp.user_id === user.id
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
      }

      setLoading(false);
    };

    fetchData();
  }, [gameId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return format(date, 'MMM d, yyyy');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </AppLayout>
    );
  }

  if (!game) {
    return (
      <AppLayout>
        <Card variant="glass" className="text-center py-12">
          <p className="text-slate-400">Game not found</p>
          <Link href="/bg-tracker/games" className="mt-4 inline-block">
            <Button variant="secondary">Back to Games</Button>
          </Link>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/bg-tracker/games">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
        </div>

        {/* Game Info */}
        <Card variant="glass">
          <div className="flex flex-col sm:flex-row gap-6">
            {game.thumbnail_url ? (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                <Image
                  src={game.thumbnail_url}
                  alt={game.name}
                  fill
                  className="object-cover"

                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Dice5 className="h-12 w-12 text-slate-600" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-100">{game.name}</h1>
              {game.year_published && (
                <p className="text-slate-400 mt-1">{game.year_published}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-400">
                {game.min_players && game.max_players && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {game.min_players}-{game.max_players} players
                  </span>
                )}
                {game.playing_time && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    ~{game.playing_time} min
                  </span>
                )}
                {game.bgg_rating && (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Target className="h-4 w-4" />
                    BGG: {game.bgg_rating.toFixed(1)}
                  </span>
                )}
              </div>
              {/* Owners */}
              {owners.length > 0 && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500">Owned by:</span>
                  {owners.map((owner) => {
                    const isMe = owner.user_id === currentUserId;
                    const displayName = owner.profile.display_name || owner.profile.username;
                    return (
                      <span
                        key={owner.user_id}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isMe
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {isMe ? 'You' : displayName}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Expansions */}
        {expansions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              Expansions ({expansions.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {expansions.map((expansion) => (
                <Card
                  key={expansion.id}
                  variant="glass"
                  className="p-3 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expansion.thumbnail_url ? (
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-slate-800 flex-shrink-0">
                        <Image
                          src={expansion.thumbnail_url}
                          alt={expansion.name}
                          fill
                          className="object-cover"
        
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{expansion.name}</p>
                      {expansion.year_published && (
                        <p className="text-xs text-slate-500">{expansion.year_published}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Personal Stats */}
        {personalStats && personalStats.plays > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Plays"
                value={personalStats.plays}
                icon={<Dice5 className="h-6 w-6" />}
              />
              <StatCard
                label="Wins"
                value={personalStats.wins}
                icon={<Trophy className="h-6 w-6" />}
              />
              <StatCard
                label="Win Rate"
                value={`${personalStats.winRate}%`}
                icon={<TrendingUp className="h-6 w-6" />}
              />
              {personalStats.bestScore !== null && (
                <StatCard
                  label="Best Score"
                  value={personalStats.bestScore}
                  subValue={personalStats.avgScore ? `Avg: ${personalStats.avgScore}` : undefined}
                  icon={<Target className="h-6 w-6" />}
                />
              )}
            </div>
          </div>
        )}

        {/* Session History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Session History</h2>
            <Link href={`/sessions/new?gameId=${gameId}`}>
              <Button size="sm">Log Session</Button>
            </Link>
          </div>

          {sessions.length === 0 ? (
            <Card variant="glass">
              <EmptyState
                icon={<CalendarDays className="h-16 w-16" />}
                title="No sessions yet"
                description={`You haven't played ${game.name} yet. Log your first session!`}
                action={
                  <Link href={`/sessions/new?gameId=${gameId}`}>
                    <Button>Log Session</Button>
                  </Link>
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link key={session.id} href={`/sessions/${session.id}`}>
                  <Card
                    variant="glass"
                    className="hover:border-emerald-500/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(session.played_at)}
                          {session.duration_minutes && (
                            <>
                              <span className="text-slate-600">·</span>
                              <Clock className="h-4 w-4" />
                              {session.duration_minutes} min
                            </>
                          )}
                        </div>
                        {/* Players */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {session.session_players?.map((sp) => (
                            <span
                              key={sp.id}
                              className={`text-sm px-2 py-0.5 rounded ${
                                sp.is_winner
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {sp.is_winner && <Trophy className="h-3 w-3 inline mr-1" />}
                              {sp.profile?.display_name || sp.profile?.username}
                              {sp.score !== null && ` (${sp.score})`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
