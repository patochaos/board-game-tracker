-- Fix for Deck Privacy Issues

-- 1. Ensure all decks have a privacy setting (default to Public for existing ones)
UPDATE public.decks SET is_public = true WHERE is_public IS NULL;

-- 2. Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view deck cards if public or owner" ON public.deck_cards;
DROP POLICY IF EXISTS "Users can view all deck cards" ON public.deck_cards;
DROP POLICY IF EXISTS "Users can view cards of their own decks" ON public.deck_cards;

-- 3. Re-create the simplified RLS policy for Deck Cards
-- This policy allows viewing cards IF:
-- a) The deck is explicitly Public
-- b) OR The viewer is the Author
CREATE POLICY "Users can view deck cards if public or owner"
  ON public.deck_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE id = deck_cards.deck_id
      AND (is_public = true OR user_id = auth.uid())
    )
  );

-- 4. Ensure Decks logic is also correct (Viewable by authenticated users)
DROP POLICY IF EXISTS "Users can view all decks" ON public.decks;
DROP POLICY IF EXISTS "Users can view their own decks" ON public.decks;

CREATE POLICY "Users can view all decks"
  ON public.decks FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- 5. Explicitly Grant Select Permissions (Redundant usually but safe)
GRANT SELECT ON public.decks TO authenticated;
GRANT SELECT ON public.deck_cards TO authenticated;
