-- Add app_type column to games to separate VTES from board games
-- Values: 'vtes', 'boardgame'

ALTER TABLE games
ADD COLUMN IF NOT EXISTS app_type TEXT DEFAULT 'boardgame';

-- Add constraint for valid values
ALTER TABLE games
ADD CONSTRAINT games_app_type_check
CHECK (app_type IN ('vtes', 'boardgame'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_games_app_type ON games(app_type);

-- Set VTES game to 'vtes' type
UPDATE games SET app_type = 'vtes' WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- All other games default to 'boardgame' (the column default)
