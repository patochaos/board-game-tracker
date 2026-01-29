-- Migration 23: Change score columns from INTEGER to DECIMAL
-- VTES uses half victory points (0.5, 1.5, 2.5, etc.) so we need decimal support

-- 1. Drop views that depend on score column
DROP VIEW IF EXISTS public.game_stats;
DROP VIEW IF EXISTS public.player_stats;

-- 2. Alter session_players.score to DECIMAL(4,1)
-- This allows scores like 0.5, 1.5, 2.5 up to 999.5
ALTER TABLE session_players
  ALTER COLUMN score TYPE DECIMAL(4,1);

-- 3. Alter guest_players.score to DECIMAL(4,1)
ALTER TABLE guest_players
  ALTER COLUMN score TYPE DECIMAL(4,1);

-- 4. Recreate player_stats view
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

-- 5. Recreate game_stats view
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

-- Note: Existing integer values will be automatically converted (e.g., 5 becomes 5.0)
