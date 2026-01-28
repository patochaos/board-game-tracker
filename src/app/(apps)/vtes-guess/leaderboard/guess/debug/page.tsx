'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { GuessLeaderboard } from '@/components/vtes/GuessLeaderboard';
import Link from 'next/link';

export default function GuessLeaderboardDebugPage() {
  const [testScore, setTestScore] = useState(100);
  const [testMode, setTestMode] = useState<'normal' | 'ranked'>('ranked');
  const [debugMessage, setDebugMessage] = useState('');
  const [debugSecret, setDebugSecret] = useState('');

  const handleSubmitScore = async () => {
    if (!debugSecret) {
      setDebugMessage('Enter debug secret key first');
      return;
    }
    try {
      const response = await fetch(`/api/vtes/leaderboard?secret=${debugSecret}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: testScore,
          mode: testMode,
          cardsPlayed: Math.floor(Math.random() * 20) + 1,
          cardsCorrect: Math.floor(Math.random() * 20),
          bestStreak: Math.floor(Math.random() * 10),
        }),
      });
      const data = await response.json();
      setDebugMessage(data.error || `Score submitted! Rank: #${data.rank || 'N/A'}`);
    } catch (error) {
      setDebugMessage('Error submitting score');
    }
  };

  const handleClearLeaderboard = async () => {
    if (!debugSecret) {
      setDebugMessage('Enter debug secret key first');
      return;
    }
    try {
      const response = await fetch(`/api/vtes/leaderboard?secret=${debugSecret}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      setDebugMessage(data.error || 'Leaderboard cleared!');
    } catch (error) {
      setDebugMessage('Error clearing leaderboard');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{
            fontFamily: 'var(--vtes-font-display)',
            color: 'var(--vtes-gold)'
          }}>
            Leaderboard Debug Mode
          </h1>
          <Link
            href="/vtes/leaderboard/guess"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: 'var(--vtes-bg-tertiary)',
              color: 'var(--vtes-text-muted)',
              border: '1px solid var(--vtes-burgundy-dark)',
            }}
          >
            ← Back to Normal View
          </Link>
        </div>

        {/* Debug Controls */}
        <div className="p-6 rounded-xl border-2" style={{
          backgroundColor: 'var(--vtes-bg-secondary)',
          borderColor: 'var(--vtes-blood)',
        }}>
          <h2 className="text-xl font-bold mb-4" style={{
            fontFamily: 'var(--vtes-font-display)',
            color: 'var(--vtes-text-primary)'
          }}>
            Debug Controls
          </h2>

          <div className="space-y-4">
            {/* Submit Test Score */}
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--vtes-text-muted)' }}>
                  Score
                </label>
                <input
                  type="number"
                  value={testScore}
                  onChange={(e) => setTestScore(parseInt(e.target.value) || 0)}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--vtes-bg-tertiary)',
                    color: 'var(--vtes-text-primary)',
                    border: '1px solid var(--vtes-burgundy-dark)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--vtes-text-muted)' }}>
                  Mode
                </label>
                <select
                  value={testMode}
                  onChange={(e) => setTestMode(e.target.value as 'normal' | 'ranked')}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--vtes-bg-tertiary)',
                    color: 'var(--vtes-text-primary)',
                    border: '1px solid var(--vtes-burgundy-dark)',
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="ranked">Ranked</option>
                </select>
              </div>
              <button
                onClick={handleSubmitScore}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: 'var(--vtes-gold)',
                  color: 'var(--vtes-bg-primary)',
                  border: '2px solid var(--vtes-gold)',
                }}
              >
                Submit Test Score
              </button>
            </div>

            <hr style={{ borderColor: 'var(--vtes-burgundy-dark)' }} />

            {/* Clear Leaderboard */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm mb-1" style={{ color: 'var(--vtes-text-muted)' }}>
                  Debug Secret Key
                </label>
                <input
                  type="text"
                  value={debugSecret}
                  onChange={(e) => setDebugSecret(e.target.value)}
                  placeholder="Enter secret key"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--vtes-bg-tertiary)',
                    color: 'var(--vtes-text-primary)',
                    border: '1px solid var(--vtes-burgundy-dark)',
                  }}
                />
              </div>
              <button
                onClick={handleClearLeaderboard}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: 'var(--vtes-blood)',
                  color: 'var(--vtes-text-primary)',
                  border: '2px solid var(--vtes-blood)',
                }}
              >
                Clear All Leaderboard Data
              </button>
            </div>

            {/* Debug Message */}
            {debugMessage && (
              <div className="p-3 rounded-lg text-sm" style={{
                backgroundColor: 'var(--vtes-bg-tertiary)',
                color: debugMessage.includes('Error') ? '#ef4444' : 'var(--vtes-gold)',
              }}>
                {debugMessage}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div>
          <h2 className="text-xl font-bold mb-4" style={{
            fontFamily: 'var(--vtes-font-display)',
            color: 'var(--vtes-text-primary)'
          }}>
            Live Leaderboard Preview
          </h2>
          <GuessLeaderboard />
        </div>
      </div>
    </AppLayout>
  );
}
