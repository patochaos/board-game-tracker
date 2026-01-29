'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next');

      if (!code) {
        // No code, redirect to login with error
        router.replace('/login?error=auth');
        return;
      }

      try {
        const supabase = createClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('Auth callback error:', exchangeError);
          router.replace('/login?error=auth');
          return;
        }

        // Determine redirect destination
        // Priority: 1) URL param, 2) sessionStorage, 3) default
        let redirectTo = next;

        if (!redirectTo || redirectTo === '/dashboard' || redirectTo === '/bg-tracker/dashboard') {
          // Check sessionStorage for stored return URL
          const storedUrl = sessionStorage.getItem('auth_return_url');
          if (storedUrl) {
            redirectTo = storedUrl;
            sessionStorage.removeItem('auth_return_url');
          }
        }

        // Default fallback
        if (!redirectTo) {
          redirectTo = '/bg-tracker/dashboard';
        }

        // Redirect to final destination
        router.replace(redirectTo);
      } catch (err) {
        console.error('Auth callback exception:', err);
        setError('Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="text-wood-400 hover:text-wood-300"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
        <p className="text-slate-400">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
