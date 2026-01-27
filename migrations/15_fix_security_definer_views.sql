-- Fix security issues by enabling security_invoker = true
-- This ensures the views respect RLS policies of the querying user

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
