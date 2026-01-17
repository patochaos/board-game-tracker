import { XMLParser } from 'fast-xml-parser';
import type { BGGSearchResult, BGGGameDetails } from '@/types';

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

// Rate limiting helper - BGG requires ~5 seconds between requests
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second minimum

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return fetch(url);
}

export async function searchGames(query: string): Promise<BGGSearchResult[]> {
  if (!query || query.length < 2) return [];
  
  const encodedQuery = encodeURIComponent(query);
  const url = `${BGG_API_BASE}/search?query=${encodedQuery}&type=boardgame`;
  
  try {
    const response = await rateLimitedFetch(url);
    
    if (!response.ok) {
      console.error('BGG API error:', response.status);
      return [];
    }
    
    const xml = await response.text();
    const result = parser.parse(xml);
    
    if (!result.items || !result.items.item) {
      return [];
    }
    
    // Handle single result (not an array)
    const items = Array.isArray(result.items.item) 
      ? result.items.item 
      : [result.items.item];
    
    return items.slice(0, 20).map((item: any) => ({
      id: parseInt(item['@_id']),
      name: item.name?.['@_value'] || item.name || 'Unknown',
      yearPublished: item.yearpublished?.['@_value'] 
        ? parseInt(item.yearpublished['@_value']) 
        : null,
    }));
  } catch (error) {
    console.error('Error searching BGG:', error);
    return [];
  }
}

export async function getGameDetails(bggId: number): Promise<BGGGameDetails | null> {
  const url = `${BGG_API_BASE}/thing?id=${bggId}&stats=1`;
  
  try {
    const response = await rateLimitedFetch(url);
    
    if (!response.ok) {
      console.error('BGG API error:', response.status);
      return null;
    }
    
    const xml = await response.text();
    const result = parser.parse(xml);
    
    if (!result.items || !result.items.item) {
      return null;
    }
    
    const item = Array.isArray(result.items.item) 
      ? result.items.item[0] 
      : result.items.item;
    
    // Get primary name
    const names = Array.isArray(item.name) ? item.name : [item.name];
    const primaryName = names.find((n: any) => n['@_type'] === 'primary');
    const name = primaryName?.['@_value'] || names[0]?.['@_value'] || 'Unknown';
    
    return {
      id: parseInt(item['@_id']),
      name,
      yearPublished: item.yearpublished?.['@_value'] 
        ? parseInt(item.yearpublished['@_value']) 
        : null,
      image: item.image || null,
      thumbnail: item.thumbnail || null,
      minPlayers: item.minplayers?.['@_value'] 
        ? parseInt(item.minplayers['@_value']) 
        : null,
      maxPlayers: item.maxplayers?.['@_value'] 
        ? parseInt(item.maxplayers['@_value']) 
        : null,
      playingTime: item.playingtime?.['@_value'] 
        ? parseInt(item.playingtime['@_value']) 
        : null,
      averageRating: item.statistics?.ratings?.average?.['@_value']
        ? parseFloat(item.statistics.ratings.average['@_value'])
        : null,
      description: item.description || null,
    };
  } catch (error) {
    console.error('Error fetching game details:', error);
    return null;
  }
}

export interface BGGCollectionItem {
  id: number;
  name: string;
  yearPublished: number | null;
  image: string | null;
  thumbnail: string | null;
  numPlays: number;
  owned: boolean;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  rating: number | null;
}

export async function getUserCollection(username: string): Promise<BGGCollectionItem[]> {
  const url = `${BGG_API_BASE}/collection?username=${encodeURIComponent(username)}&own=1&stats=1&excludesubtype=boardgameexpansion`;
  
  try {
    // BGG often returns 202 (queued) on first request, need to retry
    let attempts = 0;
    let response: Response;
    
    do {
      response = await rateLimitedFetch(url);
      
      if (response.status === 202) {
        // Request queued, wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    } while (response.status === 202 && attempts < 5);
    
    if (!response.ok) {
      console.error('BGG API error:', response.status);
      return [];
    }
    
    const xml = await response.text();
    const result = parser.parse(xml);
    
    if (!result.items || !result.items.item) {
      return [];
    }
    
    const items = Array.isArray(result.items.item) 
      ? result.items.item 
      : [result.items.item];
    
    return items.map((item: any) => ({
      id: parseInt(item['@_objectid']),
      name: item.name?.['#text'] || item.name || 'Unknown',
      yearPublished: item.yearpublished 
        ? parseInt(item.yearpublished) 
        : null,
      image: item.image || null,
      thumbnail: item.thumbnail || null,
      numPlays: item.numplays ? parseInt(item.numplays) : 0,
      owned: item.status?.['@_own'] === '1',
      minPlayers: item.stats?.['@_minplayers'] 
        ? parseInt(item.stats['@_minplayers']) 
        : null,
      maxPlayers: item.stats?.['@_maxplayers'] 
        ? parseInt(item.stats['@_maxplayers']) 
        : null,
      playingTime: item.stats?.['@_playingtime'] 
        ? parseInt(item.stats['@_playingtime']) 
        : null,
      rating: item.stats?.rating?.average?.['@_value']
        ? parseFloat(item.stats.rating.average['@_value'])
        : null,
    }));
  } catch (error) {
    console.error('Error fetching BGG collection:', error);
    return [];
  }
}

export async function getHotGames(): Promise<BGGSearchResult[]> {
  const url = `${BGG_API_BASE}/hot?type=boardgame`;
  
  try {
    const response = await rateLimitedFetch(url);
    
    if (!response.ok) {
      console.error('BGG API error:', response.status);
      return [];
    }
    
    const xml = await response.text();
    const result = parser.parse(xml);
    
    if (!result.items || !result.items.item) {
      return [];
    }
    
    const items = Array.isArray(result.items.item) 
      ? result.items.item 
      : [result.items.item];
    
    return items.slice(0, 10).map((item: any) => ({
      id: parseInt(item['@_id']),
      name: item.name?.['@_value'] || 'Unknown',
      yearPublished: item.yearpublished?.['@_value'] 
        ? parseInt(item.yearpublished['@_value']) 
        : null,
    }));
  } catch (error) {
    console.error('Error fetching hot games:', error);
    return [];
  }
}
