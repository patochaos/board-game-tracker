-- Add deck_name to session_players and guest_players
-- This allows tracking which deck was used in a game (crucial for VTES)

ALTER TABLE session_players 
ADD COLUMN IF NOT EXISTS deck_name TEXT;

ALTER TABLE guest_players 
ADD COLUMN IF NOT EXISTS deck_name TEXT;

-- Insert VTES as a system game if it doesn't exist
-- Using a fixed valid UUID: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
-- BGG ID for VTES is 2122
INSERT INTO games (id, name, min_players, max_players, thumbnail_url, bgg_id)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'Vampire: The Eternal Struggle', 
  3, 
  5, 
  'https://cf.geekdo-images.com/PZ8G6n-X_d2rLqGZ7B5N5g__micro/img/ZzE4c0yQd4x8y9C8W3f2c5e5Z5k=/fit-in/64x64/filters:strip_icc()/pic1876822.jpg',
  2122
)
ON CONFLICT (id) DO NOTHING;
