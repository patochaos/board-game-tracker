'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { ArrowLeft, Plus, Trash2, Trophy, Loader2, Dice5 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SessionExpansionQuery } from '@/types';

interface Game {
  id: string;
  name: string;
  thumbnail_url: string | null;
  min_players: number | null;
  max_players: number | null;
}

interface PlayerEntry {
  id: string;
  name: string;
  score: string;
  isWinner: boolean;
  isCurrentUser: boolean;
  userId: string | null;
}

export default function NewSessionPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [players, setPlayers] = useState<PlayerEntry[]>([]);

  // Expansion state
  const [availableExpansions, setAvailableExpansions] = useState<Game[]>([]);
  const [selectedExpansions, setSelectedExpansions] = useState<string[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');

  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user has a group
      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .limit(1);

      if (!membership || membership.length === 0) {
        router.push('/onboard');
        return;
      }

      setCurrentUserId(user.id);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();

      const userName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'You';
      setCurrentUserName(userName);

      // Add current user as first player
      setPlayers([{
        id: crypto.randomUUID(),
        name: userName,
        score: '',
        isWinner: false,
        isCurrentUser: true,
        userId: user.id,
      }]);

      // Fetch games
      const { data: gamesData } = await supabase
        .from('games')
        .select('id, name, thumbnail_url, min_players, max_players')
        .neq('type', 'expansion')
        .order('name');

      if (gamesData) {
        setGames(gamesData);
      }

      setLoading(false);
    };

    init();
  }, []);

  // Fetch expansions and defaults when game selected
  useEffect(() => {
    const fetchExpansions = async () => {
      if (!selectedGameId) {
        setAvailableExpansions([]);
        setSelectedExpansions([]);
        return;
      }

      const selectedGame = games.find(g => g.id === selectedGameId);
      if (!selectedGame) return;

      // 1. Find expansions by base_game_id first (more accurate)
      let { data: expansions } = await supabase
        .from('games')
        .select('*')
        .eq('type', 'expansion')
        .eq('base_game_id', selectedGameId)
        .order('name');

      // 2. Fallback to name matching if no expansions found by base_game_id
      // "Root" -> "Root: The Riverfolk", "Root: Underworld"
      if (!expansions || expansions.length === 0) {
        const { data: nameMatchedExpansions } = await supabase
          .from('games')
          .select('*')
          .eq('type', 'expansion')
          .ilike('name', `${selectedGame.name}:%`)
          .order('name');

        expansions = nameMatchedExpansions;
      }

      if (expansions && expansions.length > 0) {
        setAvailableExpansions(expansions);

        // 3. Find last used expansions for this game
        const { data: lastSession } = await supabase
          .from('sessions')
          .select(`
            id,
            session_expansions (
              expansion_id
            )
          `)
          .eq('game_id', selectedGameId)
          .eq('created_by', currentUserId)
          .order('played_at', { ascending: false })
          .limit(1)
          .single();

        if (lastSession && lastSession.session_expansions) {
          const prevExpansions = (lastSession.session_expansions as SessionExpansionQuery[]).map((se) => se.expansion_id);
          setSelectedExpansions(prevExpansions);
        } else {
          setSelectedExpansions([]);
        }
      } else {
        setAvailableExpansions([]);
        setSelectedExpansions([]);
      }
    };

    fetchExpansions();
  }, [selectedGameId, games]);

  const toggleExpansion = (id: string) => {
    setSelectedExpansions(prev =>
      prev.includes(id)
        ? prev.filter(e => e !== id)
        : [...prev, id]
    );
  };

  const addPlayer = () => {
    setPlayers([...players, {
      id: crypto.randomUUID(),
      name: '',
      score: '',
      isWinner: false,
      isCurrentUser: false,
      userId: null,
    }]);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayer = (id: string, field: keyof PlayerEntry, value: string | boolean) => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      // If setting a winner, unset others (single winner mode)
      if (field === 'isWinner' && value === true) {
        return { ...p, isWinner: p.id === id };
      }
      return p;
    }));
  };

  const toggleWinner = (id: string) => {
    setPlayers(players.map(p => ({
      ...p,
      isWinner: p.id === id ? !p.isWinner : p.isWinner
    })));
  };

  const getOrCreateGroup = async (userId: string): Promise<{ groupId: string | null; error: string | null }> => {
    // Check if user has a group
    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .limit(1);

    if (membershipError) {
      console.error('Error checking membership:', membershipError);
      return { groupId: null, error: `Membership check failed: ${membershipError.message}` };
    }

    if (memberships && memberships.length > 0) {
      return { groupId: memberships[0].group_id, error: null };
    }

    // Create a default group
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: newGroup, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: 'My Game Nights',
        invite_code: inviteCode,
        created_by: userId,
      })
      .select('id')
      .single();

    if (groupError || !newGroup) {
      console.error('Error creating group:', groupError);
      return { groupId: null, error: `Group creation failed: ${groupError?.message || 'Unknown error'}` };
    }

    // Add user as admin
    const { error: addMemberError } = await supabase
      .from('group_members')
      .insert({
        group_id: newGroup.id,
        user_id: userId,
        role: 'admin',
      });

    if (addMemberError) {
      console.error('Error adding member:', addMemberError);
      return { groupId: null, error: `Adding member failed: ${addMemberError.message}` };
    }

    return { groupId: newGroup.id, error: null };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedGameId) {
      setError('Please select a game');
      return;
    }

    if (!currentUserId) {
      setError('Not authenticated');
      return;
    }

    const validPlayers = players.filter(p => p.name.trim() || p.isCurrentUser);
    if (validPlayers.length === 0) {
      setError('Add at least one player');
      return;
    }

    setSaving(true);

    try {
      // Get or create group
      const { groupId, error: groupError } = await getOrCreateGroup(currentUserId);
      if (!groupId || groupError) {
        throw new Error(groupError || 'Could not create group');
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          group_id: groupId,
          game_id: selectedGameId,
          played_at: playedAt,
          duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
          location: location || null,
          notes: notes || null,
          created_by: currentUserId,
        })
        .select('id')
        .single();

      if (sessionError || !session) {
        throw new Error(sessionError?.message || 'Failed to create session');
      }

      // Add session players
      // For non-registered players (guests), we'll store them in notes for now
      // Only the current user goes into session_players (proper tracking)
      const currentUserPlayer = validPlayers.find(p => p.isCurrentUser);
      if (currentUserPlayer) {
        const { error: playerError } = await supabase
          .from('session_players')
          .insert({
            session_id: session.id,
            user_id: currentUserId,
            score: currentUserPlayer.score ? parseInt(currentUserPlayer.score) : null,
            is_winner: currentUserPlayer.isWinner,
          });

        if (playerError) {
          console.error('Error adding player:', playerError);
        }
      }

      // Insert guest players into the guest_players table
      const guestPlayers = validPlayers.filter(p => !p.isCurrentUser && p.name.trim());
      if (guestPlayers.length > 0) {
        const guestInserts = guestPlayers.map(p => ({
          session_id: session.id,
          name: p.name.trim(),
          score: p.score ? parseInt(p.score) : null,
          is_winner: p.isWinner,
        }));

        const { error: guestError } = await supabase
          .from('guest_players')
          .insert(guestInserts);

        if (guestError) {
          console.error('Error adding guest players:', guestError);
        }
      }

      // Save expansions
      if (selectedExpansions.length > 0) {
        const expansionInserts = selectedExpansions.map(expId => ({
          session_id: session.id,
          expansion_id: expId
        }));

        const { error: expError } = await supabase
          .from('session_expansions')
          .insert(expansionInserts);

        if (expError) console.error('Error saving expansions:', expError);
      }

      router.push('/sessions');
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const selectedGame = games.find(g => g.id === selectedGameId);

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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/sessions">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Log Session</h1>
            <p className="text-slate-400">Record a game you played</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Selection */}
          <Card variant="glass">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Game</h2>
            {games.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 mb-4">No games in your library yet</p>
                <Link href="/games">
                  <Button variant="secondary" size="sm">Add Games First</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {games.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => setSelectedGameId(game.id)}
                    className={`p-3 rounded-xl border transition-all text-left ${selectedGameId === game.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {game.thumbnail_url ? (
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-slate-700 flex-shrink-0">
                          <Image
                            src={game.thumbnail_url}
                            alt={game.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <Dice5 className="h-5 w-5 text-slate-500" />
                        </div>
                      )}
                      <span className="text-sm text-slate-200 line-clamp-2">{game.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Expansions */}
          {availableExpansions.length > 0 && (
            <Card variant="glass">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Expansions used ({selectedExpansions.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableExpansions.map((exp) => (
                  <label
                    key={exp.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedExpansions.includes(exp.id)
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedExpansions.includes(exp.id)
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-500'
                      }`}>
                      {selectedExpansions.includes(exp.id) && (
                        <Trophy className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedExpansions.includes(exp.id)}
                      onChange={() => toggleExpansion(exp.id)}
                    />
                    <div className="flex items-center gap-3 overflow-hidden">
                      {exp.thumbnail_url && (
                        <div className="relative w-8 h-8 rounded bg-slate-700 flex-shrink-0">
                          <Image
                            src={exp.thumbnail_url}
                            alt={exp.name}
                            fill
                            className="object-cover rounded"
                            unoptimized
                          />
                        </div>
                      )}
                      <span className="text-sm text-slate-200 truncate">{exp.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          )}

          {/* Date & Duration */}
          <Card variant="glass">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">When</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                value={playedAt}
                onChange={(e) => setPlayedAt(e.target.value)}
              />
              <Input
                label="Duration (minutes)"
                type="number"
                placeholder="Optional"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </Card>

          {/* Players */}
          <Card variant="glass">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Players</h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={addPlayer}
              >
                Add Player
              </Button>
            </div>

            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${player.isWinner
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : 'border-slate-700 bg-slate-800/30'
                    }`}
                >
                  <div className="flex-1">
                    {player.isCurrentUser ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-medium">{player.name}</span>
                        <span className="text-xs text-slate-500">(you)</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Player name"
                        value={player.name}
                        onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                        className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none"
                      />
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder="Score"
                    value={player.score}
                    onChange={(e) => updatePlayer(player.id, 'score', e.target.value)}
                    className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => toggleWinner(player.id)}
                    className={`p-2 rounded-lg transition-colors ${player.isWinner
                      ? 'bg-yellow-500 text-slate-900'
                      : 'bg-slate-700 text-slate-400 hover:text-yellow-500'
                      }`}
                    title={player.isWinner ? 'Winner!' : 'Mark as winner'}
                  >
                    <Trophy className="h-4 w-4" />
                  </button>
                  {!player.isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => removePlayer(player.id)}
                      className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {selectedGame && selectedGame.min_players && selectedGame.max_players && (
              <p className="text-xs text-slate-500 mt-3">
                {selectedGame.name} plays {selectedGame.min_players}-{selectedGame.max_players} players
              </p>
            )}
          </Card>

          {/* Location */}
          <Card variant="glass">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Location</h2>
            <div className="space-y-4">
              <Input
                placeholder="Where did you play?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {players.filter(p => p.name.trim()).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLocation(`${p.name}'s Home`)}
                    className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    {p.name}&apos;s Home
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card variant="glass">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was the game? Any memorable moments?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 resize-none"
            />
          </Card>

          {
            error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400">
                {error}
              </div>
            )
          }

          {/* Submit */}
          <div className="flex gap-4">
            <Link href="/sessions" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || !selectedGameId}
              leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {saving ? 'Saving...' : 'Log Session'}
            </Button>
          </div>
        </form >
      </div >
    </AppLayout >
  );
}
