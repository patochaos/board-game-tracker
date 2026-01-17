'use client';

import Link from 'next/link';
import { Dice5, Swords, ArrowRight } from 'lucide-react';

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row relative overflow-hidden">

      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 flex">
        {/* Left Side (Board Games) Ambience */}
        <div className="w-1/2 h-full bg-gradient-to-br from-emerald-900/20 to-slate-900/50" />
        {/* Right Side (VTES) Ambience */}
        <div className="w-1/2 h-full bg-gradient-to-bl from-red-900/20 to-slate-900/50" />
      </div>

      {/* Intro Overlay for Mobile (Header) */}
      <div className="absolute top-0 w-full z-20 p-6 lg:hidden text-center">
        <h1 className="text-2xl font-bold text-slate-100 tracking-wider">GAME TRACKER</h1>
      </div>

      {/* Board Games Section */}
      <Link
        href="/dashboard"
        className="group relative w-full lg:w-1/2 h-[50vh] lg:h-screen flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800/50 hover:bg-emerald-900/10 transition-all duration-500 cursor-pointer overflow-hidden"
      >
        <div className="absolute inset-0 bg-wood-500/5 group-hover:bg-wood-500/10 transition-colors duration-500" />

        <div className="relative z-10 p-8 text-center transform group-hover:scale-105 transition-transform duration-500">
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl flex items-center justify-center group-hover:shadow-emerald-500/20 transition-all">
            <Dice5 className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-slate-100 mb-4">Board Games</h2>
          <p className="text-emerald-200/60 max-w-sm mx-auto text-lg">
            Track sessions, stats, and leaderboards for your board game collection.
          </p>
          <div className="mt-8 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
            <span className="inline-flex items-center gap-2 text-emerald-400 font-semibold tracking-wide uppercase text-sm">
              Enter Dashboard <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>

      {/* VTES Section */}
      <Link
        href="/vtes"
        className="group relative w-full lg:w-1/2 h-[50vh] lg:h-screen flex flex-col items-center justify-center hover:bg-red-900/10 transition-all duration-500 cursor-pointer overflow-hidden"
      >
        <div className="absolute inset-0 bg-red-950/20 group-hover:bg-red-900/20 transition-colors duration-500" />

        <div className="relative z-10 p-8 text-center transform group-hover:scale-105 transition-transform duration-500">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-red-600 to-rose-900 shadow-2xl flex items-center justify-center group-hover:shadow-red-500/20 transition-all border-4 border-red-900/30">
            <Swords className="h-12 w-12 text-red-100" />
          </div>
          <h2 className="text-3xl lg:text-5xl font-black text-slate-100 mb-4 tracking-tight font-serif">
            <span className="text-red-500">V</span>TES
          </h2>
          <p className="text-red-200/50 max-w-sm mx-auto text-lg">
            Manage your eternal struggle. Track decks, ousts, and tournament standings.
          </p>
          <div className="mt-8 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
            <span className="inline-flex items-center gap-2 text-red-400 font-semibold tracking-wide uppercase text-sm">
              Enter Domain <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>

      {/* Center Divider Logo (Desktop Only) */}
      <div className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-950 rounded-full items-center justify-center border border-slate-800 z-30">
        <div className="w-2 h-2 bg-slate-700 rounded-full" />
      </div>

    </div>
  );
}
