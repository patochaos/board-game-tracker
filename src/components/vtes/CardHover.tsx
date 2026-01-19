"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface CardHoverProps {
    card: {
        url?: string;
        name: string;
    };
    children: React.ReactNode;
}

export default function CardHover({ card, children }: CardHoverProps) {
    const [isHovering, setIsHovering] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Constants for card dimensions
    const CARD_WIDTH = 300; // Slightly smaller to be safe
    const CARD_HEIGHT = 420;
    const OFFSET = 20;

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
        if (!isHovering) setIsHovering(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    // Calculate position style
    const getPositionStyle = () => {
        if (typeof window === 'undefined') return {};

        let left = mousePos.x + OFFSET;
        let top = mousePos.y - (CARD_HEIGHT / 4); // Start centered-ish

        // Flip to left if no space on right
        if (left + CARD_WIDTH > window.innerWidth - OFFSET) {
            left = mousePos.x - CARD_WIDTH - OFFSET;
        }

        // Adjust vertical to keep in view
        if (top + CARD_HEIGHT > window.innerHeight - OFFSET) {
            top = window.innerHeight - CARD_HEIGHT - OFFSET;
        }
        if (top < OFFSET) {
            top = OFFSET;
        }

        return {
            left: `${left}px`,
            top: `${top}px`
        };
    };

    if (!card.url) return <>{children}</>;

    return (
        <>
            <span
                className="text-blue-400 hover:text-blue-300 cursor-help inline-block w-full"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={() => setIsHovering(true)}
            >
                {children}
            </span>

            {/* Portal-like behavior via Fixed positioning */}
            {isHovering && (
                <div
                    ref={imageContainerRef}
                    className="fixed z-[9999] pointer-events-none transition-opacity duration-75"
                    style={{
                        ...getPositionStyle(),
                        width: CARD_WIDTH,
                        height: CARD_HEIGHT
                    }}
                >
                    <Image
                        src={card.url}
                        alt={card.name}
                        fill
                        sizes="300px"
                        className="object-contain rounded-xl shadow-2xl border-4 border-slate-900 bg-black"
                        unoptimized={false}
                        priority // Load fast on hover
                    />
                </div>
            )}
        </>
    );
}
