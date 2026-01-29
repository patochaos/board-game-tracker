'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dice5, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center" variant="glass">
          <div className="p-3 rounded-2xl bg-felt-500/20 w-fit mx-auto mb-4">
            <Mail className="h-8 w-8 text-felt-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Check your email</h1>
          <p className="mt-4 text-slate-400">
            We sent a password reset link to <span className="text-slate-200">{email}</span>.
            Click the link to reset your password.
          </p>

          <div className="mt-6">
            <Link href="/login" className="btn-secondary btn-md inline-flex justify-center w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
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
          <h1 className="text-2xl font-bold text-slate-100">Forgot password?</h1>
          <p className="mt-2 text-slate-400 text-center">
            Enter your email and we&apos;ll send you a link to reset your password
          </p>
        </div>

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

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Send Reset Link
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Remember your password?{' '}
          <Link href="/login" className="text-wood-400 hover:text-wood-300 font-medium">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
