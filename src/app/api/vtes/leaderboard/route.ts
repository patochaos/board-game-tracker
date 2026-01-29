import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface Cookie {
  name: string;
  value: string;
}

interface CookiesToSet {
  name: string;
  value: string;
  options?: Record<string, string | boolean | number | undefined>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') as 'normal' | 'ranked' | null;
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): Cookie[] {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookiesToSet[]): void {
          // Read-only for GET
        },
      },
    }
  );

  try {
    let query = supabase
      .from('vtes_guess_leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (mode) {
      query = query.eq('mode', mode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Get user's own rank if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    let userRank: number | null = null;

    if (user && mode) {
      const { count } = await supabase
        .from('vtes_guess_leaderboard')
        .select('*', { count: 'exact', head: true })
        .eq('mode', mode)
        .gt('score', data?.find((e: any) => e.user_id === user.id)?.score || 0);

      const { data: userEntry } = await supabase
        .from('vtes_guess_leaderboard')
        .select('score')
        .eq('mode', mode)
        .eq('user_id', user.id)
        .single();

      if (userEntry) {
        const { count: countAbove } = await supabase
          .from('vtes_guess_leaderboard')
          .select('*', { count: 'exact', head: true })
          .eq('mode', mode)
          .gt('score', userEntry.score);

        userRank = (countAbove || 0) + 1;
      }
    }

    return NextResponse.json({ 
      leaderboard: data || [],
      userRank,
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { score, mode, cardsPlayed, cardsCorrect, bestStreak } = body;

  // Validate input
  if (score === undefined || !mode || cardsPlayed === undefined || cardsCorrect === undefined || bestStreak === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['normal', 'ranked'].includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // DEBUG mode: Allow anonymous score submission with secret key
  const isDebugMode = secret === process.env.DEBUG_SECRET_KEY;

  // Create supabase client outside the if block
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): Cookie[] {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookiesToSet[]): void {
          // Read-only for POST
        },
      },
    }
  );

  let user: { id: string } | null = null;

  if (!isDebugMode) {
    // Normal mode: require authentication
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    user = authUser;
  }

  try {
    // For debug mode, use a fixed anonymous user ID
    const debugUserId = '00000000-0000-0000-0000-000000000000';
    const userId = isDebugMode ? debugUserId : user!.id;

    // Get display name
    let displayName = 'Debug Test';
    if (!isDebugMode && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      displayName = profile?.display_name || 'Anonymous';
    }

    // Check if user already has an entry for this mode
    const { data: existingEntry } = await supabase
      .from('vtes_guess_leaderboard')
      .select('score, best_streak, games_played, cards_played, cards_correct')
      .eq('user_id', userId)
      .eq('mode', mode)
      .single();

    const oldHighScore = existingEntry?.score ?? 0;
    const oldBestStreak = existingEntry?.best_streak ?? 0;
    const oldGamesPlayed = existingEntry?.games_played ?? 0;

    // Calculate new values
    const newHighScore = Math.max(score, oldHighScore);
    const newBestStreak = Math.max(bestStreak, oldBestStreak);
    const newGamesPlayed = oldGamesPlayed + 1;
    const isNewRecord = score > oldHighScore;

    // Upsert the entry - always increment games_played, conditionally update score/streak
    const { error: upsertError } = await supabase
      .from('vtes_guess_leaderboard')
      .upsert({
        user_id: userId,
        display_name: displayName,
        score: newHighScore,
        mode,
        cards_played: isNewRecord ? cardsPlayed : (existingEntry?.cards_played ?? cardsPlayed),
        cards_correct: isNewRecord ? cardsCorrect : (existingEntry?.cards_correct ?? cardsCorrect),
        best_streak: newBestStreak,
        games_played: newGamesPlayed,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,mode',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Error upserting leaderboard entry:', upsertError);
      return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
    }

    // Get user's rank
    const { count: countAbove } = await supabase
      .from('vtes_guess_leaderboard')
      .select('*', { count: 'exact', head: true })
      .eq('mode', mode)
      .gt('score', newHighScore);

    const rank = (countAbove || 0) + 1;

    return NextResponse.json({
      success: true,
      isNewRecord,
      rank,
      highScore: newHighScore,
      gamesPlayed: newGamesPlayed,
    });
  } catch (error) {
    console.error('Leaderboard POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DEBUG: Delete all entries (for testing only)
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  // Simple secret key for debugging
  if (secret !== process.env.DEBUG_SECRET_KEY) {
    return NextResponse.json({ error: 'Invalid secret key' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): Cookie[] {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookiesToSet[]): void {
          // Read-only for DELETE
        },
      },
    }
  );

  try {
    const { error } = await supabase
      .from('vtes_guess_leaderboard')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('Error clearing leaderboard:', error);
      return NextResponse.json({ error: 'Failed to clear leaderboard' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Leaderboard cleared' });
  } catch (error) {
    console.error('Leaderboard DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
