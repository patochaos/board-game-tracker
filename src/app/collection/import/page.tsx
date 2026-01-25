'use client';

import { useState } from 'react';
import { fetchUserCollection, importGames as importGamesAction, GameWithExpansions } from './actions';
import type { BGGCollectionItem } from '@/types';
import { Search, Loader2, Download, AlertCircle, Check, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';

export default function ImportCollectionPage() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [importingId, setImportingId] = useState<number | null>(null);
    const [importingAll, setImportingAll] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [grouped, setGrouped] = useState<GameWithExpansions[]>([]);
    const [expandedGames, setExpandedGames] = useState<Set<number>>(new Set());
    const [imported, setImported] = useState<Set<number>>(new Set());
    const [totalBaseGames, setTotalBaseGames] = useState(0);
    const [totalExpansions, setTotalExpansions] = useState(0);
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setError(null);
        setGrouped([]);

        try {
            const result = await fetchUserCollection(username);

            if (result.success) {
                if (result.grouped.length === 0) {
                    setError('No games found in this collection (or user does not exist/has no games marked as owned).');
                } else {
                    setGrouped(result.grouped);
                    setTotalBaseGames(result.data.length);
                    setTotalExpansions(result.expansions.length);
                    // Auto-expand games that have expansions
                    const withExpansions = result.grouped
                        .filter(g => g.expansions.length > 0)
                        .map(g => g.game.id);
                    setExpandedGames(new Set(withExpansions));
                }
            } else {
                setError(result.error || 'Failed to fetch collection');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpanded = (gameId: number) => {
        setExpandedGames(prev => {
            const next = new Set(prev);
            if (next.has(gameId)) {
                next.delete(gameId);
            } else {
                next.add(gameId);
            }
            return next;
        });
    };

    const handleImportGame = async (game: BGGCollectionItem, expansions: BGGCollectionItem[]) => {
        setImportingId(game.id);

        try {
            // Import base game and all its expansions
            const allGames = [game, ...expansions];
            const result = await importGamesAction(allGames);
            if (result.success) {
                const newImported = new Set(imported);
                allGames.forEach(g => newImported.add(g.id));
                setImported(newImported);
                router.refresh();
            } else {
                console.error('Import failed:', result.error);
                setError(result.error || 'Failed to import game');
            }
        } catch (err) {
            console.error('Import error:', err);
            setError('Failed to import game');
        } finally {
            setImportingId(null);
        }
    };

    const handleImportAll = async () => {
        setImportingAll(true);
        setError(null);

        try {
            // Collect all unimported games and expansions
            const allGames: BGGCollectionItem[] = [];
            grouped.forEach(({ game, expansions }) => {
                if (!imported.has(game.id)) {
                    allGames.push(game);
                }
                expansions.forEach(exp => {
                    if (!imported.has(exp.id)) {
                        allGames.push(exp);
                    }
                });
            });

            if (allGames.length === 0) return;

            const result = await importGamesAction(allGames);

            if (result.success) {
                const newImported = new Set(imported);
                allGames.forEach(game => newImported.add(game.id));
                setImported(newImported);
                router.refresh();
            } else {
                setError(result.error || 'Failed to import games');
            }
        } catch (err) {
            console.error('Bulk import error:', err);
            setError('Failed to perform bulk import');
        } finally {
            setImportingAll(false);
        }
    };

    const isGameFullyImported = (game: BGGCollectionItem, expansions: BGGCollectionItem[]) => {
        if (!imported.has(game.id)) return false;
        return expansions.every(exp => imported.has(exp.id));
    };

    return (
        <AppLayout>
            <div className="space-y-8 max-w-4xl">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">Import from BoardGameGeek</h1>
                    <p className="text-slate-400">
                        Enter your BGG username to import your game collection with expansions.
                    </p>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="BGG Username"
                                className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !username.trim()}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Searching...</span>
                                </>
                            ) : (
                                <span>Fetch Collection</span>
                            )}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-200">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                {grouped.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-200">
                                    Found {totalBaseGames} Base Games
                                </h2>
                                {totalExpansions > 0 && (
                                    <p className="text-sm text-purple-400 flex items-center gap-1 mt-1">
                                        <Package className="w-4 h-4" />
                                        + {totalExpansions} expansions
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleImportAll}
                                disabled={importingAll}
                                className="text-sm px-4 py-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {importingAll && <Loader2 className="w-4 h-4 animate-spin" />}
                                Import All ({totalBaseGames + totalExpansions})
                            </button>
                        </div>

                        <div className="space-y-2">
                            {grouped.map(({ game, expansions }) => {
                                const isExpanded = expandedGames.has(game.id);
                                const hasExpansions = expansions.length > 0;
                                const fullyImported = isGameFullyImported(game, expansions);
                                const isImporting = importingId === game.id;

                                return (
                                    <div key={game.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
                                        {/* Base Game Row */}
                                        <div className="p-4 flex items-center gap-4 hover:bg-slate-800/80 transition-colors">
                                            {/* Expand/Collapse Button */}
                                            {hasExpansions ? (
                                                <button
                                                    onClick={() => toggleExpanded(game.id)}
                                                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                                    ) : (
                                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </button>
                                            ) : (
                                                <div className="w-7" />
                                            )}

                                            {/* Thumbnail */}
                                            <div className="w-14 h-14 bg-slate-900 rounded-md overflow-hidden flex-shrink-0">
                                                {game.thumbnail ? (
                                                    <img
                                                        src={game.thumbnail}
                                                        alt={game.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                        <Search className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Game Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-slate-100 truncate" title={game.name}>
                                                        {game.name}
                                                    </h3>
                                                    {game.isExpansion && (
                                                        <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                                                            Expansion
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                                    <span>{game.yearPublished || 'Unknown'}</span>
                                                    <span>•</span>
                                                    <span>{game.rating ? `★ ${game.rating.toFixed(1)}` : 'No rating'}</span>
                                                    {hasExpansions && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-purple-400">
                                                                {expansions.length} expansion{expansions.length !== 1 ? 's' : ''}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Import Button */}
                                            <button
                                                onClick={() => handleImportGame(game, expansions)}
                                                disabled={fullyImported || isImporting}
                                                className={`
                                                    px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-medium text-sm
                                                    ${fullyImported
                                                        ? 'bg-green-500/10 text-green-400 cursor-default'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                    }
                                                `}
                                            >
                                                {fullyImported ? (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Imported
                                                    </>
                                                ) : isImporting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Importing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="w-4 h-4" />
                                                        Import{hasExpansions ? ` (${1 + expansions.length})` : ''}
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Expansions List */}
                                        {hasExpansions && isExpanded && (
                                            <div className="border-t border-slate-700/50 bg-slate-900/30">
                                                {expansions.map((expansion) => (
                                                    <div
                                                        key={expansion.id}
                                                        className="px-4 py-3 flex items-center gap-4 pl-16 border-b border-slate-800/50 last:border-b-0"
                                                    >
                                                        {/* Expansion Thumbnail */}
                                                        <div className="w-10 h-10 bg-slate-900 rounded overflow-hidden flex-shrink-0">
                                                            {expansion.thumbnail ? (
                                                                <img
                                                                    src={expansion.thumbnail}
                                                                    alt={expansion.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                                    <Package className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Expansion Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <Package className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                                                <span className="text-sm text-slate-300 truncate" title={expansion.name}>
                                                                    {expansion.name}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-slate-500">
                                                                {expansion.yearPublished || 'Unknown'}
                                                            </span>
                                                        </div>

                                                        {/* Status */}
                                                        {imported.has(expansion.id) && (
                                                            <Check className="w-4 h-4 text-green-400" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
