-- Add tags column to decks table
ALTER TABLE public.decks 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Allow users to update tags (covered by existing update policy, but good to double check RLS)
-- Existing policy: "Users can update their own decks" using ( auth.uid() = user_id );
