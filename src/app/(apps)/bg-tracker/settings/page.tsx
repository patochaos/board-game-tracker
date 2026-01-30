'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { Link2, Check, AlertCircle, Dice5, Download, Loader2, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SettingsPage() {
  const [bggUsername, setBggUsername] = useState('');
  const [savedBggUsername, setSavedBggUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
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
    setIsLoading(false);
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

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
          <p className="mt-1 text-slate-400">
            Manage your account and integrations
          </p>
        </div>

        {/* BGG Integration Card */}
        <Card variant="glass">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-orange-500/20">
              <Dice5 className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">BoardGameGeek Integration</h2>
              <p className="text-sm text-slate-400 mt-1">
                Connect your BGG account to import your game collection.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">BGG Username</label>
              <Input
                placeholder="Your BGG username (e.g., patochaos)"
                value={bggUsername}
                onChange={(e) => setBggUsername(e.target.value)}
                leftIcon={<Link2 className="h-5 w-5" />}
              />
              <p className="text-xs text-slate-500">
                Enter your BoardGameGeek username to import your collection.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
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
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
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
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Download className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Export Data</h2>
              <p className="text-sm text-slate-400 mt-1">
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
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/bg-tracker/games" className="block">
              <div className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700 hover:border-emerald-500/50">
                <h3 className="font-medium text-slate-200">Add Games</h3>
                <p className="text-sm text-slate-400 mt-1">Search and add games from BGG</p>
              </div>
            </Link>
            <Link href="/bg-tracker/sessions/new" className="block">
              <div className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700 hover:border-emerald-500/50">
                <h3 className="font-medium text-slate-200">Log Session</h3>
                <p className="text-sm text-slate-400 mt-1">Record a new game session</p>
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
              <p className="text-sm text-slate-400 mt-1">
                Irreversible actions. Be careful!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <h3 className="font-medium text-slate-200 mb-2">Reset All Data</h3>
            <p className="text-sm text-slate-400 mb-4">
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
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-slate-300 mb-4">
              This will permanently delete all your sessions and games. This action cannot be undone.
            </p>
            <p className="text-sm text-slate-400 mb-2">
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
