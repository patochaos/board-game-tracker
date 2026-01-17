-- Add type column to games table
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standalone';

-- Create session_expansions junction table
CREATE TABLE IF NOT EXISTS public.session_expansions (
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  expansion_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, expansion_id)
);

-- Enable RLS
ALTER TABLE public.session_expansions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Group members can view session expansions"
  ON public.session_expansions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE group_id IN (
        SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Group members can add session expansions"
  ON public.session_expansions FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.sessions WHERE group_id IN (
        SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Session creator can delete session expansions"
  ON public.session_expansions FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE created_by = auth.uid()
    )
  );
