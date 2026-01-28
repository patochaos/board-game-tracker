import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { StatCard, Card, Button, EmptyState, Badge } from '@/components/ui';
import { Dice5, Trophy, Clock, Users, Plus, CalendarDays, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has a group
  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .limit(1);

  if (!membership || membership.length === 0) {
    redirect('/onboard');
  }

  // Fetch real data
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id,
      played_at,
      duration_minutes,
      game:games(name, thumbnail_url),
      session_players(is_winner, user_id)
    `)
    .order('played_at', { ascending: false })
    .limit(5);

  const { data: playerStats } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: gameStats } = await supabase
    .from('game_stats')
    .select('*')
    .order('total_plays', { ascending: false })
    .limit(3);

  const hasData = sessions && sessions.length > 0;

  // Calculate stats
  const totalSessions = sessions?.length || 0;
  const totalPlayTime = sessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0;
  const formatPlayTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h`;
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Welcome back!
            </h1>
            <p className="mt-1 text-slate-400">
              Ready for another game night?
            </p>
          </div>
          <Link href="/sessions/new">
            <Button size="lg" leftIcon={<Plus className="h-5 w-5" />}>
              Log New Session
            </Button>
          </Link>
        </div>

        {!hasData ? (
          /* Empty State for new users */
          <Card variant="glass" className="py-16">
            <EmptyState
              icon={<Dice5 className="h-20 w-20" />}
              title="No sessions yet"
              description="Log your first board game session to start tracking stats and competing with friends!"
              action={
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/sessions/new">
                    <Button leftIcon={<Plus className="h-4 w-4" />}>
                      Log First Session
                    </Button>
                  </Link>
                  <Link href="/players">
                    <Button variant="secondary" leftIcon={<Users className="h-4 w-4" />}>
                      Invite Friends
                    </Button>
                  </Link>
                </div>
              }
            />
          </Card>
        ) : (
          /* Dashboard with data */
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Sessions"
                value={totalSessions}
                icon={<CalendarDays className="h-8 w-8" />}
              />
              <StatCard
                label="Games Played"
                value={playerStats?.games_played || 0}
                icon={<Dice5 className="h-8 w-8" />}
              />
              <StatCard
                label="Win Rate"
                value={`${playerStats?.win_rate || 0}%`}
                icon={<Trophy className="h-8 w-8" />}
                subValue={`${playerStats?.total_wins || 0} wins`}
              />
              <StatCard
                label="Play Time"
                value={formatPlayTime(totalPlayTime)}
                icon={<Clock className="h-8 w-8" />}
                subValue="Total time played"
              />
            </div>

            {/* Recent Sessions & Top Games */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Sessions */}
              <Card variant="glass">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-100">Recent Sessions</h2>
                  <Link href="/sessions" className="text-sm text-emerald-400 hover:text-emerald-300">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {sessions?.map((session) => {
                    const userWon = session.session_players?.some(
                      (sp: { is_winner: boolean; user_id: string }) => sp.user_id === user.id && sp.is_winner
                    );
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50"
                      >
                        <div>
                          <p className="font-medium text-slate-200">
                            {(session.game as unknown as { name: string })?.name || 'Unknown Game'}
                          </p>
                          <p className="text-sm text-slate-500">{session.played_at}</p>
                        </div>
                        {userWon && (
                          <Trophy className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Top Games */}
              <Card variant="glass">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-100">Most Played Games</h2>
                  <Link href="/games" className="text-sm text-emerald-400 hover:text-emerald-300">
                    View all
                  </Link>
                </div>
                {gameStats && gameStats.length > 0 ? (
                  <div className="space-y-3">
                    {gameStats.map((game, index) => (
                      <div
                        key={game.game_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-medium">{index + 1}</span>
                          <span className="font-medium text-slate-200">{game.name}</span>
                        </div>
                        <span className="text-sm text-slate-400">{game.total_plays} plays</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No games yet"
                    description="Your favorite games will show up here"
                  />
                )}
              </Card>
            </div>
          </>
        )}

        {/* Quick Start Guide for new users */}
        {!hasData && (
          <Card variant="glass" className="bg-gradient-to-br from-emerald-500/5 to-transparent">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Quick Start</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  step: 1,
                  title: 'Add games',
                  description: 'Seed test games or search BoardGameGeek',
                  href: '/games',
                },
                {
                  step: 2,
                  title: 'Log a session',
                  description: 'Record your first game and start tracking!',
                  href: '/sessions/new',
                },
                {
                  step: 3,
                  title: 'View stats',
                  description: 'See your win rate and leaderboard',
                  href: '/stats',
                },
              ].map((item) => (
                <Link key={item.step} href={item.href}>
                  <div className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group cursor-pointer">
                    <Badge variant="green" className="mb-3">Step {item.step}</Badge>
                    <h3 className="font-medium text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
