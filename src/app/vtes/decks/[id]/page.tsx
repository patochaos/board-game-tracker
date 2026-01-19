'use client';

export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { ArrowLeft, User, LayoutGrid, Layers, Download, Lock, Droplet, AlertCircle, Trash2, Shield, Sword, Eye, MousePointerClick } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { getCardsByIds, VtesCard } from '@/lib/krcg';
import Image from 'next/image';
import { VtesIcon } from '@/components/vtes/VtesIcon';
import { sortDisciplines } from '@/lib/vtes/utils';
import { useVtesDeckStats } from '@/hooks/useVtesDeckStats';
import { Trophy, Crosshair, Crown, Layout, Zap, Tag, Wand2 } from 'lucide-react';
import { autoTagDeck } from '@/lib/vtes/autoTag';
import CardHover from '@/components/vtes/CardHover';

function DeckStatsSection({ deckId }: { deckId: string }) {
    const { stats, loading } = useVtesDeckStats(deckId);

    if (loading || !stats) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card variant="glass" className="p-3 flex flex-col items-center justify-center text-center bg-slate-900/40 border-slate-800">
                <div className="text-sm text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Layout className="h-3 w-3" /> Games
                </div>
                <div className="text-xl font-bold text-slate-200">{stats.gamesPlayed}</div>
            </Card>
            <Card variant="glass" className="p-3 flex flex-col items-center justify-center text-center bg-slate-900/40 border-slate-800">
                <div className="text-sm text-amber-500/70 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Trophy className="h-3 w-3" /> Wins
                </div>
                <div className="text-xl font-bold text-amber-100">{stats.gamesWon}</div>
            </Card>
            <Card variant="glass" className="p-3 flex flex-col items-center justify-center text-center bg-slate-900/40 border-slate-800">
                <div className="text-sm text-red-500/70 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Crosshair className="h-3 w-3" /> Win %
                </div>
                <div className="text-xl font-bold text-red-200">{stats.winRate.toFixed(1)}%</div>
            </Card>
            <Card variant="glass" className="p-3 flex flex-col items-center justify-center text-center bg-slate-900/40 border-slate-800">
                <div className="text-sm text-purple-400/70 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Zap className="h-3 w-3" /> Avg VP
                </div>
                <div className="text-xl font-bold text-purple-200">{stats.averageVp.toFixed(2)}</div>
            </Card>
        </div>
    );
}

interface DeckData {
    id: string;
    name: string;
    description: string;
    created_at: string;
    user_id: string;
    is_public: boolean;
    profile: {
        display_name: string;
        username: string;
    };
    tags: string[];
    deck_cards: {
        card_id: number;
        count: number;
    }[];
}

export default function DeckDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [deck, setDeck] = useState<DeckData | null>(null);
    const [hydratedCards, setHydratedCards] = useState<Map<number, VtesCard>>(new Map());


    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [isRestricted, setIsRestricted] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchDeck = async () => {
            console.log('Fetching deck...', params.id);
            try {
                // Get Current User First
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUserId(user?.id || null);

                const { data, error } = await supabase
                    .from('decks')
                    .select(`
                        id, name, description, created_at, user_id, is_public, tags,
                        profile:profiles(display_name, username),
                        deck_cards(card_id, count)
                    `)
                    .eq('id', params.id)
                    .single();

                if (error) {
                    console.error('Supabase Error:', error);
                    // Don't redirect immediately to allow debugging
                    // router.push('/vtes/decks');
                    setLoading(false);
                    return;
                }

                if (!data) {
                    console.error('No deck found');
                    setLoading(false);
                    return;
                }

                console.log('Deck Data:', data);
                const deckData = data as unknown as DeckData;
                setDeck(deckData);

                // Hydrate cards
                const ids = deckData.deck_cards?.map(dc => dc.card_id) || [];
                console.log('Card IDs to hydrate:', ids.length);

                if (ids.length > 0) {
                    const krcgCards = await getCardsByIds(ids);
                    console.log('KRCG Fetched:', krcgCards.length);

                    const cardMap = new Map<number, VtesCard>();
                    krcgCards.forEach(c => cardMap.set(c.id, c));
                    setHydratedCards(cardMap);

                    // Preload all card images to prevent flicker on hover
                    krcgCards.forEach(card => {
                        if (card.url) {
                            const img = new window.Image();
                            img.src = card.url;
                        }
                    });
                }

                setLoading(false);
            } catch (err) {
                console.error('CRITICAL LOAD ERROR:', err);
                setLoading(false);
            }
        };

        if (params.id) fetchDeck();
    }, [params.id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this deck? This cannot be undone.')) return;

        const { error } = await supabase
            .from('decks')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error(error);
            alert('Failed to delete deck');
        } else {
            router.push('/vtes/decks');
        }
    };

    const handleAutoTag = async () => {
        if (!deck || hydratedCards.size === 0) return;

        // Construct deck composition for analyzer
        const composition = deck.deck_cards.map(dc => ({
            quantity: dc.count,
            card: hydratedCards.get(dc.card_id)!
        })).filter(c => c.card); // filter out missing cards

        const newTags = autoTagDeck(composition);

        if (newTags.length === 0 && !confirm('No specific tags were detected. Clear existing tags?')) {
            return;
        }

        const { error } = await supabase
            .from('decks')
            .update({ tags: newTags })
            .eq('id', deck.id);

        if (error) {
            console.error('Error updating tags:', error);
            alert('Failed to update tags');
        } else {
            setDeck({ ...deck, tags: newTags });
        }
    };

    const isOwner = currentUserId && deck && deck.user_id === currentUserId;



    if (loading || !deck) {
        return (
            <AppLayout>
                <div className="flex justify-center py-20 text-slate-500">Loading deck...</div>
            </AppLayout>
        );
    }

    if (isRestricted) {
        return (
            <AppLayout>
                <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
                    <div className="inline-flex p-6 rounded-full bg-slate-800/50 mb-4">
                        <Lock className="h-12 w-12 text-slate-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-red-100">{deck.name}</h1>
                    <p className="text-xl text-slate-400">This deck is private.</p>
                    <p className="text-slate-500">Only the author can view its contents.</p>
                    <Link href="/vtes/decks">
                        <Button className="mt-8" variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                            Back to Decks
                        </Button>
                    </Link>
                </div>
            </AppLayout>
        );
    }

    if (!deck) return <div className='p-10 text-white'>Deck not found (Check Console)</div>;

    // Process Cards - Safe Access
    const cryptCards: { q: number; card: VtesCard }[] = [];
    const libraryCards: { q: number; card: VtesCard }[] = [];

    (deck.deck_cards || []).forEach(dc => {
        const card = hydratedCards.get(dc.card_id);
        if (card) {
            const isCrypt = card.types?.includes('Vampire') || card.types?.includes('Imbued');
            if (isCrypt) cryptCards.push({ q: dc.count, card });
            else libraryCards.push({ q: dc.count, card });
        }
    });

    // Sort Crypt
    cryptCards.sort((a, b) => (b.card.capacity || 0) - (a.card.capacity || 0) || (a.card.name || '').localeCompare(b.card.name || ''));

    // Group Library
    const libraryByType: { [type: string]: typeof libraryCards } = {};
    const typeOrder = ['Master', 'Action', 'Political Action', 'Action Modifier', 'Reaction', 'Combat', 'Equipment', 'Retainer', 'Ally', 'Event'];

    libraryCards.forEach(item => {
        const type = item.card.types?.[0] || 'Other';
        if (!libraryByType[type]) libraryByType[type] = [];
        libraryByType[type].push(item);
    });

    // Sort Library
    Object.values(libraryByType).forEach(list => list.sort((a, b) => (a.card.name || '').localeCompare(b.card.name || '')));

    const totalCrypt = cryptCards.reduce((acc, c) => acc + c.q, 0);
    const totalLibrary = libraryCards.reduce((acc, c) => acc + c.q, 0);



    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-6 relative">
                {deck.deck_cards.length === 0 && (
                    <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg text-amber-200 mb-6">
                        <h3 className="font-bold flex items-center gap-2"><AlertCircle className="h-4 w-4" /> No Cards Found</h3>
                        <p className="text-sm mt-1 opacity-80">
                            This deck appears to have no cards. If you just imported it, the import might have failed,
                            or you may not have permission to view the card list (Privacy Settings).
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/vtes/decks">
                            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-100">{deck.name}</h1>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>{deck.profile?.display_name || deck.profile?.username}</span>
                                <span>•</span>
                                <span>{new Date(deck.created_at).toLocaleDateString()}</span>
                            </div>
                            {/* Tags Display */}
                            {deck.tags && deck.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {deck.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700 flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {
                        isOwner && (
                            <div className="flex gap-2">
                                <Button
                                    className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50"
                                    size="sm"
                                    leftIcon={<Trash2 className="h-4 w-4" />}
                                    onClick={handleDelete}
                                >
                                    Delete
                                </Button>
                                {/* <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    size="sm"
                                    leftIcon={<Wand2 className="h-4 w-4" />}
                                    onClick={handleAutoTag}
                                >
                                    Auto Tag
                                </Button> */}
                            </div>
                        )
                    }
                </div >

                <DeckStatsSection deckId={params.id as string} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* CRYPT SECTION (Wide) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
                            <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                                <h2 className="font-bold text-slate-200">Crypt</h2>
                                <span className="text-xs font-mono text-slate-400">{totalCrypt} cards</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900 text-xs text-slate-500 uppercase font-medium">
                                    <tr>
                                        <th className="px-2 py-2 text-center w-8">#</th>
                                        <th className="px-2 py-2 text-center w-10">Cap</th>
                                        <th className="px-2 py-2 text-left w-24">Disc</th>
                                        <th className="px-2 py-2 text-left">Name</th>
                                        <th className="px-2 py-2 text-center w-8">Clan</th>
                                        <th className="px-2 py-2 text-center w-8">G</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {cryptCards.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-2 py-1.5 text-center text-slate-400 font-mono">{item.q}</td>
                                            <td className="px-2 py-1.5 text-center">
                                                <div className="w-6 h-6 rounded-full bg-red-900 border border-red-700 mx-auto flex items-center justify-center text-white font-bold text-xs shadow-inner shadow-red-950">
                                                    {item.card.capacity}
                                                </div>
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <div className="flex items-center gap-0.5">
                                                    {sortDisciplines(item.card.disciplines || []).map(d => (
                                                        <VtesIcon key={d} name={d} type="discipline" size="sm" />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-2 py-1.5 relative">
                                                <CardHover card={item.card}>
                                                    {item.card.name.replace(/\s*\(G\d+\)$/i, '')}
                                                </CardHover>
                                                {item.card.title && <span className="text-xs text-slate-500 ml-2">({item.card.title})</span>}
                                            </td>
                                            <td className="px-2 py-1.5 text-center">
                                                {item.card.clans && item.card.clans.length > 0 && (
                                                    <VtesIcon name={item.card.clans[0]} type="clan" size="sm" className="opacity-80" />
                                                )}
                                            </td>
                                            <td className="px-2 py-1.5 text-center text-slate-500 text-xs">
                                                {item.card.group}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* LIBRARY SECTION */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
                            <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                                <h2 className="font-bold text-slate-200">Library</h2>
                                <span className="text-xs font-mono text-slate-400">{totalLibrary} cards</span>
                            </div>

                            <div className="divide-y divide-slate-800">
                                {typeOrder.map(type => {
                                    const cards = libraryByType[type];
                                    if (!cards || cards.length === 0) return null;

                                    return (
                                        <div key={type}>
                                            <div className="px-3 py-1 bg-slate-900 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <VtesIcon name={type} type="type" size="sm" className="opacity-50 grayscale" />
                                                {type} ({cards.reduce((a, b) => a + b.q, 0)})
                                            </div>
                                            <table className="w-full text-sm">
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {cards.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                                            <td className="px-3 py-1.5 w-8 text-center text-slate-400 font-mono border-r border-slate-800/50">{item.q}</td>
                                                            <td className="px-3 py-1.5 relative">
                                                                <CardHover card={item.card}>
                                                                    {item.card.name}
                                                                </CardHover>
                                                            </td>
                                                            <td className="px-3 py-1.5 w-16 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {item.card.blood_cost && item.card.blood_cost !== '0' && (
                                                                        <div className="flex items-center text-xs font-bold text-red-400 bg-red-950/30 px-1 rounded">
                                                                            <Droplet className="w-3 h-3 mr-0.5 fill-red-500 text-red-500" />
                                                                            {item.card.blood_cost}
                                                                        </div>
                                                                    )}
                                                                    {item.card.pool_cost && item.card.pool_cost !== '0' && (
                                                                        <div className="flex items-center text-xs font-bold text-amber-400 bg-amber-950/30 px-1 rounded border border-amber-900/50">
                                                                            <div className="w-2.5 h-2.5 bg-amber-500 rotate-45 mr-1" />
                                                                            {item.card.pool_cost}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-1.5 w-12 text-right">
                                                                <div className="flex items-center justify-end gap-0.5">
                                                                    {sortDisciplines(item.card.disciplines || []).map(d => (
                                                                        <VtesIcon key={d} name={d} type="discipline" size="sm" />
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}

                                {/* Other Types */}
                                {Object.keys(libraryByType).filter(t => !typeOrder.includes(t)).map(type => {
                                    const cards = libraryByType[type];
                                    if (!cards || cards.length === 0) return null;
                                    return (
                                        <div key={type}>
                                            <div className="px-3 py-1 bg-slate-900 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                {type} ({cards.reduce((a, b) => a + b.q, 0)})
                                            </div>
                                            <table className="w-full text-sm">
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {cards.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors group">
                                                            <td className="px-3 py-1.5 w-8 text-center text-slate-400 font-mono border-r border-slate-800/50">{item.q}</td>
                                                            <td className="px-3 py-1.5 relative">
                                                                <CardHover card={item.card}>
                                                                    {item.card.name}
                                                                </CardHover>
                                                            </td>
                                                            <td className="px-3 py-1.5 w-16 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {item.card.blood_cost && item.card.blood_cost !== '0' && (
                                                                        <div className="flex items-center text-xs font-bold text-red-400 bg-red-950/30 px-1 rounded">
                                                                            <Droplet className="w-3 h-3 mr-0.5 fill-red-500 text-red-500" />
                                                                            {item.card.blood_cost}
                                                                        </div>
                                                                    )}
                                                                    {item.card.pool_cost && item.card.pool_cost !== '0' && (
                                                                        <div className="flex items-center text-xs font-bold text-amber-400 bg-amber-950/30 px-1 rounded border border-amber-900/50">
                                                                            <div className="w-2.5 h-2.5 bg-amber-500 rotate-45 mr-1" />
                                                                            {item.card.pool_cost}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-1.5 w-12 text-right">
                                                                <div className="flex items-center justify-end gap-0.5">
                                                                    {sortDisciplines(item.card.disciplines || []).map(d => (
                                                                        <VtesIcon key={d} name={d} type="discipline" size="sm" />
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </AppLayout >
    );
}
