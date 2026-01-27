import { useState } from 'react';
import Image from 'next/image';

interface VtesIconProps {
    name: string;
    type: 'clan' | 'discipline' | 'type' | 'cost';
    size?: string; // 'sm' | 'md' | 'lg'
    className?: string;
}

// Map complex names to KRCG filename parts
const NAME_MAP: Record<string, string> = {
    // Types
    'political action': 'political',
    'action modifier': 'modifier',
    'reaction': 'reaction',
    'combat': 'combat',
    'ally': 'ally',
    'retainer': 'retainer',
    'equipment': 'equipment',
    'master': 'master',
    'event': 'event',
    'imbued': 'imbued',
    'vampire': 'vampire',
    'conviction': 'conviction',
    'power': 'power',

    // Clans (Special cases & Trigrams)
    'banu haqim': 'banuhaqim',
    'daughter of cacophony': 'daughterofcacophony',
    'kiasyd': 'kiasyd',
    'nagne': 'nagaraja',
    'samedi': 'samedi',
    'spirit of the fray': 'spiritofthefray',

    // Standard Clans - Trigram mapping
    'abo': 'abomination',
    'ahrimane': 'ahrimane',
    'ahr': 'ahrimane',
    'akunanse': 'akunanse',
    'aku': 'akunanse',
    'assamite': 'assamite',
    'ass': 'assamite',
    'baali': 'baali',
    'baa': 'baali',
    'blood brother': 'bloodbrother',
    'blo': 'bloodbrother',
    'brujah': 'brujah',
    'bru': 'brujah',
    'brujah antitribu': 'brujahantitribu',
    'br!': 'brujahantitribu',
    'caitiff': 'caitiff',
    'cai': 'caitiff',
    'daughter': 'daughterofcacophony',
    'dau': 'daughterofcacophony',
    'follower': 'followerset',
    'fos': 'followerset',
    'gangrel': 'gangrel',
    'gan': 'gangrel',
    'gangrel antitribu': 'gangrelantitribu',
    'ga!': 'gangrelantitribu',
    'gargoyle': 'gargoyle',
    'gar': 'gargoyle',
    'giovanni': 'giovanni',
    'gio': 'giovanni',
    'guruhi': 'guruhi',
    'gur': 'guruhi',
    'harbinger': 'harbingerofskulls',
    'hos': 'harbingerofskulls',
    'ishtarri': 'ishtarri',
    'ish': 'ishtarri',
    'lasombra': 'lasombra',
    'las': 'lasombra',
    'malkavian': 'malkavian',
    'mal': 'malkavian',
    'malkavian antitribu': 'malkavianantitribu',
    'ma!': 'malkavianantitribu',
    'nagaraja': 'nagaraja',
    'nag': 'nagaraja',
    'nosferatu': 'nosferatu',
    'nos': 'nosferatu',
    'nosferatu antitribu': 'nosferatuantitribu',
    'no!': 'nosferatuantitribu',
    'osebo': 'osebo',
    'ose': 'osebo',
    'pander': 'pander',
    'pan': 'pander',
    'ravnos': 'ravnos',
    'rav': 'ravnos',
    'salubri': 'salubri',
    'sal': 'salubri',
    'salubri antitribu': 'salubriantitribu',
    'sa!': 'salubriantitribu',
    'setite': 'followerset',
    'toreador': 'toreador',
    'tor': 'toreador',
    'toreador antitribu': 'toreadorantitribu',
    'to!': 'toreadorantitribu',
    'tremere': 'tremere',
    'tre': 'tremere',
    'tremere antitribu': 'tremereantitribu',
    'tr!': 'tremereantitribu',
    'true brujah': 'truebrujah',
    'tbr': 'truebrujah',
    'tzimisce': 'tzimisce',
    'tzi': 'tzimisce',
    'ventrue': 'ventrue',
    'ven': 'ventrue',
    'ventrue antitribu': 'ventrueantitribu',
    've!': 'ventrueantitribu',
    'avenge': 'avenger',
    'defend': 'defender',
    'innoc': 'innocent',
    'judge': 'judge',
    'martyr': 'martyr',
    'rdeem': 'redeemer',
    'visio': 'visionary',

    // Disciplines
    'abombwe': 'abo',
    'animalism': 'ani',
    'auspex': 'aus',
    'celerity': 'cel',
    'chimerstry': 'chi',
    'daimoinon': 'dai',
    'dominate': 'dom',
    'fortitude': 'for',
    'melpominee': 'mel',
    'mytherceria': 'myt',
    'necromancy': 'nec',
    'obfuscate': 'obf',
    'obtenebration': 'obt',
    'potence': 'pot',
    'presence': 'pre',
    'protean': 'pro',
    'quietus': 'qui',
    'sanguinus': 'san',
    'serpentis': 'ser',
    'spiritus': 'spi',
    'temporis': 'tem',
    'thanatosis': 'thn',
    'thaumaturgy': 'tha',
    'valeren': 'val',
    'vicissitude': 'vic',
    'visceratika': 'vis',
    'dementation': 'dem',
    'blood sorcery': 'tha',
    'oblivion': 'obt',
    'thin-blood alchemy': 'tba',

    // Cost Icons
    'blood': 'blood',
    'pool': 'pool',
};

// Update size mapping
const sizeMap = {
    xs: 16,
    sm: 22,
    md: 28,
    lg: 36,
};

export function VtesIcon({ name, type, size = 'md', className = '' }: VtesIconProps) {
    const [error, setError] = useState(false);

    if (!name) return null;

    const lowerName = name.toLowerCase().trim();
    let filename = NAME_MAP[lowerName] || lowerName.replace(/[^a-z0-9]/g, '');

    // Logic to determine URL
    let url = '';
    const svgBaseUrl = 'https://static.krcg.org/svg';
    const webpBaseUrl = 'https://static.krcg.org/webp_wb';

    if (type === 'discipline') {
        // Superior check
        const isSuperior = name === name.toUpperCase() && /[A-Z]/.test(name);
        const folder = isSuperior ? 'sup' : 'inf';

        if (lowerName === 'blood sorcery') filename = 'tha';
        if (lowerName === 'oblivion') filename = 'obl';

        url = `${webpBaseUrl}/disc/${folder}/${filename}.webp`;

    } else if (type === 'clan') {
        url = `${webpBaseUrl}/clan/${filename}.webp`;
    } else if (type === 'cost') {
        // Use SVG for cost icons
        url = `${svgBaseUrl}/icon/${filename}.svg`;
    } else {
        // Types/Other icons
        url = `${webpBaseUrl}/icon/${filename}.webp`;
    }

    const pxSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.md;

    if (error) {
        return (
            <span
                className={`inline-flex items-center justify-center font-mono text-[10px] uppercase text-slate-500 bg-slate-800 rounded border border-slate-700 ${className}`}
                style={{ width: pxSize, height: pxSize }}
                title={name}
            >
                {name.substring(0, 3)}
            </span>
        );
    }

    const isColoredType = type === 'discipline' || type === 'clan';
    const filterClass = isColoredType
        ? 'drop-shadow-[1px_1px_1px_rgba(0,0,0,0.5)] dark:brightness-90'
        : '';

    return (
        <div
            className={`relative inline-block select-none ${className}`}
            style={{ width: pxSize, height: pxSize }}
            title={name}
        >
            <Image
                src={url}
                alt={name}
                width={pxSize}
                height={pxSize}
                className={`object-contain ${filterClass}`}
                onError={() => setError(true)}
                unoptimized={false}
            />
        </div>
    );
}
