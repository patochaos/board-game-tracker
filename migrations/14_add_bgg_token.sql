-- Add bgg_api_token to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bgg_api_token TEXT;

-- Recommended: Encrypt this in a real app, but for now we store it plain
-- Users can only see/update their own profile due to RLS policies
