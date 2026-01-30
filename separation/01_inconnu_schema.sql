-- =====================================================
-- INCONNU (CRUSADE + PRAXIS) - Complete Database Schema
-- Run this in your NEW Supabase project SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (Core user data)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bgg_username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- =====================================================
-- 2. DECKS TABLE (VTES deck management)
-- =====================================================
CREATE TABLE public.decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

-- Users can view their own decks
CREATE POLICY "Users can view their own decks"
  ON public.decks FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can view public decks
CREATE POLICY "Anyone can view public decks"
  ON public.decks FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own decks"
  ON public.decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON public.decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON public.decks FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON public.decks TO authenticated;
GRANT ALL ON public.decks TO service_role;

-- =====================================================
-- 3. DECK CARDS TABLE
-- =====================================================
CREATE TABLE public.deck_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('crypt', 'library'))
);

ALTER TABLE public.deck_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cards of own decks"
  ON public.deck_cards FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.decks WHERE id = deck_cards.deck_id AND user_id = auth.uid()));

CREATE POLICY "Anyone can view cards of public decks"
  ON public.deck_cards FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.decks WHERE id = deck_cards.deck_id AND is_public = true));

CREATE POLICY "Users can insert cards to own decks"
  ON public.deck_cards FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.decks WHERE id = deck_cards.deck_id AND user_id = auth.uid()));

CREATE POLICY "Users can update cards of own decks"
  ON public.deck_cards FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.decks WHERE id = deck_cards.deck_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete cards from own decks"
  ON public.deck_cards FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.decks WHERE id = deck_cards.deck_id AND user_id = auth.uid()));

GRANT ALL ON public.deck_cards TO authenticated;
GRANT ALL ON public.deck_cards TO service_role;

-- =====================================================
-- 4. SESSIONS TABLE (VTES game sessions)
-- =====================================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  location TEXT,
  notes TEXT,
  game_type TEXT DEFAULT 'casual' CHECK (game_type IN ('casual', 'tournament_prelim', 'tournament_final', 'league')),
  time_limit_minutes INTEGER DEFAULT 120,
  table_swept BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions are viewable by everyone"
  ON public.sessions FOR SELECT USING (true);

CREATE POLICY "Users can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = created_by);

GRANT ALL ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;

-- =====================================================
-- 5. SESSION PLAYERS TABLE (Registered users in sessions)
-- =====================================================
CREATE TABLE public.session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(10,2),
  is_winner BOOLEAN DEFAULT false,
  deck_name TEXT,
  deck_id UUID REFERENCES public.decks(id) ON DELETE SET NULL,
  seat_position INTEGER CHECK (seat_position >= 1 AND seat_position <= 6),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session players are viewable by everyone"
  ON public.session_players FOR SELECT USING (true);

CREATE POLICY "Session creator can manage players"
  ON public.session_players FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sessions WHERE id = session_players.session_id AND created_by = auth.uid()));

GRANT ALL ON public.session_players TO authenticated;
GRANT ALL ON public.session_players TO service_role;

-- =====================================================
-- 6. GUEST PLAYERS TABLE (Non-registered players)
-- =====================================================
CREATE TABLE public.guest_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score NUMERIC(10,2),
  is_winner BOOLEAN DEFAULT false,
  deck_name TEXT,
  deck_id UUID REFERENCES public.decks(id) ON DELETE SET NULL,
  seat_position INTEGER CHECK (seat_position >= 1 AND seat_position <= 6),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.guest_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guest players are viewable by everyone"
  ON public.guest_players FOR SELECT USING (true);

CREATE POLICY "Session creator can manage guest players"
  ON public.guest_players FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sessions WHERE id = guest_players.session_id AND created_by = auth.uid()));

GRANT ALL ON public.guest_players TO authenticated;
GRANT ALL ON public.guest_players TO service_role;

-- =====================================================
-- 7. SESSION OUSTS TABLE (VTES oust tracking)
-- =====================================================
CREATE TABLE public.session_ousts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  ouster_player_id UUID REFERENCES public.session_players(id) ON DELETE SET NULL,
  ouster_guest_id UUID REFERENCES public.guest_players(id) ON DELETE SET NULL,
  ousted_player_id UUID REFERENCES public.session_players(id) ON DELETE SET NULL,
  ousted_guest_id UUID REFERENCES public.guest_players(id) ON DELETE SET NULL,
  oust_order INTEGER NOT NULL CHECK (oust_order >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ousted_player_required CHECK (ousted_player_id IS NOT NULL OR ousted_guest_id IS NOT NULL)
);

ALTER TABLE public.session_ousts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ousts are viewable by everyone"
  ON public.session_ousts FOR SELECT USING (true);

CREATE POLICY "Session creator can manage ousts"
  ON public.session_ousts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.sessions WHERE id = session_ousts.session_id AND created_by = auth.uid()));

GRANT ALL ON public.session_ousts TO authenticated;
GRANT ALL ON public.session_ousts TO service_role;

-- =====================================================
-- 8. VTES GUESS LEADERBOARD
-- =====================================================
CREATE TABLE public.vtes_guess_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('normal', 'ranked')),
  cards_played INTEGER NOT NULL,
  cards_correct INTEGER NOT NULL,
  best_streak INTEGER NOT NULL,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, mode)
);

ALTER TABLE public.vtes_guess_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is public"
  ON public.vtes_guess_leaderboard FOR SELECT USING (true);

CREATE POLICY "Users can insert own scores"
  ON public.vtes_guess_leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scores"
  ON public.vtes_guess_leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_vtes_guess_leaderboard_mode_score
  ON public.vtes_guess_leaderboard(mode, score DESC);

CREATE INDEX idx_vtes_guess_leaderboard_user_id
  ON public.vtes_guess_leaderboard(user_id);

GRANT ALL ON public.vtes_guess_leaderboard TO authenticated;
GRANT ALL ON public.vtes_guess_leaderboard TO service_role;

-- =====================================================
-- DONE! Your CRUSADE database is ready.
-- =====================================================
