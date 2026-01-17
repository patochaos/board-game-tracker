'use client';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { ArrowLeft, Save, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ParsedCard {
    count: number;
    name: string;
    id?: number; // KRCG ID
    type: 'crypt' | 'library';
}

export default function ImportDeckPage() {
    const router = useRouter();
    const [text, setText] = useState('');
    const [deckName, setDeckName] = useState('');
    const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    // Simple parser for "12x Name" or "12 Name" format
    const parseDeckList = async () => {
        setLoading(true);
        setError(null);

        try {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            const cards: ParsedCard[] = [];
            let currentSection: 'crypt' | 'library' = 'library'; // Default

            // Check for heuristics to determine section
            // Usually "Crypt:" or "Library:" headers exist

            for (const line of lines) {
                if (line.toLowerCase().includes('crypt')) {
                    currentSection = 'crypt';
                    continue;
                }
                if (line.toLowerCase().includes('library')) {
                    currentSection = 'library';
                    continue;
                }

                // Regex for "12x Name" or "12 Name"
                const match = line.match(/^(\d+)[x\s]+(.+)$/);
                if (match) {
                    const count = parseInt(match[1]);
                    const name = match[2].trim();

                    // Basic determination: Crypt cards usually have names, Library have types.
                    // For now, relies on headers or generic fallback.
                    // Ideally, we query KRCG API here to verify and categorize.

                    cards.push({
                        count,
                        name,
                        type: currentSection
                    });
                }
            }

            if (cards.length === 0) {
                throw new Error("No cards found. Please check the format (e.g., '4x Govern the Unaligned').");
            }

            // Verify against KRCG API (Mock/Real)
            // We'll do a batch check or just trust the input for now and fix types later?
            // Better to check. Fetching matching cards from KRCG API.
            // Doing this client-side 1-by-1 is slow. 
            // Optimized approach: Call complete endpoint or search.

            // For MVP: Just rely on parsing.
            setParsedCards(cards);
            setStep('preview');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse deck');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Create Deck
            const { data: deck, error: deckError } = await supabase
                .from('decks')
                .insert({
                    user_id: user.id,
                    name: deckName || 'Imported Deck',
                    description: 'Imported via text parser',
                })
                .select()
                .single();

            if (deckError) throw deckError;

            // 2. Create Deck Cards
            // Note: We are missing KRCG IDs here. In a real app we MUST fetch them.
            // For this step, we will insert with a dummy ID (e.g. 0) or we need to fetch.
            // Let's assume we skip ID for now or use a placeholder if the DB constraint logic allows (it requires Int).
            // Constraint: `card_id integer NOT NULL`.
            // We NEED to fetch IDs.

            // Quick fetch from KRCG for the cards
            // This might be slow for large decks.
            const cardsWithIds = await Promise.all(parsedCards.map(async (card) => {
                try {
                    const res = await fetch(`https://api.krcg.org/card/${encodeURIComponent(card.name)}`);
                    if (res.ok) {
                        const data = await res.json();
                        return { ...card, id: data.id, type: data.type && data.type.length ? 'library' : 'crypt' }; // Heuristic
                    }
                } catch (e) { console.warn('Failed to fetch', card.name); }
                return { ...card, id: 0 }; // Fallback
            }));

            const validCards = cardsWithIds.filter(c => c.id !== 0);

            const { error: cardsError } = await supabase
                .from('deck_cards')
                .insert(validCards.map(c => ({
                    deck_id: deck.id,
                    card_id: c.id!,
                    count: c.count,
                    name: c.name,
                    type: c.type
                })));

            if (cardsError) throw cardsError;

            router.push('/vtes'); // Redirect to dashboard

        } catch (err) {
            console.error(err);
            setError('Failed to save deck');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/vtes">
                        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                            Back to Domain
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-red-100 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-red-500" />
                        Import Deck
                    </h1>
                </div>

                {step === 'input' ? (
                    <Card variant="glass">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Deck Name</label>
                                <input
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:border-red-500 outline-none"
                                    placeholder="My New Deck"
                                    value={deckName}
                                    onChange={(e) => setDeckName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Deck List (Text)</label>
                                <textarea
                                    className="w-full h-64 bg-slate-900/50 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:border-red-500 outline-none"
                                    placeholder={`Crypt:\n12x Govern the Unaligned\n\nLibrary:\n4x Deflection`}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Paste "Text" or "TWD" format here.
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={parseDeckList}
                                    disabled={loading || !text.trim()}
                                >
                                    {loading ? 'Parsing...' : 'Parse Deck'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card variant="glass">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-100">{deckName || 'Untitled Deck'}</h2>
                                <div className="text-slate-400 text-sm">
                                    {parsedCards.reduce((acc, c) => acc + c.count, 0)} Cards Found
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-red-400 font-semibold mb-3 border-b border-red-500/20 pb-2">Crypt</h3>
                                    <ul className="space-y-1">
                                        {parsedCards.filter(c => c.type === 'crypt').map((c, i) => (
                                            <li key={i} className="text-slate-300 text-sm flex gap-2">
                                                <span className="text-slate-500 font-mono w-6 text-right">{c.count}</span>
                                                {c.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-blue-400 font-semibold mb-3 border-b border-blue-500/20 pb-2">Library</h3>
                                    <ul className="space-y-1">
                                        {parsedCards.filter(c => c.type === 'library').map((c, i) => (
                                            <li key={i} className="text-slate-300 text-sm flex gap-2">
                                                <span className="text-slate-500 font-mono w-6 text-right">{c.count}</span>
                                                {c.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                                <Button variant="ghost" onClick={() => setStep('input')}>
                                    Edit Text
                                </Button>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={handleSave}
                                    disabled={loading}
                                    leftIcon={<Save className="h-4 w-4" />}
                                >
                                    {loading ? 'saving...' : 'Save Deck'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
