-- Add location column to sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS location TEXT;
