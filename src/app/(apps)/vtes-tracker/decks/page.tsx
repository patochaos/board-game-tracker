'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { Plus, Search, FileText, User, Lock, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';

interface Deck {
    id: string;
    name: string;
    created_at: string;
    description: string | null;
    user_id: string;
    is_public: boolean; // Added
    profile: {
        display_name: string | null;
        username: string;
    } | null;
}

export default function DecksPage() {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [authorFilter, setAuthorFilter] = useState<string>('all'); // Filter state
    const [filtersExpanded, setFiltersExpanded] = useState(false); // Collapsed by default on mobile

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchDecks = async () => {
            // 1. Fetch Decks (including is_public)
            const { data: decksData, error: decksError } = await supabase
                .from('decks')
                .select('id, name, created_at, description, user_id, is_public')
                .order('created_at', { ascending: false });

            if (decksError) {
                console.error('Error fetching decks:', decksError);
                setLoading(false);
                return;
            }

            // 2. Fetch Profiles for these decks
            const userIds = Array.from(new Set(decksData.map(d => d.user_id)));
            const profilesMap: Record<string, { display_name: string | null; username: string }> = {};

            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, display_name, username')
                    .in('id', userIds);

                if (profilesData) {
                    profilesData.forEach(p => {
                        profilesMap[p.id] = p;
                    });
                }
            }

            // 3. Merge
            const joinedDecks: Deck[] = decksData.map(d => ({
                id: d.id,
                name: d.name,
                created_at: d.created_at,
                description: d.description,
                user_id: d.user_id,
                is_public: d.is_public ?? true, // Default to true if missing
                profile: profilesMap[d.user_id] || null
            }));

            setDecks(joinedDecks);
            setLoading(false);
        };

        fetchDecks();
    }, []);

    // Unique Authors for Filter
    const authors = Array.from(new Set(decks.map(d => ({
        id: d.user_id,
        name: d.profile?.display_name || d.profile?.username || 'Unknown'
    })).filter(a => a.name !== 'Unknown'))).reduce((acc, current) => {
        if (!acc.find(a => a.id === current.id)) acc.push(current);
        return acc;
    }, [] as { id: string, name: string }[]);


    const filteredDecks = decks.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
            (d.profile?.display_name || '').toLowerCase().includes(search.toLowerCase());
        const matchesAuthor = authorFilter === 'all' || d.user_id === authorFilter;
        return matchesSearch && matchesAuthor;
    });

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-red-100">Decks</h1>
                        <p className="text-red-300">Manage and browse library archives.</p>
                    </div>
                    <Link href="/vtes-tracker/decks/import">
                        <Button className="bg-red-600 hover:bg-red-700" leftIcon={<Plus className="h-4 w-4" />}>
                            Import Deck
                        </Button>
                    </Link>
                </div>

                {/* Search - always visible */}
                <Card variant="glass" className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search decks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:border-red-500 outline-none"
                        />
                    </div>
                </Card>

                {/* Collapsible filters on mobile */}
                <div className="md:hidden">
                    <button
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors min-h-[44px] px-2"
                    >
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                        {authorFilter !== 'all' && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">1</span>
                        )}
                        {filtersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {filtersExpanded && (
                        <Card variant="glass" className="p-4 mt-2">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:border-red-500 outline-none appearance-none cursor-pointer"
                                    value={authorFilter}
                                    onChange={(e) => setAuthorFilter(e.target.value)}
                                >
                                    <option value="all">All Authors</option>
                                    {authors.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Desktop filters - always visible */}
                <Card variant="glass" className="p-4 w-64 hidden md:block">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:border-red-500 outline-none appearance-none cursor-pointer"
                            value={authorFilter}
                            onChange={(e) => setAuthorFilter(e.target.value)}
                        >
                            <option value="all">All Authors</option>
                            {authors.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                </Card>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="p-5 rounded-xl bg-slate-800/50 border border-slate-700 animate-pulse">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="h-6 w-3/4 bg-slate-700 rounded" />
                                    <div className="h-5 w-5 bg-slate-700 rounded" />
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="h-4 w-full bg-slate-700/60 rounded" />
                                    <div className="h-4 w-2/3 bg-slate-700/60 rounded" />
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                    <div className="h-3 w-24 bg-slate-700/40 rounded" />
                                    <div className="h-3 w-20 bg-slate-700/40 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredDecks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300 mb-1">No decks found</h3>
                        <p className="text-slate-500 mb-4">
                            {search ? 'Try a different search term.' : 'Import your first deck to get started.'}
                        </p>
                        {!search && (
                            <Link href="/vtes-tracker/decks/import">
                                <Button className="bg-red-600 hover:bg-red-700 text-white" leftIcon={<Plus className="h-4 w-4" />}>
                                    Import Deck
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDecks.map((deck) => (
                            <Link key={deck.id} href={`/vtes-tracker/decks/${deck.id}`}>
                                <div className="group relative p-5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-red-500/50 hover:bg-slate-800/80 transition-all cursor-pointer h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-lg text-slate-100 group-hover:text-red-200 line-clamp-1 flex items-center gap-2">
                                            {deck.name}
                                            {!deck.is_public && <Lock className="h-4 w-4 text-amber-500" />}
                                        </h3>
                                        <FileText className="h-5 w-5 text-slate-600 group-hover:text-red-500 transition-colors" />
                                    </div>

                                    {deck.description && (
                                        <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">
                                            {deck.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4 border-t border-slate-700/50">
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-3 w-3" />
                                            <span>{deck.profile?.display_name || deck.profile?.username || 'Unknown'}</span>
                                        </div>
                                        <span>{format(new Date(deck.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
