'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { Plus, Calendar, MapPin, Users, Trophy, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { format } from 'date-fns';
import { useVtesSessions } from '@/hooks/useVtesSessions';
import { SessionFilters } from '@/components/vtes/SessionFilters';

const GAME_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    casual: { label: 'Casual', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
    league: { label: 'League', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    tournament_prelim: { label: 'Tournament', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    tournament_final: { label: 'Finals', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

export default function SessionsPage() {
    const {
        sessions,
        loading,
        filters,
        setFilters,
        availablePlayers,
        availableDecks,
        totalSessions,
        currentUserId
    } = useVtesSessions();

    const [showFilters, setShowFilters] = useState(false);

    // Determines active tab state
    const viewMode = filters.onlyMyGames ? 'mine' : 'all';

    const handleViewModeChange = (mode: 'all' | 'mine') => {
        setFilters({ ...filters, onlyMyGames: mode === 'mine' });
    };

    const clearFilters = () => {
        setFilters({
            ...filters,
            gameType: 'all',
            dateFrom: '',
            dateTo: '',
            playerId: 'all',
            deckId: 'all'
        });
    };

    const hasActiveFilters =
        filters.gameType !== 'all' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== '' ||
        filters.playerId !== 'all' ||
        filters.deckId !== 'all';

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-red-100">Sessions</h1>
                        <p className="text-red-300">Chronicles of past struggles.</p>
                    </div>
                    <Link href="/vtes/sessions/new">
                        <Button className="bg-red-600 hover:bg-red-700" leftIcon={<Plus className="h-4 w-4" />}>
                            Log Session
                        </Button>
                    </Link>
                </div>

                {/* Tabs + Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* View Mode Tabs */}
                    <div className="flex rounded-lg bg-slate-800/50 p-1">
                        <button
                            onClick={() => handleViewModeChange('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'all'
                                ? 'bg-red-600 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            All Sessions
                        </button>
                        <button
                            onClick={() => handleViewModeChange('mine')}
                            disabled={!currentUserId}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'mine'
                                ? 'bg-red-600 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                                } ${!currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={!currentUserId ? "Sign in to view your sessions" : ""}
                        >
                            My Sessions
                        </button>
                    </div>

                    {/* Filter Toggle */}
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Filter className="h-4 w-4" />}
                        onClick={() => setShowFilters(!showFilters)}
                        className={hasActiveFilters ? 'border-red-500 text-red-400' : ''}
                    >
                        Filters {hasActiveFilters && '(Active)'}
                    </Button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <SessionFilters
                        filters={filters}
                        setFilters={setFilters}
                        availablePlayers={availablePlayers}
                        availableDecks={availableDecks}
                        onClear={clearFilters}
                    />
                )}

                {/* Results count */}
                {!loading && (
                    <div className="text-sm text-slate-500">
                        Showing {sessions.length} of {totalSessions} sessions
                        {filters.onlyMyGames && ' (your games)'}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-10 text-slate-500">Loading chronicles...</div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <p>{hasActiveFilters || filters.onlyMyGames ? 'No sessions match your filters.' : 'No sessions recorded yet.'}</p>
                        {hasActiveFilters ? (
                            <button onClick={clearFilters} className="text-red-400 hover:underline mt-2 inline-block">
                                Clear filters
                            </button>
                        ) : (
                            <Link href="/vtes/sessions/new" className="text-red-400 hover:underline mt-2 inline-block">
                                Record the first struggle
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => {
                            const winner = session.players.find(p => p.is_winner);
                            return (
                                <Card key={session.id} variant="glass" className="p-0 overflow-hidden hover:border-red-500/30 transition-colors">
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-xl bg-red-900/20 text-red-400">
                                                    <Calendar className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-100 mb-1">
                                                        {format(new Date(session.played_at), 'MMMM d, yyyy')}
                                                    </h3>
                                                    <div className="flex items-center gap-3 text-sm text-slate-400">
                                                        {session.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" /> {session.location}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" /> {session.players.length} Players
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Game Type Badge */}
                                                {session.game_type && GAME_TYPE_LABELS[session.game_type] && (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${GAME_TYPE_LABELS[session.game_type].color}`}>
                                                        {GAME_TYPE_LABELS[session.game_type].label}
                                                    </span>
                                                )}
                                                {/* Table Sweep Badge */}
                                                {session.table_swept && (
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                                        Sweep
                                                    </span>
                                                )}
                                                {/* Winner Badge */}
                                                {winner && (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
                                                        <Trophy className="h-3 w-3 text-amber-500" />
                                                        <span className="font-semibold">
                                                            {winner.profile?.display_name || winner.profile?.username || winner.guest_name}
                                                        </span>
                                                        <span className="text-amber-500/50">({winner.score} VP)</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Players Table (Compact) */}
                                        <div className="bg-slate-900/40 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {session.players.map((p, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-800/50">
                                                    <div className="flex items-center gap-2">
                                                        {p.seat_position && (
                                                            <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-400 text-xs flex items-center justify-center">
                                                                {p.seat_position}
                                                            </span>
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className={p.is_winner ? "text-amber-100 font-medium" : "text-slate-300"}>
                                                                {p.profile?.display_name || p.profile?.username || p.guest_name}
                                                            </span>
                                                            {p.deck_name && <span className="text-xs text-slate-500">{p.deck_name}</span>}
                                                        </div>
                                                    </div>
                                                    <span className="font-mono text-slate-400">{p.score} VP</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
