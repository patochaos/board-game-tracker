-- Fake Data Seed Script for Board Game Tracker
-- Run this in Supabase SQL Editor to populate test data
-- WARNING: This will create fake data in your database. Run ONLY in development/testing.

-- =====================================================
-- STEP 1: Create fake players (profiles)
-- =====================================================
-- Note: These need to match auth.users, so we'll create them via the app
-- Instead, we'll use existing user(s) and add guest players to sessions

-- =====================================================
-- STEP 2: Insert sample games (if not exists)
-- =====================================================
INSERT INTO games (bgg_id, name, year_published, min_players, max_players, playing_time, bgg_rating, type, thumbnail_url)
VALUES
    (1001, 'Catan', 1995, 3, 4, 90, 7.1, 'standalone', 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7Uun_le9bXWPnidcA=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg'),
    (1002, 'Ticket to Ride', 2004, 2, 5, 60, 7.4, 'standalone', 'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__thumb/img/a72jKE7NVKqVCWvHuHnNHlA7rPU=/fit-in/200x150/filters:strip_icc()/pic38668.jpg'),
    (1003, 'Azul', 2017, 2, 4, 45, 7.8, 'standalone', 'https://cf.geekdo-images.com/tz19PfklMdAdjxV9WArraA__thumb/img/-m8NSBzGfhkA-zy-K6h8TdtgLLg=/fit-in/200x150/filters:strip_icc()/pic3718275.jpg'),
    (1004, 'Wingspan', 2019, 1, 5, 70, 8.1, 'standalone', 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/VNToqgS2-pOGU6MuvIkMPKn_y-s=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg'),
    (1005, '7 Wonders', 2010, 2, 7, 30, 7.7, 'standalone', 'https://cf.geekdo-images.com/RvFVTEpnbb4NM7k0IF8V7A__thumb/img/4n39eb6JN2ECBg9RE75Z5-OMuBQ=/fit-in/200x150/filters:strip_icc()/pic860217.jpg')
ON CONFLICT (bgg_id) DO NOTHING;

-- =====================================================
-- STEP 3: Create sample sessions with varied dates
-- =====================================================
-- This requires knowing the user_id and group_id
-- We'll use a function to get the first user and their group

DO $$
DECLARE
    v_user_id uuid;
    v_group_id uuid;
    v_game_id uuid;
    v_session_id uuid;
    v_date date;
BEGIN
    -- Get the first user
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No users found. Please register first.';
        RETURN;
    END IF;

    -- Get or create a group for the user
    SELECT group_id INTO v_group_id
    FROM group_members
    WHERE user_id = v_user_id
    LIMIT 1;

    IF v_group_id IS NULL THEN
        -- Create a group
        INSERT INTO groups (name, invite_code, created_by)
        VALUES ('Test Game Group', 'TEST01', v_user_id)
        RETURNING id INTO v_group_id;

        INSERT INTO group_members (group_id, user_id, role)
        VALUES (v_group_id, v_user_id, 'admin');
    END IF;

    -- Create sessions for each fake game over the past 3 months
    FOR i IN 1..5 LOOP
        -- Get the game
        SELECT id INTO v_game_id FROM games WHERE bgg_id = 1000 + i;
        IF v_game_id IS NULL THEN
            CONTINUE;
        END IF;

        -- Create 3-5 sessions per game
        FOR j IN 1..4 LOOP
            v_date := CURRENT_DATE - (random() * 90)::int;

            INSERT INTO sessions (group_id, game_id, played_at, duration_minutes, location, notes, created_by)
            VALUES (
                v_group_id,
                v_game_id,
                v_date,
                30 + (random() * 120)::int,
                CASE (random() * 3)::int
                    WHEN 0 THEN 'Home'
                    WHEN 1 THEN 'Board Game Cafe'
                    WHEN 2 THEN 'Friend''s Place'
                    ELSE 'Game Store'
                END,
                CASE (random() * 4)::int
                    WHEN 0 THEN 'Great game night!'
                    WHEN 1 THEN 'Close match, really exciting.'
                    WHEN 2 THEN 'Had a blast playing this one.'
                    WHEN 3 THEN 'Need to play this more often.'
                    ELSE NULL
                END,
                v_user_id
            )
            RETURNING id INTO v_session_id;

            -- Add the user as a player
            INSERT INTO session_players (session_id, user_id, score, is_winner)
            VALUES (
                v_session_id,
                v_user_id,
                (random() * 100)::int,
                random() > 0.6  -- 40% win rate
            );

            -- Add 2-4 guest players
            FOR k IN 1..(2 + (random() * 2)::int) LOOP
                INSERT INTO guest_players (session_id, name, score, is_winner)
                VALUES (
                    v_session_id,
                    CASE k
                        WHEN 1 THEN 'Alex'
                        WHEN 2 THEN 'Jordan'
                        WHEN 3 THEN 'Sam'
                        ELSE 'Casey'
                    END,
                    (random() * 100)::int,
                    k = 1 AND random() > 0.5  -- Alex sometimes wins
                );
            END LOOP;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Fake data created successfully!';
END $$;

-- =====================================================
-- To DELETE all fake data, run this:
-- =====================================================
-- DELETE FROM session_players WHERE session_id IN (SELECT id FROM sessions WHERE game_id IN (SELECT id FROM games WHERE bgg_id BETWEEN 1001 AND 1005));
-- DELETE FROM guest_players WHERE session_id IN (SELECT id FROM sessions WHERE game_id IN (SELECT id FROM games WHERE bgg_id BETWEEN 1001 AND 1005));
-- DELETE FROM sessions WHERE game_id IN (SELECT id FROM games WHERE bgg_id BETWEEN 1001 AND 1005);
-- DELETE FROM games WHERE bgg_id BETWEEN 1001 AND 1005;
