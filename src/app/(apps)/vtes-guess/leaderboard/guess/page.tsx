'use client';

export const dynamic = 'force-dynamic';

import { GuessLeaderboard } from '@/components/vtes/GuessLeaderboard';
import Link from 'next/link';
import { Trophy, Gamepad2, ArrowLeft } from 'lucide-react';

export default function GuessLeaderboardPage() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{
      background: 'linear-gradient(to bottom, var(--vtes-bg-primary) 0%, var(--vtes-bg-secondary) 100%)',
    }}>
      {/* Header */}
      <div className="text-center pt-6 pb-4 px-4">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2" style={{
          fontFamily: 'var(--vtes-font-display)',
          color: 'var(--vtes-text-primary)',
        }}>
          <Trophy className="h-6 w-6" style={{ color: 'var(--vtes-gold)' }} />
          Leaderboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--vtes-text-muted)' }}>
          Top Methuselahs of the Jyhad
        </p>
      </div>

      {/* Leaderboard */}
      <div className="flex-1 px-4 pb-4 max-w-lg mx-auto w-full">
        <GuessLeaderboard />
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 px-4 pb-6 space-y-3 max-w-lg mx-auto w-full">
        <Link
          href="/vtes-guess/guess-card?mode=ranked"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200"
          style={{
            backgroundColor: 'var(--vtes-gold)',
            color: 'var(--vtes-bg-primary)',
            fontFamily: 'var(--vtes-font-display)',
          }}
        >
          <Gamepad2 className="w-5 h-5" />
          Play Ranked
        </Link>

        <Link
          href="/vtes-guess"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            backgroundColor: 'var(--vtes-bg-tertiary)',
            color: 'var(--vtes-text-muted)',
            border: '1px solid var(--vtes-burgundy-dark)',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>
      </div>
    </div>
  );
}
