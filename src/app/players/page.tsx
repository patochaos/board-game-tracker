'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, Input, EmptyState } from '@/components/ui';
import { Users, UserPlus, Copy, Check, Loader2, LogIn, Crown, User, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface GroupMember {
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
}

interface FrequentGuest {
  name: string;
  gamesPlayed: number;
  wins: number;
}

export default function PlayersPage() {
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [frequentGuests, setFrequentGuests] = useState<FrequentGuest[]>([]);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Join group state
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Create group state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchGroupData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get user's group membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .limit(1);

    if (membership && membership.length > 0) {
      const groupId = membership[0].group_id;

      // Get group details
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupData) {
        setGroup(groupData);

        // Get group members
        const { data: membersData } = await supabase
          .from('group_members')
          .select(`
            user_id,
            role,
            joined_at,
            profile:profiles(username, display_name, avatar_url)
          `)
          .eq('group_id', groupId)
          .order('joined_at');

        if (membersData) {
          setMembers(membersData as unknown as GroupMember[]);
        }

        // Fetch guest players from group's sessions
        const { data: guestData } = await supabase
          .from('guest_players')
          .select(`
            name,
            is_winner,
            session:sessions!inner(group_id)
          `)
          .eq('session.group_id', groupId);

        if (guestData) {
          // Aggregate guest player stats
          const guestStats = new Map<string, { gamesPlayed: number; wins: number }>();
          for (const guest of guestData) {
            const stats = guestStats.get(guest.name) || { gamesPlayed: 0, wins: 0 };
            stats.gamesPlayed++;
            if (guest.is_winner) stats.wins++;
            guestStats.set(guest.name, stats);
          }

          const guests: FrequentGuest[] = Array.from(guestStats.entries())
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.gamesPlayed - a.gamesPlayed);

          setFrequentGuests(guests);
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchGroupData();
  }, []);

  const copyInviteCode = async () => {
    if (!group) return;
    await navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteLink = async () => {
    if (!group) return;
    const link = `${window.location.origin}/join?code=${group.invite_code}`;
    await navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim() || !currentUserId) return;
    setJoining(true);
    setJoinError(null);

    try {
      // Find group by invite code
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', joinCode.trim().toUpperCase())
        .single();

      if (groupError || !groupData) {
        setJoinError('Invalid invite code');
        setJoining(false);
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('group_id', groupData.id)
        .eq('user_id', currentUserId)
        .single();

      if (existing) {
        setJoinError('You are already a member of this group');
        setJoining(false);
        return;
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: currentUserId,
          role: 'member',
        });

      if (joinError) {
        setJoinError('Failed to join group');
        setJoining(false);
        return;
      }

      // Refresh data
      await fetchGroupData();
      setShowJoinForm(false);
      setJoinCode('');
    } catch (error) {
      setJoinError('An error occurred');
    } finally {
      setJoining(false);
    }
  };

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

      // Refresh data
      await fetchGroupData();
      setShowCreateForm(false);
      setNewGroupName('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Players</h1>
            <p className="mt-1 text-slate-400">
              Manage your gaming group
            </p>
          </div>
          {!group && (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                leftIcon={<LogIn className="h-4 w-4" />}
                onClick={() => { setShowJoinForm(true); setShowCreateForm(false); }}
              >
                Join Group
              </Button>
              <Button
                leftIcon={<UserPlus className="h-4 w-4" />}
                onClick={() => { setShowCreateForm(true); setShowJoinForm(false); }}
              >
                Create Group
              </Button>
            </div>
          )}
        </div>

        {/* Join Group Form */}
        {showJoinForm && !group && (
          <Card variant="glass">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Join a Group</h2>
            <div className="flex gap-3">
              <Input
                placeholder="Enter invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="flex-1 font-mono tracking-wider"
              />
              <Button
                onClick={handleJoinGroup}
                disabled={joining || !joinCode.trim()}
                leftIcon={joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              >
                {joining ? 'Joining...' : 'Join'}
              </Button>
              <Button variant="ghost" onClick={() => setShowJoinForm(false)}>
                Cancel
              </Button>
            </div>
            {joinError && (
              <p className="mt-2 text-sm text-red-400">{joinError}</p>
            )}
          </Card>
        )}

        {/* Create Group Form */}
        {showCreateForm && !group && (
          <Card variant="glass">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Create a Group</h2>
            <div className="flex gap-3">
              <Input
                placeholder="Group name (e.g., Friday Night Gaming)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleCreateGroup}
                disabled={creating || !newGroupName.trim()}
                leftIcon={creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              >
                {creating ? 'Creating...' : 'Create'}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {group ? (
          <>
            {/* Group Info & Invite Code */}
            <Card variant="glass" className="bg-gradient-to-br from-emerald-500/5 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">{group.name}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Share this code with friends to join your group
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <code className="px-4 py-2 rounded-xl bg-slate-800 text-emerald-400 font-mono text-lg tracking-wider">
                    {group.invite_code}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    onClick={copyInviteCode}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={linkCopied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                    onClick={copyInviteLink}
                  >
                    {linkCopied ? 'Copied!' : 'Copy Invite Link'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Members List */}
            <Card variant="glass">
              <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-500" />
                Members ({members.length})
              </h2>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        {member.profile?.avatar_url ? (
                          <img
                            src={member.profile.avatar_url}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <User className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">
                          {member.profile?.display_name || member.profile?.username}
                        </p>
                        <p className="text-sm text-slate-500">@{member.profile?.username}</p>
                      </div>
                    </div>
                    {member.role === 'admin' && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm">
                        <Crown className="h-3.5 w-3.5" />
                        Admin
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Frequent Guest Players */}
            {frequentGuests.length > 0 && (
              <Card variant="glass">
                <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-purple-500" />
                  Guest Players ({frequentGuests.length})
                </h2>
                <p className="text-sm text-slate-400 mb-4">
                  Players who have joined your sessions without an account
                </p>
                <div className="space-y-2">
                  {frequentGuests.map((guest) => (
                    <div
                      key={guest.name}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{guest.name}</p>
                          <p className="text-sm text-slate-500">
                            {guest.gamesPlayed} game{guest.gamesPlayed !== 1 ? 's' : ''} played
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-400">{guest.wins} wins</p>
                        <p className="text-xs text-slate-500">
                          {guest.gamesPlayed > 0 ? Math.round((guest.wins / guest.gamesPlayed) * 100) : 0}% win rate
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card variant="glass">
            <EmptyState
              icon={<Users className="h-20 w-20" />}
              title="No group yet"
              description="Create a new group or join an existing one with an invite code to start tracking games together!"
              action={
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    leftIcon={<LogIn className="h-4 w-4" />}
                    onClick={() => setShowJoinForm(true)}
                  >
                    Join Group
                  </Button>
                  <Button
                    leftIcon={<UserPlus className="h-4 w-4" />}
                    onClick={() => setShowCreateForm(true)}
                  >
                    Create Group
                  </Button>
                </div>
              }
            />
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
