-- Add base_game_id to link expansions to their base game
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS base_game_id UUID REFERENCES public.games(id) ON DELETE SET NULL;

-- Index for faster expansion lookups
CREATE INDEX IF NOT EXISTS idx_games_base_game_id ON public.games(base_game_id);

-- Index for type queries
CREATE INDEX IF NOT EXISTS idx_games_type ON public.games(type);

-- Update type constraint to be more explicit
-- 'standalone' = regular game (no expansions known)
-- 'base' = base game that has expansions
-- 'expansion' = expansion of another game
