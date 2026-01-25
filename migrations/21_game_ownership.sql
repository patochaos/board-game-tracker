-- =====================================================
-- GAME OWNERSHIP TABLE
-- Tracks which users own which games
-- =====================================================

-- Create user_games table for tracking game ownership
CREATE TABLE IF NOT EXISTS public.user_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  owned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, game_id)
);

ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;

-- Everyone can see game ownership
CREATE POLICY "Game ownership is viewable by everyone"
  ON public.user_games FOR SELECT
  USING (true);

-- Users can add their own game ownership
CREATE POLICY "Users can add their own games"
  ON public.user_games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own game ownership
CREATE POLICY "Users can remove their own games"
  ON public.user_games FOR DELETE
  USING (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON public.user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_user_games_game_id ON public.user_games(game_id);

-- =====================================================
-- Done! Run this migration in Supabase SQL Editor
-- =====================================================
