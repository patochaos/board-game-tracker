'use client';

import { useState } from 'react';
import { fetchUserCollection, importGames as importGamesAction } from './actions';
import type { BGGCollectionItem } from '@/types';
import { Search, Loader2, Download, AlertCircle, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';

export default function ImportCollectionPage() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [importingId, setImportingId] = useState<number | null>(null);
    const [importingAll, setImportingAll] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [collection, setCollection] = useState<BGGCollectionItem[]>([]);
    const [imported, setImported] = useState<Set<number>>(new Set());
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setError(null);
        setCollection([]);

        try {
            const result = await fetchUserCollection(username);

            if (result.success) {
                if (result.data.length === 0) {
                    setError('No games found in this collection (or user does not exist/has no games mark as owned).');
                } else {
                    setCollection(result.data);
                }
            } else {
                setError(result.error || 'Failed to fetch collection');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (game: BGGCollectionItem) => {
        setImportingId(game.id);

        try {
            const result = await importGamesAction([game]);
            if (result.success) {
                setImported(prev => new Set(prev).add(game.id));
                router.refresh();
            } else {
                // Show toast or error (using simple alert for now if fails)
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
            const unimportedGames = collection.filter(g => !imported.has(g.id));
            if (unimportedGames.length === 0) return;

            const result = await importGamesAction(unimportedGames);

            if (result.success) {
                const newImported = new Set(imported);
                unimportedGames.forEach(game => newImported.add(game.id));
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

    return (
        <AppLayout>
            <div className="space-y-8 max-w-4xl">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">Import from BoardGameGeek</h1>
                    <p className="text-slate-400">
                        Enter your BGG username to import your game collection.
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

                {collection.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-200">
                                Found {collection.length} Games
                            </h2>
                            <button
                                onClick={handleImportAll}
                                disabled={importingAll}
                                className="text-sm px-4 py-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {importingAll && <Loader2 className="w-4 h-4 animate-spin" />}
                                Import All
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {collection.map((game) => (
                                <div
                                    key={game.id}
                                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex gap-4 hover:border-indigo-500/50 transition-colors group relative"
                                >
                                    <div className="w-16 h-16 bg-slate-900 rounded-md overflow-hidden flex-shrink-0">
                                        {game.thumbnail ? (
                                            <img
                                                src={game.thumbnail}
                                                alt={game.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                <Search className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-slate-100 truncate" title={game.name}>
                                            {game.name}
                                        </h3>
                                        <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                            <span>{game.yearPublished || 'Unknown'}</span>
                                            <span>•</span>
                                            <span>{game.rating ? `★ ${game.rating.toFixed(1)}` : 'No rating'}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleImport(game)}
                                        disabled={imported.has(game.id) || importingId === game.id}
                                        className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${imported.has(game.id)
                                                ? 'bg-green-500/10 text-green-400 cursor-default'
                                                : 'bg-slate-700 hover:bg-indigo-600 text-white opacity-0 group-hover:opacity-100 focus:opacity-100'
                                            }
                    `}
                                        title={imported.has(game.id) ? 'Imported' : 'Import Game'}
                                    >
                                        {imported.has(game.id) ? (
                                            <Check className="w-5 h-5" />
                                        ) : importingId === game.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Download className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
