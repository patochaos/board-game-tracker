'use client';

import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { ArrowLeft, Save, FileText, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

import { detectArchetype, ARCHETYPES, Archetype } from '@/lib/vtes/archetypes';
import { VtesCard } from '@/lib/krcg';

interface ParsedCard {
    count: number;
    name: string;
    id?: number; // KRCG ID
    type: 'crypt' | 'library';
    data?: VtesCard; // Full KRCG data for detection
}

function ImportDeckContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo');
    const [text, setText] = useState('');
    const [deckName, setDeckName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [detectedArchetype, setDetectedArchetype] = useState<Archetype>('Unknown');
    const [selectedArchetype, setSelectedArchetype] = useState<Archetype>('Unknown');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    // Enhanced parser for various formats (Lackey, Text, Amaranth)
    const parseDeckList = async () => {
        setLoading(true);
        setError(null);

        try {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            const cards: ParsedCard[] = [];
            let currentSection: 'crypt' | 'library' = 'library'; // Default to library

            for (const line of lines) {
                const lower = line.toLowerCase();

                // Section detection - handles multiple formats:
                // - "Crypt:" (standard)
                // - "Crypt (12 cards)" or "Crypt (12)" (Amaranth)
                // - "Library:" (standard)
                // - "Library (90 cards)" or "Library (90)" (Amaranth)
                if (lower.startsWith('crypt')) {
                    currentSection = 'crypt';
                    continue;
                }
                if (lower.startsWith('library')) {
                    currentSection = 'library';
                    continue;
                }

                // Skip Amaranth subsection headers like "Master (12)" or "- Combat (8)"
                // These are library category headers, not cards
                if (/^-?\s*(master|conviction|power|action|political|ally|equipment|retainer|reaction|combat|event|modifier)\s*\(\d+\)/i.test(line)) {
                    continue;
                }

                // Skip deck metadata lines (Amaranth headers)
                if (lower.startsWith('deck name:') || lower.startsWith('created by:') ||
                    lower.startsWith('author:') || lower.startsWith('description:')) {
                    continue;
                }

                // Parse Line - Multiple Formats
                let count = 0;
                let name = '';

                // 1. Amaranth Crypt Format: "Countx CardName Capacity Disciplines Title Clan"
                // Example: "2x Cailean 10 ANI OBF POT PRE dom archbishop Nosferatu antitribu"
                // Count at start, then name, then capacity (1-11), then disciplines (3-letter codes)
                const amaranthCryptMatch = line.match(/^(\d+)x\s+(.+?)\s+(\d{1,2})\s+[a-zA-Z]{3}/);
                if (amaranthCryptMatch) {
                    count = parseInt(amaranthCryptMatch[1]);
                    name = amaranthCryptMatch[2].trim();
                }

                // 2. Lackey Crypt Format: "CardName Capacity Disciplines Title Clan:Count"
                // Example: "Cicatriz 5 ani obf pot bishop Nosferatu antitribu:2"
                // Count at the end after colon
                if (!name) {
                    const lackeyCryptMatch = line.match(/^(.+?)\s+(\d{1,2})\s+[a-zA-Z]{3}.*:(\d+)$/);
                    if (lackeyCryptMatch) {
                        name = lackeyCryptMatch[1].trim();
                        count = parseInt(lackeyCryptMatch[3]);
                    }
                }

                // 3. Lackey Library Format: "CardName:Count" (no capacity/disciplines)
                // Example: "Govern the Unaligned:4"
                if (!name) {
                    const lackeyLibMatch = line.match(/^(.+):(\d+)$/);
                    if (lackeyLibMatch && !lackeyLibMatch[1].match(/\s+\d{1,2}\s+[a-zA-Z]{3}/)) {
                        // Only match if it doesn't look like crypt format
                        name = lackeyLibMatch[1].trim();
                        count = parseInt(lackeyLibMatch[2]);
                    }
                }

                // 4. Tab separated (old Lackey): "count\tName"
                if (!name && line.includes('\t')) {
                    const parts = line.split('\t');
                    const countPart = parts[0].trim();
                    if (/^\d+$/.test(countPart)) {
                        count = parseInt(countPart);
                        name = parts.slice(1).join(' ').trim();
                    }
                }

                // 5. Standard/Amaranth Library: "4x Name" or "4 Name"
                if (!name) {
                    const match = line.match(/^(\d+)[x\s]+(.+)$/);
                    if (match) {
                        count = parseInt(match[1]);
                        name = match[2].trim();
                    }
                }

                if (name && count > 0) {
                    cards.push({
                        count,
                        name,
                        type: currentSection
                    });
                }
            }

            if (cards.length === 0) {
                throw new Error("No cards found. Supported formats: Lackey, Text, Amaranth.");
            }

            // ENRICHMENT STEP: Fetch data from KRCG to detect archetype
            console.log('=== PARSING DEBUG ===');
            console.log('Cards after text parsing:', cards.map(c => ({ name: c.name, type: c.type })));

            const enrichedCards = await Promise.all(cards.map(async (card) => {
                try {
                    const res = await fetch(`https://api.krcg.org/card/${encodeURIComponent(card.name)}`);
                    if (res.ok) {
                        const data = await res.json();
                        const isCrypt = data.types && (data.types.includes('Vampire') || data.types.includes('Imbued'));
                        console.log(`KRCG: "${card.name}" -> types: ${JSON.stringify(data.types)}, isCrypt: ${isCrypt}`);
                        return {
                            ...card,
                            id: data.id,
                            type: (isCrypt ? 'crypt' : 'library') as 'crypt' | 'library',
                            data: data // Store full data for detection
                        };
                    } else {
                        console.warn(`KRCG API returned ${res.status} for "${card.name}"`);
                    }
                } catch (err) {
                    console.warn('Failed to fetch', card.name, err);
                }
                return card;
            }));

            console.log('Cards after KRCG enrichment:', enrichedCards.map(c => ({ name: c.name, type: c.type, id: c.id })));

            // Run Detection
            const validForDetection = enrichedCards
                .filter(c => c.data)
                .map(c => ({ count: c.count, data: c.data }));

            const archetype = detectArchetype(validForDetection);

            setDetectedArchetype(archetype);
            setSelectedArchetype(archetype); // Default to detected
            setParsedCards(enrichedCards);
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

            // DEBUG: Log parsed cards before filtering
            console.log('=== DECK IMPORT DEBUG ===');
            console.log('All parsed cards:', parsedCards.map(c => ({
                name: c.name,
                id: c.id,
                type: c.type,
                count: c.count
            })));

            const cryptCards = parsedCards.filter(c => c.type === 'crypt');
            const libraryCards = parsedCards.filter(c => c.type === 'library');
            console.log(`Crypt cards: ${cryptCards.length}, Library cards: ${libraryCards.length}`);
            console.log('Crypt cards detail:', cryptCards);

            // 1. Create Deck
            const { data: deck, error: deckError } = await supabase
                .from('decks')
                .insert({
                    user_id: user.id,
                    name: deckName || 'Imported Deck',
                    description: 'Imported via text parser',
                    is_public: !isPrivate,
                    tags: selectedArchetype !== 'Unknown' ? [selectedArchetype] : []
                })
                .select()
                .single();

            if (deckError) throw deckError;

            // 2. Create Deck Cards
            // Data is already fetched in parsedCards, just filter invalid
            const validCards = parsedCards.filter(c => c.id && c.id !== 0);
            const invalidCards = parsedCards.filter(c => !c.id || c.id === 0);

            // DEBUG: Log what we're about to insert
            console.log('=== SAVE DEBUG ===');
            console.log('Total parsed:', parsedCards.length);
            console.log('Valid cards (with IDs):', validCards.length);
            console.log('Invalid cards (no ID):', invalidCards.length);
            if (invalidCards.length > 0) {
                console.log('⚠️ CARDS WITHOUT IDS (will be skipped):', invalidCards.map(c => ({
                    name: c.name,
                    type: c.type,
                    id: c.id
                })));
            }
            console.log('Valid crypt:', validCards.filter(c => c.type === 'crypt').length);
            console.log('Valid library:', validCards.filter(c => c.type === 'library').length);
            console.log('Cards being inserted:', validCards.map(c => ({
                card_id: c.id,
                name: c.name,
                type: c.type,
                count: c.count
            })));

            // Warn user if crypt cards are missing IDs
            const cryptWithoutId = invalidCards.filter(c => c.type === 'crypt');
            if (cryptWithoutId.length > 0) {
                console.error('🚨 CRYPT CARDS WILL BE LOST:', cryptWithoutId.map(c => c.name));
            }

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

            router.push(returnTo || '/vtes-tracker/decks'); // Redirect back or to decks list

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
                    <Link href="/vtes-tracker">
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

                            {/* Privacy Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                <div>
                                    <label className="block text-sm font-medium text-slate-200">Deck Visibility</label>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {isPrivate ? 'Only you can see the card list' : 'Everyone can see the card list'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsPrivate(!isPrivate)}
                                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                                        isPrivate ? 'bg-amber-600' : 'bg-emerald-600'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                            isPrivate ? 'translate-x-9' : 'translate-x-1'
                                        }`}
                                    />
                                    <span className={`absolute text-[10px] font-bold uppercase ${
                                        isPrivate ? 'left-1.5 text-amber-100' : 'right-1.5 text-emerald-100'
                                    }`}>
                                        {isPrivate ? 'OFF' : 'ON'}
                                    </span>
                                </button>
                                <span className={`ml-3 text-sm font-bold ${
                                    isPrivate ? 'text-amber-400' : 'text-emerald-400'
                                }`}>
                                    {isPrivate ? 'PRIVATE' : 'PUBLIC'}
                                </span>
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
                                    Supports Lackey, Text/TWD, and Amaranth formats.
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
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold text-slate-100">{deckName || 'Untitled Deck'}</h2>
                                    <button
                                        onClick={() => setIsPrivate(!isPrivate)}
                                        className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full border transition-all ${
                                            isPrivate
                                                ? 'text-amber-400 bg-amber-950/40 border-amber-900/50 hover:bg-amber-900/40'
                                                : 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50 hover:bg-emerald-900/40'
                                        }`}
                                    >
                                        {isPrivate ? (
                                            <>
                                                <EyeOff className="w-3.5 h-3.5" />
                                                PRIVATE - Click to make public
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-3.5 h-3.5" />
                                                PUBLIC - Click to make private
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="text-slate-400 text-sm">
                                    {parsedCards.reduce((acc, c) => acc + c.count, 0)} Cards Found
                                </div>
                            </div>

                            {/* Archetype Selector */}
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-300">Detected Archetype</label>
                                    {detectedArchetype !== 'Unknown' && (
                                        <span className="text-xs text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
                                            AI Suggestion: {detectedArchetype}
                                        </span>
                                    )}
                                </div>
                                <select
                                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:border-red-500 outline-none"
                                    value={selectedArchetype}
                                    onChange={(e) => setSelectedArchetype(e.target.value as Archetype)}
                                >
                                    <option value="Unknown">Unknown / Other</option>
                                    {ARCHETYPES.map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-2">
                                    This will be saved as a tag for your deck.
                                </p>
                            </div>

                            {/* Warning for cards without IDs */}
                            {(() => {
                                const cardsWithoutId = parsedCards.filter(c => !c.id || c.id === 0);
                                const cryptWithoutId = cardsWithoutId.filter(c => c.type === 'crypt');
                                if (cardsWithoutId.length > 0) {
                                    return (
                                        <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg flex items-start gap-2 text-amber-300 text-sm">
                                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold">⚠️ {cardsWithoutId.length} card(s) not found in KRCG database</p>
                                                <p className="text-xs text-amber-400/80 mt-1">
                                                    These cards will NOT be saved: {cardsWithoutId.map(c => c.name).join(', ')}
                                                </p>
                                                {cryptWithoutId.length > 0 && (
                                                    <p className="text-xs text-red-400 font-bold mt-1">
                                                        🚨 {cryptWithoutId.length} CRYPT card(s) will be lost!
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

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

export default function ImportDeckPage() {
    return (
        <Suspense fallback={
            <AppLayout>
                <div className="flex justify-center py-20 text-slate-500">Loading...</div>
            </AppLayout>
        }>
            <ImportDeckContent />
        </Suspense>
    );
}
