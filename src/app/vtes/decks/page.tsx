'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { Plus, Search, FileText, User } from 'lucide-react';
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
    profile: {
        display_name: string | null;
        username: string;
    } | null;
}

export default function DecksPage() {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchDecks = async () => {
            // Join decks with profiles to get creator name
            const { data, error } = await supabase
                .from('decks')
                .select(`
          id,
          name,
          created_at,
          description,
          user_id,
          profile:profiles(display_name, username)
        `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching decks:', error);
            } else {
                setDecks(data as unknown as Deck[]);
            }
            setLoading(false);
        };

        fetchDecks();
    }, []);

    const filteredDecks = decks.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.profile?.display_name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-red-100">Decks</h1>
                        <p className="text-red-300">Manage and browse library archives.</p>
                    </div>
                    <Link href="/vtes/decks/import">
                        <Button className="bg-red-600 hover:bg-red-700" leftIcon={<Plus className="h-4 w-4" />}>
                            Import Deck
                        </Button>
                    </Link>
                </div>

                <Card variant="glass" className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search decks or creators..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:border-red-500 outline-none"
                        />
                    </div>
                </Card>

                {loading ? (
                    <div className="text-center py-10 text-slate-500">Loading archives...</div>
                ) : filteredDecks.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">No decks found.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDecks.map((deck) => (
                            <Link key={deck.id} href={`/vtes/decks/${deck.id}`}>
                                <div className="group relative p-5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-red-500/50 hover:bg-slate-800/80 transition-all cursor-pointer h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-lg text-slate-100 group-hover:text-red-200 line-clamp-1">
                                            {deck.name}
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
