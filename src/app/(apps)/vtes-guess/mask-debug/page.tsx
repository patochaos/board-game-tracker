'use client';

import { useState, useEffect } from 'react';

// Default values reflecting current state
const DEFAULT_CONFIG = {
    p1: { top: 0, left: 0, width: 100, height: 12 },
    p2: { top: 72, left: 4, width: 92, height: 20 },
    blur: 12,
};

export default function MaskDebugPage() {
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [currentCardUrl, setCurrentCardUrl] = useState<string>('');

    // Load a random card on mount
    useEffect(() => {
        // Just hardcoding a few known good test cards
        const testCards = [
            'ansong1', // Modern
            'menele', // Modern
            'sirwalternash', // Old (disciplines right)
            'publicvileness', // Library (should be skipped but good for testing size)
            'theo', // Long text
        ];
        const randomSlug = testCards[Math.floor(Math.random() * testCards.length)];
        setCurrentCardUrl(`https://static.krcg.org/card/${randomSlug}.jpg`);
    }, []);

    const changeCard = () => {
        // Fetch from JSON properly if we wanted, but for debug a few hardcoded is faster
        const testCards = ['ansong1', 'menele', 'sirwalternash', 'theo', 'lucita', 'moncada', 'anarchconvert'];
        const randomSlug = testCards[Math.floor(Math.random() * testCards.length)];
        setCurrentCardUrl(`https://static.krcg.org/card/${randomSlug}.jpg`);
    };

    const updateVal = (patch: 'p1' | 'p2', key: string, val: number) => {
        setConfig(prev => ({
            ...prev,
            [patch]: { ...prev[patch], [key]: val }
        }));
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col md:flex-row gap-8">

            {/* Controls */}
            <div className="w-full md:w-1/3 bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6 h-fit overflow-y-auto max-h-screen">
                <h1 className="text-2xl font-bold text-amber-500">Mask Debugger</h1>

                <div className="space-y-4">
                    <button onClick={changeCard} className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-lg transition">
                        Change Card
                    </button>

                    <div className="flex items-center justify-between">
                        <label>Blur (px)</label>
                        <input
                            type="number"
                            value={config.blur}
                            onChange={e => setConfig(p => ({ ...p, blur: Number(e.target.value) }))}
                            className="bg-slate-800 w-20 px-2 py-1 rounded"
                        />
                    </div>
                </div>

                <div className="space-y-4 border-t border-slate-700 pt-4">
                    <h2 className="font-bold text-lg text-cyan-400">Patch 1 (Top Name)</h2>
                    {['top', 'left', 'width', 'height'].map(key => (
                        <div key={`p1-${key}`} className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-400 uppercase">
                                <span>{key} (%)</span>
                                <span>{config.p1[key as keyof typeof config.p1]}%</span>
                            </div>
                            <input
                                type="range"
                                min="-20" max="120"
                                value={config.p1[key as keyof typeof config.p1]}
                                onChange={e => updateVal('p1', key, Number(e.target.value))}
                                className="w-full accent-cyan-500"
                            />
                        </div>
                    ))}
                </div>

                <div className="space-y-4 border-t border-slate-700 pt-4">
                    <h2 className="font-bold text-lg text-green-400">Patch 2 (Bottom Text)</h2>
                    {['top', 'left', 'width', 'height'].map(key => (
                        <div key={`p2-${key}`} className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-400 uppercase">
                                <span>{key} (%)</span>
                                <span>{config.p2[key as keyof typeof config.p2]}%</span>
                            </div>
                            <input
                                type="range"
                                min="-20" max="120"
                                value={config.p2[key as keyof typeof config.p2]}
                                onChange={e => updateVal('p2', key, Number(e.target.value))}
                                className="w-full accent-green-500"
                            />
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-slate-950 rounded font-mono text-xs text-slate-300 break-all border border-slate-800">
                    <p className="mb-2 text-slate-500">// Copy this to developer:</p>
                    {JSON.stringify(config, null, 2)}
                </div>
            </div>

            {/* Preview */}
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                <div
                    className="relative overflow-hidden rounded-xl shadow-2xl bg-black"
                    style={{ width: 300, height: 420 }}
                >
                    {/* Base Image */}
                    <div className="absolute inset-0">
                        {currentCardUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={currentCardUrl}
                                alt="Card"
                                className="w-full h-full object-fill"
                            />
                        )}
                    </div>

                    {/* Patch 1 */}
                    <div
                        className="absolute z-10 bg-white/5 border border-cyan-500/30"
                        style={{
                            backdropFilter: `blur(${config.blur}px)`,
                            top: `${config.p1.top}%`,
                            left: `${config.p1.left}%`,
                            width: `${config.p1.width}%`,
                            height: `${config.p1.height}%`
                        }}
                    />

                    {/* Patch 2 */}
                    <div
                        className="absolute z-10 bg-white/5 border border-green-500/30"
                        style={{
                            backdropFilter: `blur(${config.blur}px)`,
                            top: `${config.p2.top}%`,
                            left: `${config.p2.left}%`,
                            width: `${config.p2.width}%`,
                            height: `${config.p2.height}%`
                        }}
                    />
                </div>
            </div>

        </div>
    );
}
