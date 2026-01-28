-- VTES Guess Card Leaderboard Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.vtes_guess_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('normal', 'ranked')),
  cards_played INTEGER NOT NULL,
  cards_correct INTEGER NOT NULL,
  best_streak INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, mode)
);

-- Enable RLS
ALTER TABLE public.vtes_guess_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Leaderboard is public" ON public.vtes_guess_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own scores" ON public.vtes_guess_leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scores" ON public.vtes_guess_leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_vtes_guess_leaderboard_mode_score 
  ON public.vtes_guess_leaderboard(mode, score DESC);

CREATE INDEX IF NOT EXISTS idx_vtes_guess_leaderboard_user_id 
  ON public.vtes_guess_leaderboard(user_id);
