'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input, Badge } from '@/components/ui';
import { Settings, Link2, Download, Check, AlertCircle, Loader2, Dice5, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { BGGCollectionItem } from '@/lib/bgg';
import Image from 'next/image';

export default function SettingsPage() {
  const [bggUsername, setBggUsername] = useState('');
  const [savedBggUsername, setSavedBggUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [collection, setCollection] = useState<BGGCollectionItem[]>([]);
  const [previewCollection, setPreviewCollection] = useState<BGGCollectionItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const supabase = createClient();

  // Load saved BGG username on mount
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

  const handleSaveUsername = async () => {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ bgg_username: bggUsername })
        .eq('id', user.id);
      
      if (!error) {
        setSavedBggUsername(bggUsername);
        setImportMessage('BGG username saved!');
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 3000);
      } else {
        setImportMessage('Error saving username');
        setImportStatus('error');
      }
    }
    setIsSaving(false);
  };

  const handlePreviewCollection = async () => {
    if (!bggUsername.trim()) {
      setImportMessage('Please enter your BGG username first');
      setImportStatus('error');
      return;
    }

    setImportStatus('loading');
    setImportMessage('Fetching your collection from BGG...');

    try {
      const response = await fetch(`/api/bgg/collection?username=${encodeURIComponent(bggUsername)}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 202) {
          setImportMessage('BGG is processing your request. Please try again in a few seconds.');
        } else {
          setImportMessage(data.error || 'Error fetching collection. Please check your username.');
        }
        setImportStatus('error');
        return;
      }

      const games: BGGCollectionItem[] = data.games || [];

      if (games.length === 0) {
        setImportMessage('No owned games found for this username. Make sure your collection is public on BGG.');
        setImportStatus('error');
        return;
      }

      setPreviewCollection(games);
      setShowPreview(true);
      setImportStatus('success');
      setImportMessage(`Found ${games.length} games in your collection!`);
    } catch (error) {
      setImportMessage('Error fetching collection. Please check your username.');
      setImportStatus('error');
    }
  };

  const handleImportCollection = async () => {
    if (previewCollection.length === 0) return;
    
    setIsImporting(true);
    setImportStatus('loading');
    setImportMessage('Importing games to your library...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's group (or create one if doesn't exist)
      let { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .single();

      let groupId = membership?.group_id;

      // If no group, create one
      if (!groupId) {
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: newGroup } = await supabase
          .from('groups')
          .insert({
            name: 'My Gaming Group',
            invite_code: inviteCode,
            created_by: user.id,
          })
          .select()
          .single();

        if (newGroup) {
          groupId = newGroup.id;
          // Add user as admin
          await supabase
            .from('group_members')
            .insert({
              group_id: groupId,
              user_id: user.id,
              role: 'admin',
            });
        }
      }

      // Import games in batches
      let imported = 0;
      const batchSize = 10;
      
      for (let i = 0; i < previewCollection.length; i += batchSize) {
        const batch = previewCollection.slice(i, i + batchSize);
        
        const gamesToInsert = batch.map(game => ({
          bgg_id: game.id,
          name: game.name,
          year_published: game.yearPublished,
          image_url: game.image,
          thumbnail_url: game.thumbnail,
          min_players: game.minPlayers,
          max_players: game.maxPlayers,
          playing_time: game.playingTime,
          bgg_rating: game.rating,
        }));

        // Upsert games (insert or update if exists)
        const { error } = await supabase
          .from('games')
          .upsert(gamesToInsert, { 
            onConflict: 'bgg_id',
            ignoreDuplicates: false 
          });

        if (!error) {
          imported += batch.length;
          setImportMessage(`Importing... ${imported}/${previewCollection.length} games`);
        }
      }

      setImportStatus('success');
      setImportMessage(`Successfully imported ${imported} games!`);
      setShowPreview(false);
      setCollection(previewCollection);
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      setImportMessage('Error importing games. Please try again.');
    } finally {
      setIsImporting(false);
    }
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
                Connect your BGG account to import your game collection
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Your BGG username"
                value={bggUsername}
                onChange={(e) => setBggUsername(e.target.value)}
                leftIcon={<Link2 className="h-5 w-5" />}
                className="flex-1"
              />
              <Button 
                variant="secondary" 
                onClick={handleSaveUsername}
                isLoading={isSaving}
                disabled={!bggUsername.trim() || bggUsername === savedBggUsername}
              >
                Save
              </Button>
            </div>

            {savedBggUsername && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Check className="h-4 w-4 text-felt-400" />
                <span>Linked to BGG user: </span>
                <a 
                  href={`https://boardgamegeek.com/user/${savedBggUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wood-400 hover:text-wood-300 flex items-center gap-1"
                >
                  {savedBggUsername}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800">
              <Button
                onClick={handlePreviewCollection}
                disabled={!bggUsername.trim() || importStatus === 'loading'}
                leftIcon={importStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              >
                {importStatus === 'loading' ? 'Fetching...' : 'Import Collection from BGG'}
              </Button>
            </div>

            {/* Status Message */}
            {importMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                importStatus === 'success' ? 'bg-felt-500/10 text-felt-400 border border-felt-500/20' :
                importStatus === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-slate-800/50 text-slate-300'
              }`}>
                {importStatus === 'success' && <Check className="h-4 w-4" />}
                {importStatus === 'error' && <AlertCircle className="h-4 w-4" />}
                {importStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                {importMessage}
              </div>
            )}
          </div>
        </Card>

        {/* Collection Preview */}
        {showPreview && previewCollection.length > 0 && (
          <Card variant="glass">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Your BGG Collection
                </h2>
                <p className="text-sm text-slate-400">
                  {previewCollection.length} games found
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowPreview(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleImportCollection}
                  isLoading={isImporting}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Import All Games
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1">
              {previewCollection.map((game) => (
                <div 
                  key={game.id}
                  className="relative group rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700 hover:border-wood-500/50 transition-all"
                >
                  {game.thumbnail ? (
                    <Image
                      src={game.thumbnail}
                      alt={game.name}
                      width={150}
                      height={150}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-slate-700 flex items-center justify-center">
                      <Dice5 className="h-8 w-8 text-slate-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-xs font-medium text-white truncate">
                        {game.name}
                      </p>
                      {game.yearPublished && (
                        <p className="text-xs text-slate-300">
                          {game.yearPublished}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Other Settings */}
        <Card variant="glass">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Account</h2>
          <p className="text-sm text-slate-400">
            More settings coming soon...
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
