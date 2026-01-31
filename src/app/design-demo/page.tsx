'use client';

import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Trophy, Dice5, Users, Star, Sparkles } from 'lucide-react';

export default function DesignDemoPage() {
  return (
    <div className="min-h-screen p-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-display font-bold">Design System Demo</h1>
        <p className="text-slate-400 text-lg">Salty Meeples - UI Components & Animations</p>
      </div>

      {/* Typography */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-wood-400">Typography</h2>
        <Card variant="glass" className="space-y-4">
          <h1 className="text-4xl font-display font-bold">Heading 1 - Fraunces</h1>
          <h2 className="text-3xl font-display font-bold">Heading 2 - Fraunces</h2>
          <h3 className="text-2xl font-display font-bold">Heading 3 - Fraunces</h3>
          <p className="text-lg">Body text - Plus Jakarta Sans. The quick brown fox jumps over the lazy dog.</p>
          <p className="text-slate-400">Secondary text with muted color for descriptions and labels.</p>
        </Card>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-wood-400">Buttons</h2>
        <Card variant="glass" className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" leftIcon={<Sparkles className="h-4 w-4" />}>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Button</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
          <p className="text-sm text-slate-500">Hover over buttons to see lift and glow effects</p>
        </Card>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-wood-400">Card Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass" className="space-y-2">
            <h3 className="font-bold text-lg">Glass Card</h3>
            <p className="text-slate-400 text-sm">Default glass morphism card with hover lift effect</p>
          </Card>

          <Card variant="stat" className="space-y-2">
            <p className="text-slate-400 text-sm">Total Plays</p>
            <p className="text-3xl font-bold">247</p>
            <p className="text-sm text-emerald-400">+12 this week</p>
          </Card>

          <div className="card-game p-6 space-y-2">
            <h3 className="font-bold text-lg">Game Card</h3>
            <p className="text-slate-400 text-sm">Hover to see glow + scale effect</p>
          </div>
        </div>
      </section>

      {/* Animations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-wood-400">Animations</h2>
        <Card variant="glass">
          <div className="flex flex-wrap items-center gap-8">
            <div className="text-center space-y-2">
              <div className="animate-float">
                <Trophy className="h-12 w-12 text-yellow-500 mx-auto" />
              </div>
              <p className="text-sm text-slate-400">animate-float</p>
            </div>

            <div className="text-center space-y-2">
              <div className="animate-glow-pulse">
                <Star className="h-12 w-12 text-wood-400 mx-auto" />
              </div>
              <p className="text-sm text-slate-400">animate-glow-pulse</p>
            </div>

            <div className="text-center space-y-2">
              <div className="dice-icon">
                <Dice5 className="h-12 w-12 text-slate-300 mx-auto cursor-pointer" />
              </div>
              <p className="text-sm text-slate-400">dice-icon (hover)</p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-24 h-12 rounded-lg animate-winner bg-slate-800 flex items-center justify-center">
                <span className="text-wood-400 font-bold">Winner!</span>
              </div>
              <p className="text-sm text-slate-400">animate-winner</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Podium Preview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-wood-400">Leaderboard Podium</h2>
        <div className="grid grid-cols-3 gap-4 items-end max-w-2xl mx-auto">
          {/* 2nd Place */}
          <Card variant="glass" className="h-48 flex flex-col items-center justify-end pb-4 border-slate-400/30">
            <div className="w-14 h-14 rounded-full bg-slate-700 border-4 border-slate-400 mb-2 flex items-center justify-center text-xl">
              2
            </div>
            <span className="text-2xl">🥈</span>
            <p className="font-bold">Silver</p>
            <p className="text-slate-400 text-sm">42 Wins</p>
          </Card>

          {/* 1st Place */}
          <Card variant="glass" className="h-64 flex flex-col items-center justify-end pb-4 border-wood-500/50 animate-winner"
            style={{ background: 'linear-gradient(180deg, rgba(217, 139, 43, 0.1) 0%, rgba(15, 23, 42, 0.9) 50%)' }}>
            <Trophy className="h-8 w-8 text-yellow-500 animate-float mb-2" />
            <div className="w-16 h-16 rounded-full bg-slate-700 border-4 border-yellow-500 mb-2 flex items-center justify-center text-2xl">
              1
            </div>
            <span className="text-3xl animate-float">👑</span>
            <p className="font-bold text-yellow-500 text-lg">Champion</p>
            <p className="text-white font-bold text-xl">58 Wins</p>
          </Card>

          {/* 3rd Place */}
          <Card variant="glass" className="h-40 flex flex-col items-center justify-end pb-4 border-amber-700/30">
            <div className="w-12 h-12 rounded-full bg-slate-700 border-4 border-amber-700 mb-2 flex items-center justify-center">
              3
            </div>
            <span className="text-2xl">🥉</span>
            <p className="font-bold">Bronze</p>
            <p className="text-slate-400 text-sm">38 Wins</p>
          </Card>
        </div>
      </section>

      {/* Color Palette */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-wood-400">Color Palette</h2>
        <Card variant="glass">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-2">Wood (Primary)</p>
              <div className="flex gap-2">
                {[400, 500, 600, 700].map(shade => (
                  <div key={shade} className={`w-16 h-16 rounded-lg bg-wood-${shade} flex items-center justify-center text-xs font-mono`}>
                    {shade}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">Felt (Success)</p>
              <div className="flex gap-2">
                {[400, 500, 600, 700].map(shade => (
                  <div key={shade} className={`w-16 h-16 rounded-lg bg-felt-${shade} flex items-center justify-center text-xs font-mono text-slate-900`}>
                    {shade}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">Slate (Base)</p>
              <div className="flex gap-2">
                <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-mono">700</div>
                <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono">800</div>
                <div className="w-16 h-16 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-mono">900</div>
                <div className="w-16 h-16 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center text-xs font-mono">950</div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <div className="text-center text-slate-500 text-sm pt-8 border-t border-slate-800">
        Salty Meeples Design System - Built with Tailwind CSS
      </div>
    </div>
  );
}
