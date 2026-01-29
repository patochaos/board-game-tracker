/* eslint-disable @next/next/no-img-element */
import { useMemo } from 'react';

interface MaskedCardProps {
    imageUrl: string;
    name: string;
    isCrypt: boolean; // Only use composite mask for Crypt cards
    isRevealed: boolean;
    className?: string;
}

export function MaskedCard({ imageUrl, name, isCrypt, isRevealed, className = '' }: MaskedCardProps) {

    // If revealed or not a crypt card (for now), show normal image
    // Note: Library cards might need their own mask later, but user specified Crypt.
    if (isRevealed || !isCrypt) {
        return (
            <img
                src={imageUrl}
                alt={name}
                className={`w-full h-full object-contain rounded-xl shadow-2xl select-none ${className}`}
                draggable={false}
            />
        );
    }

    return (
        <div className={`relative w-full h-full overflow-hidden rounded-xl shadow-2xl bg-black ${className}`}>

            {/* Base Image (Sharp) */}
            <div className="absolute inset-0">
                <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-fill select-none"
                    draggable={false}
                />
            </div>

            {/* Patch 1: Name Bar (Top) */}
            <div
                className="absolute z-10 backdrop-blur-[12px] bg-white/5"
                style={{
                    top: '0%',
                    left: '0%',
                    width: '100%',
                    height: '13%'
                }}
            />

            {/* Patch 2: Text Box (Bottom) */}
            <div
                className="absolute z-10 backdrop-blur-[12px] bg-white/5"
                style={{
                    top: '76%',
                    left: '18%',
                    width: '82%',
                    height: '24%'
                }}
            />
        </div>
    );
}
