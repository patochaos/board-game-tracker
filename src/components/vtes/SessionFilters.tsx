import { Card, Button } from '@/components/ui';
import { VtesSessionFilters } from '@/hooks/useVtesSessions';
import { X, Filter } from 'lucide-react';

interface SessionFiltersProps {
    filters: VtesSessionFilters;
    setFilters: (filters: VtesSessionFilters) => void;
    availablePlayers: { id: string; name: string }[];
    availableDecks?: { id: string; name: string }[];
    onClear: () => void;
    className?: string;
}

export function SessionFilters({ filters, setFilters, availablePlayers, availableDecks = [], onClear, className = '' }: SessionFiltersProps) {
    const hasActiveFilters =
        filters.gameType !== 'all' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== '' ||
        filters.playerId !== 'all' ||
        filters.deckId !== 'all';

    const handleFilterChange = (key: keyof VtesSessionFilters, value: any) => {
        setFilters({ ...filters, [key]: value });
    };

    return (
        <Card variant="glass" className={`p-4 ${className}`}>
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    {/* Game Type Filter */}
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">Game Type</label>
                        <select
                            value={filters.gameType}
                            onChange={(e) => handleFilterChange('gameType', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-red-500 outline-none"
                        >
                            <option value="all">All Types</option>
                            <option value="casual">Casual</option>
                            <option value="league">League</option>
                            <option value="tournament_prelim">Tournament Prelim</option>
                            <option value="tournament_final">Tournament Final</option>
                        </select>
                    </div>

                    {/* Player Filter */}
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">Player</label>
                        <select
                            value={filters.playerId}
                            onChange={(e) => handleFilterChange('playerId', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-red-500 outline-none"
                        >
                            <option value="all">All Players</option>
                            {availablePlayers.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Deck Filter */}
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">Deck</label>
                        <select
                            value={filters.deckId}
                            onChange={(e) => handleFilterChange('deckId', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-red-500 outline-none"
                        >
                            <option value="all">All Decks</option>
                            {availableDecks.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* From Date */}
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">From Date</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-red-500 outline-none"
                        />
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">To Date</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-red-500 outline-none"
                        />
                    </div>
                </div>

                {/* Footer / Clear */}
                {hasActiveFilters && (
                    <div className="flex justify-end pt-2 border-t border-slate-800">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClear}
                            leftIcon={<X className="h-4 w-4" />}
                            className="text-slate-400 hover:text-slate-200"
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
