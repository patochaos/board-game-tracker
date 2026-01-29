-- Add games_played counter to leaderboard
-- This tracks total games played regardless of score

ALTER TABLE public.vtes_guess_leaderboard
ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 1 NOT NULL;

-- Update existing rows to have games_played = 1 (they've played at least once)
UPDATE public.vtes_guess_leaderboard SET games_played = 1 WHERE games_played IS NULL;

COMMENT ON COLUMN public.vtes_guess_leaderboard.games_played IS 'Total number of games played (increments every game, regardless of score)';
COMMENT ON COLUMN public.vtes_guess_leaderboard.best_streak IS 'Highest streak ever achieved across all games';
COMMENT ON COLUMN public.vtes_guess_leaderboard.score IS 'Personal best high score';
