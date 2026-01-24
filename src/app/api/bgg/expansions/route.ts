import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@/lib/supabase/server';

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';
const BGG_TOKEN = process.env.BGG_API_TOKEN;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

interface BGGThingItem {
  '@_id': string;
  '@_type': string;
  name: { '@_type': string; '@_value': string }[] | { '@_type': string; '@_value': string };
  yearpublished?: { '@_value': string };
  image?: string;
  thumbnail?: string;
  minplayers?: { '@_value': string };
  maxplayers?: { '@_value': string };
  playingtime?: { '@_value': string };
  statistics?: {
    ratings?: {
      average?: { '@_value': string };
    };
  };
}

// POST: Import a single expansion and link it to base game
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { bggId, baseGameId } = body;

  if (!bggId) {
    return NextResponse.json({ error: 'BGG ID is required' }, { status: 400 });
  }

  if (!BGG_TOKEN) {
    return NextResponse.json({ error: 'BGG API token not configured' }, { status: 500 });
  }

  const url = `${BGG_API_BASE}/thing?id=${bggId}&stats=1`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${BGG_TOKEN}` },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `BGG API error: ${response.status}` },
        { status: response.status }
      );
    }

    const xml = await response.text();
    const result = parser.parse(xml);

    if (!result.items || !result.items.item) {
      return NextResponse.json({ error: 'Expansion not found on BGG' }, { status: 404 });
    }

    const item: BGGThingItem = Array.isArray(result.items.item)
      ? result.items.item[0]
      : result.items.item;

    const names = Array.isArray(item.name) ? item.name : [item.name];
    const primaryName = names.find(n => n['@_type'] === 'primary');
    const name = primaryName?.['@_value'] || names[0]?.['@_value'] || 'Unknown';

    const expansionData = {
      bgg_id: parseInt(item['@_id']),
      name,
      type: 'expansion',
      base_game_id: baseGameId || null,
      year_published: item.yearpublished?.['@_value']
        ? parseInt(item.yearpublished['@_value'])
        : null,
      image_url: item.image || null,
      thumbnail_url: item.thumbnail || null,
      min_players: item.minplayers?.['@_value']
        ? parseInt(item.minplayers['@_value'])
        : null,
      max_players: item.maxplayers?.['@_value']
        ? parseInt(item.maxplayers['@_value'])
        : null,
      playing_time: item.playingtime?.['@_value']
        ? parseInt(item.playingtime['@_value'])
        : null,
      bgg_rating: item.statistics?.ratings?.average?.['@_value']
        ? parseFloat(item.statistics.ratings.average['@_value'])
        : null,
      cached_at: new Date().toISOString(),
    };

    const { data: expansion, error: dbError } = await supabase
      .from('games')
      .upsert(expansionData, { onConflict: 'bgg_id' })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save expansion' }, { status: 500 });
    }

    return NextResponse.json({ expansion });
  } catch (error) {
    console.error('Error importing expansion:', error);
    return NextResponse.json({ error: 'Failed to import expansion' }, { status: 500 });
  }
}

// GET: Get expansions for a base game (from DB)
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const baseGameId = searchParams.get('baseGameId');

  if (!baseGameId) {
    return NextResponse.json({ error: 'Base game ID is required' }, { status: 400 });
  }

  const { data: expansions, error } = await supabase
    .from('games')
    .select('*')
    .eq('base_game_id', baseGameId)
    .eq('type', 'expansion')
    .order('name');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch expansions' }, { status: 500 });
  }

  return NextResponse.json({ expansions: expansions || [] });
}
