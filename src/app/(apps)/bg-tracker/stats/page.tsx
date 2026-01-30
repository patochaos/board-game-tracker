'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, StatCard, EmptyState, StatCardsSkeleton } from '@/components/ui';
import { BarChart3, Trophy, Target, Clock, Dice5, TrendingUp, Medal, Users, Calendar, Award, Star, Zap, Flame, Crown, Sparkles, Swords, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import { format, subDays, eachWeekOfInterval } from 'date-fns';
import { SessionWithDetails } from '@/types';

interface PlayerStats {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  total_plays: number;
  total_wins: number;
  win_rate: number;
  games_played: number;
}

interface GameStats {
  game_id: string;
  name: string;
  thumbnail_url: string | null;
  total_plays: number;
  total_players: number;
  avg_score: number | null;
  high_score: number | null;
  avg_duration: number | null;
}

interface OverviewStats {
  totalSessions: number;
  totalPlayTime: number;
  uniqueGames: number;
}

interface WeeklyActivity {
  week: string;
  sessions: number;
}

interface GameWinRate {
  gameId: string;
  name: string;
  plays: number;
  wins: number;
  winRate: number;
}

interface Nemesis {
  name: string;
  winsAgainstUser: number;
  totalGamesTogether: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: { current: number; target: number };
}

const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_play', name: 'Getting Started', description: 'Log your first game session', target: 1, type: 'plays' },
  { id: 'plays_10', name: 'Regular Player', description: 'Play 10 game sessions', target: 10, type: 'plays' },
  { id: 'plays_50', name: 'Dedicated Gamer', description: 'Play 50 game sessions', target: 50, type: 'plays' },
  { id: 'first_win', name: 'Winner!', description: 'Win your first game', target: 1, type: 'wins' },
  { id: 'wins_10', name: 'Champion', description: 'Win 10 games', target: 10, type: 'wins' },
  { id: 'wins_25', name: 'Dominator', description: 'Win 25 games', target: 25, type: 'wins' },
  { id: 'games_5', name: 'Variety Pack', description: 'Play 5 different games', target: 5, type: 'uniqueGames' },
  { id: 'games_10', name: 'Game Explorer', description: 'Play 10 different games', target: 10, type: 'uniqueGames' },
  { id: 'time_5h', name: 'Time Well Spent', description: 'Accumulate 5 hours of play time', target: 300, type: 'playTime' },
  { id: 'time_24h', name: 'Marathon Gamer', description: 'Accumulate 24 hours of play time', target: 1440, type: 'playTime' },
  { id: 'hindex_3', name: 'Collection Builder', description: 'Reach H-Index of 3', target: 3, type: 'hindex' },
  { id: 'winrate_60', name: 'Above Average', description: 'Maintain 60%+ win rate (min 5 games)', target: 60, type: 'winRate' },
];

export default function StatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUserStats, setCurrentUserStats] = useState<PlayerStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [overview, setOverview] = useState<OverviewStats>({ totalSessions: 0, totalPlayTime: 0, uniqueGames: 0 });
  const [hIndex, setHIndex] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [gameWinRates, setGameWinRates] = useState<GameWinRate[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [nemesis, setNemesis] = useState<Nemesis | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // Check auth and group membership
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

      // Fetch player stats (leaderboard)
      const { data: playerStats } = await supabase
        .from('player_stats')
        .select('*')
        .order('total_wins', { ascending: false });

      if (playerStats) {
        setLeaderboard(playerStats);
        if (user) {
          const userStats = playerStats.find(p => p.user_id === user.id);
          setCurrentUserStats(userStats || null);
        }
      }

      // Fetch game stats
      const { data: games } = await supabase
        .from('game_stats')
        .select('*')
        .order('total_plays', { ascending: false })
        .limit(10);

      if (games) {
        setGameStats(games);

        // Calculate H-index
        const playCounts = games.map(g => g.total_plays).sort((a, b) => b - a);
        let h = 0;
        for (let i = 0; i < playCounts.length; i++) {
          if (playCounts[i] >= i + 1) {
            h = i + 1;
          } else {
            break;
          }
        }
        setHIndex(h);
      }

      // Fetch sessions for charts
      const { data: allSessions } = await supabase
        .from('sessions')
        .select(`
          id,
          played_at,
          duration_minutes,
          game_id,
          game:games!sessions_game_id_fkey(id, name, app_type),
          session_players(user_id, is_winner, profile:profiles(display_name, username))
        `)
        .order('played_at', { ascending: false });

      // Filter to only boardgame sessions (exclude VTES)
      const sessions = allSessions?.filter(s => {
        const game = s.game as { app_type?: string } | null;
        return !game?.app_type || game.app_type === 'boardgame';
      });

      if (sessions) {
        const totalPlayTime = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
        const uniqueGames = new Set(sessions.map(s => s.game_id)).size;
        setOverview({
          totalSessions: sessions.length,
          totalPlayTime,
          uniqueGames,
        });

        // Calculate weekly activity (last 8 weeks)
        const now = new Date();
        const eightWeeksAgo = subDays(now, 56);
        const weeks = eachWeekOfInterval({ start: eightWeeksAgo, end: now });

        const activityByWeek: WeeklyActivity[] = weeks.map(weekStart => {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          const count = sessions.filter(s => {
            const sessionDate = new Date(s.played_at);
            return sessionDate >= weekStart && sessionDate < weekEnd;
          }).length;

          return {
            week: format(weekStart, 'MMM d'),
            sessions: count,
          };
        });

        setWeeklyActivity(activityByWeek);

        // Calculate win rate per game for current user
        if (user) {
          const gameMap = new Map<string, { name: string; plays: number; wins: number }>();

          (sessions as unknown as SessionWithDetails[]).forEach((session) => {
            const gameName = session.game?.name || 'Unknown';
            const gameId = session.game_id;
            const myPlay = session.session_players?.find((sp) => sp.user_id === user.id);

            if (myPlay) {
              const existing = gameMap.get(gameId) || { name: gameName, plays: 0, wins: 0 };
              existing.plays++;
              if (myPlay.is_winner) existing.wins++;
              gameMap.set(gameId, existing);
            }
          });

          const winRates: GameWinRate[] = Array.from(gameMap.entries())
            .map(([gameId, data]) => ({
              gameId,
              name: data.name,
              plays: data.plays,
              wins: data.wins,
              winRate: Math.round((data.wins / data.plays) * 100),
            }))
            .sort((a, b) => b.plays - a.plays)
            .slice(0, 5);

          setGameWinRates(winRates);

          // Calculate achievements
          const plays = winRates.reduce((acc, g) => acc + g.plays, 0);
          const wins = winRates.reduce((acc, g) => acc + g.wins, 0);
          const uniqueGamesCount = winRates.length;
          const totalTime = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
          const currentWinRate = plays >= 5 ? Math.round((wins / plays) * 100) : 0;

          const achievementIcons: Record<string, React.ReactNode> = {
            first_play: <Star className="h-5 w-5" />,
            plays_10: <Dice5 className="h-5 w-5" />,
            plays_50: <Flame className="h-5 w-5" />,
            first_win: <Trophy className="h-5 w-5" />,
            wins_10: <Medal className="h-5 w-5" />,
            wins_25: <Crown className="h-5 w-5" />,
            games_5: <Target className="h-5 w-5" />,
            games_10: <Sparkles className="h-5 w-5" />,
            time_5h: <Clock className="h-5 w-5" />,
            time_24h: <Zap className="h-5 w-5" />,
            hindex_3: <Award className="h-5 w-5" />,
            winrate_60: <TrendingUp className="h-5 w-5" />,
          };

          const calculatedAchievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => {
            let current = 0;
            switch (def.type) {
              case 'plays': current = plays; break;
              case 'wins': current = wins; break;
              case 'uniqueGames': current = uniqueGamesCount; break;
              case 'playTime': current = totalTime; break;
              case 'hindex': current = hIndex; break;
              case 'winRate': current = plays >= 5 ? currentWinRate : 0; break;
            }
            return {
              id: def.id,
              name: def.name,
              description: def.description,
              icon: achievementIcons[def.id],
              unlocked: current >= def.target,
              progress: { current, target: def.target },
            };
          });

          setAchievements(calculatedAchievements);
          setAchievements(calculatedAchievements);

          // Calculate Nemesis (The player who beats you the most)
          const rivalMap = new Map<string, { name: string, wins: number, games: number }>();

          (sessions as unknown as SessionWithDetails[]).forEach((session) => {
            const myPlay = session.session_players.find((p) => p.user_id === user.id);
            // Only count games where I played AND I lost
            if (myPlay && !myPlay.is_winner) {
              const winner = session.session_players.find((p) => p.is_winner);
              if (winner && winner.user_id !== user.id) { // Ensure winner is not me (redundant check but safe)
                const rivalId = winner.user_id;
                const rivalName = winner.profile?.display_name || winner.profile?.username || 'Unknown';

                const current = rivalMap.get(rivalId) || { name: rivalName, wins: 0, games: 0 };
                current.wins++;
                rivalMap.set(rivalId, current);
              }
            }

            // Track total games together just for context (optional)
            if (myPlay) {
              session.session_players.forEach((p) => {
                if (p.user_id !== user.id) {
                  const rivalId = p.user_id;
                  const rivalName = p.profile?.display_name || p.profile?.username || 'Unknown';
                  const current = rivalMap.get(rivalId) || { name: rivalName, wins: 0, games: 0 };
                  current.games++;
                  rivalMap.set(rivalId, current);
                }
              });
            }
          });

          // Find the nemesis
          let topNemesis: Nemesis | null = null;
          let maxLosses = 0;

          rivalMap.forEach((stats) => {
            if (stats.wins > maxLosses) {
              maxLosses = stats.wins;
              topNemesis = {
                name: stats.name,
                winsAgainstUser: stats.wins,
                totalGamesTogether: stats.games
              };
            }
          });

          if (topNemesis) {
            setNemesis(topNemesis);
          }
        }
      }

      setLoading(false);
    };

    fetchStats();
  }, []);

  const formatPlayTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getRankIcon = (position: number) => {
    if (position === 0) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (position === 1) return <Medal className="h-5 w-5 text-slate-300" />;
    if (position === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-slate-500">{position + 1}</span>;
  };

  const maxWeeklySessions = Math.max(...weeklyActivity.map(w => w.sessions), 1);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <div>
            <div className="h-9 w-48 bg-slate-800/60 rounded animate-pulse" />
            <div className="h-5 w-64 bg-slate-800/60 rounded animate-pulse mt-2" />
          </div>
          <StatCardsSkeleton />
        </div>
      </AppLayout>
    );
  }

  const hasData = overview.totalSessions > 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Statistics</h1>
          <p className="mt-1 text-slate-400">
            Your gaming performance at a glance
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="H-Index"
            value={hIndex}
            subValue={hIndex > 0 ? `${hIndex} games played ${hIndex}+ times` : "Play more to build your H-Index"}
            icon={<Target className="h-8 w-8" />}
          />
          <StatCard
            label="Total Wins"
            value={currentUserStats?.total_wins || 0}
            subValue={`${currentUserStats?.total_plays || 0} total plays`}
            icon={<Trophy className="h-8 w-8" />}
          />
          <StatCard
            label="Win Rate"
            value={currentUserStats ? `${currentUserStats.win_rate || 0}%` : '0%'}
            subValue={`${currentUserStats?.games_played || 0} different games`}
            icon={<TrendingUp className="h-8 w-8" />}
          />
          <StatCard
            label="Play Time"
            value={formatPlayTime(overview.totalPlayTime)}
            subValue={`${overview.totalSessions} sessions`}
            icon={<Clock className="h-8 w-8" />}
          />
          {nemesis && (
            <StatCard
              label="Your Nemesis"
              value={nemesis.name}
              subValue={`Defeated you ${nemesis.winsAgainstUser} times`}
              icon={<Swords className="h-8 w-8 text-red-500" />}
            />
          )}
        </div>

        {/* Head-to-Head Link */}
        <Link href="/bg-tracker/stats/head-to-head">
          <Card variant="glass" className="hover:border-red-500/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/20">
                  <Swords className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">Head-to-Head Comparison</h3>
                  <p className="text-sm text-slate-400">Compare stats between any two players</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-500" />
            </div>
          </Card>
        </Link>

        {/* Charts Row */}
        {hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Chart */}
            <Card variant="glass">
              <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Weekly Activity
              </h2>
              <div className="flex items-end justify-between gap-2 h-32">
                {weeklyActivity.map((week, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center justify-end h-24">
                      <div
                        className="w-full max-w-[40px] bg-emerald-500/80 rounded-t transition-all"
                        style={{
                          height: `${(week.sessions / maxWeeklySessions) * 100}%`,
                          minHeight: week.sessions > 0 ? '8px' : '0',
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 truncate w-full text-center">
                      {week.week}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-slate-500 mt-4">
                {overview.totalSessions} sessions in the last 8 weeks
              </p>
            </Card>

            {/* Win Rate by Game */}
            <Card variant="glass">
              <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Your Win Rate by Game
              </h2>
              {gameWinRates.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Play some games to see your win rates</p>
              ) : (
                <div className="space-y-3">
                  {gameWinRates.map((game) => (
                    <div key={game.gameId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300 truncate pr-2">{game.name}</span>
                        <span className="text-slate-400 flex-shrink-0">
                          {game.winRate}% ({game.wins}/{game.plays})
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${game.winRate >= 50 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          style={{ width: `${game.winRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <Card variant="glass">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Achievements
              <span className="text-sm font-normal text-slate-500">
                ({achievements.filter(a => a.unlocked).length}/{achievements.length})
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-xl border transition-all ${achievement.unlocked
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={achievement.unlocked ? 'text-purple-400' : 'text-slate-500'}>
                      {achievement.icon}
                    </div>
                    <span className={`font-medium text-sm ${achievement.unlocked ? 'text-slate-200' : 'text-slate-400'}`}>
                      {achievement.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{achievement.description}</p>
                  {!achievement.unlocked && achievement.progress && (
                    <div className="space-y-1">
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500/50 rounded-full transition-all"
                          style={{ width: `${Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600">
                        {achievement.progress.current}/{achievement.progress.target}
                      </p>
                    </div>
                  )}
                  {achievement.unlocked && (
                    <span className="text-xs text-purple-400 font-medium">Unlocked!</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <Card variant="glass">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leaderboard
            </h2>
            {leaderboard.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="h-16 w-16" />}
                title="No data yet"
                description="Play some games to see the leaderboard!"
              />
            ) : (
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.user_id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${index === 0
                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                        : 'bg-slate-800/50 hover:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(index)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 truncate">
                        {player.display_name || player.username}
                      </p>
                      <p className="text-xs text-slate-500">
                        {player.total_plays} plays · {player.games_played} games
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{player.total_wins} wins</p>
                      <p className="text-xs text-slate-500">{player.win_rate || 0}% rate</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Most Played Games */}
          <Card variant="glass">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Dice5 className="h-5 w-5 text-emerald-500" />
              Most Played Games
            </h2>
            {gameStats.length === 0 ? (
              <EmptyState
                icon={<Dice5 className="h-16 w-16" />}
                title="No games played"
                description="Your most played games will appear here"
              />
            ) : (
              <div className="space-y-2">
                {gameStats.map((game, index) => (
                  <div
                    key={game.game_id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 text-slate-500 font-medium">
                      {index + 1}
                    </div>
                    {game.thumbnail_url ? (
                      <div className="relative w-10 h-10 rounded overflow-hidden bg-slate-700 flex-shrink-0">
                        <Image
                          src={game.thumbnail_url}
                          alt={game.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Dice5 className="h-5 w-5 text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 truncate">{game.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {game.total_players}
                        </span>
                        {game.avg_duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ~{Math.round(game.avg_duration)}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-200">{game.total_plays}</p>
                      <p className="text-xs text-slate-500">plays</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Game Stats Details */}
        {gameStats.length > 0 && (
          <Card variant="glass">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Game Details
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                    <th className="pb-3 font-medium">Game</th>
                    <th className="pb-3 font-medium text-center">Plays</th>
                    <th className="pb-3 font-medium text-center">Players</th>
                    <th className="pb-3 font-medium text-center">Avg Score</th>
                    <th className="pb-3 font-medium text-center">High Score</th>
                    <th className="pb-3 font-medium text-center">Avg Time</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {gameStats.map((game) => (
                    <tr key={game.game_id} className="border-b border-slate-800 last:border-0">
                      <td className="py-3">
                        <span className="text-slate-200">{game.name}</span>
                      </td>
                      <td className="py-3 text-center text-slate-300">{game.total_plays}</td>
                      <td className="py-3 text-center text-slate-300">{game.total_players}</td>
                      <td className="py-3 text-center text-slate-300">
                        {game.avg_score ? Math.round(game.avg_score) : '-'}
                      </td>
                      <td className="py-3 text-center text-emerald-400 font-medium">
                        {game.high_score || '-'}
                      </td>
                      <td className="py-3 text-center text-slate-300">
                        {game.avg_duration ? `${Math.round(game.avg_duration)}m` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
