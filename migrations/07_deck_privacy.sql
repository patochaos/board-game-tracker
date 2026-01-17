-- Add is_public column to decks
ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Update Deck Cards Policy to respect privacy
DROP POLICY IF EXISTS "Users can view all deck cards" ON public.deck_cards;
DROP POLICY IF EXISTS "Users can view cards of their own decks" ON public.deck_cards;

CREATE POLICY "Users can view deck cards if public or owner"
  ON public.deck_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE id = deck_cards.deck_id
      AND (is_public = true OR user_id = auth.uid())
    )
  );

-- Decks themselves remain visible to all authenticated users (for the list/dropdown)
-- Existing policy "Users can view all decks" is fine.
