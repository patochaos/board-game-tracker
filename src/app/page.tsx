'use client';

import Link from 'next/link';
import { Dice5, Swords, Trophy, BarChart3, Sparkles, ArrowRight, Github, Gamepad2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-purple-900/10 rounded-full blur-[80px]" />

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
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">Your Gaming Hub</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              The Ultimate
            </span>
            <br />
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Tabletop Companion
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
            Track plays, analyze stats, and test your knowledge.
            <br className="hidden sm:block" />
            All your gaming tools in one place.
          </p>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Featured Card - VTES Guess (Spans 2 cols on lg) */}
          <Link
            href="/vtes-guess"
            className="group relative md:col-span-2 lg:col-span-2 rounded-3xl overflow-hidden min-h-[320px] md:min-h-[380px]"
          >
            {/* Background Image Effect */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-500"
              style={{
                backgroundImage: `url('https://static.krcg.org/card/aksinya.jpg')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 to-purple-900/20" />

            {/* Glass Border */}
            <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-red-500/30 transition-colors duration-300" />

            {/* Content */}
            <div className="relative h-full p-6 md:p-8 flex flex-col justify-end">
              {/* Badge */}
              <div className="absolute top-6 right-6 flex gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Trophy className="w-3 h-3" />
                  Ranked Mode
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  New
                </span>
              </div>

              {/* Icon */}
              <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Swords className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                <span className="text-red-500">V</span>TES Guess
              </h2>
              <p className="text-slate-400 text-lg mb-6 max-w-md">
                Test your knowledge of Vampire: The Eternal Struggle cards. Climb the leaderboard in Ranked mode.
              </p>

              <div className="flex items-center gap-2 text-red-400 font-semibold group-hover:gap-4 transition-all duration-300">
                Play Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Secondary Card A - VTES Tracker */}
          <Link
            href="/vtes"
            className="group relative rounded-3xl overflow-hidden min-h-[280px]"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent" />

            {/* Glass Border */}
            <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-purple-500/30 transition-colors duration-300" />

            {/* Decorative circles */}
            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors duration-500" />

            {/* Content */}
            <div className="relative h-full p-6 flex flex-col">
              <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-2xl font-bold mb-2">VTES Tracker</h3>
              <p className="text-slate-400 text-sm mb-auto">
                Track decks, match statistics, and tournament results for your eternal struggle.
              </p>

              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mt-4 group-hover:gap-3 transition-all duration-300">
                Open Tracker
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Secondary Card B - Board Game Tracker */}
          <Link
            href="/dashboard"
            className="group relative rounded-3xl overflow-hidden min-h-[280px] md:col-span-2 lg:col-span-1"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent" />

            {/* Glass Border */}
            <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-emerald-500/30 transition-colors duration-300" />

            {/* Decorative circles */}
            <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500" />

            {/* Content */}
            <div className="relative h-full p-6 flex flex-col">
              <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Dice5 className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-2xl font-bold mb-2">Board Games</h3>
              <p className="text-slate-400 text-sm mb-auto">
                Log plays for your entire collection. Track wins, stats, and see who dominates game night.
              </p>

              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mt-4 group-hover:gap-3 transition-all duration-300">
                Log Session
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

        </div>

        {/* Stats Row (Optional flair) */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { value: '2,500+', label: 'Cards in Database' },
            { value: '5', label: 'Difficulty Levels' },
            { value: '∞', label: 'Games to Track' },
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
                className="flex items-center gap-2 hover:text-slate-300 transition-colors"
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
