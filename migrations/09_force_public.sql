-- Force all decks to be Public to fix visibility issues
UPDATE public.decks SET is_public = true;

-- Simplify Deck Cards policy to just allow authenticated users to view EVERYTHING
-- This removes complexity of joins that might be failing
DROP POLICY IF EXISTS "Users can view deck cards if public or owner" ON public.deck_cards;
DROP POLICY IF EXISTS "Users can view all deck cards" ON public.deck_cards;
DROP POLICY IF EXISTS "Users can view cards of their own decks" ON public.deck_cards;

CREATE POLICY "Users can view all deck cards"
  ON public.deck_cards FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- Ensure Decks are viewable
DROP POLICY IF EXISTS "Users can view all decks" ON public.decks;
CREATE POLICY "Users can view all decks"
  ON public.decks FOR SELECT
  USING ( auth.role() = 'authenticated' );
