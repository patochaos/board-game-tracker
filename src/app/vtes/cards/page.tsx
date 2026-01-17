'use client';

import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { Search, Filter, Loader2, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { searchKrcg, VtesCard } from '@/lib/krcg';
import Image from 'next/image';

// Constants
const CLANS = [
    'Assamite', 'Brujah', 'Followers of Set', 'Gangrel', 'Giovanni', 'Lasombra',
    'Malkavian', 'Nosferatu', 'Ravnos', 'Toreador', 'Tremere', 'Tzimisce', 'Ventrue',
    'Caitiff', 'Pander', 'Baali', 'Blood Brothers', 'Gargoyles', 'Harbingers of Skulls',
    'Nagaraja', 'Salubri', 'Samedi', 'True Brujah', 'Daughters of Cacophony',
    'Kiasyd', 'Osebo', 'Akunanse', 'Guruhi', 'Ishtarri'
];

const DISCIPLINES = [
    'Animalism', 'Auspex', 'Celerity', 'Dominate', 'Fortitude', 'Obfuscate',
    'Potence', 'Presence', 'Protean', 'Thaumaturgy', 'Vicissitude', 'Obtenebration',
    'Dementation', 'Necromancy', 'Chimerstry', 'Serpentis'
];

export default function CardSearchPage() {
    const [activeTab, setActiveTab] = useState<'crypt' | 'library'>('crypt');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<VtesCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Filters
    const [clanFilter, setClanFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState(''); // For Library
    const [capacityMin, setCapacityMin] = useState('');
    const [capacityMax, setCapacityMax] = useState('');

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setHasSearched(true);

        try {
            const filters: any = {};

            // Basic type filtering based on Tab
            // KRCG uses 'type' array. 
            // Crypt cards have type=['Vampire'] or 'Imbued'.
            // Library cards have type=['Action', 'Master', etc.]

            if (activeTab === 'crypt') {
                filters.type = ['Vampire', 'Imbued'];
                if (capacityMin || capacityMax) {
                    // KRCG API might support range or we filter client side?
                    // Let's rely on basic query + client filtering if API is opaque
                }
            } else {
                // Library: exclude Vampire/Imbued? Or just specify explicit types?
                // Easiest is to filter post-fetch if API is permissive, 
                // BUT standard practice is to search for specific filters.
                if (typeFilter) filters.type = [typeFilter];
                else filters['text'] = '-type:Vampire -type:Imbued'; // Negative filter trick if supported? 
                // Actually, KRCG usually handles "type" logic strictly.
            }

            if (clanFilter) filters.clan = [clanFilter];

            // Perform Search
            const cards = await searchKrcg(query, filters);

            // Client-side refinement due to loose API
            const filtered = cards.filter(c => {
                // Tab separation
                const isCrypt = c.types.includes('Vampire') || c.types.includes('Imbued');
                if (activeTab === 'crypt' && !isCrypt) return false;
                if (activeTab === 'library' && isCrypt) return false;

                // Capacity check
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
                                {CLANS.map(c => <option key={c} value={c}>{c}</option>)}
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
                                    <option value="Action">Action</option>
                                    <option value="Action Modifier">Action Modifier</option>
                                    <option value="Reaction">Reaction</option>
                                    <option value="Combat">Combat</option>
                                    <option value="Master">Master</option>
                                    <option value="Ally">Ally</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Retainer">Retainer</option>
                                    <option value="Event">Event</option>
                                </select>
                            )}
                        </div>
                    </form>
                </Card>

                {/* RESULTS GRID */}
                {loading ? (
                    <div className="py-20 flex justify-center text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {results.map((card) => (
                            <div key={card.id} className="relative group perspective-1000">
                                <div className="relative aspect-[358/500] bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700 group-hover:border-red-500/50 transition-all duration-300 group-hover:scale-[1.02]">
                                    {/* Image - KRCG hosted images */}
                                    {card.url && (
                                        <img
                                            src={card.url}
                                            alt={card.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    )}

                                    {/* Usage Info Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <h3 className="text-white font-bold text-lg leading-tight mb-1">{card.name}</h3>
                                        <p className="text-xs text-slate-300 mb-2">
                                            {card.types.join(', ')} {card.group ? `(G${card.group})` : ''}
                                            {card.capacity ? ` • Cap ${card.capacity}` : ''}
                                        </p>
                                        {/* <p className="text-xs text-slate-400 line-clamp-3">{card.text}</p> */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : hasSearched ? (
                    <div className="text-center py-20 text-slate-500">
                        <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No cards found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-500">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Search via name, text, or filters above.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
