
export const ARCHETYPES = [
    'Stealth & Bleed',
    'Powerbleed',
    'Rush',
    'Swarm',
    'Wall',
    'Lock & Bleed',
    'Vote',
    'Vote & Bleed',
    'Toolbox',
    'Combo',
    'Allies'
] as const;

export type Archetype = typeof ARCHETYPES[number] | 'Unknown';

interface CardData {
    id: number;
    name: string;
    types: string[];
    card_text: string;
    disciplines?: string[];
    clan?: string;
    capacity?: number;
}

// Signature Cards Map for boosting specific archetypes
const SIGNATURE_CARDS: Record<string, Archetype> = {
    'war ghoul': 'Allies',
    'shambling hordes': 'Allies',
    'nephandus': 'Allies',
    'emerald legionnaire': 'Allies',
    'smiling jack, the anarchist': 'Wall',
    'smiling jack': 'Wall',
    'constant revolution': 'Wall',
    "eagle's sight": 'Wall',
    "bum's rush": 'Rush',
    'haven uncovered': 'Rush',
    'computer hacking': 'Swarm',
    'effective management': 'Swarm'
};

export function detectArchetype(cards: { count: number; data: CardData }[]): Archetype {
    let scores: Record<Archetype, number> = {
        'Stealth & Bleed': 0,
        'Powerbleed': 0,
        'Rush': 0,
        'Swarm': 0,
        'Wall': 0,
        'Lock & Bleed': 0,
        'Vote': 0,
        'Vote & Bleed': 0,
        'Toolbox': 0,
        'Combo': 0,
        'Allies': 0,
        'Unknown': 0
    };

    let totalLibrary = 0;
    let totalCrypt = 0;
    let totalCapacity = 0;

    // Counters
    let counts = {
        stealthmod: 0,
        bleedmod: 0,
        combat: 0,
        reaction: 0,
        political: 0,
        votePush: 0,
        unlock: 0,
        allyRecruit: 0,
        enterCombat: 0,
        lockMinion: 0
    };

    // Crypt Stats
    let cryptDominantDisciplines: Record<string, number> = {};
    let cryptTitles = 0;
    let cryptObfDom = 0; // Stats for S&B

    for (const { count, data } of cards) {
        const text = (data.card_text || '').toLowerCase();
        const name = (data.name || '').toLowerCase();
        const types = data.types || [];

        // Check Signature Cards
        if (SIGNATURE_CARDS[name]) {
            scores[SIGNATURE_CARDS[name]] += count * 5; // Heavy weight
        }

        if (types.includes('Vampire') || types.includes('Imbued')) {
            totalCrypt += count;
            totalCapacity += (data.capacity || 0) * count;

            if (data.disciplines) {
                data.disciplines.forEach(d => {
                    cryptDominantDisciplines[d] = (cryptDominantDisciplines[d] || 0) + count;
                    if (d === 'obf' || d === 'dom') cryptObfDom += count;
                });
            }

            if (text.includes('prince') || text.includes('baron') || text.includes('justicar') ||
                text.includes('bishop') || text.includes('archbishop') || text.includes('magaji')) {
                cryptTitles += count;
            }

        } else {
            totalLibrary += count;

            // Keyword Counting
            if (text.includes('stealth')) counts.stealthmod += count;
            if (text.includes('bleed') || text.includes('pool damage')) counts.bleedmod += count;

            if (types.includes('Action Modifier') && (text.includes('vote') || text.includes('referendum'))) counts.votePush += count;

            if (types.includes('Combat')) counts.combat += count;
            if (types.includes('Reaction')) counts.reaction += count;
            if (types.includes('Political Action')) counts.political += count;

            if (text.includes('enter combat') || text.includes('attack') || text.includes('rush')) counts.enterCombat += count;

            // Wall specific
            if (text.includes('wake') || text.includes('forced awakening') || text.includes('on the qui vive') || text.includes('unlock')) counts.unlock += count;

            // Allies
            if (text.includes('recruit ally') || types.includes('Ally')) counts.allyRecruit += count;

            // Lock & Bleed
            if (text.includes('tap') && (text.includes('minion') || text.includes('vampire'))) counts.lockMinion += count;
        }
    }

    const avgCapacity = totalCrypt > 0 ? totalCapacity / totalCrypt : 0;
    const libraryRatio = (val: number) => totalLibrary > 0 ? (val / totalLibrary) : 0;

    // --- HEURISTICS APPLICATION ---

    // 1. Stealth & Bleed
    // >30% Stealth or Bleed modifiers
    // Crypt: Obf/Dom dominance
    if (libraryRatio(counts.stealthmod + counts.bleedmod) > 0.3) {
        scores['Stealth & Bleed'] += 10;
        if (cryptObfDom / totalCrypt > 0.5) scores['Stealth & Bleed'] += 5;
    }

    // 2. Powerbleed
    // High bleed mod, low stealth. "Cannot be blocked" check would go here but relying on bleed mod ratio > 25% w/o high stealth
    if (libraryRatio(counts.bleedmod) > 0.25 && libraryRatio(counts.stealthmod) < 0.1) {
        scores['Powerbleed'] += 15;
    }

    // 3. Swarm
    // Avg Cap < 3.5 OR High Ally recruit
    if (avgCapacity > 0 && avgCapacity < 3.5) scores['Swarm'] += 20;
    if (libraryRatio(counts.allyRecruit) > 0.15) scores['Swarm'] += 5;

    // 4. Rush
    // >40% Combat OR High "Enter Combat"
    if (libraryRatio(counts.combat) > 0.4 || libraryRatio(counts.enterCombat) > 0.15) {
        scores['Rush'] += 15;
    }

    // 5. Wall
    // >40% Reaction. 
    if (libraryRatio(counts.reaction) > 0.30) { // Lowered slightly to 30% to catch mixed walls
        scores['Wall'] += 20;
    }
    if (libraryRatio(counts.reaction) > 0.15 && libraryRatio(counts.unlock) > 0.05) scores['Wall'] += 5;

    // 6. Lock & Bleed
    if (counts.lockMinion > 8) scores['Lock & Bleed'] += 15;

    // 7. Vote
    // >15% Pol Actions + Titles
    if (libraryRatio(counts.political) > 0.15) {
        scores['Vote'] += 15;
        if (cryptTitles > 2) scores['Vote'] += 5;
    }

    // 8. Vote & Bleed
    // Mix of Political (>10%) and Bleed (>10%)
    if (libraryRatio(counts.political) > 0.10 && libraryRatio(counts.bleedmod) > 0.10) {
        scores['Vote & Bleed'] += 18; // Specific combo
    }

    // 9. Allies
    if (libraryRatio(counts.allyRecruit) > 0.20) scores['Allies'] += 15;

    // 10. Toolbox
    // Balanced distribution?
    // 20-30% combat, 15-20% reaction, 15-20% action
    const rCombat = libraryRatio(counts.combat);
    const rReaction = libraryRatio(counts.reaction);

    // If nothing else is high, and stats are "mid", it's toolbox
    if (rCombat > 0.15 && rReaction > 0.10 && avgCapacity > 4 && avgCapacity < 8) {
        scores['Toolbox'] += 10;
    }

    // Winner
    let maxProto: Archetype = 'Unknown';
    let maxVal = 0;

    for (const [key, val] of Object.entries(scores)) {
        if (val > maxVal) {
            maxVal = val;
            maxProto = key as Archetype;
        }
    }

    // Threshold
    if (maxVal < 10) return 'Unknown';

    return maxProto;
}
