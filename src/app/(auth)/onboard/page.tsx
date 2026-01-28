'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dice5, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export default function OnboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Create group state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  // Join group state
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?next=/onboard');
        return;
      }

      setCurrentUserId(user.id);

      // Check if user already has a group
      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .limit(1);

      if (membership && membership.length > 0) {
        // Already in a group, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router, supabase]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentUserId) return;
    setCreating(true);

    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName.trim(),
          invite_code: inviteCode,
          created_by: currentUserId,
        })
        .select('id')
        .single();

      if (createError || !newGroup) {
        console.error('Error creating group:', createError);
        setCreating(false);
        return;
      }

      // Add user as admin
      await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: currentUserId,
          role: 'admin',
        });

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      setCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim() || !currentUserId) return;
    setJoining(true);
    setJoinError(null);

    try {
      // Find group by invite code using RPC
      const { data: groupData, error: groupError } = await supabase
        .rpc('get_group_by_invite_code', { code: joinCode.trim().toUpperCase() });

      if (groupError || !groupData || groupData.length === 0) {
        setJoinError('Invalid invite code');
        setJoining(false);
        return;
      }

      const group = groupData[0];

      // Join the group
      const { error: joinErrorDb } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: currentUserId,
          role: 'member',
        });

      if (joinErrorDb) {
        setJoinError('Failed to join group');
        setJoining(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setJoinError('An error occurred');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-gradient-to-br from-wood-500/5 via-transparent to-felt-500/5" />
        <Card className="relative z-10 w-full max-w-md p-8 text-center" variant="glass">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
          <p className="mt-4 text-slate-400">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-wood-500/5 via-transparent to-felt-500/5" />
      <div className="fixed top-1/3 left-1/4 w-96 h-96 bg-wood-500/10 rounded-full blur-3xl" />
      <div className="fixed bottom-1/3 right-1/4 w-96 h-96 bg-felt-500/10 rounded-full blur-3xl" />

      <Card className="relative z-10 w-full max-w-lg p-8" variant="glass">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-wood-500 to-wood-600 shadow-glow mb-4">
            <Dice5 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Welcome to Game Night Tracker</h1>
          <p className="mt-2 text-slate-400 text-center">
            Join or create a gaming group to start tracking your board game sessions with friends.
          </p>
        </div>

        {/* Options */}
        {!showCreateForm && !showJoinForm && (
          <div className="space-y-4">
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <UserPlus className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-100 group-hover:text-emerald-400 transition-colors">
                    Create a New Group
                  </h3>
                  <p className="text-sm text-slate-400">Start a new gaming group and invite friends</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowJoinForm(true)}
              className="w-full p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <LogIn className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-100 group-hover:text-blue-400 transition-colors">
                    Join an Existing Group
                  </h3>
                  <p className="text-sm text-slate-400">Enter an invite code to join your friends</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Create Group Form */}
        {showCreateForm && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-400" />
              Create a Group
            </h2>
            <Input
              placeholder="Group name (e.g., Friday Night Gaming)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full"
            />
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleCreateGroup}
                disabled={creating || !newGroupName.trim()}
                leftIcon={creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              >
                {creating ? 'Creating...' : 'Create Group'}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Join Group Form */}
        {showJoinForm && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <LogIn className="h-5 w-5 text-blue-400" />
              Join a Group
            </h2>
            <Input
              placeholder="Enter invite code (e.g., ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full font-mono tracking-wider"
            />
            {joinError && (
              <p className="text-sm text-red-400">{joinError}</p>
            )}
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleJoinGroup}
                disabled={joining || !joinCode.trim()}
                leftIcon={joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              >
                {joining ? 'Joining...' : 'Join Group'}
              </Button>
              <Button variant="ghost" onClick={() => { setShowJoinForm(false); setJoinError(null); }}>
                Back
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
