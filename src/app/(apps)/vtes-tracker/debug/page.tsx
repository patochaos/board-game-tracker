'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { getCardsByIds } from '@/lib/krcg';

export default function DebugPage() {
    const [deckId, setDeckId] = useState('');
    const [dbData, setDbData] = useState<any>(null);
    const [krcgData, setKrcgData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Card name test
    const [cardName, setCardName] = useState('');
    const [cardResult, setCardResult] = useState<any>(null);

    // Import simulation test
    const [deckText, setDeckText] = useState('');
    const [importResult, setImportResult] = useState<any>(null);
    const [importLoading, setImportLoading] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const testCardName = async () => {
        if (!cardName) return;
        setCardResult({ loading: true });

        try {
            const res = await fetch(`https://api.krcg.org/card/${encodeURIComponent(cardName)}`);
            if (res.ok) {
                const data = await res.json();
                const isCrypt = data.types && (data.types.includes('Vampire') || data.types.includes('Imbued'));
                setCardResult({
                    success: true,
                    id: data.id,
                    name: data.name,
                    types: data.types,
                    isCrypt,
                    raw: data
                });
            } else {
                setCardResult({ error: `HTTP ${res.status}` });
            }
        } catch (e: any) {
            setCardResult({ error: e.message });
        }
    };

    const testDeck = async () => {
        if (!deckId) return;
        setLoading(true);
        setDbData(null);
        setKrcgData([]);

        // 1. Fetch from DB
        const { data, error } = await supabase
            .from('decks')
            .select('id, name, deck_cards(card_id, count, type, name)')
            .eq('id', deckId)
            .single();

        if (error) {
            setDbData({ error: error.message });
            setLoading(false);
            return;
        }

        setDbData(data);

        // 2. Fetch from KRCG
        const ids = data.deck_cards?.map((dc: any) => dc.card_id) || [];
        if (ids.length > 0) {
            const cards = await getCardsByIds(ids.slice(0, 5)); // Just first 5
            setKrcgData(cards);
        }

        setLoading(false);
    };

    // Count by type
    const cryptCount = dbData?.deck_cards?.filter((dc: any) => dc.type === 'crypt').length || 0;
    const libraryCount = dbData?.deck_cards?.filter((dc: any) => dc.type === 'library').length || 0;
    const nullTypeCount = dbData?.deck_cards?.filter((dc: any) => !dc.type).length || 0;

    return (
        <div className="p-8 bg-slate-900 min-h-screen text-white">
            <h1 className="text-2xl font-bold mb-4">🔍 Deck Debug</h1>

            {/* TEST 1: Card Name */}
            <div className="mb-8 p-4 bg-slate-800 rounded">
                <h2 className="font-bold text-lg mb-2">🧪 Test 1: KRCG API by Card Name</h2>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Card name (e.g. Anson)"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white w-96"
                    />
                    <button
                        onClick={testCardName}
                        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Test KRCG
                    </button>
                </div>
                {cardResult && (
                    <div className="text-sm">
                        {cardResult.loading ? (
                            <p>Loading...</p>
                        ) : cardResult.error ? (
                            <p className="text-red-400">Error: {cardResult.error}</p>
                        ) : (
                            <div className="space-y-1">
                                <p>ID: <span className="text-amber-400">{cardResult.id}</span></p>
                                <p>Name: <span className="text-amber-400">{cardResult.name}</span></p>
                                <p>Types: <span className="text-blue-400">{JSON.stringify(cardResult.types)}</span></p>
                                <p>Is Crypt: <span className={cardResult.isCrypt ? 'text-green-400' : 'text-red-400'}>
                                    {cardResult.isCrypt ? 'YES ✓' : 'NO (library)'}
                                </span></p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* TEST 2: Deck */}
            <div className="mb-8 p-4 bg-slate-800 rounded">
                <h2 className="font-bold text-lg mb-2">🧪 Test 2: Check Deck in DB</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Deck UUID"
                        value={deckId}
                        onChange={(e) => setDeckId(e.target.value)}
                        className="px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white w-96"
                    />
                    <button
                        onClick={testDeck}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Test'}
                    </button>
                </div>
            </div>

            {dbData && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="p-4 bg-slate-800 rounded">
                        <h2 className="font-bold text-lg mb-2">📊 Summary</h2>
                        <p>Deck: <span className="text-amber-400">{dbData.name || dbData.error}</span></p>
                        <p>Total cards: <span className="text-blue-400">{dbData.deck_cards?.length || 0}</span></p>
                        <p>Crypt (type='crypt'): <span className="text-green-400">{cryptCount}</span></p>
                        <p>Library (type='library'): <span className="text-purple-400">{libraryCount}</span></p>
                        <p className={nullTypeCount > 0 ? 'text-red-400' : ''}>
                            NULL type: <span className="font-bold">{nullTypeCount}</span>
                            {nullTypeCount > 0 && ' ⚠️ THIS IS THE PROBLEM!'}
                        </p>
                    </div>

                    {/* DB Data Sample */}
                    <div className="p-4 bg-slate-800 rounded">
                        <h2 className="font-bold text-lg mb-2">🗄️ DB deck_cards (first 10)</h2>
                        <pre className="text-xs overflow-auto max-h-60 bg-slate-950 p-2 rounded">
                            {JSON.stringify(dbData.deck_cards?.slice(0, 10), null, 2)}
                        </pre>
                    </div>

                    {/* KRCG Data Sample */}
                    {krcgData.length > 0 && (
                        <div className="p-4 bg-slate-800 rounded">
                            <h2 className="font-bold text-lg mb-2">🌐 KRCG API (first 5)</h2>
                            <pre className="text-xs overflow-auto max-h-60 bg-slate-950 p-2 rounded">
                                {JSON.stringify(krcgData.map(c => ({
                                    id: c.id,
                                    name: c.name,
                                    types: c.types
                                })), null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* TEST 3: Import Simulation */}
            <div className="mb-8 p-4 bg-slate-800 rounded">
                <h2 className="font-bold text-lg mb-2">🧪 Test 3: Import Simulation</h2>
                <p className="text-sm text-slate-400 mb-4">Paste a deck list to see what types would be assigned (without saving).</p>
                <textarea
                    placeholder={`Crypt:
2x Anson
1x Alexandra

Library:
4x Govern the Unaligned
2x Deflection`}
                    value={deckText}
                    onChange={(e) => setDeckText(e.target.value)}
                    className="w-full h-40 px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono text-sm mb-4"
                />
                <button
                    onClick={async () => {
                        setImportLoading(true);
                        setImportResult(null);

                        try {
                            // Parse deck text (same logic as import page)
                            const lines = deckText.split('\n').map(l => l.trim()).filter(l => l);
                            const cards: { count: number; name: string; type: 'crypt' | 'library'; sectionBased: boolean }[] = [];
                            let currentSection: 'crypt' | 'library' = 'library';

                            for (const line of lines) {
                                const lower = line.toLowerCase();
                                if (lower.startsWith('crypt')) { currentSection = 'crypt'; continue; }
                                if (lower.startsWith('library')) { currentSection = 'library'; continue; }
                                if (/^-?\s*(master|conviction|power|action|political|ally|equipment|retainer|reaction|combat|event|modifier)\s*\(\d+\)/i.test(line)) continue;

                                let count = 0, name = '';

                                // 1. Amaranth Crypt: "Countx CardName Capacity Disciplines..."
                                // Example: "2x Cailean 10 ANI OBF POT PRE dom archbishop"
                                const amaranthCryptMatch = line.match(/^(\d+)x\s+(.+?)\s+(\d{1,2})\s+[a-zA-Z]{3}/);
                                if (amaranthCryptMatch) {
                                    count = parseInt(amaranthCryptMatch[1]);
                                    name = amaranthCryptMatch[2].trim();
                                }

                                // 2. Lackey Crypt: "CardName Capacity Disciplines...:Count"
                                if (!name) {
                                    const lackeyCryptMatch = line.match(/^(.+?)\s+(\d{1,2})\s+[a-zA-Z]{3}.*:(\d+)$/);
                                    if (lackeyCryptMatch) {
                                        name = lackeyCryptMatch[1].trim();
                                        count = parseInt(lackeyCryptMatch[3]);
                                    }
                                }

                                // 3. Lackey Library: "CardName:Count"
                                if (!name) {
                                    const lackeyLibMatch = line.match(/^(.+):(\d+)$/);
                                    if (lackeyLibMatch && !lackeyLibMatch[1].match(/\s+\d{1,2}\s+[a-zA-Z]{3}/)) {
                                        name = lackeyLibMatch[1].trim();
                                        count = parseInt(lackeyLibMatch[2]);
                                    }
                                }

                                // 4. Tab separated: "count\tName"
                                if (!name && line.includes('\t')) {
                                    const parts = line.split('\t');
                                    if (/^\d+$/.test(parts[0].trim())) {
                                        count = parseInt(parts[0].trim());
                                        name = parts.slice(1).join(' ').trim();
                                    }
                                }

                                // 5. Standard: "4x Name" or "4 Name"
                                if (!name) {
                                    const match = line.match(/^(\d+)[x\s]+(.+)$/);
                                    if (match) { count = parseInt(match[1]); name = match[2].trim(); }
                                }

                                if (name && count > 0) {
                                    cards.push({ count, name, type: currentSection, sectionBased: true });
                                }
                            }

                            // Enrich with KRCG (with timing)
                            const enrichmentResults: any[] = [];
                            const enrichedCards = await Promise.all(cards.map(async (card, idx) => {
                                const start = Date.now();
                                try {
                                    const res = await fetch(`https://api.krcg.org/card/${encodeURIComponent(card.name)}`);
                                    const elapsed = Date.now() - start;
                                    if (res.ok) {
                                        const data = await res.json();
                                        const isCrypt = data.types && (data.types.includes('Vampire') || data.types.includes('Imbued'));
                                        enrichmentResults.push({
                                            idx, name: card.name, status: 'OK',
                                            krcgTypes: data.types, isCrypt,
                                            originalType: card.type,
                                            finalType: isCrypt ? 'crypt' : 'library',
                                            changed: card.type !== (isCrypt ? 'crypt' : 'library'),
                                            elapsed
                                        });
                                        return { ...card, id: data.id, type: (isCrypt ? 'crypt' : 'library') as 'crypt' | 'library', sectionBased: false };
                                    } else {
                                        enrichmentResults.push({
                                            idx, name: card.name, status: `HTTP ${res.status}`,
                                            originalType: card.type, finalType: card.type,
                                            changed: false, elapsed
                                        });
                                    }
                                } catch (err: any) {
                                    enrichmentResults.push({
                                        idx, name: card.name, status: `ERROR: ${err.message}`,
                                        originalType: card.type, finalType: card.type,
                                        changed: false, elapsed: Date.now() - start
                                    });
                                }
                                return card;
                            }));

                            const cryptFinal = enrichedCards.filter(c => c.type === 'crypt');
                            const libraryFinal = enrichedCards.filter(c => c.type === 'library');

                            setImportResult({
                                parsed: cards.length,
                                cryptCount: cryptFinal.length,
                                libraryCount: libraryFinal.length,
                                crypt: cryptFinal.map(c => ({ name: c.name, count: c.count, sectionBased: c.sectionBased })),
                                library: libraryFinal.slice(0, 10).map(c => ({ name: c.name, count: c.count, sectionBased: c.sectionBased })),
                                enrichmentLog: enrichmentResults
                            });
                        } catch (err: any) {
                            setImportResult({ error: err.message });
                        }
                        setImportLoading(false);
                    }}
                    disabled={importLoading || !deckText.trim()}
                    className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {importLoading ? 'Simulating...' : 'Simulate Import'}
                </button>
            </div>

            {importResult && (
                <div className="mb-8 p-4 bg-slate-800 rounded space-y-4">
                    <h2 className="font-bold text-lg">📊 Import Simulation Result</h2>
                    {importResult.error ? (
                        <p className="text-red-400">Error: {importResult.error}</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 bg-slate-900 rounded text-center">
                                    <div className="text-2xl font-bold">{importResult.parsed}</div>
                                    <div className="text-sm text-slate-400">Total Parsed</div>
                                </div>
                                <div className="p-3 bg-red-900/30 rounded text-center">
                                    <div className="text-2xl font-bold text-red-400">{importResult.cryptCount}</div>
                                    <div className="text-sm text-slate-400">Crypt</div>
                                </div>
                                <div className="p-3 bg-blue-900/30 rounded text-center">
                                    <div className="text-2xl font-bold text-blue-400">{importResult.libraryCount}</div>
                                    <div className="text-sm text-slate-400">Library</div>
                                </div>
                            </div>

                            {importResult.cryptCount === 0 && importResult.parsed > 0 && (
                                <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-300">
                                    ⚠️ NO CRYPT CARDS DETECTED! Check the enrichment log below.
                                </div>
                            )}

                            <div>
                                <h3 className="font-bold text-red-400 mb-2">Crypt ({importResult.cryptCount})</h3>
                                <ul className="text-sm space-y-1">
                                    {importResult.crypt.map((c: any, i: number) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-slate-500 w-6 text-right">{c.count}x</span>
                                            <span>{c.name}</span>
                                            {c.sectionBased && <span className="text-amber-400 text-xs">(section-based, KRCG failed)</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-blue-400 mb-2">Library (first 10 of {importResult.libraryCount})</h3>
                                <ul className="text-sm space-y-1">
                                    {importResult.library.map((c: any, i: number) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-slate-500 w-6 text-right">{c.count}x</span>
                                            <span>{c.name}</span>
                                            {c.sectionBased && <span className="text-amber-400 text-xs">(section-based, KRCG failed)</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-purple-400 mb-2">🔬 KRCG Enrichment Log</h3>
                                <div className="max-h-60 overflow-auto bg-slate-950 p-2 rounded text-xs">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-slate-400">
                                                <th className="text-left p-1">Card</th>
                                                <th className="text-left p-1">Status</th>
                                                <th className="text-left p-1">KRCG Types</th>
                                                <th className="text-left p-1">Original</th>
                                                <th className="text-left p-1">Final</th>
                                                <th className="text-left p-1">ms</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importResult.enrichmentLog.map((log: any, i: number) => (
                                                <tr key={i} className={log.changed ? 'text-green-400' : log.status !== 'OK' ? 'text-red-400' : ''}>
                                                    <td className="p-1">{log.name}</td>
                                                    <td className="p-1">{log.status}</td>
                                                    <td className="p-1">{JSON.stringify(log.krcgTypes || '-')}</td>
                                                    <td className="p-1">{log.originalType}</td>
                                                    <td className="p-1 font-bold">{log.finalType}</td>
                                                    <td className="p-1">{log.elapsed}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="mt-8 p-4 bg-slate-800/50 rounded text-sm text-slate-400">
                <p>Para obtener un deck UUID, andá a la lista de decks y copiá el ID de la URL.</p>
                <p>Ejemplo: /vtes-tracker/decks/<span className="text-amber-400">abc123-uuid-here</span></p>
            </div>
        </div>
    );
}
