-- Create table for storing user decks
CREATE TABLE IF NOT EXISTS public.decks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT decks_pkey PRIMARY KEY (id)
);

-- Create table for storing cards within a deck
-- We store the KRCG ID and Name to avoid needing a massive local card database
CREATE TABLE IF NOT EXISTS public.deck_cards (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    deck_id uuid NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    card_id integer NOT NULL, -- KRCG ID
    count integer NOT NULL DEFAULT 1,
    name text NOT NULL, -- Cached name for easy display
    type text NOT NULL, -- 'crypt' or 'library'
    CONSTRAINT deck_cards_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_cards ENABLE ROW LEVEL SECURITY;

-- Policies for Decks
create policy "Users can view their own decks"
  on public.decks for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own decks"
  on public.decks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own decks"
  on public.decks for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own decks"
  on public.decks for delete
  using ( auth.uid() = user_id );

-- Policies for Deck Cards (inherit from deck ownership)
-- A user can see/edit cards if they own the parent deck
create policy "Users can view cards of their own decks"
  on public.deck_cards for select
  using ( exists ( select 1 from public.decks where id = deck_cards.deck_id and user_id = auth.uid() ) );

create policy "Users can insert cards to their own decks"
  on public.deck_cards for insert
  with check ( exists ( select 1 from public.decks where id = deck_cards.deck_id and user_id = auth.uid() ) );

create policy "Users can update cards of their own decks"
  on public.deck_cards for update
  using ( exists ( select 1 from public.decks where id = deck_cards.deck_id and user_id = auth.uid() ) );

create policy "Users can delete cards from their own decks"
  on public.deck_cards for delete
  using ( exists ( select 1 from public.decks where id = deck_cards.deck_id and user_id = auth.uid() ) );

-- Grant access to authenticated users
GRANT ALL ON TABLE public.decks TO authenticated;
GRANT ALL ON TABLE public.deck_cards TO authenticated;
GRANT ALL ON TABLE public.decks TO service_role;
GRANT ALL ON TABLE public.deck_cards TO service_role;
