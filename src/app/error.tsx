'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Something went wrong</h1>
        <p className="text-slate-400 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={reset} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Try Again
          </Button>
          <Link href="/">
            <Button variant="ghost" leftIcon={<Home className="h-4 w-4" />}>
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
