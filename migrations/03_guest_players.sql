-- Migration: Add guest_players table for tracking non-registered players
-- This allows sessions to include players who don't have accounts

CREATE TABLE public.guest_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  score INTEGER,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient querying by session
CREATE INDEX idx_guest_players_session ON public.guest_players(session_id);

-- Enable RLS
ALTER TABLE public.guest_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Same as session_players (if you can see the session, you can see its guests)
CREATE POLICY "Guest players visible to session viewers"
  ON public.guest_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.group_members gm ON s.group_id = gm.group_id
      WHERE s.id = guest_players.session_id
        AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Session creator can insert guest players"
  ON public.guest_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = guest_players.session_id
        AND s.created_by = auth.uid()
    )
  );

CREATE POLICY "Session creator can update guest players"
  ON public.guest_players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = guest_players.session_id
        AND s.created_by = auth.uid()
    )
  );

CREATE POLICY "Session creator can delete guest players"
  ON public.guest_players FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = guest_players.session_id
        AND s.created_by = auth.uid()
    )
  );
