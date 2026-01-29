'use client';

import { useState, useMemo } from 'react';

export default function CropTestPage() {
  // NEW values from user's export
  const [scale, setScale] = useState(0.710);
  const [aspectRatio, setAspectRatio] = useState(1.540);
  const [offsetXPercent, setOffsetXPercent] = useState(0.2050);
  const [offsetYPercent, setOffsetYPercent] = useState(0.1150);

  // Display dimensions (fixed for this prototype)
  const displayWidth = 320;
  const displayHeight = 315;

  // Calculated values
  const scaledCardWidth = displayWidth / scale;
  const scaledCardHeight = scaledCardWidth * aspectRatio;
  const offsetX = scaledCardWidth * offsetXPercent;
  const offsetY = scaledCardHeight * offsetYPercent;

  // Large pool of library cards to test with
  const allCards = [
    { name: 'Govern the Unaligned', slug: 'governtheunaligned' },
    { name: 'Conditioning', slug: 'conditioning' },
    { name: 'Deflection', slug: 'deflection' },
    { name: 'Blood Doll', slug: 'blooddoll' },
    { name: 'Aire of Elation', slug: 'aireofelation' },
    { name: 'Archon Investigation', slug: 'archoninvestigation' },
    { name: 'Dreams of the Sphinx', slug: 'dreamsofthesphinx' },
    { name: 'Haven Uncovered', slug: 'havenuncovered' },
    { name: 'Villein', slug: 'villein' },
    { name: 'Palla Grande', slug: 'pallagrande' },
    { name: 'Telepathic Misdirection', slug: 'telepathicmisdirection' },
    { name: 'Bonding', slug: 'bonding' },
    { name: 'Freak Drive', slug: 'freakdrive' },
    { name: 'On the Qui Vive', slug: 'onthequivive' },
    { name: 'Vessel', slug: 'vessel' },
    { name: 'Wake with Evening\'s Freshness', slug: 'wakewitheveningsfreshness' },
    { name: 'Second Tradition: Domain', slug: 'secondtraditiondomain' },
    { name: 'Enchant Kindred', slug: 'enchantkindred' },
    { name: 'Obedience', slug: 'obedience' },
    { name: 'Concealed Weapon', slug: 'concealedweapon' },
  ];

  // Show 5 random cards
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('grid');

  // Pick 5 random cards
  const randomCards = useMemo(() => {
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, []);

  const [gridCards, setGridCards] = useState(randomCards);
  const [selectedCard, setSelectedCard] = useState(allCards[0]);

  const shuffleGridCards = () => {
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    setGridCards(shuffled.slice(0, 5));
  };

  const imageUrl = `https://static.krcg.org/card/${selectedCard.slug}.jpg`;

  // Grid preview component
  const CroppedCard = ({ card }: { card: { name: string; slug: string } }) => (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden rounded-xl ring-2 ring-slate-700"
        style={{
          width: displayWidth * 0.5,
          height: displayHeight * 0.5,
          backgroundColor: '#1a1a2e',
        }}
      >
        <img
          src={`https://static.krcg.org/card/${card.slug}.jpg`}
          alt={card.name}
          style={{
            position: 'absolute',
            width: scaledCardWidth * 0.5,
            height: scaledCardHeight * 0.5,
            left: -offsetX * 0.5,
            top: -offsetY * 0.5,
            maxWidth: 'none',
          }}
        />
      </div>
      <p className="text-[10px] mt-1 text-center truncate w-[160px]" style={{ color: 'var(--vtes-text-muted)' }}>
        {card.name}
      </p>
    </div>
  );

  const exportSettings = () => {
    const settings = {
      scale: scale.toFixed(3),
      aspectRatio: aspectRatio.toFixed(3),
      offsetXPercent: offsetXPercent.toFixed(4),
      offsetYPercent: offsetYPercent.toFixed(4),
      // CSS code ready to use
      cssCode: `
const scaledCardWidth = 'calc(clamp(260px, 85vw, 320px) / ${scale.toFixed(3)})';
const scaledCardHeight = 'calc(' + scaledCardWidth + ' * ${aspectRatio.toFixed(3)})';
const offsetX = 'calc(' + scaledCardWidth + ' * ${offsetXPercent.toFixed(4)})';
const offsetY = 'calc(' + scaledCardHeight + ' * ${offsetYPercent.toFixed(4)})';
      `.trim()
    };

    navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    alert('Settings copied to clipboard!\n\n' + settings.cssCode);
  };

  return (
    <div className="min-h-screen p-4" style={{
      background: 'linear-gradient(to bottom, var(--vtes-bg-primary) 0%, var(--vtes-bg-secondary) 100%)',
    }}>
      <h1 className="text-2xl font-bold text-center mb-4" style={{ color: 'var(--vtes-gold)' }}>
        Library Card Crop Tester
      </h1>

      {/* View mode toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            viewMode === 'grid' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          5-Card Grid
        </button>
        <button
          onClick={() => setViewMode('single')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            viewMode === 'single' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          Single Card
        </button>
      </div>

      {/* GRID VIEW - 5 cards */}
      {viewMode === 'grid' && (
        <div className="mb-6">
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {gridCards.map((card) => (
              <CroppedCard key={card.slug} card={card} />
            ))}
          </div>
          <div className="flex justify-center">
            <button
              onClick={shuffleGridCards}
              className="px-4 py-2 rounded-lg font-semibold text-sm"
              style={{
                backgroundColor: 'var(--vtes-burgundy)',
                color: 'var(--vtes-gold)',
              }}
            >
              Shuffle Cards
            </button>
          </div>
        </div>
      )}

      {/* SINGLE VIEW */}
      {viewMode === 'single' && (
        <>
          {/* Card selector */}
          <div className="mb-4">
            <label className="block text-sm mb-2" style={{ color: 'var(--vtes-text-muted)' }}>
              Test Card:
            </label>
            <select
              value={selectedCard.slug}
              onChange={(e) => setSelectedCard(allCards.find(c => c.slug === e.target.value) || allCards[0])}
              className="w-full p-2 rounded bg-slate-800 text-white border border-slate-600"
            >
              {allCards.map(card => (
                <option key={card.slug} value={card.slug}>{card.name}</option>
              ))}
            </select>
          </div>

          {/* Preview area */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Cropped preview (what we show in game) */}
              <div
                className="relative overflow-hidden rounded-xl ring-2 ring-slate-700"
                style={{
                  width: displayWidth,
                  height: displayHeight,
                  backgroundColor: '#1a1a2e',
                }}
              >
                <img
                  src={imageUrl}
                  alt={selectedCard.name}
                  style={{
                    position: 'absolute',
                    width: scaledCardWidth,
                    height: scaledCardHeight,
                    left: -offsetX,
                    top: -offsetY,
                    maxWidth: 'none',
                  }}
                />
              </div>
              <p className="text-center text-xs mt-2" style={{ color: 'var(--vtes-text-muted)' }}>
                Cropped Preview ({displayWidth}x{displayHeight})
              </p>
            </div>
          </div>
        </>
      )}

      {/* Controls */}
      <div className="space-y-4 max-w-md mx-auto">
        {/* Scale */}
        <div>
          <label className="flex justify-between text-sm mb-1" style={{ color: 'var(--vtes-text-muted)' }}>
            <span>Scale (zoom)</span>
            <span className="font-mono">{scale.toFixed(3)}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs" style={{ color: 'var(--vtes-text-dim)' }}>
            Lower = more zoomed in
          </p>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="flex justify-between text-sm mb-1" style={{ color: 'var(--vtes-text-muted)' }}>
            <span>Aspect Ratio</span>
            <span className="font-mono">{aspectRatio.toFixed(3)}</span>
          </label>
          <input
            type="range"
            min="1.0"
            max="2.0"
            step="0.01"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs" style={{ color: 'var(--vtes-text-dim)' }}>
            Height relative to width
          </p>
        </div>

        {/* Offset X */}
        <div>
          <label className="flex justify-between text-sm mb-1" style={{ color: 'var(--vtes-text-muted)' }}>
            <span>Offset X (horizontal)</span>
            <span className="font-mono">{(offsetXPercent * 100).toFixed(1)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="0.4"
            step="0.005"
            value={offsetXPercent}
            onChange={(e) => setOffsetXPercent(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs" style={{ color: 'var(--vtes-text-dim)' }}>
            How much to crop from left
          </p>
        </div>

        {/* Offset Y */}
        <div>
          <label className="flex justify-between text-sm mb-1" style={{ color: 'var(--vtes-text-muted)' }}>
            <span>Offset Y (vertical)</span>
            <span className="font-mono">{(offsetYPercent * 100).toFixed(1)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="0.3"
            step="0.005"
            value={offsetYPercent}
            onChange={(e) => setOffsetYPercent(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs" style={{ color: 'var(--vtes-text-dim)' }}>
            How much to crop from top
          </p>
        </div>

        {/* Export button */}
        <button
          onClick={exportSettings}
          className="w-full py-3 rounded-xl font-bold transition-all duration-200"
          style={{
            backgroundColor: 'var(--vtes-gold)',
            color: 'var(--vtes-bg-primary)',
          }}
        >
          Export Settings
        </button>

        {/* Reset button */}
        <button
          onClick={() => {
            setScale(0.710);
            setAspectRatio(1.540);
            setOffsetXPercent(0.2050);
            setOffsetYPercent(0.1150);
          }}
          className="w-full py-2 rounded-xl font-semibold transition-all duration-200"
          style={{
            backgroundColor: 'var(--vtes-bg-tertiary)',
            color: 'var(--vtes-text-muted)',
            border: '1px solid var(--vtes-burgundy-dark)',
          }}
        >
          Reset to Your Settings
        </button>
      </div>

      {/* Reference: Full card - only in single view */}
      {viewMode === 'single' && (
        <div className="mt-8 text-center">
          <p className="text-sm mb-2" style={{ color: 'var(--vtes-text-muted)' }}>
            Full Card Reference:
          </p>
          <img
            src={imageUrl}
            alt={selectedCard.name}
            className="mx-auto rounded-lg shadow-lg"
            style={{ maxHeight: 300 }}
          />
        </div>
      )}
    </div>
  );
}
