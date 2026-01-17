-- DANGER: This script wipes all user data (sessions, groups, players)
-- Leaves 'profiles' and 'games' (metadata) intact.

-- Truncate tables with CASCADE to handle foreign keys
TRUNCATE TABLE session_expansions CASCADE;
TRUNCATE TABLE guest_players CASCADE;
TRUNCATE TABLE session_players CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE group_members CASCADE;
TRUNCATE TABLE groups CASCADE;

-- Optional: If you want to delete specific profiles, add query here
-- DELETE FROM profiles WHERE username = '...';
