'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { ArrowLeft, Trash2, Trophy, Loader2, Dice5, Save, X, Pencil, Calendar, Clock, Users, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { PreviousSessionQuery } from '@/types';

interface Game {
  id: string;
  name: string;
  thumbnail_url: string | null;
}

interface SessionPlayer {
  id: string;
  user_id: string;
  score: number | null;
  is_winner: boolean;
  profile: {
    display_name: string | null;
    username: string;
  };
  isNewToMe?: boolean;
}

interface GuestPlayer {
  id: string;
  name: string;
  score: number | null;
  is_winner: boolean;
}

interface Session {
  id: string;
  played_at: string;
  duration_minutes: number | null;
  location: string | null;
  notes: string | null;
  created_by: string;
  game: Game;
  session_players: SessionPlayer[];
  guest_players: GuestPlayer[];
  session_expansions: {
    expansion: {
      id: string;
      name: string;
      thumbnail_url: string | null;
    }
  }[];
}

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Edit form state
  const [editPlayedAt, setEditPlayedAt] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPlayers, setEditPlayers] = useState<{ id: string; score: string; isWinner: boolean }[]>([]);
  const [editGuestPlayers, setEditGuestPlayers] = useState<{ id: string; score: string; isWinner: boolean }[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          played_at,
          duration_minutes,
          notes,
          created_by,
          location,
          game:games(id, name, thumbnail_url),
          session_players(
            id,
            user_id,
            score,
            is_winner,
            profile:profiles(display_name, username)
          ),
          guest_players(
            id,
            name,
            score,
            is_winner
          ),
          session_expansions(
            expansion:games(id, name, thumbnail_url)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        console.error('Error fetching session:', error);
        router.push('/sessions');
        return;
      }

      const sessionData = data as unknown as Session;
      // Calculate "New to Me" for each player
      if (sessionData.game?.id) {
        // Fetch ALL previous sessions for this game
        const { data: previousSessions } = await supabase
          .from('sessions')
          .select('session_players(user_id)')
          .eq('game_id', sessionData.game.id)
          .lt('played_at', sessionData.played_at); // Strictly before this session

        const priorPlayers = new Set<string>();
        (previousSessions as PreviousSessionQuery[] | null)?.forEach((s) => {
          s.session_players.forEach((sp) => priorPlayers.add(sp.user_id));
        });

        sessionData.session_players = sessionData.session_players.map(sp => ({
          ...sp,
          isNewToMe: !priorPlayers.has(sp.user_id)
        }));
      }

      setSession(sessionData);

      // Initialize edit form
      setEditPlayedAt(sessionData.played_at);
      setEditDuration(sessionData.duration_minutes?.toString() || '');
      setEditLocation(sessionData.location || '');
      setEditNotes(sessionData.notes || '');
      setEditPlayers(
        sessionData.session_players.map(sp => ({
          id: sp.id,
          score: sp.score?.toString() || '',
          isWinner: sp.is_winner,
        }))
      );
      setEditGuestPlayers(
        sessionData.guest_players?.map(gp => ({
          id: gp.id,
          score: gp.score?.toString() || '',
          isWinner: gp.is_winner,
        })) || []
      );

      setLoading(false);
    };

    fetchSession();
  }, [sessionId]);

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);

    try {
      // Update session
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({
          played_at: editPlayedAt,
          duration_minutes: editDuration ? parseInt(editDuration) : null,
          location: editLocation || null,
          notes: editNotes || null,
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      // Update session players
      for (const player of editPlayers) {
        const { error: playerError } = await supabase
          .from('session_players')
          .update({
            score: player.score ? parseInt(player.score) : null,
            is_winner: player.isWinner,
          })
          .eq('id', player.id);

        if (playerError) throw playerError;
      }

      // Update guest players
      for (const guest of editGuestPlayers) {
        const { error: guestError } = await supabase
          .from('guest_players')
          .update({
            score: guest.score ? parseInt(guest.score) : null,
            is_winner: guest.isWinner,
          })
          .eq('id', guest.id);

        if (guestError) throw guestError;
      }

      // Refresh data
      const { data } = await supabase
        .from('sessions')
        .select(`
          id,
          played_at,
          duration_minutes,
          notes,
          created_by,
          location,
          game:games(id, name, thumbnail_url),
          session_players(
            id,
            user_id,
            score,
            is_winner,
            profile:profiles(display_name, username)
          ),
          guest_players(
            id,
            name,
            score,
            is_winner
          ),
          session_expansions(
             expansion:games(id, name, thumbnail_url)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (data) {
        setSession(data as unknown as Session);
      }

      setEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', session.id);

      if (error) throw error;

      router.push('/sessions');
    } catch (error) {
      console.error('Error deleting:', error);
      setDeleting(false);
    }
  };

  const togglePlayerWinner = (playerId: string) => {
    setEditPlayers(
      editPlayers.map(p => ({
        ...p,
        isWinner: p.id === playerId ? !p.isWinner : p.isWinner,
      }))
    );
  };

  const toggleGuestWinner = (guestId: string) => {
    setEditGuestPlayers(
      editGuestPlayers.map(p => ({
        ...p,
        isWinner: p.id === guestId ? !p.isWinner : p.isWinner,
      }))
    );
  };

  const updatePlayerScore = (playerId: string, score: string) => {
    setEditPlayers(
      editPlayers.map(p => (p.id === playerId ? { ...p, score } : p))
    );
  };

  const updateGuestScore = (guestId: string, score: string) => {
    setEditGuestPlayers(
      editGuestPlayers.map(p => (p.id === guestId ? { ...p, score } : p))
    );
  };

  const canEdit = currentUserId && session?.created_by === currentUserId;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </AppLayout>
    );
  }

  if (!session) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/sessions">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-100">Session Details</h1>
          </div>
          {canEdit && !editing && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Pencil className="h-4 w-4" />}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            </div>
          )}
          {editing && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<X className="h-4 w-4" />}
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                onClick={handleSave}
                disabled={saving}
              >
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <Card variant="glass" className="border-red-500/50 bg-red-500/10">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete Session?</h3>
              <p className="text-slate-400 mb-4">This action cannot be undone.</p>
              <div className="flex justify-center gap-3">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleting}
                  leftIcon={deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Game Info */}
        <Card variant="glass">
          <div className="flex items-center gap-4">
            {session.game?.thumbnail_url ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                <Image
                  src={session.game.thumbnail_url}
                  alt={session.game.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Dice5 className="h-8 w-8 text-slate-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-100">{session.game?.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {editing ? (
                    <input
                      type="date"
                      value={editPlayedAt}
                      onChange={(e) => setEditPlayedAt(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200"
                    />
                  ) : (
                    formatDate(session.played_at)
                  )}
                </span>
                {(session.duration_minutes || editing) && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {editing ? (
                      <input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        placeholder="mins"
                        className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200"
                      />
                    ) : (
                      `${session.duration_minutes} min`
                    )}
                  </span>
                )}
                {(session.location || editing) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {editing ? (
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="Location"
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200"
                      />
                    ) : (
                      session.location
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Expansions */}
        {
          session.session_expansions && session.session_expansions.length > 0 && (
            <Card variant="glass">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-emerald-500" />
                Expansions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {session.session_expansions.map((se) => (
                  <div key={se.expansion.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                    {se.expansion.thumbnail_url ? (
                      <div className="relative w-10 h-10 rounded overflow-hidden bg-slate-700 flex-shrink-0">
                        <Image
                          src={se.expansion.thumbnail_url}
                          alt={se.expansion.name}
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
                    <span className="text-sm text-slate-200 font-medium">{se.expansion.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          )
        }

        {/* Players */}
        <Card variant="glass">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Players
          </h3>
          <div className="space-y-3">
            {/* Registered Players */}
            {session.session_players.map((sp) => {
              const editPlayer = editPlayers.find(p => p.id === sp.id);
              const isWinner = editing ? editPlayer?.isWinner : sp.is_winner;
              const score = editing ? editPlayer?.score : sp.score?.toString();

              return (
                <div
                  key={sp.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${isWinner
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : 'bg-slate-800/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {isWinner && <Trophy className="h-5 w-5 text-yellow-400" />}
                    <span className="font-medium text-slate-200">
                      {sp.profile?.display_name || sp.profile?.username}
                    </span>
                    {!editing && sp.isNewToMe && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {editing ? (
                      <>
                        <input
                          type="number"
                          value={editPlayer?.score || ''}
                          onChange={(e) => updatePlayerScore(sp.id, e.target.value)}
                          placeholder="Score"
                          className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => togglePlayerWinner(sp.id)}
                          className={`p-2 rounded-lg transition-colors ${editPlayer?.isWinner
                            ? 'bg-yellow-500 text-slate-900'
                            : 'bg-slate-700 text-slate-400 hover:text-yellow-500'
                            }`}
                        >
                          <Trophy className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      score && <span className="text-slate-400">{score} pts</span>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Guest Players */}
            {session.guest_players && session.guest_players.map((gp) => {
              const editGuest = editGuestPlayers.find(g => g.id === gp.id);
              const isWinner = editing ? editGuest?.isWinner : gp.is_winner;
              const score = editing ? editGuest?.score : gp.score?.toString();

              return (
                <div
                  key={gp.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${isWinner
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : 'bg-slate-800/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {isWinner && <Trophy className="h-5 w-5 text-yellow-400" />}
                    <span className="font-medium text-slate-200">{gp.name}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-400 border border-slate-600">
                      GUEST
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {editing ? (
                      <>
                        <input
                          type="number"
                          value={editGuest?.score || ''}
                          onChange={(e) => updateGuestScore(gp.id, e.target.value)}
                          placeholder="Score"
                          className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => toggleGuestWinner(gp.id)}
                          className={`p-2 rounded-lg transition-colors ${editGuest?.isWinner
                            ? 'bg-yellow-500 text-slate-900'
                            : 'bg-slate-700 text-slate-400 hover:text-yellow-500'
                            }`}
                        >
                          <Trophy className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      score && <span className="text-slate-400">{score} pts</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Notes */}
        {
          (session.notes || editing) && (
            <Card variant="glass">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Notes</h3>
              {editing ? (
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this session..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 resize-none"
                />
              ) : (
                <p className="text-slate-300 whitespace-pre-wrap">{session.notes}</p>
              )}
            </Card>
          )
        }
      </div >
    </AppLayout >
  );
}
