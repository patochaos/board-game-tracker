-- Add app_type column to profiles to separate user bases
-- Values: 'vtes' (CRUSADE/Praxis), 'boardgame' (Board Game Tracker)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS app_type TEXT DEFAULT 'vtes';

-- Add constraint for valid values
ALTER TABLE profiles
ADD CONSTRAINT profiles_app_type_check
CHECK (app_type IN ('vtes', 'boardgame'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_app_type ON profiles(app_type);

-- Set existing users to 'vtes' (they registered before the split)
UPDATE profiles SET app_type = 'vtes' WHERE app_type IS NULL;
