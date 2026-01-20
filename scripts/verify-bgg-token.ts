
import { XMLParser } from 'fast-xml-parser';

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';
const TOKEN = '84116b89-3590-4e45-932f-75c6e62215d3';
const USERNAME = 'patochaos';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
});

async function verifyTokenAndParse() {
    const url = `${BGG_API_BASE}/collection?username=${USERNAME}&own=1&stats=1&excludesubtype=boardgameexpansion`;

    console.log('TEST_START');
    try {
        const headers = { 'Authorization': `Bearer ${TOKEN}` };
        console.log(`Fetching ${url}...`);
        const res = await fetch(url, { headers });

        console.log(`STATUS: ${res.status}`);
        if (res.status === 200) {
            const xml = await res.text();
            console.log(`XML LENGTH: ${xml.length}`);

            const result = parser.parse(xml);
            console.log('Parsed Result Keys:', Object.keys(result));

            if (result.items && result.items.item) {
                const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
                console.log(`Found ${items.length} items.`);
                if (items.length > 0) {
                    const first = items[0];
                    console.log('First Item Sample:', JSON.stringify(first, null, 2));

                    // Simulate mapping logic
                    const mapped = {
                        id: parseInt(first['@_objectid']),
                        name: first.name?.['#text'] || first.name || 'Unknown',
                        year: first.yearpublished, // Raw value check
                        owned: first.status?.['@_own'] === '1'
                    };
                    console.log('Mapped Sample:', mapped);
                }
            } else {
                console.log('No items found in parsed result.');
                console.log('Result snippet:', JSON.stringify(result).substring(0, 500));
            }

        } else {
            console.log('FAILED request.');
        }
    } catch (err) {
        console.error('ERROR:', err);
    }
    console.log('TEST_END');
}

verifyTokenAndParse();
