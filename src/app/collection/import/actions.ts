'use server';

import { getUserCollection, searchGames } from '@/lib/bgg';
import type { BGGCollectionItem, BGGSearchResult } from '@/types';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

async function getBggToken() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('bgg_api_token')
        .eq('id', user.id)
        .single();

    // Fallback to environment variable if no user profile/token
    return profile?.bgg_api_token || process.env.BGG_API_TOKEN || null;
}

export async function fetchUserCollection(username: string): Promise<{ success: boolean; data: BGGCollectionItem[]; error?: string }> {
    console.log('[Import] fetchUserCollection started for:', username);
    try {
        const token = await getBggToken();
        console.log('[Import] Token resolution:', token ? 'Found' : 'Missing', token ? `(Length: ${token.length})` : '');

        if (!token) {
            return { success: false, data: [], error: 'BGG API Token not found. Please add it in Settings.' };
        }

        console.log('[Import] Calling getUserCollection...');
        const data = await getUserCollection(username, token);
        console.log('[Import] getUserCollection returned:', data.length, 'items');
        return { success: true, data };
    } catch (error) {
        console.error('[Import] Failed to fetch collection:', error);
        if (error instanceof Error) {
            console.error('[Import] Error message:', error.message);
            if (error.message === 'Unauthorized') {
                return { success: false, data: [], error: 'Unauthorized: Invalid BGG API Token. Please check Settings.' };
            }
        }
        return { success: false, data: [], error: 'Failed to fetch collection from BGG: ' + (error instanceof Error ? error.message : String(error)) };
    }
}

export async function searchBGGGames(query: string): Promise<{ success: boolean; data: BGGSearchResult[]; error?: string }> {
    try {
        const token = await getBggToken();
        // For search, we might technically allow without token if BGG permitted, but docs say ALL requests.
        // So we'll require it.
        if (!token) {
            return { success: false, data: [], error: 'BGG API Token not found. Please add it in Settings.' };
        }

        const data = await searchGames(query, token);
        return { success: true, data };
    } catch (error) {
        console.error('Failed to search games:', error);
        if (error instanceof Error && error.message === 'Unauthorized') {
            return { success: false, data: [], error: 'Unauthorized: Invalid BGG API Token.' };
        }
        return { success: false, data: [], error: 'Failed to search games on BGG' };
    }
}

export async function importGames(games: BGGCollectionItem[]): Promise<{ success: boolean; count: number; error?: string }> {
    const supabase = await createClient();
    console.log(`[Import] Starting import for ${games.length} games`);

    try {
        const gamesToUpsert = games.map(game => ({
            bgg_id: game.id,
            name: game.name,
            year_published: game.yearPublished,
            image_url: game.image,
            thumbnail_url: game.thumbnail,
            min_players: game.minPlayers,
            max_players: game.maxPlayers,
            playing_time: game.playingTime,
            bgg_rating: game.rating,
            type: determineGameType(game)
        }));

        const { error, count } = await supabase
            .from('games')
            .upsert(gamesToUpsert, {
                onConflict: 'bgg_id',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('[Import] Database upsert failed:', error);
            throw new Error(error.message);
        }

        console.log(`[Import] Successfully upserted games`);
        return { success: true, count: games.length };
    } catch (error) {
        console.error('[Import] Import failed:', error);
        return { success: false, count: 0, error: 'Failed to save games to database' };
    }
}

// Helper to determine game type (heuristic)
function determineGameType(game: BGGCollectionItem): 'standalone' | 'expansion' {
    // Just a basic heuristic. Ideally we'd check 'subtype' from BGG if we asked for it, 
    // but the collection fetch filtered out expansions unless we specifically asked.
    // However, user might want to import things that are technically expansions but act as games.
    // For now, default to standalone as we filtered `excludesubtype=boardgameexpansion` in the fetch.
    return 'standalone';
}
