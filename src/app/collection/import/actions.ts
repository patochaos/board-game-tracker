'use server';

import { getUserCollection, getUserExpansions, searchGames } from '@/lib/bgg';
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

export interface GameWithExpansions {
    game: BGGCollectionItem;
    expansions: BGGCollectionItem[];
}

// Normalize game name by removing edition info, years, articles, and standardizing separators
function normalizeGameName(name: string): string {
    return name
        .toLowerCase()
        // Normalize unicode dashes to regular hyphen
        .replace(/[\u2013\u2014\u2015]/g, '-')
        // Remove common edition suffixes in parentheses
        .replace(/\s*\([^)]*edition[^)]*\)/gi, '')
        .replace(/\s*\([^)]*anniversary[^)]*\)/gi, '')
        .replace(/\s*\([^)]*revised[^)]*\)/gi, '')
        .replace(/\s*\([^)]*second[^)]*\)/gi, '')
        .replace(/\s*\([^)]*third[^)]*\)/gi, '')
        // Remove year in parentheses like (2020)
        .replace(/\s*\(\d{4}\)/g, '')
        // Remove leading "The" article
        .replace(/^the\s+/i, '')
        // Normalize multiple spaces to single space
        .replace(/\s+/g, ' ')
        .trim();
}

// Extract the base name from a game (part before any separator like ":")
// e.g. "Cosmic Encounter: 42nd Anniversary Edition" -> "Cosmic Encounter"
// e.g. "Cosmic Encounter: Cosmic Alliance" -> "Cosmic Encounter"
function extractBaseName(name: string): string {
    // Normalize unicode dashes first
    const normalized = name.replace(/[\u2013\u2014\u2015]/g, '-');
    // Split on common separators: colon, hyphen with spaces
    const parts = normalized.split(/\s*[:]\s*|\s+[-]\s+/);
    return parts[0].trim();
}

// Check if an expansion name matches a base game
function expansionMatchesGame(expName: string, gameName: string): boolean {
    // Extract the core name from both (part before colon/dash)
    const gameBaseName = normalizeGameName(extractBaseName(gameName));
    const expBaseName = normalizeGameName(extractBaseName(expName));

    // The expansion must:
    // 1. Have the same base name as the game
    // 2. Have something after the separator (be an actual expansion, not the same game)
    if (gameBaseName === expBaseName) {
        // Check that the expansion has content after the base name
        const expHasSuffix = expName.includes(':') || expName.includes(' - ') || expName.includes(' – ');
        const gameHasSuffix = gameName.includes(':') || gameName.includes(' - ') || gameName.includes(' – ');

        // If both have suffixes, they could be the same game - check if suffixes are different
        if (expHasSuffix && gameHasSuffix) {
            // Compare normalized full names - if they're the same, it's the same game not an expansion
            const expFull = normalizeGameName(expName);
            const gameFull = normalizeGameName(gameName);
            return expFull !== gameFull;
        }

        // If only expansion has a suffix, it's an expansion of the base game
        if (expHasSuffix && !gameHasSuffix) {
            return true;
        }

        // If the game has a suffix (like "42nd Anniversary Edition") but expansion doesn't,
        // the expansion might still match if its base equals the game's base
        if (gameHasSuffix && expHasSuffix) {
            return true;
        }
    }

    return false;
}

export async function fetchUserCollection(username: string): Promise<{ success: boolean; data: BGGCollectionItem[]; expansions: BGGCollectionItem[]; grouped: GameWithExpansions[]; error?: string }> {
    console.log('[Import] fetchUserCollection started for:', username);
    try {
        const token = await getBggToken();
        console.log('[Import] Token resolution:', token ? 'Found' : 'Missing', token ? `(Length: ${token.length})` : '');

        if (!token) {
            return { success: false, data: [], expansions: [], grouped: [], error: 'BGG API Token not found. Please add it in Settings.' };
        }

        console.log('[Import] Calling getUserCollection...');
        const [baseGames, expansions] = await Promise.all([
            getUserCollection(username, token),
            getUserExpansions(username, token)
        ]);
        console.log('[Import] getUserCollection returned:', baseGames.length, 'base games and', expansions.length, 'expansions');

        // Group expansions under their base games by name matching
        // Debug: log some examples
        console.log('[Import] Sample base games:', baseGames.slice(0, 5).map(g => g.name));
        console.log('[Import] Sample expansions:', expansions.slice(0, 5).map(e => e.name));

        const grouped: GameWithExpansions[] = baseGames.map(game => {
            const gameExpansions = expansions.filter(exp => {
                const matches = expansionMatchesGame(exp.name, game.name);
                if (exp.name.toLowerCase().includes('cosmic') || exp.name.toLowerCase().includes('quacks')) {
                    console.log(`[Import] Matching "${exp.name}" with "${game.name}" => ${matches}`);
                }
                return matches;
            });
            return { game, expansions: gameExpansions };
        });

        // Find orphan expansions (don't match any base game)
        const matchedExpansionIds = new Set(grouped.flatMap(g => g.expansions.map(e => e.id)));
        const orphanExpansions = expansions.filter(exp => !matchedExpansionIds.has(exp.id));

        // Add orphan expansions as standalone items
        orphanExpansions.forEach(exp => {
            grouped.push({ game: exp, expansions: [] });
        });

        return { success: true, data: baseGames, expansions, grouped };
    } catch (error) {
        console.error('[Import] Failed to fetch collection:', error);
        if (error instanceof Error) {
            console.error('[Import] Error message:', error.message);
            if (error.message === 'Unauthorized') {
                return { success: false, data: [], expansions: [], grouped: [], error: 'Unauthorized: Invalid BGG API Token. Please check Settings.' };
            }
        }
        return { success: false, data: [], expansions: [], grouped: [], error: 'Failed to fetch collection from BGG: ' + (error instanceof Error ? error.message : String(error)) };
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

// Helper to determine game type
function determineGameType(game: BGGCollectionItem): 'standalone' | 'expansion' {
    return game.isExpansion ? 'expansion' : 'standalone';
}
