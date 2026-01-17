'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { ArrowLeft, User, LayoutGrid, Layers, Download } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { getCardsByIds, VtesCard } from '@/lib/krcg';
import Image from 'next/image';

interface DeckData {
    id: string;
    name: string;
    description: string;
    created_at: string;
    user_id: string;
    profile: {
        display_name: string;
        username: string;
    };
    deck_cards: {
        card_id: number;
        quantity: number;
    }[];
}

export default function DeckDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [deck, setDeck] = useState<DeckData | null>(null);
    const [hydratedCards, setHydratedCards] = useState<Map<number, VtesCard>>(new Map());
    const [loading, setLoading] = useState(true);
    const [hoveredCardUrl, setHoveredCardUrl] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchDeck = async () => {
            const { data, error } = await supabase
                .from('decks')
                .select(`
                    id, name, description, created_at, user_id,
                    profile:profiles(display_name, username),
                    deck_cards(card_id, quantity)
                `)
                .eq('id', params.id)
                .single();

            if (error || !data) {
                console.error('Error:', error);
                router.push('/vtes/decks');
                return;
            }

            const deckData = data as unknown as DeckData;
            setDeck(deckData);

            // Hydrate cards
            const ids = deckData.deck_cards.map(dc => dc.card_id);
            const krcgCards = await getCardsByIds(ids);

            const cardMap = new Map<number, VtesCard>();
            krcgCards.forEach(c => cardMap.set(c.id, c));
            setHydratedCards(cardMap);

            setLoading(false);
        };

        fetchDeck();
    }, [params.id]);

    if (loading || !deck) {
        return (
            <AppLayout>
                <div className="flex justify-center py-20 text-slate-500">Loading deck...</div>
            </AppLayout>
        );
    }

    // Process Cards
    const cryptCards: { q: number; card: VtesCard }[] = [];
    const libraryCards: { q: number; card: VtesCard }[] = [];

    deck.deck_cards.forEach(dc => {
        const card = hydratedCards.get(dc.card_id);
        if (card) {
            const isCrypt = card.types.includes('Vampire') || card.types.includes('Imbued');
            if (isCrypt) cryptCards.push({ q: dc.quantity, card });
            else libraryCards.push({ q: dc.quantity, card });
        }
    });

    // Sort
    cryptCards.sort((a, b) => (b.card.capacity || 0) - (a.card.capacity || 0) || a.card.name.localeCompare(b.card.name));

    // Group Library
    const libraryByType: { [type: string]: typeof libraryCards } = {};
    const typeOrder = ['Master', 'Action', 'Political Action', 'Action Modifier', 'Reaction', 'Combat', 'Equipment', 'Retainer', 'Ally', 'Event'];

    libraryCards.forEach(item => {
        const type = item.card.types[0] || 'Other'; // Simplify to first type
        if (!libraryByType[type]) libraryByType[type] = [];
        libraryByType[type].push(item);
    });

    // Sort sorting within types
    Object.values(libraryByType).forEach(list => list.sort((a, b) => a.card.name.localeCompare(b.card.name)));

    const totalCrypt = cryptCards.reduce((acc, c) => acc + c.q, 0);
    const totalLibrary = libraryCards.reduce((acc, c) => acc + c.q, 0);

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto space-y-6 relative">
                {/* Hover Preview - Only visible on detailed hover */}
                {hoveredCardUrl && (
                    <div className="fixed z-50 pointer-events-none hidden md:block" style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        marginLeft: '350px' // Offset to the right of content usually
                    }}>
                        <img src={hoveredCardUrl} alt="Card Preview" className="w-[300px] rounded-xl shadow-2xl border-2 border-slate-700 bg-black" />
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <Link href="/vtes/decks">
                        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to Decks</Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Info & Crypt */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card variant="glass" className="p-6">
                            <h1 className="text-3xl font-bold text-red-100 mb-2">{deck.name}</h1>
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                                <User className="h-4 w-4" />
                                <span>{deck.profile?.display_name || deck.profile?.username}</span>
                                <span>•</span>
                                <span>{new Date(deck.created_at).toLocaleDateString()}</span>
                            </div>
                            {deck.description && (
                                <p className="text-slate-300 italic border-l-2 border-slate-700 pl-4">{deck.description}</p>
                            )}
                        </Card>

                        {/* CRYPT */}
                        <Card variant="glass">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                                <h2 className="text-xl font-bold text-red-200 flex items-center gap-2">
                                    <User className="h-5 w-5" /> Crypt
                                </h2>
                                <span className="text-slate-400">{totalCrypt} cards</span>
                            </div>

                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-800/50">
                                    <tr>
                                        <th className="px-3 py-2 text-center w-12">Qty</th>
                                        <th className="px-3 py-2">Name</th>
                                        <th className="px-3 py-2 text-center w-12">Cap</th>
                                        <th className="px-3 py-2">Clan</th>
                                        <th className="px-3 py-2">Group</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {cryptCards.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-3 py-2 text-center text-slate-300 font-bold">{item.q}</td>
                                            <td className="px-3 py-2">
                                                <span
                                                    className="text-red-300 font-medium cursor-help hover:underline decoration-dotted transition-colors"
                                                    onMouseEnter={() => setHoveredCardUrl(item.card.url)}
                                                    onMouseLeave={() => setHoveredCardUrl(null)}
                                                >
                                                    {item.card.name}
                                                </span>
                                                <div className="text-xs text-slate-500 truncate max-w-[200px]">
                                                    {/* Simplistic disciplines display if desired, or just keep cleaner */}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-center text-slate-300">{item.card.capacity}</td>
                                            <td className="px-3 py-2 text-slate-400">{item.card.clans?.join('/')}</td>
                                            <td className="px-3 py-2 text-center text-slate-500">G{item.card.group}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Library */}
                    <div className="space-y-6">
                        <Card variant="glass">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                                <h2 className="text-xl font-bold text-blue-200 flex items-center gap-2">
                                    <Layers className="h-5 w-5" /> Library
                                </h2>
                                <span className="text-slate-400">{totalLibrary} cards</span>
                            </div>

                            <div className="space-y-6">
                                {typeOrder.map(type => {
                                    const cards = libraryByType[type];
                                    if (!cards || cards.length === 0) return null;

                                    return (
                                        <div key={type}>
                                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2 border-b border-slate-800">{type} ({cards.reduce((a, b) => a + b.q, 0)})</h3>
                                            <ul className="space-y-1">
                                                {cards.map((item, idx) => (
                                                    <li key={idx} className="flex items-center justify-between text-sm group">
                                                        <span
                                                            className="text-slate-300 group-hover:text-blue-300 cursor-help transition-colors"
                                                            onMouseEnter={() => setHoveredCardUrl(item.card.url)}
                                                            onMouseLeave={() => setHoveredCardUrl(null)}
                                                        >
                                                            {item.card.name}
                                                        </span>
                                                        <span className="text-slate-500 font-mono">{item.q}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                                {/* Render others */}
                                {Object.keys(libraryByType).filter(t => !typeOrder.includes(t)).map(type => {
                                    const cards = libraryByType[type];
                                    if (!cards || cards.length === 0) return null;
                                    return (
                                        <div key={type}>
                                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2 border-b border-slate-800">{type} ({cards.reduce((a, b) => a + b.q, 0)})</h3>
                                            <ul className="space-y-1">
                                                {cards.map((item, idx) => (
                                                    <li key={idx} className="flex items-center justify-between text-sm group">
                                                        <span
                                                            className="text-slate-300 group-hover:text-blue-300 cursor-help transition-colors"
                                                            onMouseEnter={() => setHoveredCardUrl(item.card.url)}
                                                            onMouseLeave={() => setHoveredCardUrl(null)}
                                                        >
                                                            {item.card.name}
                                                        </span>
                                                        <span className="text-slate-500 font-mono">{item.q}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Stats/Export Actions could go here */}
                        <Card variant="glass" className="p-4">
                            <h3 className="text-sm font-semibold text-slate-100 mb-2">Actions</h3>
                            <Button variant="secondary" className="w-full text-xs" leftIcon={<Download className="h-3 w-3 " />} disabled>
                                Export Text (Coming Soon)
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
