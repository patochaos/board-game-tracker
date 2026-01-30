'use client';

import Link from 'next/link';
import { Dice5, Trophy, BarChart3, CalendarDays, Users, ArrowRight, Github } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-wood-900/20 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[-30%] w-[300px] h-[300px] bg-amber-900/10 rounded-full blur-[80px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

        {/* Hero Section */}
        <header className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <Dice5 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">Board Game Night Companion</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Track Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-wood-400 to-amber-400 bg-clip-text text-transparent">
              Game Nights
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
            Log plays, track stats, and see who dominates your gaming group.
            <br className="hidden sm:block" />
            Import your collection from BoardGameGeek.
          </p>

          <div className="mt-8">
            <Link
              href="/bg-tracker/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-500/25"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </header>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

          {/* Feature 1 - Log Sessions */}
          <div className="group relative rounded-3xl overflow-hidden min-h-[200px] bg-gradient-to-br from-slate-800/50 to-slate-900/80 border border-white/10 hover:border-emerald-500/30 transition-colors duration-300 p-6">
            <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500" />
            <div className="relative">
              <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Log Sessions</h3>
              <p className="text-slate-400 text-sm">
                Record every game night with players, scores, and winners.
              </p>
            </div>
          </div>

          {/* Feature 2 - Track Stats */}
          <div className="group relative rounded-3xl overflow-hidden min-h-[200px] bg-gradient-to-br from-slate-800/50 to-slate-900/80 border border-white/10 hover:border-wood-500/30 transition-colors duration-300 p-6">
            <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-wood-500/10 rounded-full blur-2xl group-hover:bg-wood-500/20 transition-colors duration-500" />
            <div className="relative">
              <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-wood-500 to-wood-700 shadow-lg shadow-wood-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Track Stats</h3>
              <p className="text-slate-400 text-sm">
                H-index, win rates, play counts, and more detailed analytics.
              </p>
            </div>
          </div>

          {/* Feature 3 - Leaderboard */}
          <div className="group relative rounded-3xl overflow-hidden min-h-[200px] bg-gradient-to-br from-slate-800/50 to-slate-900/80 border border-white/10 hover:border-amber-500/30 transition-colors duration-300 p-6">
            <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors duration-500" />
            <div className="relative">
              <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Leaderboard</h3>
              <p className="text-slate-400 text-sm">
                See who's the champion of your gaming group.
              </p>
            </div>
          </div>

          {/* Feature 4 - Group Play */}
          <div className="group relative rounded-3xl overflow-hidden min-h-[200px] bg-gradient-to-br from-slate-800/50 to-slate-900/80 border border-white/10 hover:border-purple-500/30 transition-colors duration-300 p-6">
            <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors duration-500" />
            <div className="relative">
              <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Group Play</h3>
              <p className="text-slate-400 text-sm">
                Invite friends and share stats across your gaming group.
              </p>
            </div>
          </div>

        </div>

        {/* Stats Row */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { value: '∞', label: 'Games to Track' },
            { value: 'BGG', label: 'Import Support' },
            { value: '100%', label: 'Free' },
          ].map((stat, i) => (
            <div key={i} className="text-center py-4 px-2 rounded-2xl bg-white/5 border border-white/5">
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>
              Built by <span className="text-slate-300">Patricio</span> • 2026
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/patochaos/board-game-tracker"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
