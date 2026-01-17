import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Seed games with real BGG data
const seedGames = [
  {
    bgg_id: 39463,
    name: 'Cosmic Encounter',
    year_published: 2008,
    image_url: 'https://cf.geekdo-images.com/S8cE-Ld7XP5sVz-upKJ-Bg__original/img/vs_l3i3lhBD2Xd-9pRGQHLBSFw0=/0x0/filters:format(png)/pic1521633.png',
    thumbnail_url: 'https://cf.geekdo-images.com/S8cE-Ld7XP5sVz-upKJ-Bg__thumb/img/sEp2CJbmO8M45EAsDt4vcP3g-Jg=/fit-in/200x150/filters:strip_icc()/pic1521633.png',
    min_players: 3,
    max_players: 5,
    playing_time: 90,
    bgg_rating: 7.5,
  },
  {
    bgg_id: 43015,
    name: 'Hansa Teutonica',
    year_published: 2009,
    image_url: 'https://cf.geekdo-images.com/g99RxnfVnFGsT_XYqVcyPQ__original/img/8HfQRQsQkuCsP_tLDRsRcyY5oNA=/0x0/filters:format(jpeg)/pic5765935.jpg',
    thumbnail_url: 'https://cf.geekdo-images.com/g99RxnfVnFGsT_XYqVcyPQ__thumb/img/nqGMpj5A2r8PIoiRuuP7c0F8D3Y=/fit-in/200x150/filters:strip_icc()/pic5765935.jpg',
    min_players: 2,
    max_players: 5,
    playing_time: 75,
    bgg_rating: 7.7,
  },
];

export async function POST() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upsert games (insert or update if bgg_id exists)
    const { data, error } = await supabase
      .from('games')
      .upsert(seedGames, { onConflict: 'bgg_id' })
      .select();

    if (error) {
      console.error('Seed error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${data.length} games`,
      games: data
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed games',
    games: seedGames.map(g => g.name)
  });
}
