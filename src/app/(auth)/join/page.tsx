'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Users, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

interface GroupInfo {
  id: string;
  name: string;
}

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasGroup, setHasGroup] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const checkAuthAndGroup = async () => {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login with return URL
        const returnUrl = `/join?code=${code}`;
        router.push(`/login?next=${encodeURIComponent(returnUrl)}`);
        return;
      }

      // Check if user already has a group
      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .limit(1);

      if (membership && membership.length > 0) {
        setHasGroup(true);
        setLoading(false);
        return;
      }

      // Lookup group by invite code using the RPC function
      if (code) {
        const { data: groupData, error: groupError } = await supabase
          .rpc('get_group_by_invite_code', { code: code.toUpperCase() });

        if (groupError || !groupData || groupData.length === 0) {
          setError('Invalid invite code. Please check the link and try again.');
        } else {
          setGroup(groupData[0]);
        }
      } else {
        setError('No invite code provided.');
      }

      setLoading(false);
    };

    checkAuthAndGroup();
  }, [code, router, supabase]);

  const handleJoin = async () => {
    if (!group) return;
    setJoining(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
      });

    if (joinError) {
      setError('Failed to join group. Please try again.');
      setJoining(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-gradient-to-br from-wood-500/5 via-transparent to-felt-500/5" />
        <div className="fixed top-1/3 left-1/4 w-96 h-96 bg-wood-500/10 rounded-full blur-3xl" />
        <Card className="relative z-10 w-full max-w-md p-8 text-center" variant="glass">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
          <p className="mt-4 text-slate-400">Checking invite code...</p>
        </Card>
      </div>
    );
  }

  // User already in a group
  if (hasGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-gradient-to-br from-wood-500/5 via-transparent to-felt-500/5" />
        <div className="fixed top-1/3 left-1/4 w-96 h-96 bg-wood-500/10 rounded-full blur-3xl" />
        <Card className="relative z-10 w-full max-w-md p-8 text-center" variant="glass">
          <div className="p-3 rounded-2xl bg-yellow-500/20 w-fit mx-auto mb-4">
            <Users className="h-8 w-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Already in a Group</h1>
          <p className="mt-4 text-slate-400">
            You are already a member of a group. To join a different group, you would need to leave your current group first.
          </p>
          <Link href="/bg-tracker/dashboard">
            <Button className="mt-6">
              Go to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-gradient-to-br from-wood-500/5 via-transparent to-felt-500/5" />
        <div className="fixed top-1/3 left-1/4 w-96 h-96 bg-wood-500/10 rounded-full blur-3xl" />
        <Card className="relative z-10 w-full max-w-md p-8 text-center" variant="glass">
          <div className="p-3 rounded-2xl bg-red-500/20 w-fit mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Invalid Link</h1>
          <p className="mt-4 text-slate-400">{error}</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/onboard">
              <Button variant="secondary">
                Create or Join a Group
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Valid group found - show join button
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-wood-500/5 via-transparent to-felt-500/5" />
      <div className="fixed top-1/3 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <Card className="relative z-10 w-full max-w-md p-8 text-center" variant="glass">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-glow w-fit mx-auto mb-4">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Join Group</h1>
        <p className="mt-4 text-slate-400">
          You have been invited to join
        </p>
        <p className="mt-2 text-xl font-semibold text-emerald-400">
          {group?.name}
        </p>
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={handleJoin}
          disabled={joining}
          leftIcon={joining ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
        >
          {joining ? 'Joining...' : 'Join Group'}
        </Button>
        <Link href="/onboard" className="block mt-4 text-sm text-slate-500 hover:text-slate-400">
          No thanks, I want to create my own group
        </Link>
      </Card>
    </div>
  );
}

function JoinPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-wood-500/5 via-transparent to-felt-500/5" />
      <div className="fixed top-1/3 left-1/4 w-96 h-96 bg-wood-500/10 rounded-full blur-3xl" />
      <Card className="relative z-10 w-full max-w-md p-8 text-center" variant="glass">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
        <p className="mt-4 text-slate-400">Loading...</p>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<JoinPageFallback />}>
      <JoinPageContent />
    </Suspense>
  );
}
