'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dice5, Mail, Lock, Loader2 } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/bg-tracker/dashboard';
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Check if user has boardgame app_type
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('app_type')
          .eq('id', data.user.id)
          .single();

        if (profile?.app_type !== 'boardgame') {
          await supabase.auth.signOut();
          setError('This account is not registered for Board Game Tracker. Please register a new account.');
          return;
        }
      }

      router.push(nextUrl);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Store return URL and app type in sessionStorage
    sessionStorage.setItem('auth_return_url', nextUrl);
    sessionStorage.setItem('auth_app_type', 'boardgame');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}&app_type=boardgame`,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-wood-500/5 via-transparent to-felt-500/5" />
      <div className="fixed top-1/3 left-1/4 w-96 h-96 bg-wood-500/10 rounded-full blur-3xl" />

      <Card className="relative z-10 w-full max-w-md p-8" variant="glass">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-wood-500 to-wood-600 shadow-glow mb-4">
            <Dice5 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Board Game Tracker</h1>
          <p className="mt-2 text-slate-400">Log in to your account</p>
        </div>

        {/* Google Login */}
        <Button
          variant="secondary"
          className="w-full mb-6"
          onClick={handleGoogleLogin}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-900 text-slate-500">or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-5 w-5" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            required
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-wood-400 hover:text-wood-300"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/bg-tracker/register" className="text-wood-400 hover:text-wood-300 font-medium">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function BGLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-wood-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
