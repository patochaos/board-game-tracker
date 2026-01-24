'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, EmptyState } from '@/components/ui';
import { Dice5, Search, Plus, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
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

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .neq('type', 'expansion')
      .order('name');

    if (!error && data) {
      setGames(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
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

      fetchGames();
    };

    checkAuthAndFetch();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await fetch('/api/seed', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        await fetchGames();
      } else {
        console.error('Seed failed:', result.error);
      }
    } catch (error) {
      console.error('Seed error:', error);
    }
    setSeeding(false);
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
            <Button
              variant="secondary"
              leftIcon={seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? 'Seeding...' : 'Seed Test Games'}
            </Button>
            <Button variant="secondary" leftIcon={<Search className="h-4 w-4" />}>
              Search BGG
            </Button>
          </div>
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
              description="Click 'Seed Test Games' to add Cosmic Encounter and Hansa Teutonica, or search BoardGameGeek to add games."
              action={
                <Button
                  leftIcon={seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  onClick={handleSeed}
                  disabled={seeding}
                >
                  {seeding ? 'Seeding...' : 'Seed Test Games'}
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
    </AppLayout>
  );
}
