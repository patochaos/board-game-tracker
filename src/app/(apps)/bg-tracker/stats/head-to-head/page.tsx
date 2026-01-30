'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { Swords, Trophy, Users, Loader2, ArrowLeft, Dice5 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import Link from 'next/link';

interface Player {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface HeadToHeadStats {
  totalGames: number;
  player1Wins: number;
  player2Wins: number;
  draws: number;
  gameBreakdown: {
    gameId: string;
    gameName: string;
    thumbnail: string | null;
    player1Wins: number;
    player2Wins: number;
    total: number;
  }[];
  recentMatches: {
    sessionId: string;
    gameName: string;
    date: string;
    winner: string | null;
  }[];
}

export default function HeadToHeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [player1, setPlayer1] = useState<string | null>(null);
  const [player2, setPlayer2] = useState<string | null>(null);
  const [stats, setStats] = useState<HeadToHeadStats | null>(null);
  const [calculating, setCalculating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const init = async () => {
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

      // Fetch all players who have played games
      const { data: playerData } = await supabase
        .from('session_players')
        .select(`
          user_id,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `);

      if (playerData) {
        const uniquePlayers = new Map<string, Player>();
        playerData.forEach((row) => {
          const profile = row.profiles as unknown as Player | null;
          if (profile && !uniquePlayers.has(row.user_id)) {
            uniquePlayers.set(row.user_id, profile);
          }
        });
        setPlayers(Array.from(uniquePlayers.values()));
      }

      setLoading(false);
    };

    init();
  }, []);

  const calculateStats = async () => {
    if (!player1 || !player2 || player1 === player2) return;

    setCalculating(true);
    setStats(null);

    // Fetch all sessions where both players participated
    const { data: allSessions } = await supabase
      .from('sessions')
      .select(`
        id,
        played_at,
        game:games (id, name, thumbnail_url, app_type),
        session_players (user_id, is_winner)
      `)
      .order('played_at', { ascending: false });

    if (!allSessions) {
      setCalculating(false);
      return;
    }

    // Filter to only boardgame sessions (exclude VTES)
    const sessions = allSessions.filter(s => {
      const game = s.game as { app_type?: string } | null;
      return !game?.app_type || game.app_type === 'boardgame';
    });

    // Filter sessions where both players participated
    const sharedSessions = sessions.filter(session => {
      const playerIds = session.session_players.map((sp: { user_id: string }) => sp.user_id);
      return playerIds.includes(player1) && playerIds.includes(player2);
    });

    let p1Wins = 0;
    let p2Wins = 0;
    let draws = 0;
    const gameMap = new Map<string, { name: string; thumbnail: string | null; p1: number; p2: number; total: number }>();
    const recentMatches: HeadToHeadStats['recentMatches'] = [];

    sharedSessions.forEach(session => {
      const p1Data = session.session_players.find((sp: { user_id: string }) => sp.user_id === player1);
      const p2Data = session.session_players.find((sp: { user_id: string }) => sp.user_id === player2);

      const gameData = session.game as unknown as { id: string; name: string; thumbnail_url: string | null } | { id: string; name: string; thumbnail_url: string | null }[] | null;
      const game = Array.isArray(gameData) ? gameData[0] : gameData;
      const gameId = game?.id || 'unknown';
      const gameName = game?.name || 'Unknown Game';
      const thumbnail = game?.thumbnail_url || null;

      if (!gameMap.has(gameId)) {
        gameMap.set(gameId, { name: gameName, thumbnail, p1: 0, p2: 0, total: 0 });
      }

      const gameStats = gameMap.get(gameId)!;
      gameStats.total++;

      let winner: string | null = null;
      if (p1Data?.is_winner && !p2Data?.is_winner) {
        p1Wins++;
        gameStats.p1++;
        winner = player1;
      } else if (p2Data?.is_winner && !p1Data?.is_winner) {
        p2Wins++;
        gameStats.p2++;
        winner = player2;
      } else if (p1Data?.is_winner && p2Data?.is_winner) {
        draws++;
      } else {
        // Neither won (someone else won or no winner recorded)
        draws++;
      }

      if (recentMatches.length < 10) {
        recentMatches.push({
          sessionId: session.id,
          gameName,
          date: session.played_at,
          winner,
        });
      }
    });

    const gameBreakdown = Array.from(gameMap.entries())
      .map(([gameId, data]) => ({
        gameId,
        gameName: data.name,
        thumbnail: data.thumbnail,
        player1Wins: data.p1,
        player2Wins: data.p2,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total);

    setStats({
      totalGames: sharedSessions.length,
      player1Wins: p1Wins,
      player2Wins: p2Wins,
      draws,
      gameBreakdown,
      recentMatches,
    });

    setCalculating(false);
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.display_name || player?.username || 'Unknown';
  };

  const getPlayerAvatar = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.avatar_url;
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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/bg-tracker/stats">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Swords className="h-6 w-6 text-red-500" />
              Head-to-Head
            </h1>
            <p className="text-slate-400">Compare stats between two players</p>
          </div>
        </div>

        {/* Player Selection */}
        <Card variant="glass">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Select Players</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Player 1</label>
              <select
                value={player1 || ''}
                onChange={(e) => setPlayer1(e.target.value || null)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select player...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id} disabled={player.id === player2}>
                    {player.display_name || player.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Player 2</label>
              <select
                value={player2 || ''}
                onChange={(e) => setPlayer2(e.target.value || null)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select player...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id} disabled={player.id === player1}>
                    {player.display_name || player.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={calculateStats}
              disabled={!player1 || !player2 || player1 === player2 || calculating}
              leftIcon={calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
            >
              {calculating ? 'Calculating...' : 'Compare'}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {stats && player1 && player2 && (
          <>
            {/* Main Stats */}
            <Card variant="glass">
              <div className="flex items-center justify-between">
                {/* Player 1 */}
                <div className="flex-1 text-center">
                  <div className="flex justify-center mb-3">
                    {getPlayerAvatar(player1) ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-emerald-500">
                        <Image src={getPlayerAvatar(player1)!} alt="" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center text-xl font-bold text-emerald-400">
                        {getPlayerName(player1).substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-100">{getPlayerName(player1)}</h3>
                  <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.player1Wins}</p>
                  <p className="text-sm text-slate-500">wins</p>
                </div>

                {/* VS */}
                <div className="px-6 text-center">
                  <div className="p-3 rounded-full bg-slate-800 border border-slate-700">
                    <Swords className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{stats.totalGames} games</p>
                </div>

                {/* Player 2 */}
                <div className="flex-1 text-center">
                  <div className="flex justify-center mb-3">
                    {getPlayerAvatar(player2) ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-blue-500">
                        <Image src={getPlayerAvatar(player2)!} alt="" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-500/20 border-4 border-blue-500 flex items-center justify-center text-xl font-bold text-blue-400">
                        {getPlayerName(player2).substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-100">{getPlayerName(player2)}</h3>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{stats.player2Wins}</p>
                  <p className="text-sm text-slate-500">wins</p>
                </div>
              </div>

              {/* Win Bar */}
              <div className="mt-6">
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex">
                  {stats.player1Wins > 0 && (
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${(stats.player1Wins / stats.totalGames) * 100}%` }}
                    />
                  )}
                  {stats.draws > 0 && (
                    <div
                      className="bg-slate-600 transition-all"
                      style={{ width: `${(stats.draws / stats.totalGames) * 100}%` }}
                    />
                  )}
                  {stats.player2Wins > 0 && (
                    <div
                      className="bg-blue-500 transition-all"
                      style={{ width: `${(stats.player2Wins / stats.totalGames) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>{Math.round((stats.player1Wins / stats.totalGames) * 100)}%</span>
                  {stats.draws > 0 && <span>{stats.draws} draws</span>}
                  <span>{Math.round((stats.player2Wins / stats.totalGames) * 100)}%</span>
                </div>
              </div>
            </Card>

            {/* Game Breakdown */}
            {stats.gameBreakdown.length > 0 && (
              <Card variant="glass">
                <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <Dice5 className="h-5 w-5 text-purple-500" />
                  Breakdown by Game
                </h2>
                <div className="space-y-3">
                  {stats.gameBreakdown.map((game) => (
                    <div key={game.gameId} className="p-3 rounded-xl bg-slate-800/50">
                      <div className="flex items-center gap-3 mb-2">
                        {game.thumbnail ? (
                          <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                            <Image src={game.thumbnail} alt="" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <Dice5 className="h-5 w-5 text-slate-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-slate-200">{game.gameName}</p>
                          <p className="text-xs text-slate-500">{game.total} games played</p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-emerald-400 font-bold">{game.player1Wins}</span>
                          <span className="text-slate-500">-</span>
                          <span className="text-blue-400 font-bold">{game.player2Wins}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden flex">
                        {game.player1Wins > 0 && (
                          <div
                            className="bg-emerald-500"
                            style={{ width: `${(game.player1Wins / game.total) * 100}%` }}
                          />
                        )}
                        {game.total - game.player1Wins - game.player2Wins > 0 && (
                          <div
                            className="bg-slate-600"
                            style={{ width: `${((game.total - game.player1Wins - game.player2Wins) / game.total) * 100}%` }}
                          />
                        )}
                        {game.player2Wins > 0 && (
                          <div
                            className="bg-blue-500"
                            style={{ width: `${(game.player2Wins / game.total) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Matches */}
            {stats.recentMatches.length > 0 && (
              <Card variant="glass">
                <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Recent Matches
                </h2>
                <div className="space-y-2">
                  {stats.recentMatches.map((match) => (
                    <Link
                      key={match.sessionId}
                      href={`/sessions/${match.sessionId}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-200">{match.gameName}</p>
                        <p className="text-xs text-slate-500">{new Date(match.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {match.winner === player1 && (
                          <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                            {getPlayerName(player1)} won
                          </span>
                        )}
                        {match.winner === player2 && (
                          <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                            {getPlayerName(player2)} won
                          </span>
                        )}
                        {!match.winner && (
                          <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-400 text-xs font-medium">
                            Draw/Other
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {stats.totalGames === 0 && (
              <Card variant="glass">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300">No games together</h3>
                  <p className="text-slate-500">These players haven&apos;t played any games together yet.</p>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
