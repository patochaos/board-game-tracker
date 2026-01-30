import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  const bggToken = process.env.BGG_API_TOKEN;
  if (!bggToken) {
    return NextResponse.json(
      { error: 'BGG API token not configured' },
      { status: 500 }
    );
  }

  const encodedQuery = encodeURIComponent(query);
  const url = `${BGG_API_BASE}/search?query=${encodedQuery}&type=boardgame`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bggToken}`,
      },
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
      return NextResponse.json({ results: [] });
    }

    const items = Array.isArray(result.items.item)
      ? result.items.item
      : [result.items.item];

    const results = items.slice(0, 20).map((item: {
      '@_id': string;
      name?: { '@_value'?: string } | string;
      yearpublished?: { '@_value'?: string };
    }) => ({
      id: parseInt(item['@_id']),
      name: typeof item.name === 'object' ? item.name?.['@_value'] : item.name || 'Unknown',
      yearPublished: item.yearpublished?.['@_value']
        ? parseInt(item.yearpublished['@_value'])
        : null,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching BGG:', error);
    return NextResponse.json(
      { error: 'Failed to search BGG' },
      { status: 500 }
    );
  }
}
