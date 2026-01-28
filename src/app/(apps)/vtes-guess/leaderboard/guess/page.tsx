'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { GuessLeaderboard } from '@/components/vtes/GuessLeaderboard';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function GuessLeaderboardPage() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-100 flex items-center gap-3">
              <Trophy className="text-red-500" />
              Guess Card Leaderboard
            </h1>
            <p className="text-red-300">Prove your knowledge of the Jyhad.</p>
          </div>
          <Link
            href="/vtes/guess-card"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Play Now
          </Link>
        </div>

        <GuessLeaderboard />
      </div>
    </AppLayout>
  );
}
