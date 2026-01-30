-- =====================================================
-- EXPORT VTES DATA FROM CURRENT SUPABASE
-- Run this in your CURRENT Supabase SQL Editor
-- Copy the results to import into the new project
-- =====================================================

-- This generates INSERT statements for your data
-- Run each query separately and save the results

-- =====================================================
-- 1. EXPORT PROFILES (VTES users only)
-- =====================================================
SELECT 'INSERT INTO profiles (id, email, username, display_name, avatar_url, bgg_username, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  COALESCE(quote_literal(email), 'NULL') || ', ' ||
  COALESCE(quote_literal(username), 'NULL') || ', ' ||
  COALESCE(quote_literal(display_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(avatar_url), 'NULL') || ', ' ||
  COALESCE(quote_literal(bgg_username), 'NULL') || ', ' ||
  quote_literal(created_at) || ', ' ||
  quote_literal(updated_at) || ') ON CONFLICT (id) DO NOTHING;'
FROM profiles
WHERE app_type = 'vtes' OR app_type IS NULL;

-- =====================================================
-- 2. EXPORT DECKS
-- =====================================================
SELECT 'INSERT INTO decks (id, user_id, name, description, is_public, tags, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(user_id) || ', ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  is_public || ', ' ||
  quote_literal(COALESCE(tags::text, '{}')) || ', ' ||
  quote_literal(created_at) || ', ' ||
  quote_literal(updated_at) || ');'
FROM decks;

-- =====================================================
-- 3. EXPORT DECK CARDS
-- =====================================================
SELECT 'INSERT INTO deck_cards (id, deck_id, card_id, count, name, type) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(deck_id) || ', ' ||
  card_id || ', ' ||
  count || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal(type) || ');'
FROM deck_cards;

-- =====================================================
-- 4. EXPORT VTES SESSIONS (game_id = VTES UUID)
-- =====================================================
SELECT 'INSERT INTO sessions (id, created_by, played_at, location, notes, game_type, time_limit_minutes, table_swept, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(created_by) || ', ' ||
  quote_literal(played_at) || ', ' ||
  COALESCE(quote_literal(location), 'NULL') || ', ' ||
  COALESCE(quote_literal(notes), 'NULL') || ', ' ||
  COALESCE(quote_literal(game_type), '''casual''') || ', ' ||
  COALESCE(time_limit_minutes::text, '120') || ', ' ||
  COALESCE(table_swept::text, 'false') || ', ' ||
  quote_literal(created_at) || ', ' ||
  quote_literal(updated_at) || ');'
FROM sessions
WHERE game_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- =====================================================
-- 5. EXPORT SESSION PLAYERS (for VTES sessions)
-- =====================================================
SELECT 'INSERT INTO session_players (id, session_id, user_id, score, is_winner, deck_name, deck_id, seat_position, created_at) VALUES (' ||
  quote_literal(sp.id) || ', ' ||
  quote_literal(sp.session_id) || ', ' ||
  quote_literal(sp.user_id) || ', ' ||
  COALESCE(sp.score::text, 'NULL') || ', ' ||
  sp.is_winner || ', ' ||
  COALESCE(quote_literal(sp.deck_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(sp.deck_id), 'NULL') || ', ' ||
  COALESCE(sp.seat_position::text, 'NULL') || ', ' ||
  quote_literal(sp.created_at) || ');'
FROM session_players sp
JOIN sessions s ON sp.session_id = s.id
WHERE s.game_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- =====================================================
-- 6. EXPORT GUEST PLAYERS (for VTES sessions)
-- =====================================================
SELECT 'INSERT INTO guest_players (id, session_id, name, score, is_winner, deck_name, deck_id, seat_position, created_at) VALUES (' ||
  quote_literal(gp.id) || ', ' ||
  quote_literal(gp.session_id) || ', ' ||
  quote_literal(gp.name) || ', ' ||
  COALESCE(gp.score::text, 'NULL') || ', ' ||
  gp.is_winner || ', ' ||
  COALESCE(quote_literal(gp.deck_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(gp.deck_id), 'NULL') || ', ' ||
  COALESCE(gp.seat_position::text, 'NULL') || ', ' ||
  quote_literal(gp.created_at) || ');'
FROM guest_players gp
JOIN sessions s ON gp.session_id = s.id
WHERE s.game_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- =====================================================
-- 7. EXPORT SESSION OUSTS
-- =====================================================
SELECT 'INSERT INTO session_ousts (id, session_id, ouster_player_id, ouster_guest_id, ousted_player_id, ousted_guest_id, oust_order, created_at) VALUES (' ||
  quote_literal(so.id) || ', ' ||
  quote_literal(so.session_id) || ', ' ||
  COALESCE(quote_literal(so.ouster_player_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(so.ouster_guest_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(so.ousted_player_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(so.ousted_guest_id), 'NULL') || ', ' ||
  so.oust_order || ', ' ||
  quote_literal(so.created_at) || ');'
FROM session_ousts so
JOIN sessions s ON so.session_id = s.id
WHERE s.game_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- =====================================================
-- 8. EXPORT VTES GUESS LEADERBOARD
-- =====================================================
SELECT 'INSERT INTO vtes_guess_leaderboard (id, user_id, display_name, score, mode, cards_played, cards_correct, best_streak, games_played, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(user_id) || ', ' ||
  quote_literal(display_name) || ', ' ||
  score || ', ' ||
  quote_literal(mode) || ', ' ||
  cards_played || ', ' ||
  cards_correct || ', ' ||
  best_streak || ', ' ||
  COALESCE(games_played, 0) || ', ' ||
  quote_literal(created_at) || ', ' ||
  quote_literal(updated_at) || ') ON CONFLICT (user_id, mode) DO NOTHING;'
FROM vtes_guess_leaderboard;
