'use client';

import { useState, useEffect } from 'react';

interface VampireCard {
  id: number;
  name: string;
  slug: string;
  gender?: string;
}

export default function GenderTaggerPage() {
  const [vampires, setVampires] = useState<VampireCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tagged, setTagged] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the data
    fetch('/vtes_guess_data.json')
      .then(res => res.json())
      .then(data => {
        // Filter crypt cards with gender "?"
        const unknownGender = (data.crypt || []).filter((card: VampireCard) =>
          card.gender === '?'
        );
        setVampires(unknownGender);
        setLoading(false);
      });
  }, []);

  const currentVampire = vampires[currentIndex];

  const handleTag = (gender: 'F' | 'M') => {
    if (!currentVampire) return;

    setTagged(prev => ({
      ...prev,
      [currentVampire.id]: gender
    }));

    // Move to next
    if (currentIndex < vampires.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    if (currentIndex < vampires.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const downloadResults = () => {
    const results = Object.entries(tagged).map(([id, gender]) => {
      const vampire = vampires.find(v => v.id === Number(id));
      return { id: Number(id), name: vampire?.name, gender };
    });

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gender_tags.json';
    a.click();
  };

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  if (vampires.length === 0) {
    return <div className="p-8 text-white">No vampires with unknown gender found!</div>;
  }

  const imageUrl = currentVampire
    ? `/api/vtes/card-image?id=${currentVampire.id}`
    : '';

  return (
    <div className="min-h-screen bg-slate-900 p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-white mb-2">Gender Tagger</h1>

      <div className="text-slate-400 mb-4">
        {currentIndex + 1} / {vampires.length} | Tagged: {Object.keys(tagged).length}
      </div>

      {currentVampire && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-xl text-white font-semibold">{currentVampire.name}</div>

          <img
            src={imageUrl}
            alt={currentVampire.name}
            className="max-w-[300px] rounded-lg shadow-xl"
          />

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => handleTag('F')}
              className="px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white text-xl font-bold rounded-lg"
            >
              F (Female)
            </button>
            <button
              onClick={() => handleTag('M')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-lg"
            >
              M (Male)
            </button>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white rounded"
            >
              ← Prev
            </button>
            <button
              onClick={handleSkip}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded"
            >
              Skip →
            </button>
          </div>

          {tagged[currentVampire.id] && (
            <div className="text-green-400 mt-2">
              Tagged as: {tagged[currentVampire.id]}
            </div>
          )}
        </div>
      )}

      <button
        onClick={downloadResults}
        className="mt-8 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
      >
        Download Results ({Object.keys(tagged).length} tagged)
      </button>

      {/* Quick list of tagged */}
      {Object.keys(tagged).length > 0 && (
        <div className="mt-8 p-4 bg-slate-800 rounded-lg max-w-md w-full">
          <h3 className="text-white font-bold mb-2">Tagged so far:</h3>
          <div className="text-sm text-slate-300 max-h-40 overflow-y-auto">
            {Object.entries(tagged).map(([id, gender]) => {
              const v = vampires.find(vamp => vamp.id === Number(id));
              return (
                <div key={id} className="flex justify-between">
                  <span>{v?.name}</span>
                  <span className={gender === 'F' ? 'text-pink-400' : 'text-blue-400'}>{gender}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
