import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@/lib/supabase/server';

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

interface BGGLink {
  '@_type': string;
  '@_id': string;
  '@_value': string;
}

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
  link?: BGGLink[] | BGGLink;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { bggId } = body;

  if (!bggId) {
    return NextResponse.json(
      { error: 'BGG ID is required' },
      { status: 400 }
    );
  }

  // Get BGG token from user profile or env var
  const { data: profile } = await supabase
    .from('profiles')
    .select('bgg_api_token')
    .eq('id', user.id)
    .single();

  const bggToken = profile?.bgg_api_token || process.env.BGG_API_TOKEN;

  if (!bggToken) {
    return NextResponse.json(
      { error: 'BGG API token not configured' },
      { status: 500 }
    );
  }

  const url = `${BGG_API_BASE}/thing?id=${bggId}&stats=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bggToken}`,
      },
    });

    if (response.status === 401) {
      return NextResponse.json(
        { error: 'BGG API authorization failed' },
        { status: 401 }
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
      return NextResponse.json(
        { error: 'Game not found on BGG' },
        { status: 404 }
      );
    }

    const item: BGGThingItem = Array.isArray(result.items.item)
      ? result.items.item[0]
      : result.items.item;

    // Get primary name
    const names = Array.isArray(item.name) ? item.name : [item.name];
    const primaryName = names.find(n => n['@_type'] === 'primary');
    const name = primaryName?.['@_value'] || names[0]?.['@_value'] || 'Unknown';

    // Determine type (base game or expansion)
    const type = item['@_type'] === 'boardgameexpansion' ? 'expansion' : 'base';

    // Extract expansion links from BGG data
    const links = item.link ? (Array.isArray(item.link) ? item.link : [item.link]) : [];
    const expansionLinks = links
      .filter(link => link['@_type'] === 'boardgameexpansion')
      .map(link => ({
        bggId: parseInt(link['@_id']),
        name: link['@_value'],
      }));

    // If this is an expansion, find what base game it expands
    const expandsLinks = links
      .filter(link => link['@_type'] === 'boardgameexpansion' && item['@_type'] === 'boardgameexpansion')
      .map(link => parseInt(link['@_id']));

    // Prepare game data
    const gameData = {
      bgg_id: parseInt(item['@_id']),
      name,
      type,
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

    // Upsert game (insert or update if exists)
    const { data: game, error: dbError } = await supabase
      .from('games')
      .upsert(gameData, { onConflict: 'bgg_id' })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save game to database' },
        { status: 500 }
      );
    }

    // Add ownership record for the user who added the game
    if (game) {
      const { error: ownershipError } = await supabase
        .from('user_games')
        .upsert({
          user_id: user.id,
          game_id: game.id
        }, {
          onConflict: 'user_id,game_id',
          ignoreDuplicates: true
        });

      if (ownershipError) {
        console.error('Ownership tracking failed:', ownershipError);
        // Don't fail the request, just log the error
      }
    }

    // Check which expansions we already have in DB
    let availableExpansions: { bggId: number; name: string; inLibrary: boolean }[] = [];
    if (expansionLinks.length > 0) {
      const expansionBggIds = expansionLinks.map(e => e.bggId);
      const { data: existingExpansions } = await supabase
        .from('games')
        .select('bgg_id')
        .in('bgg_id', expansionBggIds);

      const existingBggIds = new Set(existingExpansions?.map(e => e.bgg_id) || []);

      availableExpansions = expansionLinks.map(exp => ({
        ...exp,
        inLibrary: existingBggIds.has(exp.bggId),
      }));
    }

    return NextResponse.json({
      game,
      expansions: availableExpansions,
    });
  } catch (error) {
    console.error('Error adding game from BGG:', error);
    return NextResponse.json(
      { error: 'Failed to add game from BGG' },
      { status: 500 }
    );
  }
}
