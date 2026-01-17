-- The Application is failing because Supabase cannot infer the relationship between 'decks' and 'profiles'.
-- Currently 'decks.user_id' references 'auth.users', but we are querying 'profiles'.
-- We need an explicit Foreign Key to 'public.profiles'.

DO $$
BEGIN
    -- 1. Try to add the constraint. 
    -- We use a specific name to avoid collisions.
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'decks_user_id_profiles_fkey' 
        AND table_name = 'decks'
    ) THEN
        ALTER TABLE public.decks
        ADD CONSTRAINT decks_user_id_profiles_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Reload the schema cache is sometimes needed, but usually automatic.
-- Run this just in case:
NOTIFY pgrst, 'reload config';
