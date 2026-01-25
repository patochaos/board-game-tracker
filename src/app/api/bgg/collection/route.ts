import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { BGGXMLItem } from '@/types';
import { createClient } from '@/lib/supabase/server';

// BGG now requires authorization tokens (as of 2025)
// Register at: https://boardgamegeek.com/applications
const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

async function getBggToken(): Promise<string | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return process.env.BGG_API_TOKEN || null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('bgg_api_token')
    .eq('id', user.id)
    .single();

  return profile?.bgg_api_token || process.env.BGG_API_TOKEN || null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  const bggToken = await getBggToken();
  if (!bggToken) {
    return NextResponse.json(
      { error: 'BGG API token not configured. Register at boardgamegeek.com/applications' },
      { status: 500 }
    );
  }

  const url = `${BGG_API_BASE}/collection?username=${encodeURIComponent(username)}&own=1&stats=1&excludesubtype=boardgameexpansion`;

  const headers: HeadersInit = {
    'Authorization': `Bearer ${bggToken}`,
  };

  try {
    // BGG often returns 202 (queued) on first request, need to retry
    let attempts = 0;
    const maxAttempts = 5;
    let response: Response;

    do {
      response = await fetch(url, { headers });

      if (response.status === 202) {
        // Request queued, wait and retry
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    } while (response.status === 202 && attempts < maxAttempts);

    if (response.status === 202) {
      return NextResponse.json(
        { error: 'BGG is still processing. Please try again in a few seconds.' },
        { status: 202 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `BGG API error: ${response.status}` },
        { status: response.status }
      );
    }

    const xml = await response.text();
    const result = parser.parse(xml);

    if (!result.items || !result.items.item) {
      return NextResponse.json({ games: [] });
    }

    const items = Array.isArray(result.items.item)
      ? result.items.item
      : [result.items.item];

    const games = items.map((item: BGGXMLItem) => ({
      id: parseInt(item['@_objectid']),
      name: typeof item.name === 'object' ? item.name?.['#text'] : item.name || 'Unknown',
      yearPublished: item.yearpublished ? parseInt(item.yearpublished) : null,
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

    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error fetching BGG collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection from BGG' },
      { status: 500 }
    );
  }
}
