import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const USERNAME = 'patochaos';
const BGG_API = `https://boardgamegeek.com/xmlapi2/collection?username=${USERNAME}&own=1&stats=1&excludesubtype=boardgameexpansion`;

async function fetchCollection() {
    console.log(`Fetching collection for ${USERNAME}...`);
    // BGG requires a User-Agent usually, or just be polite
    const response = await fetch(BGG_API, {
        headers: {
            'User-Agent': 'GameNightTracker/1.0',
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    // BGG returns 202 if it's processing. We might need to wait/retry.
    if (response.status === 202) {
        console.log('BGG is processing the request. Waiting 3 seconds...');
        await new Promise(r => setTimeout(r, 3000));
        return fetchCollection();
    }

    const text = await response.text();
    return text;
}

function escapeSql(str: string | undefined): string {
    if (!str) return 'NULL';
    // Simple SQL escape for single quotes
    return `'${str.replace(/'/g, "''")}'`;
}

function parseAndGenerate(xml: string) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
    });

    const result = parser.parse(xml);
    const items = result.items?.item;

    if (!items) {
        console.log('No items found or XML invalid.');
        console.log('XML Preview:', xml.substring(0, 200));
        return;
    }

    const games = Array.isArray(items) ? items : [items];
    console.log(`Found ${games.length} games.`);

    let sql = `-- Seed file for user: ${USERNAME}\n`;
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    for (const game of games) {
        const bggId = game['@_objectid'];
        const name = game.name?.['#text'] || game.name;
        const year = game.yearpublished;
        const image = game.image;
        const thumbnail = game.thumbnail;

        // Stats
        const stats = game.stats;
        const minPlayers = stats?.['@_minplayers'] || 'NULL';
        const maxPlayers = stats?.['@_maxplayers'] || 'NULL';
        const playingTime = stats?.['@_playingtime'] || 'NULL';

        // Rating
        const ratingStats = stats?.rating;
        const avgRating = ratingStats?.average?.['@_value'] || 'NULL';

        const insert = `INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating)
VALUES (
  ${bggId},
  ${escapeSql(name)},
  ${year || 'NULL'},
  ${escapeSql(image)},
  ${escapeSql(thumbnail)},
  ${minPlayers},
  ${maxPlayers},
  ${playingTime},
  ${avgRating}
)
ON CONFLICT (bgg_id) DO NOTHING;\n`;

        sql += insert;
    }

    const outputPath = path.join(process.cwd(), 'seed_games.sql');
    fs.writeFileSync(outputPath, sql);
    console.log(`Success! SQL written to: ${outputPath}`);
}

async function main() {
    try {
        const xml = await fetchCollection();
        parseAndGenerate(xml);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
