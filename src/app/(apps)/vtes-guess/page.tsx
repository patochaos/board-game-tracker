'use client';

import Link from 'next/link';
import { Play, Trophy } from 'lucide-react';

export default function VtesGuessModeSelect() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{
      background: 'linear-gradient(to bottom, var(--vtes-bg-primary) 0%, var(--vtes-bg-secondary) 100%)',
    }}>
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-3xl font-black tracking-tight" style={{
          fontFamily: 'var(--vtes-font-display)',
          color: 'var(--vtes-text-primary)',
        }}>
          <span style={{ color: 'var(--vtes-blood)' }}>V</span>TES Guesser
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--vtes-text-muted)' }}>
          Choose your path
        </p>
      </div>

      {/* Mode Selection - Split Screen */}
      <div className="flex-1 flex flex-col">
        {/* Practice Mode - Top Half */}
        <Link
          href="/vtes-guess/guess-card?mode=normal"
          className="flex-1 relative group overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 to-slate-900/50 group-hover:from-emerald-900/40 transition-all duration-500" />

          {/* Decorative glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
            {/* Icon */}
            <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Play className="w-10 h-10 text-white fill-white" />
            </div>

            <h2 className="text-2xl font-bold mb-1" style={{
              fontFamily: 'var(--vtes-font-display)',
              color: 'var(--vtes-text-primary)',
            }}>
              🏛️ Practice
            </h2>
            <p className="text-xs font-semibold tracking-wider text-emerald-400/80 mb-3">
              The Elysium
            </p>

            <p className="text-sm max-w-xs mb-4 italic" style={{ color: 'var(--vtes-text-muted)' }}>
              &ldquo;A sanctuary from the Jyhad. Sharpen your mind, free from the schemes of rival Cainites.&rdquo;
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400">
                ♾️ Infinite Retries
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400">
                🎚️ 5 Difficulties
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400">
                📚 Library / Crypt
              </span>
            </div>

            {/* CTA hint */}
            <div className="mt-4 text-emerald-400 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Tap to Play →
            </div>
          </div>

          {/* Bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        </Link>

        {/* Ranked Mode - Bottom Half */}
        <Link
          href="/vtes-guess/guess-card?mode=ranked"
          className="flex-1 relative group overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 to-slate-900/50 group-hover:from-amber-900/40 transition-all duration-500" />

          {/* Decorative glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500" />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
            {/* Icon */}
            <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold mb-1" style={{
              fontFamily: 'var(--vtes-font-display)',
              color: 'var(--vtes-text-primary)',
            }}>
              🔥 Ranked
            </h2>
            <p className="text-xs font-semibold tracking-wider text-amber-400/80 mb-3">
              Gehenna
            </p>

            <p className="text-sm max-w-xs mb-4 italic" style={{ color: 'var(--vtes-text-muted)' }}>
              &ldquo;The Antediluvians have awakened. Face 20 cards of escalating difficulty. Only the strongest will be remembered.&rdquo;
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400">
                🩸 Ramping Difficulty
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400">
                🏆 Leaderboard
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400">
                ⏱️ Timed
              </span>
            </div>

            {/* CTA hint */}
            <div className="mt-4 text-amber-400 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Tap to Compete →
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="text-center py-3 px-4 flex justify-center gap-6">
        <Link
          href="/vtes-guess/leaderboard/guess"
          className="text-xs hover:underline"
          style={{ color: 'var(--vtes-text-muted)' }}
        >
          🏆 Leaderboard
        </Link>
        <Link
          href="/"
          className="text-xs hover:underline"
          style={{ color: 'var(--vtes-text-dim)' }}
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
