'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import {
  Link2,
  Check,
  AlertCircle,
  Dice5,
  Download,
  Loader2,
  Trash2,
  X,
  Users,
  Copy,
  UserPlus,
  Crown,
  LogOut,
  RefreshCw,
  Shield,
  UserMinus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  useGroupManagement,
  type GroupMember,
  type GroupWithMembership,
} from '@/hooks/useGroupManagement';

export default function SettingsPage() {
  const [bggUsername, setBggUsername] = useState('');
  const [savedBggUsername, setSavedBggUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Group management state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembership | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);

  const supabase = createClient();
  const {
    groups,
    loading: groupsLoading,
    error: groupError,
    createGroup,
    joinGroupByCode,
    leaveGroup,
    getGroupMembers,
    promoteToAdmin,
    demoteToMember,
    removeMember,
    regenerateInviteCode,
    refresh: refreshGroups,
  } = useGroupManagement();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('bgg_username')
        .eq('id', user.id)
        .single();

      if (profile?.bgg_username) {
        setBggUsername(profile.bgg_username);
        setSavedBggUsername(profile.bgg_username);
      }
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ bgg_username: bggUsername })
        .eq('id', user.id);

      if (!error) {
        setSavedBggUsername(bggUsername);
        setSaveMessage('Settings saved successfully!');
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        console.error('Error saving settings:', error);
        setSaveMessage('Error saving settings');
        setSaveStatus('error');
      }
    }
    setIsSaving(false);
  };

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      // Fetch all sessions with related data
      const { data: allSessions } = await supabase
        .from('sessions')
        .select(`
          id,
          played_at,
          duration_minutes,
          notes,
          game:games!sessions_game_id_fkey(name, app_type),
          session_players(
            score,
            is_winner,
            profile:profiles(display_name, username)
          )
        `)
        .order('played_at', { ascending: false });

      // Filter to only boardgame sessions (exclude VTES)
      const sessions = allSessions?.filter(s => {
        const game = s.game as { app_type?: string } | null;
        return !game?.app_type || game.app_type === 'boardgame';
      });

      if (!sessions || sessions.length === 0) {
        setSaveMessage('No sessions to export');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        setIsExporting(false);
        return;
      }

      // Convert to CSV
      const csvRows = [
        ['Date', 'Game', 'Duration (min)', 'Players', 'Winner', 'Notes'].join(',')
      ];

      sessions.forEach((session) => {
        const gameData = session.game as unknown as { name: string } | { name: string }[] | null;
        const gameName = Array.isArray(gameData) ? gameData[0]?.name : gameData?.name || 'Unknown';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionPlayers = (session.session_players || []) as any[];
        const players = sessionPlayers
          .map((sp) => {
            const profile = Array.isArray(sp.profile) ? sp.profile[0] : sp.profile;
            const name = profile?.display_name || profile?.username || 'Unknown';
            return sp.score !== null ? `${name} (${sp.score})` : name;
          })
          .join('; ');
        const winner = sessionPlayers
          .filter((sp) => sp.is_winner)
          .map((sp) => {
            const profile = Array.isArray(sp.profile) ? sp.profile[0] : sp.profile;
            return profile?.display_name || profile?.username || 'Unknown';
          })
          .join('; ');

        csvRows.push([
          session.played_at,
          `"${gameName.replace(/"/g, '""')}"`,
          session.duration_minutes?.toString() || '',
          `"${players.replace(/"/g, '""')}"`,
          `"${winner.replace(/"/g, '""')}"`,
          `"${(session.notes || '').replace(/"/g, '""')}"`
        ].join(','));
      });

      // Download CSV
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `game-sessions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSaveMessage(`Exported ${sessions.length} sessions`);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setSaveMessage('Failed to export data');
      setSaveStatus('error');
    }

    setIsExporting(false);
  };

  const handleResetData = async () => {
    if (resetConfirmText !== 'DELETE') return;

    setIsResetting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's group
      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) throw new Error('No group found');

      // Delete all sessions from the group (cascades to session_players and session_expansions)
      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('group_id', membership.group_id);

      if (sessionsError) throw sessionsError;

      // Remove user's game ownership (removes games from "My Library")
      const { error: ownershipError } = await supabase
        .from('user_games')
        .delete()
        .eq('user_id', user.id);

      if (ownershipError) {
        console.warn('Could not delete game ownership:', ownershipError);
      }

      setSaveMessage('All data has been reset successfully!');
      setSaveStatus('success');
      setShowResetConfirm(false);
      setResetConfirmText('');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Reset error:', error);
      setSaveMessage('Failed to reset data');
      setSaveStatus('error');
    }
    setIsResetting(false);
  };

  // Group management handlers
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setIsCreatingGroup(true);
    const group = await createGroup({
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || undefined,
    });

    if (group) {
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setSaveMessage('Group created successfully!');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
    setIsCreatingGroup(false);
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;

    setIsJoiningGroup(true);
    const result = await joinGroupByCode(joinCode.trim());

    if (result.success) {
      setShowJoinGroup(false);
      setJoinCode('');
      setSaveMessage('Joined group successfully!');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveMessage(groupError || 'Invalid invite code');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
    setIsJoiningGroup(false);
  };

  const handleCopyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleManageMembers = async (group: GroupWithMembership) => {
    setSelectedGroup(group);
    const members = await getGroupMembers(group.id);
    setGroupMembers(members);
    setShowManageMembers(true);
  };

  const handlePromoteMember = async (userId: string) => {
    if (!selectedGroup) return;
    const success = await promoteToAdmin(selectedGroup.id, userId);
    if (success) {
      const members = await getGroupMembers(selectedGroup.id);
      setGroupMembers(members);
    }
  };

  const handleDemoteMember = async (userId: string) => {
    if (!selectedGroup) return;
    const success = await demoteToMember(selectedGroup.id, userId);
    if (success) {
      const members = await getGroupMembers(selectedGroup.id);
      setGroupMembers(members);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;
    const success = await removeMember(selectedGroup.id, userId);
    if (success) {
      const members = await getGroupMembers(selectedGroup.id);
      setGroupMembers(members);
      await refreshGroups();
    }
  };

  const handleRegenerateCode = async (groupId: string) => {
    const newCode = await regenerateInviteCode(groupId);
    if (newCode) {
      setSaveMessage('Invite code regenerated!');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;

    setIsLeavingGroup(true);
    const success = await leaveGroup(selectedGroup.id);

    if (success) {
      setShowLeaveConfirm(false);
      setShowManageMembers(false);
      setSelectedGroup(null);
      setSaveMessage('Left group successfully');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
    setIsLeavingGroup(false);
  };

  const formatInviteCode = (code: string) => {
    // Format as XXXX-XXXX for readability
    if (code.length === 8) {
      return `${code.slice(0, 4)}-${code.slice(4)}`;
    }
    return code;
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-ink-rich">Settings</h1>
          <p className="mt-1 text-ink-muted">
            Manage your account, groups, and integrations
          </p>
        </div>

        {/* Group Management Card */}
        <Card variant="glass">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-xl bg-wood-500/20 shrink-0">
                <Users className="h-6 w-6 text-wood-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-ink-rich">Group Management</h2>
                <p className="text-sm text-ink-muted mt-1">
                  Manage your gaming groups and invite friends.
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowJoinGroup(true)}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Join
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateGroup(true)}
                leftIcon={<Users className="h-4 w-4" />}
              >
                Create
              </Button>
            </div>
          </div>

          {groupsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-ink-muted">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You&apos;re not in any groups yet.</p>
              <p className="text-sm mt-1">Create a group or join one with an invite code.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 rounded-xl bg-surface-elevated border border-wood-900/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-ink-rich truncate">{group.name}</h3>
                        {group.is_primary && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-wood-500/20 text-wood-400 border border-wood-500/30 shrink-0">
                            Primary
                          </span>
                        )}
                        {group.role === 'admin' && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-meeple-purple/20 text-meeple-purple border border-meeple-purple/30 shrink-0">
                            Admin
                          </span>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-sm text-ink-muted mt-1 truncate">{group.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-ink-faint">
                        <span>{group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Invite Code Section */}
                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-ink-faint">Invite Code:</span>
                        <code className="px-2 py-1 text-sm font-mono bg-surface-muted rounded text-wood-400 border border-wood-900/30">
                          {formatInviteCode(group.invite_code)}
                        </code>
                        <button
                          onClick={() => handleCopyInviteCode(group.invite_code)}
                          className="p-1.5 rounded-lg hover:bg-surface-muted text-ink-muted hover:text-ink-rich transition-colors"
                          title="Copy invite code"
                        >
                          {copiedCode ? (
                            <Check className="h-4 w-4 text-felt-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {group.role === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegenerateCode(group.id)}
                            className="text-xs"
                            leftIcon={<RefreshCw className="h-3 w-3" />}
                          >
                            New Code
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleManageMembers(group)}
                          className="text-xs"
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {groupError && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4" />
              {groupError}
            </div>
          )}
        </Card>

        {/* BGG Integration Card */}
        <Card variant="glass">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-wood-500/20">
              <Dice5 className="h-6 w-6 text-wood-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink-rich">BoardGameGeek Integration</h2>
              <p className="text-sm text-ink-muted mt-1">
                Connect your BGG account to import your game collection.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-muted">BGG Username</label>
              <Input
                placeholder="Your BGG username (e.g., patochaos)"
                value={bggUsername}
                onChange={(e) => setBggUsername(e.target.value)}
                leftIcon={<Link2 className="h-5 w-5" />}
              />
              <p className="text-xs text-ink-faint">
                Enter your BoardGameGeek username to import your collection.
              </p>
            </div>

            <div className="pt-4 border-t border-wood-900/30 flex items-center justify-between">
              <div className="flex gap-3">
                {savedBggUsername && (
                  <Link href="/bg-tracker/collection/import">
                    <Button variant="secondary">
                      Import Collection
                    </Button>
                  </Link>
                )}
              </div>
              <Button
                variant="primary"
                onClick={handleSaveSettings}
                isLoading={isSaving}
                disabled={!bggUsername.trim() || bggUsername === savedBggUsername}
              >
                Save Settings
              </Button>
            </div>

            {/* Status Message */}
            {saveMessage && saveStatus !== 'idle' && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                saveStatus === 'success'
                  ? 'bg-felt-500/10 text-felt-400 border border-felt-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {saveStatus === 'success' && <Check className="h-4 w-4" />}
                {saveStatus === 'error' && <AlertCircle className="h-4 w-4" />}
                {saveMessage}
              </div>
            )}
          </div>
        </Card>

        {/* Export Data */}
        <Card variant="glass">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-meeple-blue/20">
              <Download className="h-6 w-6 text-meeple-blue" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink-rich">Export Data</h2>
              <p className="text-sm text-ink-muted mt-1">
                Download your session history as a CSV file.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleExportData}
            disabled={isExporting}
            leftIcon={isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          >
            {isExporting ? 'Exporting...' : 'Export Sessions to CSV'}
          </Button>
        </Card>

        {/* Quick Actions */}
        <Card variant="glass">
          <h2 className="text-lg font-semibold text-ink-rich mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/bg-tracker/games" className="block">
              <div className="p-4 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 transition-colors border border-wood-900/30 hover:border-wood-500/50">
                <h3 className="font-medium text-ink-rich">Add Games</h3>
                <p className="text-sm text-ink-muted mt-1">Search and add games from BGG</p>
              </div>
            </Link>
            <Link href="/bg-tracker/sessions/new" className="block">
              <div className="p-4 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 transition-colors border border-wood-900/30 hover:border-wood-500/50">
                <h3 className="font-medium text-ink-rich">Log Session</h3>
                <p className="text-sm text-ink-muted mt-1">Record a new game session</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card variant="glass" className="border-red-500/30">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-red-500/20">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
              <p className="text-sm text-ink-muted mt-1">
                Irreversible actions. Be careful!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <h3 className="font-medium text-ink-rich mb-2">Reset All Data</h3>
            <p className="text-sm text-ink-muted mb-4">
              Delete all sessions and games from your library. This cannot be undone.
            </p>
            <Button
              variant="secondary"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              onClick={() => setShowResetConfirm(true)}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Reset All Data
            </Button>
          </div>
        </Card>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateGroup(false)}
          />
          <Card variant="glass" className="relative z-10 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-rich">Create a Group</h2>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="p-2 rounded-lg hover:bg-surface-elevated text-ink-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-muted mb-2 block">Group Name</label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Friday Night Games"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-muted mb-2 block">Description (optional)</label>
                <Input
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="e.g., Weekly gaming sessions at Joe's place"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowCreateGroup(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || isCreatingGroup}
                leftIcon={isCreatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
              >
                {isCreatingGroup ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowJoinGroup(false)}
          />
          <Card variant="glass" className="relative z-10 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-rich">Join a Group</h2>
              <button
                onClick={() => setShowJoinGroup(false)}
                className="p-2 rounded-lg hover:bg-surface-elevated text-ink-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-ink-muted mb-4">
              Enter the invite code shared by a group admin.
            </p>
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABCD-EFGH"
              className="font-mono text-center text-lg tracking-wider"
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowJoinGroup(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleJoinGroup}
                disabled={!joinCode.trim() || isJoiningGroup}
                leftIcon={isJoiningGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              >
                {isJoiningGroup ? 'Joining...' : 'Join Group'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Manage Members Modal */}
      {showManageMembers && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowManageMembers(false);
              setSelectedGroup(null);
            }}
          />
          <Card variant="glass" className="relative z-10 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-ink-rich">{selectedGroup.name}</h2>
                <p className="text-sm text-ink-muted">{groupMembers.length} members</p>
              </div>
              <button
                onClick={() => {
                  setShowManageMembers(false);
                  setSelectedGroup(null);
                }}
                className="p-2 rounded-lg hover:bg-surface-elevated text-ink-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {groupMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated border border-wood-900/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center text-ink-muted">
                      {member.profile?.display_name?.[0] || member.profile?.username?.[0] || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-rich">
                          {member.profile?.display_name || member.profile?.username || 'Unknown'}
                        </span>
                        {member.role === 'admin' && (
                          <Crown className="h-4 w-4 text-wood-400" />
                        )}
                      </div>
                      <span className="text-xs text-ink-faint">@{member.profile?.username}</span>
                    </div>
                  </div>

                  {selectedGroup.role === 'admin' && member.user_id !== selectedGroup.created_by && (
                    <div className="flex items-center gap-1">
                      {member.role === 'member' ? (
                        <button
                          onClick={() => handlePromoteMember(member.user_id)}
                          className="p-2 rounded-lg hover:bg-wood-500/20 text-ink-muted hover:text-wood-400 transition-colors"
                          title="Promote to Admin"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDemoteMember(member.user_id)}
                          className="p-2 rounded-lg hover:bg-surface-muted text-ink-muted hover:text-ink-rich transition-colors"
                          title="Demote to Member"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-ink-muted hover:text-red-400 transition-colors"
                        title="Remove from Group"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-wood-900/30">
              <Button
                variant="secondary"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => setShowLeaveConfirm(true)}
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Leave Group
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Leave Group Confirmation Modal */}
      {showLeaveConfirm && selectedGroup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLeaveConfirm(false)}
          />
          <Card variant="glass" className="relative z-10 w-full max-w-sm border-red-500/30">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Leave Group?</h2>
            <p className="text-sm text-ink-muted mb-4">
              Are you sure you want to leave <strong>{selectedGroup.name}</strong>? You&apos;ll need a new invite code to rejoin.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                className="flex-1 border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                onClick={handleLeaveGroup}
                disabled={isLeavingGroup}
                leftIcon={isLeavingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              >
                {isLeavingGroup ? 'Leaving...' : 'Leave'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />
          <Card variant="glass" className="relative z-10 w-full max-w-md border-red-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-red-400">Confirm Reset</h2>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="p-2 rounded-lg hover:bg-surface-elevated text-ink-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-ink-muted mb-4">
              This will permanently delete all your sessions and games. This action cannot be undone.
            </p>
            <p className="text-sm text-ink-faint mb-2">
              Type <span className="font-mono text-red-400">DELETE</span> to confirm:
            </p>
            <Input
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetConfirmText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                className="flex-1 border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                onClick={handleResetData}
                disabled={resetConfirmText !== 'DELETE' || isResetting}
                leftIcon={isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              >
                {isResetting ? 'Resetting...' : 'Reset All'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
