import Link from 'next/link';
import { Dice5, Users, BarChart3, Trophy, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-wood-500/10 via-transparent to-felt-500/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-wood-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-felt-500/10 rounded-full blur-3xl" />
        
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-wood-500 to-wood-600 shadow-glow">
              <Dice5 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-100">Game Night Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-slate-400 hover:text-slate-100 font-medium transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/register" 
              className="btn-primary btn-md"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="relative z-10 px-6 py-24 lg:px-12 lg:py-32 max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wood-500/10 border border-wood-500/20 mb-6">
              <Sparkles className="h-4 w-4 text-wood-400" />
              <span className="text-sm text-wood-400 font-medium">Track your victories</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-100 leading-tight">
              Level up your{' '}
              <span className="text-gradient">game nights</span>
            </h1>
            
            <p className="mt-6 text-xl text-slate-400 max-w-2xl">
              Track sessions, compare stats, and crown the ultimate champion in your 
              board game group. Because every victory deserves to be remembered.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="btn-primary btn-lg">
                Start Tracking Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="#features" className="btn-secondary btn-lg">
                See How It Works
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center gap-6 text-slate-500">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-sm font-medium"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm">
                Joined by <span className="text-slate-300 font-medium">1,200+</span> game groups
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="px-6 py-24 lg:px-12 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-100">
              Everything you need for epic game nights
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              From quick session logging to detailed statistics, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Dice5,
                title: 'Quick Logging',
                description: 'Log games in seconds. Search from 20,000+ games via BoardGameGeek.',
              },
              {
                icon: Users,
                title: 'Group Play',
                description: 'Create a group, invite friends, and track everyone\'s progress.',
              },
              {
                icon: BarChart3,
                title: 'Rich Stats',
                description: 'Win rates, H-index, head-to-head records, and more.',
              },
              {
                icon: Trophy,
                title: 'Leaderboards',
                description: 'See who\'s on top and track your climb to victory.',
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="glass-card group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-3 rounded-xl bg-wood-500/10 w-fit group-hover:bg-wood-500/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-wood-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-100">
                  {feature.title}
                </h3>
                <p className="mt-2 text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-wood-500/10 to-felt-500/5" />
            <div className="relative z-10 py-12 px-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-100">
                Ready to track your first game?
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                It's free, takes 30 seconds, and your group will thank you.
              </p>
              <Link href="/register" className="btn-primary btn-lg mt-8 inline-flex">
                Create Your Group
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 lg:px-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800">
              <Dice5 className="h-5 w-5 text-wood-400" />
            </div>
            <span className="text-slate-400">Game Night Tracker</span>
          </div>
          <p className="text-sm text-slate-500">
            Made with 🎲 for board game lovers
          </p>
        </div>
      </footer>
    </div>
  );
}
