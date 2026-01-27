-- =====================================================
-- GAME NIGHT TRACKER - SUPABASE SCHEMA
-- =====================================================
-- Run this in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- GROUPS TABLE
-- Gaming groups/circles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- GROUP MEMBERS TABLE
-- Junction table for users in groups
-- =====================================================
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Policies for groups (members can view their groups)
CREATE POLICY "Group members can view their groups"
  ON public.groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups"
  ON public.groups FOR UPDATE
  USING (
    id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for group_members
CREATE POLICY "Group members can view other members"
  ON public.group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- GAMES TABLE
-- Cached game info from BGG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bgg_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  year_published INTEGER,
  image_url TEXT,
  thumbnail_url TEXT,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER,
  bgg_rating DECIMAL(3,2),
  cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Games are publicly readable
CREATE POLICY "Games are viewable by everyone"
  ON public.games FOR SELECT
  USING (true);

-- Authenticated users can insert games (from BGG search)
CREATE POLICY "Authenticated users can add games"
  ON public.games FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- SESSIONS TABLE
-- Game play sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  played_at DATE DEFAULT CURRENT_DATE NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Policies for sessions
CREATE POLICY "Group members can view sessions"
  ON public.sessions FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Session creator can update"
  ON public.sessions FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Session creator can delete"
  ON public.sessions FOR DELETE
  USING (created_by = auth.uid());

-- =====================================================
-- SESSION PLAYERS TABLE
-- Players in each session with scores
-- =====================================================
CREATE TABLE IF NOT EXISTS public.session_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER,
  position INTEGER,
  is_winner BOOLEAN DEFAULT FALSE,
  notes TEXT,
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;

-- Policies for session_players
CREATE POLICY "Group members can view session players"
  ON public.session_players FOR SELECT
  USING (
    session_id IN (
      SELECT s.id FROM public.sessions s
      JOIN public.group_members gm ON s.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add session players"
  ON public.session_players FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM public.sessions s
      JOIN public.group_members gm ON s.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Session creator can update players"
  ON public.session_players FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Session creator can delete players"
  ON public.session_players FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_sessions_group_id ON public.sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_game_id ON public.sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_sessions_played_at ON public.sessions(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_players_session_id ON public.session_players(session_id);
CREATE INDEX IF NOT EXISTS idx_session_players_user_id ON public.session_players(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_games_bgg_id ON public.games(bgg_id);

-- =====================================================
-- HELPER VIEWS FOR STATS
-- =====================================================

-- Player stats view
CREATE OR REPLACE VIEW public.player_stats WITH (security_invoker = true) AS
SELECT 
  sp.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  COUNT(DISTINCT sp.session_id) as total_plays,
  COUNT(DISTINCT CASE WHEN sp.is_winner THEN sp.session_id END) as total_wins,
  ROUND(
    COUNT(DISTINCT CASE WHEN sp.is_winner THEN sp.session_id END)::DECIMAL / 
    NULLIF(COUNT(DISTINCT sp.session_id), 0) * 100, 1
  ) as win_rate,
  COUNT(DISTINCT s.game_id) as games_played
FROM public.session_players sp
JOIN public.sessions s ON sp.session_id = s.id
JOIN public.profiles p ON sp.user_id = p.id
GROUP BY sp.user_id, p.username, p.display_name, p.avatar_url;

-- Game stats view
CREATE OR REPLACE VIEW public.game_stats WITH (security_invoker = true) AS
SELECT 
  g.id as game_id,
  g.name,
  g.thumbnail_url,
  COUNT(DISTINCT s.id) as total_plays,
  COUNT(DISTINCT sp.user_id) as total_players,
  AVG(sp.score) as avg_score,
  MAX(sp.score) as high_score,
  AVG(s.duration_minutes) as avg_duration
FROM public.games g
JOIN public.sessions s ON s.game_id = g.id
JOIN public.session_players sp ON sp.session_id = s.id
GROUP BY g.id, g.name, g.thumbnail_url;

-- =====================================================
-- DONE! Your database is ready 🎲
-- =====================================================
