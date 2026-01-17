import Image from 'next/image';

interface VtesIconProps {
    name: string;
    type: 'clan' | 'discipline' | 'type' | 'cost';
    size?: string; // 'sm' | 'md' | 'lg'
    className?: string;
}

export function VtesIcon({ name, type, size = 'md', className = '' }: VtesIconProps) {
    if (!name) return null;

    // Normalizing names for KRCG URL convention
    // Usually lowercase, remove spaces/special chars
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Size mapping
    const pxSize = size === 'sm' ? 16 : size === 'md' ? 24 : 32;

    const getUrl = () => {
        // Special mapping if needed, otherwise default KRCG pattern
        // Note: KRCG icons are often SVGs at https://static.krcg.org/icon/{name}.svg
        // or sometimes inside specific folders. 
        // Docs say: https://static.krcg.org/icon/{name}.svg works for clans/disciplines/types.
        return `https://static.krcg.org/icon/${normalizedName}.svg`;
    };

    return (
        <div className={`relative inline-block ${className}`} style={{ width: pxSize, height: pxSize }}>
            <img
                src={getUrl()}
                alt={name}
                className="w-full h-full object-contain"
                title={name}
            />
        </div>
    );
}
