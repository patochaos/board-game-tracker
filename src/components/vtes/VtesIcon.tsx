import { useState } from 'react';

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
    'abo': 'abomination', // Just in case
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
    'setite': 'followerset', // Legacy
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
    'avenge': 'avenger', // Imbued
    'defend': 'defender',
    'innoc': 'innocent',
    'judge': 'judge',
    'martyr': 'martyr',
    'rdeem': 'redeemer',
    'visio': 'visionary',

    // Disciplines (Full name to Trigram if needed)
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
    // V5 / New
    'blood sorcery': 'tha', // Mapping to Thaumaturgy icon
    'oblivion': 'obt',      // Mapping to Obtenebration icon (or obl?) KRCG might have obl.
    'thin-blood alchemy': 'tba',
};

export function VtesIcon({ name, type, size = 'md', className = '' }: VtesIconProps) {
    const [error, setError] = useState(false);

    if (!name) return null;


    const lowerName = name.toLowerCase().trim();
    let filename = NAME_MAP[lowerName] || lowerName.replace(/[^a-z0-9]/g, ''); // Default strip special chars

    // Logic to determine URL
    let url = '';
    const baseUrl = 'https://static.krcg.org/svg';

    if (type === 'discipline') {
        // Superior check: If input was uppercase ("DOM"), it's superior.
        const isSuperior = name === name.toUpperCase() && /[A-Z]/.test(name);
        const folder = isSuperior ? 'sup' : 'inf';

        // Handle mappings
        // If code is "obl", it might need to be "obt" depending on KRCG version, 
        // but let's assume standard codes.
        // Explicitly handle "Blood Sorcery" -> "tha" if not mapped by NAME_MAP
        if (lowerName === 'blood sorcery') filename = 'tha';
        if (lowerName === 'oblivion') filename = 'obl';

        // Map known 3-letter codes if needed? usually they match.

        url = `${baseUrl}/disc/${folder}/${filename}.svg`;

    } else if (type === 'clan') {
        url = `${baseUrl}/clan/${filename}.svg`;
    } else if (type === 'type') {
        url = `${baseUrl}/type/${filename}.svg`;
    } else {
        url = `${baseUrl}/icon/${filename}.svg`;
    }

    const pxSize = size === 'sm' ? 16 : size === 'md' ? 24 : 32;

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

    return (
        <div
            className={`relative inline-block select-none ${className}`}
            style={{ width: pxSize, height: pxSize }}
            title={name}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt={name}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-contain drop-shadow-sm ${type === 'discipline' || type === 'clan' ? 'invert' : ''}`}
                onError={() => setError(true)}
            />
        </div>
    );
}
