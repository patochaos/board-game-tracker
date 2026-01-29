'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dice5, Lock, Loader2, CheckCircle } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // User should have a session from clicking the reset link
      setIsValidSession(!!session);
    };
    checkSession();

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Invalid or expired link
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center" variant="glass">
          <div className="p-3 rounded-2xl bg-red-500/20 w-fit mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Invalid or expired link</h1>
          <p className="mt-4 text-slate-400">
            This password reset link is invalid or has expired.
            Please request a new one.
          </p>

          <div className="mt-6">
            <Link href="/forgot-password" className="btn-primary btn-md inline-flex justify-center w-full">
              Request New Link
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center" variant="glass">
          <div className="p-3 rounded-2xl bg-emerald-500/20 w-fit mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Password updated!</h1>
          <p className="mt-4 text-slate-400">
            Your password has been successfully reset.
            You can now log in with your new password.
          </p>

          <div className="mt-6">
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
              size="lg"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-wood-500/5 via-transparent to-felt-500/5" />
      <div className="fixed top-1/3 left-1/4 w-96 h-96 bg-wood-500/10 rounded-full blur-3xl" />

      <Card className="relative z-10 w-full max-w-md p-8" variant="glass">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-wood-500 to-wood-600 shadow-glow mb-4">
            <Dice5 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Reset your password</h1>
          <p className="mt-2 text-slate-400 text-center">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            required
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Reset Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
