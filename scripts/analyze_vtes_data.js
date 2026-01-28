const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'public', 'vtes_guess_data.json');

try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    console.log('--- Metadata ---');
    console.log(JSON.stringify(data.metadata, null, 2));

    function countByDifficulty(cards, label) {
        const counts = {};
        cards.forEach(card => {
            const diff = card.difficulty;
            counts[diff] = (counts[diff] || 0) + 1;
        });
        console.log(`\n--- ${label} by Difficulty ---`);
        Object.keys(counts).sort().forEach(diff => {
            console.log(`Difficulty ${diff}: ${counts[diff]}`);
        });
    }

    function countByType(cards, label) {
        const counts = {};
        cards.forEach(card => {
            // Some cards might have multiple types, but usually primary type is first or relevant?
            // In the JSON viewed earlier: "types": ["Vampire"] or "types": ["Action Modifier"]
            const t = card.types ? card.types[0] : 'Unknown';
            counts[t] = (counts[t] || 0) + 1;
        });
        console.log(`\n--- ${label} by Primary Type ---`);
        Object.keys(counts).sort((a, b) => counts[b] - counts[a]).forEach(type => {
            console.log(`${type}: ${counts[type]}`);
        });
    }

    console.log(`\nTotal Crypt: ${data.crypt.length}`);
    countByDifficulty(data.crypt, 'Crypt');
    countByType(data.crypt, 'Crypt');

    console.log(`\nTotal Library: ${data.library.length}`);
    countByDifficulty(data.library, 'Library');
    countByType(data.library, 'Library');

    const allCards = [...data.crypt, ...data.library];
    console.log(`\nTotal All: ${allCards.length}`);
    countByDifficulty(allCards, 'Total');

} catch (error) {
    console.error('Error reading or parsing data:', error);
}
