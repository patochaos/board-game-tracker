'use client';

import { memo } from 'react';
import { Droplet } from 'lucide-react';
import { VtesIcon } from '@/components/vtes/VtesIcon';
import type { GameCardDetails } from '@/lib/vtes/guess-game';

interface CardAttributesStripProps {
  cardDetails: GameCardDetails | null;
  isCrypt: boolean;
  cardTypes: string[];
}

function CardAttributesStrip({ cardDetails, isCrypt, cardTypes }: CardAttributesStripProps) {
  return (
    <div className="flex justify-center mt-1 flex-shrink-0">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm" style={{
        backgroundColor: 'var(--vtes-bg-tertiary)',
        border: '1px solid var(--vtes-burgundy-dark)'
      }}>
        {!isCrypt ? (
          <>
            {/* Cost icons */}
            {(cardDetails?.bloodCost || cardDetails?.poolCost || cardDetails?.convictionCost) && (
              <div className="flex items-center gap-1.5">
                {cardDetails.bloodCost && (
                  <div className="flex items-center gap-0.5 bg-red-950/40 px-1 py-0.5 rounded border border-red-900/50">
                    <Droplet className="w-3 h-3 fill-red-500 text-red-500" />
                    <span className="text-xs font-bold text-white">{cardDetails.bloodCost}</span>
                  </div>
                )}
                {cardDetails.poolCost && (
                  <div className="flex items-center gap-0.5 bg-slate-700/40 px-1 py-0.5 rounded border border-slate-600/50">
                    <div className="w-2.5 h-2.5 bg-white rotate-45" />
                    <span className="text-xs font-bold text-white ml-0.5">{cardDetails.poolCost}</span>
                  </div>
                )}
                {cardDetails.convictionCost && (
                  <div className="flex items-center gap-0.5">
                    <VtesIcon name="conviction" type="cost" size="sm" />
                    <span className="text-xs font-bold text-white">{cardDetails.convictionCost}</span>
                  </div>
                )}
                <span className="text-slate-600 text-sm">/</span>
              </div>
            )}
            
            {/* Clan and Disciplines */}
            {((cardDetails?.clan && !isCrypt) || (cardDetails?.disciplines && cardDetails.disciplines.length > 0)) && (
              <div className="flex items-center gap-1">
                {cardDetails?.clan && <VtesIcon name={cardDetails.clan} type="clan" size="sm" />}
                {cardDetails?.disciplines?.map(d => (
                  <VtesIcon key={d} name={d} type="discipline" size="sm" />
                ))}
                <span className="text-slate-600 text-sm mx-1">/</span>
              </div>
            )}
            
            {/* Card Type with Icons */}
            <div className="flex items-center gap-1">
              {cardTypes.map((type, i) => (
                <span key={type} className="flex items-center gap-1">
                  {i > 0 && <span className="text-slate-500">/</span>}
                  {type.toLowerCase() !== 'master' && (
                    <VtesIcon name={type} type="type" size="sm" />
                  )}
                  <span className="text-xs font-semibold tracking-wider capitalize" style={{
                    color: 'var(--vtes-gold)',
                    fontFamily: 'var(--vtes-font-display)'
                  }}>
                    {type}
                  </span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider capitalize" style={{
              color: 'var(--vtes-gold)',
              fontFamily: 'var(--vtes-font-display)'
            }}>
              {cardTypes.join(' / ')}
            </span>
            {(cardDetails?.sect || cardDetails?.title) && (
              <>
                <span style={{ color: 'var(--vtes-burgundy)' }}>•</span>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--vtes-text-muted)' }}>
                  {cardDetails.sect && <span className="uppercase tracking-wider">{cardDetails.sect}</span>}
                  {cardDetails.sect && cardDetails.title && <span style={{ color: 'var(--vtes-burgundy)' }}>•</span>}
                  {cardDetails.title && <span className="uppercase tracking-wider">{cardDetails.title}</span>}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(CardAttributesStrip);
