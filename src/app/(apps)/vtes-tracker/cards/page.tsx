'use client';

import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
// ... imports ...
import { Search, Filter, Loader2, Info, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { searchKrcg, VtesCard } from '@/lib/krcg';

// Constants - Clans grouped by sect
const CLAN_GROUPS = [
    { label: 'Camarilla', clans: ['Brujah', 'Gangrel', 'Malkavian', 'Nosferatu', 'Toreador', 'Tremere', 'Ventrue'] },
    { label: 'Sabbat', clans: ['Lasombra', 'Tzimisce', 'Pander'] },
    { label: 'Independent', clans: ['Assamite', 'Followers of Set', 'Giovanni', 'Ravnos'] },
    { label: 'Laibon', clans: ['Akunanse', 'Guruhi', 'Ishtarri', 'Osebo'] },
    { label: 'Bloodlines', clans: ['Baali', 'Blood Brothers', 'Daughters of Cacophony', 'Gargoyles', 'Harbingers of Skulls', 'Kiasyd', 'Nagaraja', 'Salubri', 'Samedi', 'True Brujah'] },
    { label: 'Other', clans: ['Caitiff'] },
];

const LIBRARY_TYPES = [
    'Action', 'Action Modifier', 'Reaction', 'Combat', 'Master',
    'Ally', 'Equipment', 'Retainer', 'Event', 'Political Action', 'Conviction', 'Power'
];

export default function CardSearchPage() {
    const [activeTab, setActiveTab] = useState<'crypt' | 'library'>('crypt');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<VtesCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Zoom Modal State
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

    // Filters
    const [clanFilter, setClanFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState(''); // For Library
    const [capacityMin, setCapacityMin] = useState('');
    const [capacityMax, setCapacityMax] = useState('');

    // Keyboard Navigation for Modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedCardIndex === null) return;

            if (e.key === 'Escape') setSelectedCardIndex(null);
            if (e.key === 'ArrowLeft') navigateModal(-1);
            if (e.key === 'ArrowRight') navigateModal(1);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCardIndex, results]);

    const navigateModal = (direction: -1 | 1) => {
        if (selectedCardIndex === null) return;
        const newIndex = selectedCardIndex + direction;
        if (newIndex >= 0 && newIndex < results.length) {
            setSelectedCardIndex(newIndex);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setHasSearched(true);
        setSelectedCardIndex(null);

        try {
            const filters: any = {};

            if (activeTab === 'crypt') {
                filters.type = ['Vampire', 'Imbued'];
            } else {
                if (typeFilter) {
                    filters.type = [typeFilter];
                } else {
                    // Send all library types to ensure we exclude Crypt cards
                    // This is safer than negative filters which API might not support
                    filters.type = LIBRARY_TYPES;
                }
            }

            if (clanFilter) filters.clan = [clanFilter];

            // Perform Search
            const cards = await searchKrcg(query, filters);

            // Client-side refinement (Capacity)
            const filtered = cards.filter(c => {
                if (activeTab === 'crypt') {
                    if (capacityMin && (c.capacity || 0) < parseInt(capacityMin)) return false;
                    if (capacityMax && (c.capacity || 0) > parseInt(capacityMax)) return false;
                }
                return true;
            });

            setResults(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Trigger search when switching tabs if we already have a query
    useEffect(() => {
        if (query || clanFilter) handleSearch();
    }, [activeTab]);

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-red-100">Card Search</h1>
                        <p className="text-red-300">Consult the ancient texts.</p>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-4 border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('crypt')}
                        className={`pb-4 px-4 font-bold text-lg transition-colors border-b-2 ${activeTab === 'crypt' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Crypt
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`pb-4 px-4 font-bold text-lg transition-colors border-b-2 ${activeTab === 'library' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Library
                    </button>
                </div>

                {/* SEARCH BAR & FILTERS */}
                <Card variant="glass" className="p-4">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    placeholder="Card Name or Text..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    leftIcon={<Search className="h-4 w-4" />}
                                    className="bg-slate-900/50"
                                />
                            </div>
                            <Button type="submit" className={activeTab === 'crypt' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                            </Button>
                        </div>

                        {/* ADVANCED FILTERS */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                            {/* Clan Filter (Both) */}
                            <select
                                className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:border-red-500 outline-none"
                                value={clanFilter}
                                onChange={(e) => setClanFilter(e.target.value)}
                            >
                                <option value="">Any Clan</option>
                                {CLAN_GROUPS.map(group => (
                                    <optgroup key={group.label} label={group.label}>
                                        {group.clans.map(c => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                ))}
                            </select>

                            {/* Crypt Specific: Capacity */}
                            {activeTab === 'crypt' && (
                                <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                                    <input
                                        placeholder="Min Cap"
                                        type="number"
                                        className="w-1/2 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 outline-none"
                                        value={capacityMin}
                                        onChange={(e) => setCapacityMin(e.target.value)}
                                    />
                                    <input
                                        placeholder="Max"
                                        type="number"
                                        className="w-1/2 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 outline-none"
                                        value={capacityMax}
                                        onChange={(e) => setCapacityMax(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Library Specific: Type */}
                            {activeTab === 'library' && (
                                <select
                                    className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:border-blue-500 outline-none"
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <option value="">Any Type</option>
                                    {LIBRARY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            )}
                        </div>
                    </form>
                </Card>

                {/* RESULTS GRID */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="relative aspect-[358/500] bg-slate-800 rounded-xl overflow-hidden border border-slate-700 animate-pulse">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-700/50 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                                    <div className="h-5 w-3/4 bg-slate-600 rounded" />
                                    <div className="h-3 w-1/2 bg-slate-700 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {results.map((card, index) => (
                            <div
                                key={card.id}
                                className="relative group perspective-1000 cursor-pointer"
                                onClick={() => setSelectedCardIndex(index)}
                            >
                                <div className="relative aspect-[358/500] bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700 group-hover:border-red-500/50 transition-all duration-300 group-hover:scale-[1.02]">
                                    {/* Image - KRCG hosted images */}
                                    {card.url && (
                                        <img
                                            src={card.url}
                                            alt={card.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                        />
                                    )}

                                    {/* Usage Info Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <h3 className="text-white font-bold text-lg leading-tight mb-1">{card.name}</h3>
                                        <p className="text-xs text-slate-300 mb-2">
                                            {card.types.join(', ')} {card.group ? `(G${card.group})` : ''}
                                            {card.capacity ? ` • Cap ${card.capacity}` : ''}
                                        </p>
                                        <p className="text-xs text-emerald-400 font-bold mt-2">Click to View</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : hasSearched ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Info className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300 mb-1">No cards found</h3>
                        <p className="text-slate-500">Try different search terms or adjust your filters.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300 mb-1">Search the archives</h3>
                        <p className="text-slate-500">Use card name, text, or filters above to find cards.</p>
                    </div>
                )}
            </div>

            {/* ZOOM MODAL */}
            {selectedCardIndex !== null && results[selectedCardIndex] && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Card zoom view" onClick={() => setSelectedCardIndex(null)}>

                    {/* Content Container (Stop Propagation) */}
                    <div className="relative max-w-4xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>

                        {/* Close Button */}
                        <button
                            className="absolute -top-12 right-0 md:bg-white/10 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                            onClick={() => setSelectedCardIndex(null)}
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="flex items-center justify-center gap-4 w-full h-[80vh]">
                            {/* Previous Button */}
                            <button
                                className={`hidden md:flex p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all ${selectedCardIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                                onClick={(e) => { e.stopPropagation(); navigateModal(-1); }}
                                disabled={selectedCardIndex === 0}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </button>

                            {/* Card Image */}
                            <div className="relative h-full aspect-[358/500] bg-slate-900 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                                {results[selectedCardIndex].url ? (
                                    <img
                                        src={results[selectedCardIndex].url}
                                        alt={results[selectedCardIndex].name}
                                        className="w-full h-full object-contain"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-500">No Image</div>
                                )}


                            </div>

                            {/* Next Button */}
                            <button
                                className={`hidden md:flex p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all ${selectedCardIndex === results.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                                onClick={(e) => { e.stopPropagation(); navigateModal(1); }}
                                disabled={selectedCardIndex === results.length - 1}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </button>
                        </div>

                        {/* Mobile Navigation Footer */}
                        <div className="flex md:hidden items-center justify-center gap-8 mt-6">
                            <button
                                className="p-3 rounded-full bg-white/10 text-white"
                                onClick={(e) => { e.stopPropagation(); navigateModal(-1); }}
                                disabled={selectedCardIndex === 0}
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <span className="text-slate-400 text-sm">
                                {selectedCardIndex + 1} / {results.length}
                            </span>
                            <button
                                className="p-3 rounded-full bg-white/10 text-white"
                                onClick={(e) => { e.stopPropagation(); navigateModal(1); }}
                                disabled={selectedCardIndex === results.length - 1}
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </AppLayout>
    );
}
