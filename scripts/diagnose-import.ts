
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

// Mimic the logic from src/lib/bgg.ts
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
});

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';

// Helper to load env
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["'](.*)["']$/, '$1');
});

const TOKEN = env.BGG_API_TOKEN;
const USERNAME = 'patochaos';

console.log('--- DIAGNOSTIC START ---');
console.log(`Token present: ${!!TOKEN}`);
console.log(`Username: ${USERNAME}`);

async function run() {
    if (!TOKEN) {
        console.error('FAIL: No BGG_API_TOKEN found in .env.local');
        return;
    }

    const url = `${BGG_API_BASE}/collection?username=${encodeURIComponent(USERNAME)}&own=1&stats=1&excludesubtype=boardgameexpansion`;
    console.log(`URL: ${url}`);

    try {
        const headers = { 'Authorization': `Bearer ${TOKEN}` };
        console.log('Fetching...');
        const response = await fetch(url, { headers });
        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.error('FAIL: API response not OK');
            const text = await response.text();
            console.error('Body:', text.substring(0, 500));
            return;
        }

        const xml = await response.text();
        console.log(`XML received (${xml.length} bytes)`);

        // Log XML snippet to verify structure
        console.log('XML Snippet:', xml.substring(0, 500));

        console.log('Parsing...');
        const result = parser.parse(xml);

        if (!result.items || !result.items.item) {
            console.error('FAIL: structure validation. keys found:', Object.keys(result));
            // Check if it's the "queued" 202 response but hidden in 200 OK? (Unlikely for XMLAPI2, but possible)
            // Or maybe "message" field?
            console.log('Full result:', JSON.stringify(result, null, 2).substring(0, 500));
            return;
        }

        const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
        console.log(`PASS: Found ${items.length} items`);

        if (items.length > 0) {
            const first = items[0];
            console.log('First item sample:', JSON.stringify(first, null, 2));

            // Validate property access
            const id = parseInt(first['@_objectid']);
            const name = first.name?.['#text'] || first.name || 'Unknown';
            const owned = first.status?.['@_own'] === '1';

            console.log(`Mapped: ID=${id}, Name="${name}", Owned=${owned}`);
        }

    } catch (e) {
        console.error('FAIL: Exception', e);
    }
}

run();
