export const KRCG_API = 'https://api.krcg.org';

export interface VtesCard {
    id: number;
    name: string;
    url: string;
    types: string[]; // ['Vampire'] for Crypt, ['Action', ...] for Library
    clans?: string[];
    disciplines?: string[];
    capacity?: number;
    group?: string;
    sect?: string;
    title?: string;
    text?: string;
    artists?: string[];
    sets?: { [key: string]: any }; // Set info
}

export interface KrcgResponse {
    count: number;
    results: VtesCard[];
}

/**
 * Search for cards using KRCG API
 * Note: KRCG doesn't have a direct "search" endpoint for flexible queries in V3/V4 typically, 
 * usually it is /card_search with body or generic text completion.
 * 
 * Based on docs/common usage:
 * sending a POST to /card_search with filters is robust.
 * 
 * But for simple text search, looking at main site behavior:
 * often getting static index or using completion.
 * 
 * Let's implement a wrapper around `completion` for names and `card/{id}` for details,
 * OR use a known search-like endpoint if available.
 * 
 * Actually, `POST /card_search` is best.
 */
export async function searchKrcg(query: string, filters: any = {}): Promise<VtesCard[]> {
    try {
        // KRCG 'completion' is good for name autocomplete.
        // 'card_search' is for detailed filtering.

        // Simplification: If just a string query, use completion to find IDs/Names then fetch?
        // No, standard search is better.

        // Constructing query for generic text search might be tricky without full docs inspection.
        // Fallback: Use simple name match if complex search fails.

        // We'll mimic a simple text search by querying by name first.
        // Real KRCG usage usually involves POST to /card_search

        // Payload for /card_search:
        // { "name": "...", "type": [...], "clan": [...] }

        const payload: any = {};
        if (query) payload.name = query;
        // Add other filters passed in `filters` object

        // For now, let's just assume we want everything if no query, or match name
        // If the API requires exact match or special implementation, we'll adjust.
        // Testing shows `completion` is easiest for "Search bar".

        if (query.length < 2 && Object.keys(filters).length === 0) return [];

        // If we have specific filters, use the search endpoint
        // POST https://api.krcg.org/card_search
        const res = await fetch(`${KRCG_API}/card_search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, ...filters })
        });

        if (!res.ok) {
            // If 404 or similar, return empty
            return [];
        }

        const ids = await res.json(); // Returns list of IDs usually? Or full objects?
        // KRCG /card_search often returns IDs.

        // If IDs, we need to fetch details. This might be heavy for many results.
        // Limit to top 20.
        const topIds = Array.isArray(ids) ? ids.slice(0, 50) : [];

        if (topIds.length === 0) return [];

        // Fetch details for these IDs in parallel (or is there a bulk?)
        // KRCG usually supports getting individual cards.
        // Optimization: Just show names? No, user wants images/stats.
        // We can fetch details for the top X.

        const details = await Promise.all(topIds.map(async (id: number) => {
            try {
                const r = await fetch(`${KRCG_API}/card/${id}`);
                if (r.ok) return r.json();
            } catch (e) { return null; }
        }));

        return details.filter(c => c !== null);

    } catch (error) {
        console.error('KRCG Search Error:', error);
        return [];
    }
}

/**
 * Fetch multiple cards by ID
 */
export async function getCardsByIds(ids: number[]): Promise<VtesCard[]> {
    if (ids.length === 0) return [];

    // Deduplicate IDs to save requests
    const uniqueIds = Array.from(new Set(ids));

    // Parallel fetch
    // Note: In a production app with huge decks, batching or a different API would be better.
    // KRCG typically responds fast.
    const promises = uniqueIds.map(async (id) => {
        try {
            const res = await fetch(`${KRCG_API}/card/${id}`);
            if (!res.ok) return null;
            return await res.json() as VtesCard;
        } catch (e) {
            console.error(`Failed to fetch card ${id}`, e);
            return null;
        }
    });

    const results = await Promise.all(promises);
    return results.filter((c): c is VtesCard => c !== null);
}
