'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { GuessLeaderboard } from '@/components/vtes/GuessLeaderboard';
import Link from 'next/link';
import { Trophy, Gamepad2 } from 'lucide-react';

export default function GuessLeaderboardPage() {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6 px-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-red-100 flex items-center justify-center gap-2">
            <Trophy className="text-yellow-500 h-6 w-6" />
            Leaderboard
          </h1>
          <p className="text-sm text-slate-400">Top Methuselahs of the Jyhad</p>
        </div>

        {/* Leaderboard */}
        <GuessLeaderboard />

        {/* Play Button */}
        <div className="text-center pt-2">
          <Link
            href="/vtes-guess/guess-card?mode=ranked"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
          >
            <Gamepad2 className="w-5 h-5" />
            Play Ranked
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
