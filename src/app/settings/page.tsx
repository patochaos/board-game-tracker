'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { Link2, Check, AlertCircle, Dice5 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SettingsPage() {
  const [bggUsername, setBggUsername] = useState('');
  const [savedBggUsername, setSavedBggUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

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
                  <Link href="/collection/import">
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

        {/* Quick Actions */}
        <Card variant="glass">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/games" className="block">
              <div className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700 hover:border-emerald-500/50">
                <h3 className="font-medium text-slate-200">Add Games</h3>
                <p className="text-sm text-slate-400 mt-1">Search and add games from BGG</p>
              </div>
            </Link>
            <Link href="/sessions/new" className="block">
              <div className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700 hover:border-emerald-500/50">
                <h3 className="font-medium text-slate-200">Log Session</h3>
                <p className="text-sm text-slate-400 mt-1">Record a new game session</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
