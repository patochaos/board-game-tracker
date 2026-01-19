import { VtesCard } from "@/lib/krcg";

interface DeckCardEntry {
    quantity: number;
    card: VtesCard;
}

export function autoTagDeck(cards: DeckCardEntry[]): string[] {
    const tags = new Set<string>();

    let totalLibrary = 0;
    let totalCrypt = 0;

    let combatCount = 0;
    let bleedCount = 0;
    let politicalCount = 0;
    let reactionCount = 0; // Intercept/Block
    let allyCount = 0;
    let equipmentCount = 0;
    let stealthCount = 0;

    // Discipline Counters
    let domCount = 0;
    let preCount = 0;
    let ausCount = 0;
    let celCount = 0;
    let potCount = 0;
    let proCount = 0;

    cards.forEach(({ quantity, card }) => {
        const isCrypt = card.types.includes('Vampire') || card.types.includes('Imbued');

        // Discipline Counting
        if (card.disciplines) {
            card.disciplines.forEach(d => {
                const disc = d.toLowerCase();
                if (disc === 'dom') domCount += quantity;
                if (disc === 'pre') preCount += quantity;
                if (disc === 'aus') ausCount += quantity;
                if (disc === 'cel') celCount += quantity;
                if (disc === 'pot') potCount += quantity;
                if (disc === 'pro') proCount += quantity;
            });
        }

        if (isCrypt) {
            totalCrypt += quantity;
            // Crypt analysis if needed (e.g. Titles)
            if (card.title && card.title.length > 0) {
                // Titles contribute to Vote potential
                politicalCount += quantity * 0.5; // Weight titles less than votes
            }
        } else {
            // Library Analysis
            totalLibrary += quantity;

            const types = card.types || [];
            const text = (card.text || '').toLowerCase();
            const name = (card.name || '').toLowerCase();

            // Combat
            if (types.includes('Combat') || text.includes('enter combat') || text.includes('additional strike')) {
                combatCount += quantity;
            }

            // Bleed / Stealth
            if (types.includes('Action Modifier')) {
                if (text.includes('bleed') || text.includes('stealth')) {
                    bleedCount += quantity;
                }
                if (text.includes('stealth')) {
                    stealthCount += quantity;
                }
            }
            if (text.includes('+1 bleed') || text.includes('bleed at +')) {
                bleedCount += quantity;
            }

            // Vote
            if (types.includes('Political Action')) {
                politicalCount += quantity;
            }

            // Block / Intercept
            if (types.includes('Reaction')) {
                reactionCount += quantity;
            }
            if (text.includes('intercept') || text.includes('block')) {
                reactionCount += quantity;
            }

            // Ally
            if (types.includes('Ally')) {
                allyCount += quantity;
            }

            // Equipment
            if (types.includes('Equipment')) {
                equipmentCount += quantity;
            }
        }
    });

    if (totalLibrary === 0) return [];

    // Heuristics
    const libRatio = (count: number) => count / totalLibrary;

    // BLEED
    if (libRatio(bleedCount) > 0.15 || (domCount > 10 || preCount > 10)) {
        if (stealthCount > 5) tags.add('Stealth Bleed');
        else tags.add('Bleed');
    }

    // COMBAT
    if (libRatio(combatCount) > 0.20 || (potCount > 10 || celCount > 10 || proCount > 10)) {
        tags.add('Combat');
    }

    // VOTE
    if (libRatio(politicalCount) > 0.15) {
        tags.add('Vote');
    }

    // BLOCK / WALL
    if (libRatio(reactionCount) > 0.20 || ausCount > 10) {
        tags.add('Block');
        if (ausCount > 15) tags.add('Wall');
    }

    // ALLY
    if (libRatio(allyCount) > 0.10) {
        tags.add('Ally');
    }

    // EQUIPMENT
    if (libRatio(equipmentCount) > 0.10) {
        tags.add('Equipment');
    }

    return Array.from(tags).sort();
}
