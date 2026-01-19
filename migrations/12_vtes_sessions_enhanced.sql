-- Migration 12: Enhanced VTES Session Tracking
-- Adds seating position, deck linking, and game context for VTES sessions

-- 1. Add deck reference and seating to session_players
ALTER TABLE session_players
  ADD COLUMN IF NOT EXISTS deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seat_position INTEGER CHECK (seat_position >= 1 AND seat_position <= 6);

-- 2. Add deck reference and seating to guest_players
ALTER TABLE guest_players
  ADD COLUMN IF NOT EXISTS deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seat_position INTEGER CHECK (seat_position >= 1 AND seat_position <= 6);

-- 3. Add game context to sessions (for VTES-specific fields)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'casual' CHECK (game_type IN ('casual', 'tournament_prelim', 'tournament_final', 'league')),
  ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS table_swept BOOLEAN DEFAULT false;

-- 4. Create oust tracking table for VTES
CREATE TABLE IF NOT EXISTS session_ousts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  ouster_player_id UUID REFERENCES session_players(id) ON DELETE SET NULL,
  ouster_guest_id UUID REFERENCES guest_players(id) ON DELETE SET NULL,
  ousted_player_id UUID REFERENCES session_players(id) ON DELETE SET NULL,
  ousted_guest_id UUID REFERENCES guest_players(id) ON DELETE SET NULL,
  oust_order INTEGER NOT NULL CHECK (oust_order >= 1),
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Ensure at least one ousted player is specified
  CONSTRAINT ousted_player_required CHECK (ousted_player_id IS NOT NULL OR ousted_guest_id IS NOT NULL)
);

-- 5. RLS for session_ousts
ALTER TABLE session_ousts ENABLE ROW LEVEL SECURITY;

-- Allow viewing ousts for sessions in user's group
CREATE POLICY "Users can view ousts from group sessions"
  ON session_ousts FOR SELECT
  USING (
    session_id IN (
      SELECT s.id FROM sessions s
      WHERE s.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

-- Allow inserting ousts for sessions user created
CREATE POLICY "Users can insert ousts for own sessions"
  ON session_ousts FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions WHERE created_by = auth.uid()
    )
  );

-- Allow updating ousts for sessions user created
CREATE POLICY "Users can update ousts for own sessions"
  ON session_ousts FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE created_by = auth.uid()
    )
  );

-- Allow deleting ousts for sessions user created
CREATE POLICY "Users can delete ousts for own sessions"
  ON session_ousts FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE created_by = auth.uid()
    )
  );

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON session_ousts TO authenticated;
