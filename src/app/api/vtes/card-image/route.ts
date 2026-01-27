import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for KRCG card images.
 * Accepts card ID (numeric) to avoid exposing card names in URLs.
 * Fetches the correct image URL from KRCG API, which handles
 * slug quirks like "The" being moved to the end.
 *
 * Usage: /api/vtes/card-image?id=101355
 */

// Cache mapping from card ID to image URL to avoid repeated API calls
const imageUrlCache = new Map<number, string>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get('id');

  if (!cardId) {
    return NextResponse.json({ error: 'Missing card id' }, { status: 400 });
  }

  const id = parseInt(cardId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid card id' }, { status: 400 });
  }

  try {
    // Check cache first
    let imageUrl = imageUrlCache.get(id);

    if (!imageUrl) {
      // Fetch card info from KRCG API to get the correct image URL
      const apiResponse = await fetch(`https://api.krcg.org/card/${id}`);
      if (!apiResponse.ok) {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }
      const cardData = await apiResponse.json();
      imageUrl = cardData.url;
      if (!imageUrl) {
        return NextResponse.json({ error: 'No image URL' }, { status: 404 });
      }
      imageUrlCache.set(id, imageUrl);
    }

    // Fetch the actual image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Image fetch failed' }, { status: 502 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    });
  } catch (error) {
    console.error('Card image proxy error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
