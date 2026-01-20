
const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';

async function testBGG() {
    const urls = [
        `${BGG_API_BASE}/thing?id=13`, // Catan - should always work
        `${BGG_API_BASE}/collection?username=patochaos&own=1`
    ];

    for (const url of urls) {
        console.log(`\nFetching: ${url}`);
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            console.log(`Status: ${res.status} ${res.statusText}`);
            if (res.status === 200) {
                const text = await res.text();
                console.log(`Success! Body length: ${text.length}`);
                console.log(text.substring(0, 100));
            } else {
                console.log('Failed.');
            }
        } catch (err) {
            console.error('Fetch failed:', err);
        }
    }
}

testBGG();
