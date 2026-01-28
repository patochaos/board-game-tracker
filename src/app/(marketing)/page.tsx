'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Trophy, Skull, Zap, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MarketingPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(to bottom, var(--vtes-bg-primary) 0%, var(--vtes-bg-secondary) 100%)'
      }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(to bottom, var(--vtes-bg-primary) 0%, var(--vtes-bg-secondary) 100%)',
      fontFamily: 'var(--vtes-font-body)'
    }}>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4" style={{
            fontFamily: 'var(--vtes-font-display)',
            color: 'var(--vtes-text-primary)'
          }}>
            Board Game Tracker
          </h1>
          <p className="text-xl text-slate-400">
            Track your board game sessions and VTES games
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-[var(--vtes-bg-tertiary)] border border-[var(--vtes-burgundy-dark)]">
            <Trophy className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--vtes-text-primary)' }}>
              Board Game Tracker
            </h3>
            <p className="text-slate-400 mb-4">
              Track your board game plays, wins, and statistics
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Go to Tracker <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--vtes-bg-tertiary)] border border-[var(--vtes-blood)]">
            <Skull className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--vtes-text-primary)' }}>
              VTES Tracker
            </h3>
            <p className="text-slate-400 mb-4">
              Manage your Vampire: The Eternal Struggle decks and sessions
            </p>
            <Link
              href="/vtes"
              className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
            >
              Go to VTES <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--vtes-bg-tertiary)] border border-[var(--vtes-gold)]">
            <Zap className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--vtes-text-primary)' }}>
              VTES Guess Game
            </h3>
            <p className="text-slate-400 mb-4">
              Test your knowledge of VTES cards
            </p>
            <Link
              href="/vtes/guess-card"
              className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              Play Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="text-center">
          {user ? null : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200"
              style={{
                backgroundColor: 'var(--vtes-gold)',
                color: 'var(--vtes-bg-primary)',
                fontFamily: 'var(--vtes-font-display)'
              }}
            >
              Sign In to Get Started
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
