-- Update policies to make all decks public for viewing
-- User requested that Decks are NOT private and available drop down for EVERYONE.

DROP POLICY IF EXISTS "Users can view their own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can view cards of their own decks" ON public.deck_cards;

-- New Policy: Authenticated users can view ALL decks
CREATE POLICY "Users can view all decks"
  ON public.decks FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- New Policy: Authenticated users can view ALL deck cards
CREATE POLICY "Users can view all deck cards"
  ON public.deck_cards FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- Keeping insert/update/delete restricted to owner for now to prevent vandalism, 
-- but viewing is public.
