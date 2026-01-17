-- Allow public access to all decks that are marked as public
-- Since we forced all decks to be public in migration 09, this effectively opens up read access.

-- 1. Update Decks Policy
DROP POLICY IF EXISTS "Users can view all decks" ON public.decks;
DROP POLICY IF EXISTS "Anyone can view public decks" ON public.decks;

CREATE POLICY "Anyone can view public decks"
  ON public.decks FOR SELECT
  USING ( is_public = true OR auth.role() = 'authenticated' );

-- 2. Update Deck Cards Policy
-- Users (even anon) should see cards if the deck is public
DROP POLICY IF EXISTS "Users can view all deck cards" ON public.deck_cards;
DROP POLICY IF EXISTS "Anyone can view public deck cards" ON public.deck_cards;

CREATE POLICY "Anyone can view public deck cards"
  ON public.deck_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE id = public.deck_cards.deck_id
      AND (is_public = true OR auth.role() = 'authenticated')
    )
  );

-- 3. Explicitly grant permissions to anon role
-- This is crucial for non-logged-in users (Guest/Anon)
GRANT SELECT ON public.decks TO anon;
GRANT SELECT ON public.deck_cards TO anon;
